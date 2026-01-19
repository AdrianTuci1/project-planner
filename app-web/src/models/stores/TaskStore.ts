import { makeAutoObservable, runInAction, reaction } from "mobx";
import { Group, Task, IParticipant, GroupType, Workspace } from "../core";
import { v4 as uuidv4 } from 'uuid';
import { api } from "../../services/api";
import { addMonths, subMonths, startOfDay, endOfDay } from "date-fns";
import { ProjectStore } from "../store";

const MOCK_USER: IParticipant = {
    id: 'u1',
    name: 'Adrian T.',
    initials: 'AT'
};

export class TaskStore {
    rootStore: ProjectStore;

    workspaces: Workspace[] = [new Workspace("Personal", 'personal')];
    activeWorkspaceId: string | null = null;

    // Legacy support / Shortcuts? No, we should force usage of activeWorkspace to be safe.
    // templates: Task[] = []; // Templates might be global or per workspace? Let's assume Global for now or personal.
    templates: Task[] = [];
    currentUser: IParticipant = MOCK_USER;

    // API State
    isLoading: boolean = false;
    error: string | null = null;
    lastFetchRange: { start: Date, end: Date } | null = null;

    availableLabels: { id: string; name: string; color: string }[] = [];

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);

        // Pre-set active workspace from default or storage immediately
        if (typeof window !== 'undefined') {
            const savedType = localStorage.getItem('activeWorkspaceType');
            if (savedType === 'team') {
            } else {
                // Ensure ID is set for the default workspace
                this.activeWorkspaceId = this.workspaces[0].id;
            }

            // Start reaction for persistence
            reaction(
                () => this.activeWorkspace?.type,
                (type) => {
                    if (type) {
                        localStorage.setItem('activeWorkspaceType', type);
                    }
                }
            );
        } else {
            // Server-side safe default
            this.activeWorkspaceId = this.workspaces[0].id;
        }
    }

    get activeWorkspace() {
        return this.workspaces.find(w => w.id === this.activeWorkspaceId) || this.workspaces[0];
    }

    // Accessors for UI compatibility (Proxies to Active Workspace)
    get groups() { return this.activeWorkspace?.groups || []; }
    get dumpAreaTasks() { return this.activeWorkspace?.dumpAreaTasks || []; }

    async initializeData() {
        this.isLoading = true;
        this.error = null;
        try {
            const today = new Date();
            const start = startOfDay(subMonths(today, 1));
            const end = endOfDay(addMonths(today, 1));
            this.lastFetchRange = { start, end };

            // Mock Data or API call
            const data = await api.getInitialData(start, end);
            // const data: any = {}; // Placeholder for actual API data

            runInAction(() => {
                // Initialize default workspaces if they don't exist
                let personal = this.workspaces.find(w => w.type === 'personal');
                let team = this.workspaces.find(w => w.type === 'team');

                if (!personal) {
                    // Should actully be there due to pre-seeding, but safe check
                    personal = new Workspace("Personal", 'personal');
                    this.workspaces.unshift(personal);
                }

                if (!team) {
                    team = new Workspace("Team", 'team');
                    this.workspaces.push(team);
                }

                // If workspaces were just created or are empty, seed them
                if (personal.groups.length === 0) {
                    // Hydrate legacy/mock data into Personal workspace
                    if (data.groups && data.groups.length > 0) {
                        personal.groups = data.groups.map((g: any) => {
                            const group = new Group(g.name, g.icon, 'personal', g.defaultLabelId, g.autoAddLabelEnabled);
                            group.id = g.id;
                            group.tasks = g.tasks.map((t: any) => this.hydrateTask(t));
                            return group;
                        });
                    }
                    // REMOVED: Seed default if no data ("My Tasks")
                }

                // REMOVED: Seed Team Workspace ("General")

                // Hydrate Dump Tasks into Personal
                // Only if not already hydrated/present (simple check)
                if (personal.dumpAreaTasks.length === 0 && data.dumpTasks) {
                    personal.dumpAreaTasks = data.dumpTasks.map((t: any) => this.hydrateTask(t));
                }

                // Load Labels
                if (this.availableLabels.length === 0 && data.availableLabels) {
                    this.availableLabels = data.availableLabels;
                } else if (this.availableLabels.length === 0) {
                    this.availableLabels = [
                        { id: 'l1', name: 'Urgent', color: '#EF4444' },
                        { id: 'l2', name: 'Work', color: '#3B82F6' }
                    ];
                }

                // Determine active workspace from persistence or default
                const savedType = localStorage.getItem('activeWorkspaceType');
                let targetWorkspace = personal; // Default to Personal

                if (savedType === 'team' && team) {
                    targetWorkspace = team;
                } else if (savedType === 'personal' && personal) {
                    targetWorkspace = personal;
                }

                if (targetWorkspace) {
                    this.activeWorkspaceId = targetWorkspace.id;
                }

                // Ensure activeGroupId is valid for the current workspace
                // If switching workspaces or init, we check activeGroupId validity.
                const currentGroups = this.groups; // Accessed via proxy getter
                const uiStore = this.rootStore.uiStore;

                if (uiStore.activeGroupId) {
                    // VERIFY if activeGroupId exists in current workspace groups
                    // If NOT, reset to null (Brain Dump).
                    const exists = currentGroups.some(g => g.id === uiStore.activeGroupId);
                    if (!exists) {
                        uiStore.activeGroupId = null;
                        // Or persist cleanup? 
                    }
                } else {
                    // If null, it means Brain Dump, valid.
                }
            });
        } catch (err) {
            runInAction(() => {
                this.error = "Failed to load tasks";
                console.error(err);
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    private hydrateTask(data: any): Task {
        const task = new Task(data.title);
        task.id = data.id;
        task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;
        task.scheduledTime = data.scheduledTime;
        task.duration = data.duration;
        task.labels = data.labels || [];
        task.status = data.status || 'todo';
        return task;
    }

    get allTasks() {
        // Return tasks from active workspace only? Or all? 
        // User feedback implies we want to switch context completely.
        if (!this.activeWorkspace) return [];
        return [...this.activeWorkspace.dumpAreaTasks, ...this.activeWorkspace.groups.flatMap(g => g.tasks)];
    }

    // CRUD Methods - Delegated to Active Workspace
    createGroup(name: string, icon?: string, type: GroupType = 'personal', defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        // Ignore passed 'type' argument and use activeWorkspace type to ensure consistency?
        // Yes, groups created in a workspace should match that workspace.
        return this.activeWorkspace?.createGroup(name, icon, defaultLabelId, autoAddLabelEnabled);
    }

    deleteGroup(groupId: string) {
        const workspace = this.workspaces.find(w => w.groups.some(g => g.id === groupId));
        if (workspace) {
            const index = workspace.groups.findIndex(g => g.id === groupId);
            if (index > -1) workspace.groups.splice(index, 1);
        }
    }

    updateGroup(groupId: string, name: string, icon?: string, type?: GroupType, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        // Find group across all workspaces? Or just active?
        // Better to search all to be safe.
        for (const w of this.workspaces) {
            const group = w.groups.find(g => g.id === groupId);
            if (group) {
                group.name = name;
                if (icon) group.icon = icon;
                if (type) group.type = type; // Allow moving groups? Maybe not needed yet.
                if (defaultLabelId !== undefined) group.defaultLabelId = defaultLabelId;
                if (autoAddLabelEnabled !== undefined) group.autoAddLabelEnabled = autoAddLabelEnabled;
                return;
            }
        }
    }

    getLabel(labelId: string) {
        return this.availableLabels.find(l => l.id === labelId);
    }

    getLabelColor(labelId: string): string {
        const label = this.getLabel(labelId);
        return label ? label.color : '#60A5FA';
    }

    addLabel(name: string, color: string) {
        const newLabel = {
            id: uuidv4(),
            name,
            color
        };
        this.availableLabels.push(newLabel);
        return newLabel;
    }

    updateLabel(id: string, name: string, color: string) {
        const label = this.availableLabels.find(l => l.id === id);
        if (label) {
            label.name = name;
            label.color = color;
        }
    }

    deleteLabel(id: string) {
        this.availableLabels = this.availableLabels.filter(l => l.id !== id);
    }

    // Template Methods
    createTemplate(title: string) {
        const task = new Task(title);
        this.templates.push(task);
        return task;
    }

    addTemplate(task: Task) {
        this.templates.push(task);
    }

    deleteTemplate(id: string) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index > -1) {
            this.templates.splice(index, 1);
        }
    }

    addTaskToDump(title: string) {
        this.activeWorkspace?.addTaskToDump(title);
    }

    moveTaskToGroup(taskId: string, groupId: string) {
        // Assuming move within active workspace
        if (!this.activeWorkspace) return;

        const dumpTaskIndex = this.activeWorkspace.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpTaskIndex > -1) {
            const task = this.activeWorkspace.dumpAreaTasks[dumpTaskIndex];
            const group = this.activeWorkspace.groups.find(g => g.id === groupId);
            if (group) {
                group.addTask(task);
                this.activeWorkspace.dumpAreaTasks.splice(dumpTaskIndex, 1);
            }
        }
    }

    deleteTask(taskId: string) {
        if (!this.activeWorkspace) return;

        const dumpIndex = this.activeWorkspace.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpIndex > -1) {
            this.activeWorkspace.dumpAreaTasks.splice(dumpIndex, 1);
            return;
        }

        for (const group of this.activeWorkspace.groups) {
            const taskIndex = group.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                group.removeTask(taskId);
                return;
            }
        }
    }

    duplicateTask(task: Task) {
        if (!this.activeWorkspace) return;

        const dumpIndex = this.activeWorkspace.dumpAreaTasks.findIndex(t => t.id === task.id);
        if (dumpIndex > -1) {
            const clone = task.clone();
            this.activeWorkspace.dumpAreaTasks.splice(dumpIndex + 1, 0, clone);
            return clone;
        }

        for (const group of this.activeWorkspace.groups) {
            const groupTask = group.tasks.find(t => t.id === task.id);
            if (groupTask) {
                return group.duplicateTask(task.id);
            }
        }
    }

    getTaskById(taskId: string): Task | undefined {
        // Search in active workspace first? Or all?
        // If we are strictly separated, search current.
        if (!this.activeWorkspace) return undefined;

        for (const group of this.activeWorkspace.groups) {
            const task = group.tasks.find(t => t.id === taskId);
            if (task) return task;
        }
        const dumpTask = this.activeWorkspace.dumpAreaTasks.find(t => t.id === taskId);
        if (dumpTask) return dumpTask;

        const template = this.templates.find(t => t.id === taskId);
        return template;
    }
}
