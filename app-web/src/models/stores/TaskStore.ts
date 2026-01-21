import { makeAutoObservable } from "mobx";
import { Task, IParticipant } from "../core";
import { ProjectStore } from "../store";
import { taskSyncStrategy } from "../strategies/TaskSyncStrategy";

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
    }

    get allTasks() {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return [];
        return [...activeWorkspace.dumpAreaTasks, ...activeWorkspace.groups.flatMap(g => g.tasks)];
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
        const task = this.rootStore.workspaceStore.activeWorkspace?.addTaskToDump(title);
        if (task) taskSyncStrategy.monitor(task);
    }

    moveTaskToGroup(taskId: string, groupId: string) {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

        const dumpTaskIndex = activeWorkspace.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpTaskIndex > -1) {
            const task = activeWorkspace.dumpAreaTasks[dumpTaskIndex];
            const group = activeWorkspace.groups.find(g => g.id === groupId);
            if (group) {
                group.addTask(task);
                activeWorkspace.dumpAreaTasks.splice(dumpTaskIndex, 1);
            }
        }
    }

    deleteTask(taskId: string) {
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

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
        const activeWorkspace = this.rootStore.workspaceStore.activeWorkspace;
        if (!activeWorkspace) return;

        const dumpIndex = activeWorkspace.dumpAreaTasks.findIndex(t => t.id === task.id);
        if (dumpIndex > -1) {
            const clone = task.clone();
            activeWorkspace.dumpAreaTasks.splice(dumpIndex + 1, 0, clone);
            taskSyncStrategy.monitor(clone);
            return clone;
        }

        for (const group of activeWorkspace.groups) {
            const groupTask = group.tasks.find(t => t.id === task.id);
            if (groupTask) {
                const clone = group.duplicateTask(task.id);
                if (clone) taskSyncStrategy.monitor(clone);
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
        // Implement save logic if needed, or delegate to api.
        // For now, assuming it's used for just persisting locally or adding to list?
        // Method was in ProjectStore delegation list but not in original TaskStore file provided? 
        // Wait, I saw it in 'store.ts' delegation: 'saveNewTask(task: Task) { return this.taskStore.saveNewTask(task); }'
        // But in original 'TaskStore.ts', I don't see 'saveNewTask'. 
        // Let me check the original file content again.
    }

    // Missing methods from delegation in store.ts that were not in TaskStore.ts?
    // createTaskInGroup? 
    createTaskInGroup(title: string, group: any) {
        const task = new Task(title);
        group.addTask(task);
        taskSyncStrategy.monitor(task);
        return task;
    }
}
