import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, Circle } from 'lucide-react';
import './TasksView.css';

interface TasksViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const TasksView = observer(({ tasks, onTaskClick }: TasksViewProps) => {
    const currentDate = store.viewDate;
    const today = startOfDay(new Date());
    const isToday = isSameDay(currentDate, today);

    // Filter tasks for the current date
    const tasksForDate = tasks.filter(t => {
        if (!t.scheduledDate) return false;
        return isSameDay(t.scheduledDate, currentDate);
    });

    // Calculate total time for the day
    const totalScheduled = tasksForDate.reduce((sum, t) => sum + (t.duration || 0), 0);
    const totalCompleted = tasksForDate
        .filter(t => t.status === 'done')
        .reduce((sum, t) => sum + (t.duration || 0), 0);

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    };

    const formatTime = (date: Date) => {
        return format(date, 'h:mma').toLowerCase();
    };

    const goToPreviousDay = () => {
        store.setDate(addDays(currentDate, -1));
    };

    const goToToday = () => {
        store.setDate(new Date());
    };

    const goToNextDay = () => {
        store.setDate(addDays(currentDate, 1));
    };

    return (
        <div className="tasks-view">
            {/* Header */}
            <div className="tasks-header">
                <div className="tasks-title">
                    <span className="tasks-icon">☀️</span>
                    <span>Tasks</span>
                </div>
                <div className="tasks-nav">
                    <button className="nav-btn" onClick={goToPreviousDay}>
                        <ChevronLeft size={16} />
                    </button>
                    <button className="nav-btn today-btn" onClick={goToToday}>
                        Today
                    </button>
                    <button className="nav-btn" onClick={goToNextDay}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Current Date */}
            <div className="tasks-date">
                <span className="date-text">
                    {format(currentDate, 'EEE MMM d')}
                </span>
                {isToday && <span className="today-badge">Today</span>}
            </div>

            {/* Add Task Input */}
            <div className="add-task-input">
                <Circle size={20} className="task-circle" />
                <input type="text" placeholder="Add a task" />
                <span className="time-summary">
                    {formatDuration(totalCompleted)} / {formatDuration(totalScheduled)}
                </span>
            </div>

            {/* Tasks List */}
            <div className="tasks-list">
                {tasksForDate.map(task => (
                    <div
                        key={task.id}
                        className={`task-item ${task.status === 'done' ? 'completed' : ''}`}
                        onClick={() => onTaskClick(task)}
                    >
                        <div className="task-main">
                            <div
                                className="task-checkbox"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    task.toggleStatus();
                                }}
                            >
                                {task.status === 'done' ? (
                                    <CheckSquare size={20} className="checked" />
                                ) : (
                                    <Circle size={20} />
                                )}
                            </div>
                            <div className="task-content">
                                <div className="task-title-row">
                                    <span className="task-title">{task.title}</span>
                                    {task.duration && (
                                        <span className="task-duration-badge">
                                            {formatDuration(task.duration)}
                                        </span>
                                    )}
                                </div>
                                <div className="task-meta">
                                    {task.labels.length > 0 && (
                                        <div className="task-label">
                                            <div className="label-dot" style={{
                                                backgroundColor: task.labels[0] === 'Design' || task.labels[0] === 'Important' ? '#FCD34D' : '#EF4444'
                                            }} />
                                            <span>{task.labels[0]}</span>
                                        </div>
                                    )}
                                    {task.scheduledDate && (
                                        <span className="task-time">{formatTime(task.scheduledDate)}</span>
                                    )}
                                    {task.subtasks.length > 0 && (
                                        <span className="task-subtasks">
                                            🔁 {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {tasksForDate.length === 0 && (
                    <div className="empty-tasks">
                        <p>No tasks scheduled for this day</p>
                    </div>
                )}
            </div>
        </div>
    );
});
