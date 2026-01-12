import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, isSameDay, startOfWeek, startOfDay, getHours, getMinutes, setHours, startOfMonth, endOfMonth, endOfWeek, isSameMonth } from 'date-fns';
import { ResizableTaskCard } from './TaskCard/ResizableTaskCard';
import './CalendarView.css';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const CalendarSlot = observer(({ date, hour, minute }: { date: Date, hour: number, minute: number }) => {
    const cellId = `calendar-slot-${date.toISOString()}-${hour}-${minute}`;
    const { isOver, setNodeRef } = useDroppable({
        id: cellId,
        data: {
            type: 'calendar-cell',
            date: date,
            hour: hour,
            minute: minute // Granular target!
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`calendar-slot ${isOver ? 'is-over' : ''}`}
            style={{
                height: '25%', // 15 mins
                width: '100%',
                borderBottom: minute !== 45 ? '1px dashed rgba(0,0,0,0.05)' : 'none', // Subtle guide lines
                backgroundColor: isOver ? 'rgba(139, 92, 246, 0.1)' : 'transparent', // Highlight color
                transition: 'background-color 0.1s'
            }}
        />
    );
});

const CalendarCell = observer(({ date, hour, tasks, onTaskClick, onResizeStart }: {
    date: Date,
    hour: number,
    tasks: Task[],
    onTaskClick: (task: Task) => void,
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, task: Task) => void
}) => {
    const today = startOfDay(new Date());
    const isToday = isSameDay(date, today);

    const getTasksForDayHour = (date: Date, hour: number) => {
        return tasks.filter(t => {
            if (!t.scheduledDate) return false;
            // Must have time
            if (!t.scheduledTime) return false;
            if (!isSameDay(t.scheduledDate, date)) return false;

            const [h, m] = t.scheduledTime.split(':').map(Number);
            const taskHour = h;
            return taskHour === hour;
        }).sort((a, b) => {
            const [hA, mA] = a.scheduledTime!.split(':').map(Number);
            const [hB, mB] = b.scheduledTime!.split(':').map(Number);

            if (mA !== mB) return mA - mB;
            if ((a.duration || 15) !== (b.duration || 15)) return (b.duration || 15) - (a.duration || 15);
            return a.title.localeCompare(b.title) || a.id.localeCompare(b.id);
        });
    };

    const cellTasks = getTasksForDayHour(date, hour);

    return (
        <td className={`hour-cell ${isToday ? 'today-cell' : ''}`}>
            {/* Background Slots Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 0 }}>
                {[0, 15, 30, 45].map(m => (
                    <CalendarSlot key={m} date={date} hour={hour} minute={m} />
                ))}
            </div>

            {/* Tasks Layer */}
            {cellTasks.map(task => {
                const [h, m] = task.scheduledTime!.split(':').map(Number);
                const taskMinute = m;
                const top = (taskMinute / 60) * 100; // Percentage from top

                // Calculate height based on duration
                let duration = task.duration || 15;
                // Round to nearest 15 for visual consistency, minimum 15
                const roundedDuration = Math.max(15, Math.round(duration / 15) * 15);
                const height = (roundedDuration / 60) * 100; // Percentage height relative to hour cell

                const fontSize = duration <= 15 ? '10px' : '12px';

                return (
                    <ResizableTaskCard
                        key={task.id}
                        task={task}
                        onTaskClick={onTaskClick}
                        onResizeStart={(e) => onResizeStart(e, task)}
                        containerData={{
                            type: 'calendar-cell',
                            date: date,
                            hour: hour,
                            minute: m // Pass specific minute so drops on card work recursively/contextually if needed
                        }}
                        style={{
                            top: `${top}%`,
                            height: `${height}%`,
                            fontSize: fontSize,
                            position: 'absolute',
                            zIndex: 1,
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            width: '94%', // slight gap
                            left: '3%'
                        }}
                    />
                );
            })}
        </td>
    );
});

export const CalendarView = observer(({ tasks, onTaskClick }: CalendarViewProps) => {
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
        const weekStart = startOfWeek(store.viewDate, { weekStartsOn: 0 }); // Sunday start
        days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
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
                        <tr>
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

// Month Grid Component
const MonthGrid = observer(({ tasks, onTaskClick }: { tasks: Task[], onTaskClick: (task: Task) => void }) => {
    const start = startOfWeek(startOfMonth(store.viewDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(store.viewDate), { weekStartsOn: 0 });

    const days = [];
    let day = start;
    while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className="month-grid">
            {/* Header */}
            <div className="month-header-row">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="month-header-cell">{d}</div>
                ))}
            </div>

            {/* Rows */}
            {weeks.map((week, i) => (
                <div key={i} className="month-row">
                    {week.map(date => (
                        <MonthCell key={date.toString()} date={date} tasks={tasks} onTaskClick={onTaskClick} />
                    ))}
                </div>
            ))}
        </div>
    );
});

const MonthCell = observer(({ date, tasks, onTaskClick }: { date: Date, tasks: Task[], onTaskClick: (task: Task) => void }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `month-cell-${date.toISOString()}`,
        data: {
            type: 'month-cell',
            date: date
        }
    });

    const dayTasks = tasks.filter(t => t.scheduledDate && isSameDay(t.scheduledDate, date));
    const isCurrentMonth = isSameMonth(date, store.viewDate);
    const isToday = isSameDay(date, new Date());

    return (
        <div
            ref={setNodeRef}
            className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isOver ? 'is-over' : ''}`}
        >
            <div className={`month-day-number ${isToday ? 'today' : ''}`}>{format(date, 'd')}</div>
            <div className="month-cell-tasks">
                {dayTasks.map(task => (
                    <div
                        key={task.id}
                        className="month-task-item"
                        onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                        style={{ backgroundColor: store.getLabelColor(task.labels[0] || '') + '20', borderLeft: `3px solid ${store.getLabelColor(task.labels[0] || '')}` }}
                    >
                        <span className="month-task-title">{task.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});
