import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { startOfDay, isSameDay } from 'date-fns';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { calculateOverlappingLayout } from '../layoutUtils';
import { ResizableTaskCard, ResizableTaskCardView } from '../TaskCard/ResizableTaskCard';
import { CalendarSlot } from './CalendarSlot';
import { CalendarEventPopover } from './CalendarEventPopover';

export const CalendarCell = observer(({ date, hour, tasks, onTaskClick, onResizeStart, onSlotClick, className, slotPrefix }: {
    date: Date,
    hour: number,
    tasks: Task[],
    onTaskClick: (task: Task, e?: React.MouseEvent) => void,
    onResizeStart: (e: React.MouseEvent | React.TouchEvent, task: Task) => void,
    onSlotClick?: (date: Date, hour: number, minute: number) => void,
    className?: string,
    slotPrefix?: string
}) => {
    const today = startOfDay(new Date());
    const isToday = isSameDay(date, today);

    const [popover, setPopover] = useState<{ task: Task, position: { x: number, y: number } } | null>(null);

    const handleTaskClick = (task: Task, e?: React.MouseEvent) => {
        // Check if calendar event
        const isCalendarEvent = task.id.startsWith('evt_') || (task as any).isCalendarEvent;
        if (isCalendarEvent && e) {
            e.stopPropagation();
            setPopover({
                task,
                position: { x: e.clientX, y: e.clientY }
            });
        } else {
            onTaskClick(task, e);
        }
    };

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

    // Live Drag Preview Logic
    if (store.draggingTaskId && store.dragOverLocation) {
        const { date: dDate, hour: dHour, minute: dMinute } = store.dragOverLocation;
        // Check if this cell matches the drag over location
        if (isSameDay(dDate, date) && dHour === hour) {
            // Find the task
            const draggedTask = store.allTasks.find(t => t.id === store.draggingTaskId);

            if (draggedTask) {
                // Calculate position constraints
                const duration = draggedTask.duration || 15;
                const roundedDuration = Math.max(15, Math.round(duration / 15) * 15);
                const height = (roundedDuration / 60) * 100;
                const top = (dMinute / 60) * 100;

                // Determine width/left based on standard layout
                const left = 0;
                const width = 94;

                // Determine background color for the ghost card
                const backgroundColor = draggedTask.labelId
                    ? store.getLabelColor(draggedTask.labelId)
                    : '#e6c581ff';

                return (
                    <td className={`hour-cell ${isToday ? 'today-cell' : ''} ${className || ''}`}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 0 }}>
                            {[0, 15, 30, 45].map(m => (
                                <CalendarSlot key={m} date={date} hour={hour} minute={m} prefix={slotPrefix} onClick={onSlotClick} />
                            ))}
                        </div>

                        {cellTasks.map(task => {
                            if (task.id === draggedTask.id) return null; // Hide original if it happens to be here
                            const [h, m] = task.scheduledTime!.split(':').map(Number);
                            const top = (m / 60) * 100;
                            let duration = task.duration || 15;
                            const roundedDuration = Math.max(15, Math.round(duration / 15) * 15);
                            const height = (roundedDuration / 60) * 100;
                            const fontSize = duration <= 15 ? '10px' : '12px';
                            const layout = layoutData.get(task.id) || { left: 3, width: 94, zIndex: 1 };

                            return (
                                <ResizableTaskCard
                                    key={task.id}
                                    task={task}
                                    onTaskClick={onTaskClick}
                                    onResizeStart={(e) => onResizeStart(e, task)}
                                    containerData={{ type: 'calendar-cell', date, hour, minute: m }}
                                    style={{
                                        top: `${top}%`,
                                        height: `${height}%`,
                                        fontSize: fontSize,
                                        position: 'absolute',
                                        zIndex: layout.zIndex,
                                        width: `${layout.width}%`,
                                        left: `${layout.left}%`
                                    }}
                                />
                            );
                        })}

                        {/* GHOST CARD RENDER */}
                        <div style={{
                            position: 'absolute',
                            top: `${top}%`,
                            height: `${height}%`,
                            left: `${left}%`,
                            width: `${width}%`,
                            zIndex: 1000,
                            pointerEvents: 'none',
                        }}>
                            <ResizableTaskCardView
                                task={draggedTask}
                                style={{ height: '100%', width: '100%', backgroundColor }}
                                className="ghost-preview-card"
                            />
                        </div>
                    </td>
                );
            }
        }
    }



    return (
        <td className={`hour-cell ${isToday ? 'today-cell' : ''} ${className || ''}`}>
            {/* Background Slots Layer */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', zIndex: 0 }}>
                {[0, 15, 30, 45].map(m => (
                    <CalendarSlot key={m} date={date} hour={hour} minute={m} prefix={slotPrefix} onClick={onSlotClick} />
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
                        onTaskClick={handleTaskClick}
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
            {popover && (
                <CalendarEventPopover
                    task={popover.task}
                    position={popover.position}
                    onClose={() => setPopover(null)}
                />
            )}
        </td>
    );
});
