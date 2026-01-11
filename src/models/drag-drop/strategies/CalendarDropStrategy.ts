import { setHours, setMinutes, startOfDay } from 'date-fns';
import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';
import { DragEndEvent } from '@dnd-kit/core';

export class CalendarDropStrategy implements DragStrategy {
    handle(task: Task, overData: DragData): void {
        // Calendar items moved internally OR List items dropped here (scheduling)
        if (overData.date && overData.hour !== undefined) {
            const { date, hour } = overData;
            // Preserve minute if it makes sense, or default to 0
            const newDate = setHours(startOfDay(date), hour);
            // Default to 0 minutes for clearer scheduling on hour grid
            task.scheduledDate = setMinutes(newDate, 0); // Still needed for sorting/display logic relying on Date object?
            // Actually, Date object should be 00:00 and time in string? 
            // Or better: keep Date object as Date only (00:00) and time string.
            // But CalendarView might rely on Date object having time for positioning?
            // "CalendarView filters by includeTime" was my previous fix.
            // Current Plan: Date stores DATE (00:00). Time stores TIME.
            task.scheduledDate = setHours(startOfDay(date), 0);
            task.scheduledTime = `${hour.toString().padStart(2, '0')}:00`;
        }
    }
}
