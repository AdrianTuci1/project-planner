import { makeAutoObservable, runInAction } from "mobx";
import { ProjectStore } from "../store";
import { Task } from "../core";
import { addMonths, addDays } from "date-fns";

export class RecurrenceStore {
    rootStore: ProjectStore;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    checkAndGenerateRecurringTasks() {
        // Horizon: Generate tasks up to 7 days or 1 month ahead
        const tasksToCreate: { task: Task, groupId?: string }[] = [];
        const today = new Date();
        const horizonDate = addMonths(today, 1);

        const allTasks = this.rootStore.taskStore.allTasks;
        // Snapshot to avoid mutation issues during iteration if we were strictly reactive, 
        // though here we just read.
        const currentTasks = [...allTasks];

        currentTasks.forEach(task => {
            if (task.recurrence && task.recurrence !== 'none' && task.scheduledDate) {
                let nextDate = new Date(task.scheduledDate);
                nextDate.setHours(0, 0, 0, 0);

                let iterations = 0;
                while (iterations < 5) {
                    if (task.recurrence === 'daily') {
                        nextDate = addDays(nextDate, 1);
                    } else if (task.recurrence === 'weekly') {
                        nextDate = addDays(nextDate, 7);
                    } else if (task.recurrence === 'weekday') {
                        do {
                            nextDate = addDays(nextDate, 1);
                        } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
                    } else if (task.recurrence === 'monthly') {
                        nextDate = addMonths(nextDate, 1);
                    } else if (task.recurrence === 'yearly') {
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                    } else {
                        break;
                    }

                    if (nextDate > horizonDate) break;

                    const exists = allTasks.some(t =>
                        t.title === task.title &&
                        t.scheduledDate &&
                        t.scheduledDate.getDate() === nextDate.getDate() &&
                        t.scheduledDate.getMonth() === nextDate.getMonth() &&
                        t.scheduledDate.getFullYear() === nextDate.getFullYear()
                    );

                    if (!exists) {
                        const newTask = task.clone();
                        newTask.scheduledDate = new Date(nextDate);
                        const group = this.rootStore.groups.find(g => g.tasks.includes(task));
                        tasksToCreate.push({ task: newTask, groupId: group?.id });
                    }
                    iterations++;
                }
            }
        });

        runInAction(() => {
            tasksToCreate.forEach(({ task, groupId }) => {
                const exists = this.rootStore.taskStore.allTasks.some(t =>
                    t.title === task.title &&
                    t.scheduledDate &&
                    t.scheduledDate.getTime() === task.scheduledDate!.getTime()
                );
                if (!exists) {
                    if (groupId) {
                        const group = this.rootStore.groups.find(g => g.id === groupId);
                        group?.addTask(task);
                    } else {
                        // this.rootStore.taskStore.addTaskToDump(task.title);
                        // Wait, addTaskToDump creates a NEW task. We want to add THIS specific task instance.
                        // TaskStore.addTaskToDump takes string. We need to expose a way to add a Task object.
                        // We'll fix TaskStore to allow adding raw task or expose access to list.
                        // accessing dumpAreaTasks directly is fine as it's public.
                        this.rootStore.dumpAreaTasks.push(task);
                    }
                }
            });
        });
    }

    deleteRecurringSeries(sourceTask: Task) {
        const tasksToDelete = this.rootStore.taskStore.allTasks.filter(t => t.title === sourceTask.title);

        runInAction(() => {
            tasksToDelete.forEach(t => {
                this.rootStore.taskStore.deleteTask(t.id);
            });
        });
    }

    updateRecurringSeries(sourceTask: Task) {
        const tasksToUpdate = this.rootStore.taskStore.allTasks.filter(t =>
            t.title === sourceTask.title &&
            t.id !== sourceTask.id &&
            t.status !== 'done'
        );

        runInAction(() => {
            tasksToUpdate.forEach(t => {
                t.title = sourceTask.title;
                t.description = sourceTask.description;
                t.duration = sourceTask.duration;
                t.labelId = sourceTask.labelId;
                t.participants = [...sourceTask.participants];
                t.recurrence = sourceTask.recurrence;
                if (sourceTask.scheduledTime) {
                    t.scheduledTime = sourceTask.scheduledTime;
                }
            });
        });
    }

    stopRecurrence(task: Task) {
        runInAction(() => {
            task.recurrence = 'none';
        });
    }
}
