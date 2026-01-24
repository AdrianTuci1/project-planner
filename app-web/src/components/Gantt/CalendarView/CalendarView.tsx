import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { format, addDays, isSameDay, startOfWeek, startOfDay } from 'date-fns';
import './CalendarView.css';
import { MonthGrid } from './MonthGrid';
import { CalendarCell } from './CalendarCell';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onSlotClick?: (date: Date, hour: number, minute: number) => void;
}

export const CalendarView = observer(({ tasks, onTaskClick, onSlotClick }: CalendarViewProps) => {
    // Resize Logic
    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, task: Task) => {
        e.preventDefault();
        e.stopPropagation();

        // Get start Y position
        const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const startDuration = task.duration || 15;

        // We need the height of 1 hour (pixel height of the hour cell)
        // We can find closest .hour-cell or better yet, since we are in the handler, 
        // e.target is the resize handle. Its parent is the task card. 
        // Its parent's parent is the .hour-cell.
        const handle = e.target as HTMLElement;
        const card = handle.closest('.calendar-event') as HTMLElement;
        const cell = card?.closest('.hour-cell') as HTMLElement;

        if (!cell) return;

        const hourHeight = cell.clientHeight;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
            const deltaY = currentY - startY;

            // Convert pixels to minutes
            // hourHeight pixels = 60 minutes
            const deltaMinutes = (deltaY / hourHeight) * 60;

            let newDuration = startDuration + deltaMinutes;

            // Snap to 15 mins
            newDuration = Math.max(15, Math.round(newDuration / 15) * 15);

            if (newDuration !== task.duration) {
                task.duration = newDuration;
            }
        };

        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
    };

    // Calculate days based on view type
    let days: Date[] = [];
    if (store.calendarViewType === 'day') {
        days = [store.viewDate];
    } else if (store.calendarViewType === 'week') {
        // Map string setting to 0-6 index
        const weekStartsOnMap: Record<string, 0 | 1 | 6> = {
            'Sunday': 0,
            'Monday': 1,
            'Saturday': 6
        };
        const weekStartIdx = weekStartsOnMap[store.settings.general.generalSettings.startWeekOn] ?? 0;

        const weekStart = startOfWeek(store.viewDate, { weekStartsOn: weekStartIdx });
        days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

        // Use daysToShow ONLY if we are using the default "Sunday" start and showing 7 days isn't forced by the "Week" view concept
        // ACTUALLY: The previous requirement was "configurable number of days".
        // Usually "Week View" implies a full week or 5 days (work week).
        // BUT the user asked for configurable days (2-7).
        // Interaction:
        // If daysToShow < 7, we probably just show N days starting from weekStart?
        // OR does "Week Start On" only matter for full 7-day weeks?
        // Let's assume:
        // 1. Calculate the start of the week based on setting.
        // 2. Generate 'store.daysToShow' days from that start date.

        days = Array.from({ length: store.daysToShow }, (_, i) => addDays(weekStart, i));

        // Filter weekends if needed
        if (!store.settings.general.generalSettings.showWeekends) {
            days = days.filter(d => {
                const day = d.getDay();
                return day !== 0 && day !== 6;
            });
        }
    } else {
        // Month view - Placeholder logic for now, will implement MonthGrid next
        // For now, allow it to render a week or just return null/different component
        // But to avoid breaking, let's just show the week of the viewDate
        const weekStart = startOfWeek(store.viewDate, { weekStartsOn: 0 });
        days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }

    const today = startOfDay(new Date());

    // Create 24 hours (0-23)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    const getHourLabel = (hour: number) => {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    };


    return (
        <div className="calendar-view-container">
            {store.calendarViewType === 'month' ? (
                <MonthGrid tasks={tasks} onTaskClick={onTaskClick} />
            ) : (
                <table className="calendar-table">
                    <thead className="calendar-header">
                        <tr style={{ height: '44px' }}>
                            <th className="time-column-header"></th>
                            {days.map(date => {
                                const isToday = isSameDay(date, today);
                                return (
                                    <th key={date.toString()} className={`day-column-header ${isToday ? 'today' : ''}`} style={{ width: store.calendarViewType === 'day' ? '100%' : undefined }}>
                                        <div className="day-header-content">
                                            <span className="day-name">{format(date, 'EEE')}</span>
                                            <span className={`day-number ${isToday ? 'today-number' : ''}`}>
                                                {format(date, 'd')}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="calendar-body">
                        {hours.map(hour => (
                            <tr key={hour} className="hour-row">
                                <td className="time-label">
                                    <div className="time-cell-visual">
                                        <span className="time-text">{getHourLabel(hour)}</span>
                                    </div>
                                </td>
                                {days.map(date => (
                                    <CalendarCell
                                        key={`${date.toString()}-${hour}`}
                                        date={date}
                                        hour={hour}
                                        tasks={tasks}
                                        onTaskClick={onTaskClick}
                                        onResizeStart={handleResizeStart}
                                        onSlotClick={onSlotClick}
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
});
