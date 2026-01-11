import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, isSameDay, startOfWeek, startOfDay, getHours, getMinutes, setHours } from 'date-fns';
import { ResizableTaskCard } from './TaskCard/ResizableTaskCard';
import './CalendarView.css';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

const CalendarCell = observer(({ date, hour, tasks, onTaskClick, onResizeStart }: {
    date: Date,
    hour: number,
    tasks: Task[],
    onTaskClick: (task: Task) => void,
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, task: Task) => void
}) => {
    // Create a deterministic ID for the drop zone
    // We use a simplified ISO string or timestamp to ensure uniqueness
    const cellId = `calendar-cell-${date.toISOString()}-${hour}`;

    // Setup droppable
    const { isOver, setNodeRef } = useDroppable({
        id: cellId,
        data: {
            type: 'calendar-cell',
            date: date,
            hour: hour
        }
    });

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

    const formatTaskTime = (date: Date) => {
        return format(date, 'h:mm');
    };

    const cellTasks = getTasksForDayHour(date, hour);

    return (
        <td
            ref={setNodeRef}
            className={`hour-cell ${isToday ? 'today-cell' : ''} ${isOver ? 'droppable-over' : ''}`}
            style={isOver ? { backgroundColor: 'var(--bg-card-hover)' } : undefined}
        >
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
                            hour: hour
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

    // Get the start of the week for the current viewDate
    const weekStart = startOfWeek(store.viewDate, { weekStartsOn: 0 }); // Sunday start
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

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
            <table className="calendar-table">
                <thead className="calendar-header">
                    <tr>
                        <th className="time-column-header"></th>
                        {days.map(date => {
                            const isToday = isSameDay(date, today);
                            return (
                                <th key={date.toString()} className={`day-column-header ${isToday ? 'today' : ''}`}>
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
        </div>
    );
});
