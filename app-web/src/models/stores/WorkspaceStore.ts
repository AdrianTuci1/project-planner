import { makeAutoObservable, runInAction, reaction } from "mobx";
import { startOfDay, endOfDay, subMonths, addMonths } from "date-fns";
import { Workspace, Group, Task, Subtask } from "../core";
import { api } from "../../services/api";
import { ProjectStore } from "../store";
import { taskSyncStrategy } from "../strategies/TaskSyncStrategy";
import { workspaceSyncStrategy } from "../strategies/WorkspaceSyncStrategy";
import { groupSyncStrategy } from "../strategies/GroupSyncStrategy";

export class WorkspaceStore {
    rootStore: ProjectStore;
    workspaces: Workspace[] = [new Workspace("Personal", 'personal')];
    activeWorkspaceId: string | null = null;

    // API State
    isLoading: boolean = false;
    error: string | null = null;
    lastFetchRange: { start: Date, end: Date } | null = null;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);

        // Pre-set active workspace from default or storage immediately
        if (typeof window !== 'undefined') {
            const savedType = localStorage.getItem('activeWorkspaceType');
            if (savedType === 'team') {
                // We'll set it properly after initialization if team workspace exists
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

    setActiveWorkspace(id: string) {
        const workspace = this.workspaces.find(w => w.id === id);
        if (workspace) {
            this.activeWorkspaceId = workspace.id;
        }
    }

    async createTeamWorkspace() {
        this.isLoading = true;
        try {
            const user = this.rootStore.authStore.user;
            if (!user) throw new Error("User not authenticated");

            // Use sub or username as ownerId
            const ownerId = user.sub || user.username;

            await api.createWorkspace("My Team", "team", ownerId);

            // Re-initialize to fetch the new workspace
            await this.initializeData();

            // Switch to it
            runInAction(() => {
                const team = this.workspaces.find(w => w.type === 'team');
                if (team) {
                    this.activeWorkspaceId = team.id;
                    workspaceSyncStrategy.monitor(team);
                }
            });

        } catch (err: any) {
            runInAction(() => {
                this.error = "Failed to create team workspace: " + err.message;
            });
            throw err;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async initializeData() {
        this.isLoading = true;
        this.error = null;
        try {
            const today = new Date();
            const start = startOfDay(subMonths(today, 1));
            const end = endOfDay(addMonths(today, 1));
            this.lastFetchRange = { start, end };

            // Mock Data or API call
            const data = await api.getInitialData(start, end, this.activeWorkspaceId || undefined);

            runInAction(() => {
                // Initialize default workspaces if they don't exist
                let personal = this.workspaces.find(w => w.type === 'personal');
                let team = this.workspaces.find(w => w.type === 'team');

                if (!personal) {
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
                            groupSyncStrategy.monitor(group);
                            return group;
                        });
                    }
                }

                // Monitor workspaces
                this.workspaces.forEach(w => workspaceSyncStrategy.monitor(w));

                // Hydrate Dump Tasks into Personal
                if (personal.dumpAreaTasks.length === 0 && data.dumpTasks) {
                    personal.dumpAreaTasks = data.dumpTasks.map((t: any) => this.hydrateTask(t));
                }

                // Load Labels via LabelStore
                if (this.rootStore.labelStore.availableLabels.length === 0 && data.availableLabels) {
                    this.rootStore.labelStore.setAvailableLabels(data.availableLabels);
                } else if (this.rootStore.labelStore.availableLabels.length === 0) {
                    this.rootStore.labelStore.setAvailableLabels([
                        { id: 'l1', name: 'Urgent', color: '#EF4444' },
                        { id: 'l2', name: 'Work', color: '#3B82F6' }
                    ]);
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
                const uiStore = this.rootStore.uiStore;
                if (uiStore && uiStore.activeGroupId) {
                    const currentGroups = this.activeWorkspace.groups;
                    const exists = currentGroups.some(g => g.id === uiStore.activeGroupId);
                    if (!exists) {
                        uiStore.activeGroupId = null;
                    }
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
        task.description = data.description || "";
        task.status = data.status || 'todo';
        task.priority = data.priority || 'none';
        task.recurrence = data.recurrence || 'none';

        task.duration = data.duration || 0;
        task.actualDuration = data.actualDuration || 0;

        task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;
        task.scheduledTime = data.scheduledTime;
        task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;

        // Hydrate labelId, fallback to legacy labels array if needed
        if (data.labelId !== undefined) {
            task.labelId = data.labelId;
        } else if (data.labels && Array.isArray(data.labels) && data.labels.length > 0) {
            task.labelId = data.labels[0];
        } else {
            task.labelId = null;
        }

        task.workspaceId = data.workspaceId;
        task.groupId = data.groupId;

        if (data.subtasks) {
            task.subtasks = data.subtasks.map((s: any) => {
                const sub = new Subtask(s.title);
                sub.id = s.id;
                sub.isCompleted = !!s.isCompleted;
                return sub;
            });
        }

        if (data.attachments) {
            task.attachments = data.attachments.map((a: any) => ({
                ...a,
                createdAt: a.createdAt ? new Date(a.createdAt) : new Date()
            }));
        }

        task.participants = data.participants || [];

        // Start monitoring for auto-sync
        taskSyncStrategy.markAsPersisted(task.id);
        taskSyncStrategy.monitor(task);

        return task;
    }
}
