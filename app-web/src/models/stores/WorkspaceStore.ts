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
            // 1. Hydrate Workspace Metadata (ids, names, types)
            // Note: Deep data (tasks/groups) comes from IndexedDB via api.getInitialData
            const savedWorkspaces = localStorage.getItem('persisted_workspaces');
            if (savedWorkspaces) {
                try {
                    const parsed = JSON.parse(savedWorkspaces);
                    this.workspaces = parsed.map((w: any) => {
                        const ws = new Workspace(w.name, w.type, w.id);
                        ws.ownerId = w.ownerId;
                        ws.members = w.members || [];
                        return ws;
                    });
                } catch (e) {
                    console.error("[WorkspaceStore] Failed to parse persisted workspaces", e);
                }
            }

            // 2. Hydrate Active Workspace ID
            const savedId = localStorage.getItem('activeWorkspaceId');
            const savedType = localStorage.getItem('activeWorkspaceType');

            if (savedId && this.workspaces.some(w => w.id === savedId)) {
                this.activeWorkspaceId = savedId;
            } else if (savedType) {
                const match = this.workspaces.find(w => w.type === savedType);
                this.activeWorkspaceId = match?.id || this.workspaces[0].id;
            } else {
                this.activeWorkspaceId = this.workspaces[0].id;
            }

            // Persistence Reactions
            reaction(
                () => this.workspaces.map(w => ({
                    id: w.id,
                    name: w.name,
                    type: w.type,
                    ownerId: w.ownerId,
                    members: w.members
                })),
                (simplified) => {
                    localStorage.setItem('persisted_workspaces', JSON.stringify(simplified));
                }
            );

            reaction(
                () => this.activeWorkspaceId,
                (id) => {
                    if (id) {
                        localStorage.setItem('activeWorkspaceId', id);
                        const ws = this.workspaces.find(w => w.id === id);
                        if (ws) {
                            localStorage.setItem('activeWorkspaceType', ws.type);
                        }
                    }
                }
            );

            // Data Fetching Reaction (Crucial: always call, api handles offline/IndexedDB)
            reaction(
                () => this.activeWorkspaceId,
                (id) => {
                    if (id) {
                        this.fetchActiveWorkspaceData();
                        // Reset active group to Inbox when switching workspaces
                        this.rootStore.activeGroupId = 'default';
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

            const newWS = await api.createWorkspace("My Team", "team", ownerId);

            // Re-initialize to fetch the new workspace
            await this.initializeData();

            // Switch to it
            runInAction(() => {
                // Prefer the ID from the server response if available, otherwise find by type
                const team = this.workspaces.find(w => (newWS?.id && w.id === newWS.id) || w.type === 'team');
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

    async updateWorkspace(id: string, data: { name?: string }) {
        this.isLoading = true;
        try {
            await api.updateWorkspace(id, data);
            runInAction(() => {
                const workspace = this.workspaces.find(w => w.id === id);
                if (workspace) {
                    if (data.name) workspace.name = data.name;
                    // Trigger reaction/sync if needed, though monitoring should catch it
                }
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = "Failed to update workspace: " + err.message;
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
            // 1. Fetch Real Workspaces first (if online)
            let fetchedWorkspaces = [];
            if (typeof window !== 'undefined' && !navigator.onLine) {
                console.log("[WorkspaceStore] Offline. Skipping workspace list fetch.");
            } else {
                fetchedWorkspaces = await api.getWorkspaces();
            }

            runInAction(() => {
                // Map fetched to instances
                const newWorkspaces = fetchedWorkspaces.map((fw: any) => {
                    const id = fw.type === 'personal' ? 'personal' : fw.id;
                    const existing = this.workspaces.find(w => w.id === id);
                    if (existing) {
                        existing.name = fw.name;
                        existing.members = fw.members;
                        existing.ownerId = fw.ownerId;
                        return existing;
                    }

                    const w = new Workspace(fw.name, fw.type, id);
                    w.ownerId = fw.ownerId;
                    w.members = fw.members;
                    return w;
                });

                this.workspaces = newWorkspaces;

                // Ensure Personal Exists locally
                if (!this.workspaces.some(w => w.type === 'personal')) {
                    const p = new Workspace("Personal", 'personal');
                    this.workspaces.unshift(p);
                }

                // If activeWorkspaceId is no longer valid, fallback
                if (!this.activeWorkspaceId || !this.workspaces.some(w => w.id === this.activeWorkspaceId)) {
                    const personal = this.workspaces.find(w => w.type === 'personal');
                    this.activeWorkspaceId = personal?.id || this.workspaces[0].id;
                } else {
                    // Force refresh data for the valid active workspace
                    this.fetchActiveWorkspaceData();
                }

                // Monitor workspaces
                this.workspaces.forEach(w => workspaceSyncStrategy.monitor(w));
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = "Failed to load workspaces: " + err.message;
                console.error(err);
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    private async fetchActiveWorkspaceData() {
        if (!this.activeWorkspaceId) return;

        console.log(`[WorkspaceStore] Fetching data for workspace: ${this.activeWorkspaceId}`);
        this.isLoading = true;

        try {
            const today = new Date();
            const start = startOfDay(subMonths(today, 1));
            const end = endOfDay(addMonths(today, 1));
            this.lastFetchRange = { start, end };

            const data = await api.getInitialData(start, end, this.activeWorkspaceId);

            runInAction(() => {
                const targetWorkspace = this.activeWorkspace;
                if (!targetWorkspace) return;

                // Hydrate Groups into Target Workspace
                if (data.groups) {
                    targetWorkspace.groups = data.groups.map((g: any) => this.hydrateGroup(g));
                }

                // Hydrate Dump Tasks
                if (data.dumpTasks) {
                    targetWorkspace.dumpAreaTasks = data.dumpTasks.map((t: any) => this.hydrateTask(t));
                }

                // Hydrate Templates
                if (data.templates) {
                    this.rootStore.taskStore.templates = data.templates.map((t: any) => this.hydrateTask(t));
                }

                // Load Labels
                if (data.availableLabels) {
                    const mappedLabels = data.availableLabels.map((l: any) => ({
                        ...l,
                        workspaceId: l.workspaceId || this.activeWorkspaceId
                    }));
                    this.rootStore.labelStore.setAvailableLabels(mappedLabels);
                }
            });
        } catch (err: any) {
            runInAction(() => {
                this.error = "Failed to load tasks: " + err.message;
                console.error(err);
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    private hydrateGroup(g: any): Group {
        const group = new Group(g.name, g.icon, g.type || 'personal', g.workspaceId, g.defaultLabelId, g.autoAddLabelEnabled);
        group.id = g.id;
        group.workspaceId = g.workspaceId;
        if (g.tasks) {
            group.tasks = g.tasks.map((t: any) => this.hydrateTask(t));
        }
        groupSyncStrategy.monitor(group);
        return group;
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
        task.isTemplate = !!data.isTemplate;

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
