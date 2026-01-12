import { makeAutoObservable, runInAction } from "mobx";
import { Group, Task, IParticipant } from "../core";
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

    groups: Group[] = [];
    dumpAreaTasks: Task[] = [];
    currentUser: IParticipant = MOCK_USER;

    // API State - Loading state usually belongs to data fetching
    isLoading: boolean = false;
    error: string | null = null;
    lastFetchRange: { start: Date, end: Date } | null = null;

    availableLabels: { id: string; name: string; color: string }[] = [];

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async initializeData() {
        this.isLoading = true;
        this.error = null;
        try {
            // Determine range: Today +/- 1 Month
            const today = new Date();
            const start = startOfDay(subMonths(today, 1));
            const end = endOfDay(addMonths(today, 1));

            this.lastFetchRange = { start, end };

            const data = await api.getInitialData(start, end);

            runInAction(() => {
                // Hydrate Groups
                this.groups = data.groups.map((g: any) => {
                    const group = new Group(g.name, g.icon, g.defaultLabelId, g.autoAddLabelEnabled);
                    group.id = g.id;
                    group.tasks = g.tasks.map((t: any) => this.hydrateTask(t));
                    return group;
                });

                // Hydrate Dump Tasks
                this.dumpAreaTasks = data.dumpTasks.map((t: any) => this.hydrateTask(t));

                // Hydrate Labels
                this.availableLabels = data.availableLabels;

                // Run recurrence check
                // We access the recurrence store through the root store wrapper if needed, 
                // or we just call the method on rootStore which delegates.
                // But RecurrenceStore might not be ready if we call it here?
                // Actually `initializeData` is called in RootStore constructor.
                // We will move the call to RootStore after initializing all stores.
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
        const groupTasks = this.groups.flatMap(g => g.tasks);
        return [...this.dumpAreaTasks, ...groupTasks];
    }

    // CRUD Methods
    createGroup(name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        const group = new Group(name, icon || '📝', defaultLabelId, autoAddLabelEnabled);
        this.groups.push(group);
        return group;
    }

    deleteGroup(groupId: string) {
        const index = this.groups.findIndex(g => g.id === groupId);
        if (index > -1) {
            this.groups.splice(index, 1);
            // Handling activeGroupId update is UI concern. 
            // We should ideally let UIStore react to this or handle it in RootStore/UIStore.
            // But for now, we leave it. The RootStore wrapper can handle the side effect.
        }
    }

    updateGroup(groupId: string, name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.name = name;
            if (icon) group.icon = icon;
            if (defaultLabelId !== undefined) group.defaultLabelId = defaultLabelId;
            if (autoAddLabelEnabled !== undefined) group.autoAddLabelEnabled = autoAddLabelEnabled;
        }
    }

    getLabel(labelId: string) {
        return this.availableLabels.find(l => l.id === labelId);
    }

    getLabelColor(labelId: string): string {
        const label = this.getLabel(labelId);
        return label ? label.color : '#60A5FA'; // Default blue if not found
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
        // Removing from filters is UI concern, handled in UIStore or RootStore wrapper.
    }

    addTaskToDump(title: string) {
        const task = new Task(title);
        this.dumpAreaTasks.push(task);
    }

    moveTaskToGroup(taskId: string, groupId: string) {
        const dumpTaskIndex = this.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpTaskIndex > -1) {
            const task = this.dumpAreaTasks[dumpTaskIndex];
            const group = this.groups.find(g => g.id === groupId);
            if (group) {
                group.addTask(task);
                this.dumpAreaTasks.splice(dumpTaskIndex, 1);
            }
        }
    }

    deleteTask(taskId: string) {
        const dumpIndex = this.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpIndex > -1) {
            this.dumpAreaTasks.splice(dumpIndex, 1);
            return;
        }

        for (const group of this.groups) {
            const taskIndex = group.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                group.removeTask(taskId);
                return;
            }
        }
    }

    duplicateTask(task: Task) {
        const dumpIndex = this.dumpAreaTasks.findIndex(t => t.id === task.id);
        if (dumpIndex > -1) {
            const clone = task.clone();
            this.dumpAreaTasks.splice(dumpIndex + 1, 0, clone);
            return clone;
        }

        for (const group of this.groups) {
            const groupTask = group.tasks.find(t => t.id === task.id);
            if (groupTask) {
                return group.duplicateTask(task.id);
            }
        }
    }

    getTaskById(taskId: string): Task | undefined {
        for (const group of this.groups) {
            const task = group.tasks.find(t => t.id === taskId);
            if (task) return task;
        }
        const dumpTask = this.dumpAreaTasks.find(t => t.id === taskId);
        return dumpTask;
    }
}
