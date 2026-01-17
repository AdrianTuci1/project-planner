import { startOfDay, setHours } from 'date-fns';
import { runInAction } from 'mobx';
import { DragStrategy } from '../DragStrategy';
import { Task } from '../../core';
import { DragData } from '../types';
import { DragEndEvent } from '@dnd-kit/core';

export class CalendarDropStrategy implements DragStrategy {
    handle(
        task: Task,
        overData: DragData,
        event: DragEndEvent,
        context: { activeId: string; overId: string; isReordering: boolean }
    ): void {
        const { date, hour } = overData;

        // Case 1: Month View Drop (Date only)
        if (date && hour === undefined) {
            runInAction(() => {
                const newDate = startOfDay(date);
                // If task already has a time, preserve it.
                // If not, maybe we don't set a time? Or set default?
                // Standard behavior: preserve time if exists.
                // If moving from "Unscheduled" (Sidebar) to Month View -> Set date, no time?
                // The current app model distinguishes "Timeboxed" (has date AND time) vs "Scheduled" (has date only?)
                // Actually, `task.scheduledTime` is optional string 'HH:mm'.
                // If we drop on Month View, we essentially just change the Date.

                task.scheduledDate = newDate;
                // If task had no time and we want to enforce timeboxing on calendar, we might default to 9 AM
                // But if the user drops on Month view, they might just mean "do it this day".
                // Lets check if the App supports tasks with date but NO time?
                // `getTasksForDayHour` filters by `t.scheduledTime` presence.
                // So if we don't set a time, it won't appear on the Day/Week/Timebox grid?
                // It WILL appear on Month View because month logic (likely) just checks date.

                // DECISION: If task has no time, set default 09:00. If it has time, keep it.
                if (!task.scheduledTime) {
                    task.scheduledTime = '09:00';
                }
            });
            return;
        }

        // Case 2: Time Grid Drop (Date + Hour)
        if (overData.date && overData.hour !== undefined) {
            // ... (Existing Logic)
            const { date, hour } = overData;

            // Calculate minute based on drop position relative to the hour cell
            // We use the 'activatorEvent' (pointer) relative to the 'over' rect
            let minute = 0;

            if (overData.minute !== undefined) {
                // If dropping directly on a slot or an existing task with precise minute data
                minute = overData.minute;
            } else if (event && event.over && event.over.rect) {
                // Fallback: Calculate minute based on drop position relative to the hour cell
                // Get the layout rect of the drop target (the hour cell)
                // dnd-kit stores rect in `over.rect` (ClientRect)
                // @ts-ignore - rect exists on over in dnd-kit usually, verifying via usage
                const overRect = event.over.rect;

                if (overRect) {
                    // Try to get the actual top of the dragged element
                    // This creates a WYSIWYG drop experience where the top of the card aligns with the slot
                    let targetY: number;

                    // @ts-ignore - access dnd-kit rect structure
                    const translatedRect = event.active?.rect?.current?.translated;
                    if (translatedRect) {
                        targetY = translatedRect.top;
                    } else {
                        // Fallback to pointer if rect is missing (should not happen usually)
                        const activatorEvent = event.activatorEvent as MouseEvent | TouchEvent;
                        if (activatorEvent) {
                            targetY = 'changedTouches' in activatorEvent
                                ? (activatorEvent as any).changedTouches[0].clientY
                                : (activatorEvent as MouseEvent).clientY;
                        } else {
                            // Absolute fallback
                            targetY = overRect.top;
                        }
                    }

                    // Calculate relative Y in the cell
                    /* 
                       Logic: We want the top of the card to determine the start time.
                       Relative Y = CardTop - CellTop.
                    */
                    const relativeY = targetY - overRect.top;
                    const cellHeight = overRect.height;

                    console.log('[CalendarDropStrategy] Debug:', {
                        targetY,
                        rectTop: overRect.top,
                        rectHeight: overRect.height,
                        relativeY,
                        percent: relativeY / cellHeight
                    });

                    if (cellHeight > 0) {
                        // Use Math.round for "closest" snapping sense
                        // 0-12.5% -> 0
                        // 12.5-37.5% -> 15
                        // 37.5-62.5% -> 30
                        // 62.5-100% -> 45 (clamped)
                        const percentage = relativeY / cellHeight;
                        let segment = Math.round(percentage * 4);
                        // Clamp to valid segments [0, 3] to stay within the hour
                        // (Alternatively, segment=4 could mean rolling to next hour, but that complicates Date logic)
                        segment = Math.max(0, Math.min(3, segment));
                        minute = segment * 15;
                    }
                } else {
                    console.log('[CalendarDropStrategy] Missing rect or activatorEvent', { overRect });
                }
            } else {
                console.log('[CalendarDropStrategy] Missing event or over.rect', event);
            }

            console.log('[CalendarDropStrategy] Calculated minute:', minute);

            runInAction(() => {
                const newDate = setHours(startOfDay(date), hour);
                newDate.setMinutes(minute);

                task.scheduledDate = newDate;
                task.scheduledTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            });
        }
    }
}
