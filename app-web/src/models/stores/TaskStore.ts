import { makeAutoObservable, reaction, runInAction } from "mobx";
import { Task, IParticipant } from "../core";
import { ProjectStore } from "../store";
import { taskSyncStrategy } from "../strategies/TaskSyncStrategy";
import { api } from "../../services/api";

const MOCK_USER: IParticipant = {
    id: 'u1',
    name: 'Adrian T.',
    initials: 'AT'
};

export class TaskStore {
    rootStore: ProjectStore;
    templates: Task[] = [];
    currentUser: IParticipant = MOCK_USER;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);

        // Auto-monitor templates
        reaction(
            () => this.templates.length,
            () => {
                this.templates.forEach(t => taskSyncStrategy.monitor(t));
            }
        );
    }

    get allTasks() {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return [];
        return [...activeWorkspace.dumpAreaTasks, ...activeWorkspace.groups.flatMap(g => g.tasks)];
    }

    handleRealtimeUpdate(type: string, data: any) {
        const workspaceStore = this.rootStore.workspaceStore;

        switch (type) {
            case 'task.created':
                this.handleTaskCreated(data, workspaceStore);
                break;
            case 'task.updated':
                this.handleTaskUpdated(data, workspaceStore);
                break;
            case 'task.deleted':
                this.handleTaskDeleted(data, workspaceStore);
                break;
        }
    }

    private handleTaskCreated(data: any, workspaceStore: any) {
        // Find correct workspace
        const workspaceFn = data.workspaceId ? workspaceStore.workspaces.find((w: any) => w.id === data.workspaceId) : workspaceStore.activeWorkspace;

        if (!workspaceFn) return; // Should not happen if data valid

        // Avoid duplications if optimistic creation already added it? 
        // Sync strategy usually handles ID matching. 
        // If local temp ID differs, we might duplicate.
        // Assuming strategy update handles dedupe or this is purely remote event.

        // Check if exists
        const exists = this.getTaskByIdInWorkspace(data.id, workspaceFn);
        if (exists) return; // Already exists

        const newTask = this.hydrateTask(data);

        if (newTask.groupId) {
            const group = workspaceFn.groups.find((g: any) => g.id === newTask.groupId);
            if (group) {
                group.addTask(newTask);
            } else {
                // Fallback or ignore if group missing (race condition)
                workspaceFn.dumpAreaTasks.push(newTask);
            }
        } else {
            workspaceFn.dumpAreaTasks.push(newTask);
        }
    }

    private handleTaskUpdated(data: any, workspaceStore: any) {
        const workspaceFn = data.workspaceId ? workspaceStore.workspaces.find((w: any) => w.id === data.workspaceId) : workspaceStore.activeWorkspace;
        if (!workspaceFn) return;

        const task = this.getTaskByIdInWorkspace(data.id, workspaceFn);
        if (task) {
            // Update fields
            task.title = data.title;
            task.description = data.description;
            task.status = data.status;
            task.priority = data.priority;
            task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;
            task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
            task.labelId = data.labelId;
            // ... map other fields

            // Handle Group Move via update
            if (task.groupId !== data.groupId) {
                // Remove from old
                // This logic logic is complex inside store usually, reusing moveTaskToGroup would be better if we knew IDs
                this.moveTaskInternal(task, data.groupId, workspaceFn);
            }
        }
    }

    private handleTaskDeleted(data: any, workspaceStore: any) {
        // data.id
        // Need to search across workspaces if we don't know which one, but usually current active or check all
        // Optimization: search active first
        let workspace = workspaceStore.activeWorkspace;
        let task = this.getTaskByIdInWorkspace(data.id, workspace);

        if (!task) {
            // Search others
            for (const w of workspaceStore.workspaces) {
                if (w === workspace) continue;
                task = this.getTaskByIdInWorkspace(data.id, w);
                if (task) {
                    workspace = w;
                    break;
                }
            }
        }

        if (task && workspace) {
            this.removeTaskFromWorkspace(task, workspace);
        }
    }

    private getTaskByIdInWorkspace(id: string, workspace: any) {
        for (const group of workspace.groups) {
            const task = group.tasks.find((t: any) => t.id === id);
            if (task) return task;
        }
        return workspace.dumpAreaTasks.find((t: any) => t.id === id);
    }

    private removeTaskFromWorkspace(task: Task, workspace: any) {
        if (task.groupId) {
            const group = workspace.groups.find((g: any) => g.id === task.groupId);
            if (group) group.removeTask(task.id);
        } else {
            const idx = workspace.dumpAreaTasks.indexOf(task);
            if (idx > -1) workspace.dumpAreaTasks.splice(idx, 1);
        }
    }

    // Reuse hydration logic from WorkspaceStore to avoid duplication? 
    // Ideally utility function. For NOW, copying bare minimum hydration.
    private hydrateTask(data: any): Task {
        const task = new Task(data.title);
        task.id = data.id;
        task.description = data.description || "";
        task.status = data.status || 'todo';
        task.priority = data.priority || 'none';
        task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;
        task.dueDate = data.dueDate ? new Date(data.dueDate) : undefined;
        task.labelId = data.labelId || null;
        task.workspaceId = data.workspaceId;
        task.groupId = data.groupId;

        // Start monitoring? Sync Strategy handles this automatically usually on observable changes?
        // Yes, but we should register it.
        taskSyncStrategy.markAsPersisted(task.id);
        taskSyncStrategy.monitor(task);

        return task;
    }

    private moveTaskInternal(task: Task, newGroupId: string | null, workspace: any) {
        // Remove from old
        this.removeTaskFromWorkspace(task, workspace);

        // Add to new
        if (newGroupId) {
            const group = workspace.groups.find((g: any) => g.id === newGroupId);
            if (group) {
                task.groupId = newGroupId;
                group.addTask(task);
            }
        } else {
            task.groupId = null;
            workspace.dumpAreaTasks.push(task);
        }
    }

    // --- Original Methods preserved ---

    // Template Methods
    createTemplate(title: string) {
        const task = new Task(title);
        task.isTemplate = true;
        task.workspaceId = this.rootStore.activeWorkspace.id;
        this.templates.push(task);
        return task;
    }

    addTemplate(task: Task) {
        task.isTemplate = true;
        if (!task.workspaceId) {
            task.workspaceId = this.rootStore.activeWorkspace.id;
        }
        this.templates.push(task);
    }

    deleteTemplate(id: string) {
        const index = this.templates.findIndex(t => t.id === id);
        if (index > -1) {
            this.templates.splice(index, 1);
        }
    }

    addTaskToDump(title: string) {
        const task = this.rootStore.workspaceStore.activeWorkspace?.addTaskToDump(title);
        if (task) {
            taskSyncStrategy.monitor(task);
        }
        return task;
    }

    moveTaskToGroup(taskId: string, groupId: string) {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

        const targetGroup = activeWorkspace.groups.find(g => g.id === groupId);
        if (!targetGroup) return;

        // 1. Check dump area
        const dumpIndex = activeWorkspace.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpIndex > -1) {
            const task = activeWorkspace.dumpAreaTasks[dumpIndex];
            activeWorkspace.dumpAreaTasks.splice(dumpIndex, 1);
            targetGroup.addTask(task);
            return;
        }

        // 2. Check all groups
        for (const group of activeWorkspace.groups) {
            const taskIndex = group.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const task = group.tasks[taskIndex];
                group.tasks.splice(taskIndex, 1);
                targetGroup.addTask(task);
                return;
            }
        }
    }

    createTaskInGroup(title: string, group: any) {
        const task = new Task(title);
        group.addTask(task);
        taskSyncStrategy.monitor(task);
        return task;
    }

    deleteTask(taskId: string) {

        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

        // Perform API delete
        api.deleteTask(taskId).catch(err => {
            console.error(`[TaskStore] Failed to delete task ${taskId} from server`, err);
        });

        const dumpIndex = activeWorkspace.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpIndex > -1) {
            activeWorkspace.dumpAreaTasks.splice(dumpIndex, 1);
            return;
        }

        for (const group of activeWorkspace.groups) {
            const taskIndex = group.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                group.removeTask(taskId);
                return;
            }
        }
    }

    duplicateTask(task: Task) {
        // Handle Template Duplication
        const templateIndex = this.templates.findIndex(t => t.id === task.id);
        if (templateIndex > -1) {
            const clone = task.clone();
            clone.title = `${task.title} (Copy)`;
            clone.isTemplate = true;
            this.templates.push(clone);
            taskSyncStrategy.monitor(clone);
            return clone;
        }

        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

        const dumpIndex = activeWorkspace.dumpAreaTasks.findIndex(t => t.id === task.id);
        if (dumpIndex > -1) {
            const clone = task.clone();
            activeWorkspace.dumpAreaTasks.splice(dumpIndex + 1, 0, clone);
            return clone;
        }

        for (const group of activeWorkspace.groups) {
            const groupTask = group.tasks.find(t => t.id === task.id);
            if (groupTask) {
                const clone = group.duplicateTask(task.id);
                return clone;
            }
        }
    }

    getTaskById(taskId: string): Task | undefined {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return undefined;

        for (const group of activeWorkspace.groups) {
            const task = group.tasks.find(t => t.id === taskId);
            if (task) return task;
        }
        const dumpTask = activeWorkspace.dumpAreaTasks.find(t => t.id === taskId);
        if (dumpTask) return dumpTask;

        const template = this.templates.find(t => t.id === taskId);
        return template;
    }

    saveNewTask(task: Task) {
        // Logic
    }

    moveTaskToInbox(taskId: string) {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

        // Check if already in dump
        if (activeWorkspace.dumpAreaTasks.find(t => t.id === taskId)) return;

        // Find in groups
        for (const group of activeWorkspace.groups) {
            const taskIndex = group.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const task = group.tasks[taskIndex];
                group.removeTask(taskId);

                // Update groupId to null explicitly for sync
                task.groupId = null;
                activeWorkspace.dumpAreaTasks.push(task);
                return;
            }
        }
    }
    removeLabelFromTasks(labelId: string) {
        this.allTasks.forEach(task => {
            if (task.labelId === labelId) {
                task.labelId = null;
                // Strategy will auto-sync this change
            }
        });

        // Also remove from templates
        this.templates.forEach(t => {
            if (t.labelId === labelId) {
                t.labelId = null;
            }
        });
    }
    toggleTaskCompletion(task: Task) {
        // Toggle status
        task.toggleStatus();

        // 1. Check "Move to bottom" setting
        const settings = this.rootStore.settings.general.generalSettings;

        if (task.status === 'done' && settings.moveTasksBottom) {
            // Move to bottom of its list
            const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
            if (!activeWorkspace) return;

            // Check dump area
            const dumpIndex = activeWorkspace.dumpAreaTasks.findIndex(t => t.id === task.id);
            if (dumpIndex > -1) {
                activeWorkspace.dumpAreaTasks.splice(dumpIndex, 1);
                activeWorkspace.dumpAreaTasks.push(task);
                return;
            }

            // Check groups
            for (const group of activeWorkspace.groups) {
                const groupIndex = group.tasks.findIndex(t => t.id === task.id);
                if (groupIndex > -1) {
                    group.tasks.splice(groupIndex, 1);
                    group.tasks.push(task);
                    return;
                }
            }
        }

        // 2. Check "Auto set actual time" setting
        if (task.status === 'done' && settings.autoSetActualTime) {
            if ((task.actualDuration || 0) < 1 && task.duration && task.duration > 0) {
                task.actualDuration = task.duration;
            }
        }
    }

    toggleSubtaskCompletion(subtask: any, parentTask: Task) {
        subtask.isCompleted = !subtask.isCompleted;

        const settings = this.rootStore.settings.general.generalSettings;

        // Move subtask to bottom if completed and setting enabled
        if (subtask.isCompleted && settings.moveTasksBottom) {
            const index = parentTask.subtasks.findIndex(s => s.id === subtask.id);
            if (index > -1) {
                parentTask.subtasks.splice(index, 1);
                parentTask.subtasks.push(subtask);
            }
        }

        // Check "Mark task as complete" setting
        if (settings.markCompleteSubtasks && subtask.isCompleted) {
            // Check if ALL subtasks are complete
            const allComplete = parentTask.subtasks.every(s => s.isCompleted);
            if (allComplete && parentTask.status !== 'done') {
                this.toggleTaskCompletion(parentTask);
            }
        }
    }
}
