import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, isSameDay, startOfWeek, startOfDay, getHours } from 'date-fns';
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

    // Time slots for full 24 hours (0-23)
    const timeSlots = Array.from({ length: 24 }, (_, i) => ({
        label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
        hour: i
    }));

    const getTasksForDayAndHour = (date: Date, hour: number) => {
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
        <div className="calendar-view-grid">
            {/* Header Row */}
            <div className="calendar-header-row">
                <div className="time-column-header"></div>
                {days.map(date => {
                    const isToday = isSameDay(date, today);
                    return (
                        <div key={date.toString()} className={`day-column-header ${isToday ? 'today' : ''}`}>
                            <div className="day-name">{format(date, 'EEE')}</div>
                            <div className={`day-number ${isToday ? 'today-number' : ''}`}>
                                {format(date, 'd')}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Time Slots Grid */}
            <div className="calendar-grid-body">
                {timeSlots.map((slot) => (
                    <div key={slot.hour} className="time-row">
                        <div className="time-label">{slot.label}</div>
                        {days.map(date => {
                            const cellTasks = getTasksForDayAndHour(date, slot.hour);
                            const isToday = isSameDay(date, today);

                            return (
                                <div
                                    key={`${date.toString()}-${slot.hour}`}
                                    className={`time-cell ${isToday ? 'today-cell' : ''}`}
                                >
                                    {cellTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className="calendar-event"
                                            onClick={() => onTaskClick(task)}
                                            style={{
                                                backgroundColor: task.labels.length > 0 ? '#FCD34D' : '#60A5FA',
                                            }}
                                        >
                                            <div className="event-title">{task.title}</div>
                                            {task.scheduledDate && (
                                                <div className="event-time">
                                                    {formatTaskTime(task.scheduledDate)}
                                                    {task.duration && ` - ${format(addDays(task.scheduledDate, 0), 'h:mm')}`}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
});
