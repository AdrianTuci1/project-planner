import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskCard } from '../Gantt/TaskCard';
import './TasksView.css';

interface TasksViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const TasksView = observer(({ tasks, onTaskClick }: TasksViewProps) => {
    const [isAddingTask, setIsAddingTask] = useState(false);
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

    const goToPreviousDay = () => {
        store.setDate(addDays(currentDate, -1));
    };

    const goToToday = () => {
        store.setDate(new Date());
    };

    const goToNextDay = () => {
        store.setDate(addDays(currentDate, 1));
    };

    const handleCreateTask = (title: string) => {
        if (title && store.activeGroup) {
            const newTask = new Task(title);
            newTask.scheduledDate = currentDate;
            store.activeGroup.addTask(newTask);
            // setIsAddingTask(false); // Keep open for multiple entry
        }
    };

    const handleDuplicateTask = (task: Task) => {
        if (store.activeGroup) {
            store.activeGroup.duplicateTask(task.id);
        }
    };

    const handleDeleteTask = (task: Task) => {
        if (store.activeGroup && confirm('Are you sure you want to delete this task?')) {
            store.activeGroup.removeTask(task.id);
        }
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
            <div className="tasks-date-row">
                <div className="tasks-date">
                    <span className="date-text">
                        {format(currentDate, 'EEE MMM d')}
                    </span>
                    {isToday && <span className="today-badge">Today</span>}
                </div>
                <span className="time-summary">
                    {formatDuration(totalCompleted)} / {formatDuration(totalScheduled)}
                </span>
            </div>

            {/* Tasks List */}
            <div className="tasks-list">
                <TaskCard
                    isGhost
                    onAddClick={() => setIsAddingTask(true)}
                />

                {isAddingTask && (
                    <TaskCard
                        isCreating
                        onCreate={handleCreateTask}
                        onCancel={() => setIsAddingTask(false)}
                    />
                )}

                {tasksForDate.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onTaskClick={onTaskClick}
                        onDuplicate={handleDuplicateTask}
                        onDelete={handleDeleteTask}
                    />
                ))}

                {tasksForDate.length === 0 && !isAddingTask && (
                    <div className="empty-tasks">
                        <p>No tasks scheduled for this day</p>
                    </div>
                )}
            </div>
        </div>
    );
});
