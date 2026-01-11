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
                task.includeTime = false;
            });
        } else {
            // Keep existing time, just change date
            // ONLY if includeTime is true
            if (task.includeTime) {
                const hour = task.scheduledDate.getHours();
                const minute = task.scheduledDate.getMinutes();
                runInAction(() => {
                    task.scheduledDate = setMinutes(setHours(startOfDay(date), hour), minute);
                });
            } else {
                runInAction(() => {
                    task.scheduledDate = setHours(startOfDay(date), 0);
                    task.includeTime = false;
                });
            }
        }

        // Check if we need to move the task to a different group (if dropped on an empty column for a different group)
        // This is handled optimistically in DragDropManager for reordering, but key for "empty list" drops
        const { groupId } = overData;
        if (groupId !== undefined) { // groupId can be null (brain dump)
            const currentGroup = store.groups.find(g => g.tasks.find(t => t.id === task.id));
            const isBrainDump = store.dumpAreaTasks.find(t => t.id === task.id);

            let needsMove = false;
            if (groupId === null) {
                if (!isBrainDump) needsMove = true;
            } else {
                if (!currentGroup || currentGroup.id !== groupId) needsMove = true;
            }

            if (needsMove) {
                runInAction(() => {
                    // Remove from old
                    if (currentGroup) currentGroup.removeTask(task.id);
                    if (isBrainDump) {
                        const idx = store.dumpAreaTasks.findIndex(t => t.id === task.id);
                        if (idx > -1) store.dumpAreaTasks.splice(idx, 1);
                    }

                    // Add to new
                    if (groupId === null) {
                        store.dumpAreaTasks.push(task);
                    } else {
                        const targetGroup = store.groups.find(g => g.id === groupId);
                        if (targetGroup) targetGroup.addTask(task);
                    }
                });
            }
        }
    }
}
