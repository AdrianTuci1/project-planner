import { setHours, setMinutes, startOfDay } from 'date-fns';
import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';

export class TimeboxDropStrategy implements DragStrategy {
    handle(task: Task, overData: DragData): void {
        if (overData.date && overData.hour !== undefined && overData.minute !== undefined) {
            const { date, hour, minute } = overData;
            task.scheduledDate = setHours(startOfDay(date), 0);
            task.scheduledTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        }
    }
}
