import { reaction, IReactionDisposer } from "mobx";
import { Task } from "../core";
import { api } from "../../services/api";

type DebouncedFunction = ((...args: any[]) => void) & { cancel: () => void };

function debounce(func: (...args: any[]) => void, wait: number): DebouncedFunction {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = function (...args: any[]) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, wait);
    };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced as DebouncedFunction;
}

export class TaskSyncStrategy {
    private disposers = new Map<string, IReactionDisposer[]>();
    private pendingUpdates = new Map<string, DebouncedFunction>();
    private isMonitoring = new Set<string>();
    private persistedTasks = new Set<string>();

    markAsPersisted(taskId: string) {
        this.persistedTasks.add(taskId);
    }

    monitor(task: Task) {
        if (this.isMonitoring.has(task.id)) return;
        this.isMonitoring.add(task.id);

        // If not already on server, create it
        if (!this.persistedTasks.has(task.id)) {
            console.log(`[TaskSyncStrategy] Creating task ${task.id} on server...`);
            api.createTask(task).then(() => {
                this.persistedTasks.add(task.id);
            }).catch(err => {
                console.error(`[TaskSyncStrategy] Failed to create task ${task.id}`, err);
            });
        }

        const disposers: IReactionDisposer[] = [];

        // 1. Structural/Status Changes (Immediate Sync usually better, but debounce allows quick toggles)
        disposers.push(reaction(
            () => ({
                title: task.title,
                status: task.status,
                priority: task.priority,
                recurrence: task.recurrence,
                workspaceId: task.workspaceId,
                groupId: task.groupId,
                isTemplate: task.isTemplate
            }),
            (data) => {
                this.scheduleUpdate(task.id, task);
            }
        ));

        // 2. Scheduler Changes
        disposers.push(reaction(
            () => ({
                scheduledDate: task.scheduledDate,
                scheduledTime: task.scheduledTime,
                dueDate: task.dueDate,
                duration: task.duration,
                actualDuration: task.actualDuration
            }),
            (data) => {
                this.scheduleUpdate(task.id, task);
            }
        ));

        // 3. Collection Changes (Labels)
        disposers.push(reaction(
            () => task.labelId,
            (labelId) => {
                this.scheduleUpdate(task.id, task);
            }
        ));

        // 4. Description (Debounce longer?)
        disposers.push(reaction(
            () => task.description,
            (desc) => {
                this.scheduleUpdate(task.id, task, 2000); // Longer debounce for text
            }
        ));

        // 5. Subtasks (Deep observation or length/content)
        disposers.push(reaction(
            () => task.subtasks.map(s => ({ id: s.id, title: s.title, isCompleted: s.isCompleted })),
            (data) => {
                this.scheduleUpdate(task.id, task);
            }
        ));

        // 6. Attachments
        disposers.push(reaction(
            () => task.attachments.length, // Watch for add/remove
            (len) => {
                this.scheduleUpdate(task.id, task);
            }
        ));

        // 7. Participants
        disposers.push(reaction(
            () => task.participants.map(p => p.id), // Watch for ID changes
            (ids) => {
                this.scheduleUpdate(task.id, task);
            }
        ));



        this.disposers.set(task.id, disposers);
    }

    stopMonitoring(taskId: string) {
        const disposers = this.disposers.get(taskId);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(taskId);
        }

        // Cancel pending update if any
        const pending = this.pendingUpdates.get(taskId);
        if (pending) {
            pending.cancel();
            this.pendingUpdates.delete(taskId);
        }

        this.isMonitoring.delete(taskId);
    }

    private scheduleUpdate(taskId: string, task: Task, delay: number = 1000) {
        let debounced = this.pendingUpdates.get(taskId);

        if (!debounced) {
            debounced = debounce(async () => {
                console.log(`[TaskSyncStrategy] Syncing task ${taskId}...`);
                try {
                    await api.updateTask(taskId, task); // Pass task object directly, let API module serialize
                } catch (err) {
                    console.error(`[TaskSyncStrategy] Failed to sync task ${taskId}`, err);
                } finally {
                    this.pendingUpdates.delete(taskId);
                }
            }, delay);
            this.pendingUpdates.set(taskId, debounced);
        }

        debounced();
    }
}

export const taskSyncStrategy = new TaskSyncStrategy();
