import { setHours, setMinutes, startOfDay, isSameDay } from 'date-fns';
import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';
import { DragEndEvent } from '@dnd-kit/core';
import { store } from '../../store';
import { runInAction } from 'mobx';

export class TasksListDropStrategy implements DragStrategy {
    handle(
        task: Task,
        overData: DragData,
        event: DragEndEvent,
        context: { activeId: string; overId: string; isReordering: boolean }
    ): void {
        if (!overData.date) return;
        const { date } = overData; // View date

        // ALWAYS update date to match the view (if we are in TasksView)
        // This handles dragging from other days.
        if (!task.scheduledDate || !isSameDay(task.scheduledDate, date)) {
            runInAction(() => {
                if (task.scheduledDate) {
                    const h = task.scheduledDate.getHours();
                    const m = task.scheduledDate.getMinutes();
                    task.scheduledDate = new Date(date);
                    task.scheduledDate.setHours(h, m);
                } else {
                    task.scheduledDate = new Date(date);
                    task.scheduledDate.setHours(0, 0, 0, 0); // Default to start of day
                }
            });
        }

        if (context.isReordering) {
            const { activeId, overId } = context;

            if (activeId !== overId) {
                const taskOwner = store.groups.find(g => g.tasks.find(t => t.id === activeId)) ||
                    (store.dumpAreaTasks.find(t => t.id === activeId) ? { tasks: store.dumpAreaTasks } : null);

                const overOwner = store.groups.find(g => g.tasks.find(t => t.id === overId)) ||
                    (store.dumpAreaTasks.find(t => t.id === overId) ? { tasks: store.dumpAreaTasks } : null);

                if (taskOwner && overOwner) {
                    const sourceList = taskOwner.tasks as Task[];
                    const targetList = overOwner.tasks as Task[];
                    const oldIdx = sourceList.findIndex(t => t.id === activeId);
                    // Find new index in TARGET list
                    let newIdx = targetList.findIndex(t => t.id === overId);

                    if (oldIdx !== -1 && newIdx !== -1) {
                        runInAction(() => {
                            if (taskOwner === overOwner) {
                                // Same list reorder
                                const [moved] = sourceList.splice(oldIdx, 1);
                                sourceList.splice(newIdx, 0, moved);
                            } else {
                                // Cross-list move (Change Group)
                                // We are moving from Group A to Group B to place it "next to" the target task.
                                const [moved] = sourceList.splice(oldIdx, 1);

                                // Update group ID
                                const newGroupId = store.groups.find(g => g.tasks === targetList)?.id || null; // null for dumpArea
                                moved.groupId = newGroupId; // Use setter if available, or property

                                targetList.splice(newIdx, 0, moved);
                                console.log(`[TasksListDropStrategy] Moved task ${activeId} to group ${newGroupId} at index ${newIdx}`);
                            }
                        });
                    }
                }
            }
            return;
        }


    }
}
