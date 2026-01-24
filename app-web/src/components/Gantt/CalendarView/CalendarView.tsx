import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { format, addDays, isSameDay, startOfWeek, startOfDay } from 'date-fns';
import './CalendarView.css';
import { MonthGrid } from './MonthGrid';
import { CalendarCell } from './CalendarCell';
import { CalendarEventCard } from '../TaskCard/CalendarEventCard';

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
        const card = handle.closest('.task-card') as HTMLElement;
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
                // If it is a calendar event, we must sync via CalendarStore
                if (task.id.startsWith('evt_')) {
                    const event = store.calendarStore.getEventById(task.id);
                    if (event) {
                        // Calculate new end time
                        const newEnd = new Date(event.start.getTime() + newDuration * 60000);
                        store.calendarStore.updateEvent(event, { end: newEnd });
                    }
                } else {
                    task.duration = newDuration;
                }
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
        const weekStartsOnMap: Record<string, 0 | 1 | 6> = {
            'Sunday': 0,
            'Monday': 1,
            'Saturday': 6
        };
        const weekStartIdx = weekStartsOnMap[store.settings.general.generalSettings.startWeekOn] ?? 0;

        const weekStart = startOfWeek(store.viewDate, { weekStartsOn: weekStartIdx });
        days = Array.from({ length: store.daysToShow }, (_, i) => addDays(weekStart, i));

        if (!store.settings.general.generalSettings.showWeekends) {
            days = days.filter(d => {
                const day = d.getDay();
                return day !== 0 && day !== 6;
            });
        }
    } else {
        const weekStart = startOfWeek(store.viewDate, { weekStartsOn: 0 });
        days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    }

    // Fetch Events Logic (Internal)
    React.useEffect(() => {
        if (store.activeWorkspace?.type === 'personal' && days.length > 0) {
            // Buffer
            const start = addDays(days[0], -1);
            const end = addDays(days[days.length - 1], 1);
            store.calendarStore.fetchEvents(start, end);
        }
    }, [store.viewDate, store.daysToShow, store.calendarViewType, store.activeWorkspace?.type]); // Depend on view params & workspace

    const calendarEvents = store.activeWorkspace?.type === 'personal' ? store.calendarStore.events : [];

    // Separate Events
    const allEvents = [...tasks, ...calendarEvents] as Task[];

    const timedTasks: Task[] = [];
    const allDayEvents: any[] = [];

    allEvents.forEach(t => {
        const isCalendarEvent = t.id.startsWith('evt_') || (t as any).isCalendarEvent;
        if (isCalendarEvent) {
            const isAllDay = (t as any).allDay !== undefined ? (t as any).allDay : !(t as any).rawStart?.dateTime;
            if (isAllDay) {
                allDayEvents.push(t);
            } else {
                timedTasks.push(t);
            }
        } else {
            // Normal task, check if it has time?
            // Existing logic assumes tasks in CalendarView HAVE time or are filtered?
            // CalendarCell checks scheduledTime.
            if (t.scheduledTime) {
                timedTasks.push(t);
            }
        }
    });

    const isToday = (d: Date) => isSameDay(d, new Date());

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
                <MonthGrid tasks={allEvents} onTaskClick={onTaskClick} />
            ) : (
                <table className="calendar-table">
                    <thead className="calendar-header">
                        <tr style={{ height: '44px' }}>
                            <th className="time-column-header"></th>
                            {days.map(date => {
                                const currentIsToday = isToday(date);
                                return (
                                    <th key={date.toString()} className={`day-column-header ${currentIsToday ? 'today' : ''}`} style={{ width: store.calendarViewType === 'day' ? '100%' : undefined }}>
                                        <div className="day-header-content">
                                            <span className="day-name">{format(date, 'EEE')}</span>
                                            <span className={`day-number ${currentIsToday ? 'today-number' : ''}`}>
                                                {format(date, 'd')}
                                            </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                        {/* All Day Row */}
                        {store.activeWorkspace?.type === 'personal' && (
                            <tr className="all-day-row" style={{ height: 'auto', minHeight: '30px' }}>
                                <td className="time-label" style={{ fontSize: '10px', verticalAlign: 'middle', textAlign: 'center', color: '#888' }}>
                                    All Day
                                </td>
                                {days.map(date => {
                                    // Filter all day events for this day
                                    const daysEvents = allDayEvents.filter(e => {
                                        // Check if date matches (all day usually has 'date' field YYYY-MM-DD or is just date object)
                                        const eDate = new Date(e.scheduledDate || e.rawStart?.date);
                                        return isSameDay(eDate, date);
                                    });

                                    return (
                                        <td key={`allday-${date.toString()}`} className="all-day-cell" style={{ verticalAlign: 'top', padding: '2px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                {daysEvents.map(ev => (
                                                    <CalendarEventCard
                                                        key={ev.id}
                                                        event={ev}
                                                        style={{
                                                            width: '100%',
                                                            height: '22px', // Compact height for month/week views
                                                        }}
                                                        className="all-day-card"
                                                    />
                                                ))}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        )}
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
                                        tasks={timedTasks}
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
