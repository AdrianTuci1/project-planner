import React from 'react';
import { observer } from 'mobx-react-lite';
import { startOfDay, isSameDay } from 'date-fns';
import { Task } from '../../../models/core';
import { calculateOverlappingLayout } from '../layoutUtils';
import { ResizableTaskCard } from '../TaskCard/ResizableTaskCard';
import { CalendarSlot } from './CalendarSlot';

export const CalendarCell = observer(({ date, hour, tasks, onTaskClick, onResizeStart }: {
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
    const layoutData = calculateOverlappingLayout(cellTasks);

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

                // Get layout data
                const layout = layoutData.get(task.id) || { left: 3, width: 94, zIndex: 1 };

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
                            zIndex: layout.zIndex,
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                            width: `${layout.width}%`,
                            left: `${layout.left}%`
                        }}
                    />
                );
            })}
        </td>
    );
});
