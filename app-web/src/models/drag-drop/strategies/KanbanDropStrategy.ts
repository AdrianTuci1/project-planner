import { setHours, setMinutes, startOfDay } from 'date-fns';
import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';
import { DragEndEvent } from '@dnd-kit/core';
import { store } from '../../store';
import { runInAction } from 'mobx';

export class KanbanDropStrategy implements DragStrategy {
    handle(
        task: Task,
        overData: DragData,
        event: DragEndEvent,
        context: { activeId: string; overId: string; isReordering: boolean }
    ): void {
        const { date } = overData;
        if (!date) return;

        if (context.isReordering) {
            const { activeId, overId } = context;

            if (activeId !== overId) {
                // Find tasks for this day
                // We need the ACTUAL list that is being rendered to find indices correctly.
                // Ideally we drag within a Group.
                // But Kanban shows tasks by date.

                // Strategy: identify the source list (group or dump) and move within that list.
                // ONLY if both tasks belong to the same list.
                const taskOwner = store.groups.find(g => g.tasks.find(t => t.id === activeId)) ||
                    (store.dumpAreaTasks.find(t => t.id === activeId) ? { tasks: store.dumpAreaTasks } : null);

                const overOwner = store.groups.find(g => g.tasks.find(t => t.id === overId)) ||
                    (store.dumpAreaTasks.find(t => t.id === overId) ? { tasks: store.dumpAreaTasks } : null);

                if (taskOwner && overOwner && taskOwner === overOwner) {
                    const list = taskOwner.tasks as Task[];
                    const oldIdx = list.findIndex(t => t.id === activeId);
                    const newIdx = list.findIndex(t => t.id === overId);

                    if (oldIdx !== -1 && newIdx !== -1) {
                        runInAction(() => {
                            const [moved] = list.splice(oldIdx, 1);
                            list.splice(newIdx, 0, moved);
                        });
                    }
                }
            }
            return;
        }

        if (!task.scheduledDate) {
            // Default to start of day if no previous time
            runInAction(() => {
                task.scheduledDate = setHours(startOfDay(date), 0);
                task.scheduledTime = null;
            });
        } else {
            // Keep existing time, just change date
            // ONLY if includeTime is true
            if (task.scheduledTime) {
                const hour = task.scheduledDate.getHours();
                const minute = task.scheduledDate.getMinutes();
                runInAction(() => {
                    task.scheduledDate = setMinutes(setHours(startOfDay(date), hour), minute);
                });
            } else {
                runInAction(() => {
                    task.scheduledDate = setHours(startOfDay(date), 0);
                    task.scheduledTime = null;
                });
            }
        }

        // Group moves are now handled centrally in DragDropManager.
    }
}
