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

        // Group moves and Inbox normalization are now handled centrally in DragDropManager.

        // Schedule clearing is now handled centrally in DragDropManager for sidebar-list targets.
    }
}
