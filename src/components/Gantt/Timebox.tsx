import React from 'react';
import { observer } from 'mobx-react-lite';
import { format, isSameDay, startOfDay, addDays, subDays, getHours, getMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { Task } from '../../models/core';
import { ResizableTaskCard } from './TaskCard/ResizableTaskCard';
import { store } from '../../models/store';
import './Timebox.css';

interface TimeboxSlotProps {
    date: Date;
    hour: number;
    minute: number;
    tasks: Task[];
}

const TimeboxSlot = observer(({ date, hour, minute, tasks }: TimeboxSlotProps) => {
    const slotId = `timebox-slot-${date.toISOString()}-${hour}-${minute}`;

    const { isOver, setNodeRef } = useDroppable({
        id: slotId,
        data: {
            type: 'timebox-slot',
            date,
            hour,
            minute
        }
    });

    return (
        <div
            ref={setNodeRef}
            className="time-slot-sub"
            style={{
                backgroundColor: isOver ? 'rgba(139, 92, 246, 0.1)' : undefined,
                height: '25%',
                borderBottom: minute !== 45 ? '1px dashed rgba(0,0,0,0.05)' : 'none',
                transition: 'background-color 0.1s'
            }}
        >
            {/* We don't render tasks INSIDE the slot div to avoid overflow clipping issues if the slot is small.
                Tasks are rendered absolutely on top of the grid in the main Timebox component.
                But wait, CalendarView renders inside the cell.
                If we render inside, we need position: relative on the container div? 
                The current CSS .time-slot-sub might not support it.
                Let's stick to the CalendarView approach: Render logic in parent or use this slot for dropping only.
            */}
        </div>
    );
});

export const Timebox = observer(() => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    // Mock current time line (e.g. at 9:30 AM = 9 * 60 + 30 mins)
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const topPosition = minutesSinceMidnight * (100 / 60); // 100px per hour scale

    const isToday = isSameDay(store.timeboxDate, new Date());

    // Get tasks for the timebox day
    const tasks = store.allTasks.filter(t =>
        t.scheduledDate && t.scheduledTime && isSameDay(t.scheduledDate, store.timeboxDate)
    );

    return (
        <div className="timebox-container">
            <div className="timebox-header">
                <div className="timebox-title">
                    <Clock size={14} />
                    <span>Timebox</span>
                </div>
                <div className="timebox-nav">
                    <button
                        className="nav-btn"
                        onClick={() => store.setTimeboxDate(subDays(store.timeboxDate, 1))}
                        title="Previous Day"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className={`today-btn ${isToday ? 'active' : ''}`}
                        onClick={() => store.setTimeboxDate(new Date())}
                    >
                        Today
                    </button>
                    <button
                        className="nav-btn"
                        onClick={() => store.setTimeboxDate(addDays(store.timeboxDate, 1))}
                        title="Next Day"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="timebox-date-row">
                <span className="date-text">
                    {format(store.timeboxDate, 'EEE')}
                </span>
                <span className="today-badge">{format(store.timeboxDate, 'd')}</span>

            </div>

            <div className="timebox-grid">
                <table className="timebox-table">
                    <tbody className="timebox-body">
                        {hours.map(hour => (
                            <tr key={hour} className="hour-row">
                                <td className="time-label-cell">
                                    <span className="time-text">
                                        {hour === 0 ? '12 AM' :
                                            hour < 12 ? `${hour} AM` :
                                                hour === 12 ? '12 PM' :
                                                    `${hour - 12} PM`}
                                    </span>
                                </td>
                                <td className="timebox-content-cell" style={{ position: 'relative' }}>
                                    {[0, 15, 30, 45].map(minute => (
                                        <TimeboxSlot
                                            key={minute}
                                            date={store.timeboxDate}
                                            hour={hour}
                                            minute={minute}
                                            tasks={tasks}
                                        />
                                    ))}

                                    {/* Render Tasks Overlay for this hour */}
                                    {tasks.filter(t => {
                                        const [h] = t.scheduledTime!.split(':').map(Number);
                                        return h === hour;
                                    }).map(task => {
                                        const [h, m] = task.scheduledTime!.split(':').map(Number);
                                        const top = (m / 60) * 100;
                                        let duration = task.duration || 15;
                                        const height = (duration / 60) * 100;

                                        return (
                                            <ResizableTaskCard
                                                key={task.id}
                                                task={task}
                                                onResizeStart={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();

                                                    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
                                                    const startDuration = task.duration || 15;

                                                    const handle = e.target as HTMLElement;
                                                    const card = handle.closest('.calendar-event') as HTMLElement;
                                                    const cell = card?.closest('.timebox-content-cell') as HTMLElement; // Parent cell

                                                    if (!cell) return;

                                                    const hourHeight = cell.clientHeight;

                                                    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
                                                        const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
                                                        const deltaY = currentY - startY;

                                                        const deltaMinutes = (deltaY / hourHeight) * 60;

                                                        let newDuration = startDuration + deltaMinutes;
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
                                                }}
                                                containerData={{
                                                    type: 'timebox-slot',
                                                    date: store.timeboxDate,
                                                    hour: hour,
                                                    minute: Number(m) // Use task's current minute as the drop target context
                                                }}
                                                style={{
                                                    top: `${top}%`,
                                                    height: `${height}%`,
                                                    position: 'absolute',
                                                    zIndex: 10,
                                                    width: '95%',
                                                    left: '2.5%',
                                                    boxSizing: 'border-box',
                                                    fontSize: duration <= 15 ? '10px' : '12px'
                                                }}
                                            />
                                        );
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Current Time Line - Overlayed */}
                <div className="current-time-line" style={{ top: `${topPosition}px` }} />
            </div>
        </div >
    );
});
