import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';
import { DragEndEvent } from '@dnd-kit/core';
import { store } from '../../store';
import { runInAction } from 'mobx';

export class SidebarDropStrategy implements DragStrategy {
    handle(
        task: Task,
        overData: DragData,
        event: DragEndEvent,
        context: { activeId: string; overId: string; isReordering: boolean }
    ): void {
        const { groupId } = overData;

        if (context.isReordering) {
            const { activeId, overId } = context;

            if (activeId !== overId) {
                const targetList = groupId === null ? store.dumpAreaTasks : store.groups.find(g => g.id === groupId)?.tasks;

                if (targetList) {
                    const oldIndex = targetList.findIndex(t => t.id === activeId);
                    const newIndex = targetList.findIndex(t => t.id === overId);

                    if (oldIndex !== -1 && newIndex !== -1) {
                        runInAction(() => {
                            const [movedItem] = targetList.splice(oldIndex, 1);
                            targetList.splice(newIndex, 0, movedItem);
                        });
                    }
                }
            }
            return;
        }

        // Moving between lists or from Calendar
        if (groupId === null) {
            // Moving to Brain Dump
            if (!store.dumpAreaTasks.find(t => t.id === task.id)) {
                runInAction(() => {
                    // Remove from old group
                    const oldGroup = store.groups.find(g => g.tasks.includes(task));
                    if (oldGroup) oldGroup.removeTask(task.id);

                    store.dumpAreaTasks.push(task);
                });
            }
        } else {
            // Moving to a specific group
            const targetGroup = store.groups.find(g => g.id === groupId);
            if (targetGroup && !targetGroup.tasks.find(t => t.id === task.id)) {
                runInAction(() => {
                    // Remove from dump if there
                    const dumpIndex = store.dumpAreaTasks.findIndex(t => t.id === task.id);
                    if (dumpIndex > -1) store.dumpAreaTasks.splice(dumpIndex, 1);

                    // Remove from old group
                    const oldGroup = store.groups.find(g => g.id !== groupId && g.tasks.includes(task));
                    if (oldGroup) oldGroup.removeTask(task.id);

                    targetGroup.addTask(task);
                });
            }
        }

        // Ensure the task is visible in the sidebar by clearing the schedule
        // Sidebar filters out tasks that have a scheduledDate
        runInAction(() => {
            task.scheduledDate = undefined;
            task.scheduledTime = undefined;
        });
    }
}
