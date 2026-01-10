import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, isSameDay, startOfWeek, startOfDay, getHours, getMinutes } from 'date-fns';
import './CalendarView.css';

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const CalendarView = observer(({ tasks, onTaskClick }: CalendarViewProps) => {
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

    const getTasksForDayHour = (date: Date, hour: number) => {
        return tasks.filter(t => {
            if (!t.scheduledDate) return false;
            if (!isSameDay(t.scheduledDate, date)) return false;

            const taskHour = getHours(t.scheduledDate);
            return taskHour === hour;
        });
    };

    const formatTaskTime = (date: Date) => {
        return format(date, 'h:mm');
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
                            {days.map(date => {
                                const isToday = isSameDay(date, today);
                                return (
                                    <td key={`${date.toString()}-${hour}`} className={`hour-cell ${isToday ? 'today-cell' : ''}`}>
                                        {getTasksForDayHour(date, hour).map(task => {
                                            const taskMinute = getMinutes(task.scheduledDate!);
                                            const top = (taskMinute / 60) * 100; // Percentage from top

                                            // Calculate height based on duration
                                            let duration = task.duration || 15;
                                            // Round to nearest 15 for visual consistency, minimum 15
                                            const roundedDuration = Math.max(15, Math.round(duration / 15) * 15);
                                            const height = (roundedDuration / 60) * 100; // Percentage height relative to hour cell

                                            const fontSize = duration <= 15 ? '10px' : '12px';
                                            const backgroundColor = task.labels.length > 0 ? store.getLabelColor(task.labels[0]) : '#60A5FA';

                                            return (
                                                <div
                                                    key={task.id}
                                                    className={`calendar-event ${task.status === 'done' ? 'completed' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onTaskClick(task);
                                                    }}
                                                    style={{
                                                        top: `${top}%`,
                                                        height: `${height}%`,
                                                        backgroundColor: backgroundColor,
                                                        fontSize: fontSize,
                                                        position: 'absolute',
                                                        zIndex: 1,
                                                        maxWidth: '100%', // Ensure it doesn't exceed slot
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    <div className="event-content-wrapper">
                                                        <input
                                                            type="checkbox"
                                                            checked={task.status === 'done'}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                task.toggleStatus();
                                                            }}
                                                            className="task-checkbox"
                                                        />
                                                        <div className="event-details">
                                                            <div className="event-title" style={{ fontSize }}>{task.title}</div>
                                                            {task.scheduledDate && duration > 20 && (
                                                                <div className="event-time" style={{ fontSize: `calc(${fontSize} - 1px)` }}>
                                                                    {formatTaskTime(task.scheduledDate)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});
