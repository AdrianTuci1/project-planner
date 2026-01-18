import { runInAction } from 'mobx';
import { DragEndEvent } from '@dnd-kit/core';
import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';
import { startOfDay } from 'date-fns';
import { store } from '../../store';

export class TimeboxDropStrategy implements DragStrategy {
    handle(
        task: Task,
        overData: DragData,
        event: DragEndEvent,
        context: { activeId: string; overId: string; isReordering: boolean }
    ): void {
        console.log('[TimeboxDropStrategy] Handle called', {
            taskId: task.id,
            overType: overData.type,
            overData
        });

        // Ensure we are handling the correct target type
        if (overData.type !== 'timebox-slot') {
            return;
        }

        const { date, hour, minute } = overData;

        // Check for required data points
        if (date && hour !== undefined && minute !== undefined) {
            runInAction(() => {
                // Confirm valid date object and set time
                const h = Math.max(0, Math.min(23, Number(hour)));
                const m = Math.max(0, Math.min(59, Number(minute)));

                const newDate = new Date(date);
                newDate.setHours(h, m, 0, 0);

                task.scheduledDate = newDate;

                task.scheduledTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

                store.setDragOverLocation({ date: newDate, hour: h, minute: m });

                console.log('[TimeboxDropStrategy] Updated task time:', task.scheduledTime);
            });
        } else {
            console.warn('[TimeboxDropStrategy] Missing required drop data:', { date, hour, minute });
        }
    }
}
