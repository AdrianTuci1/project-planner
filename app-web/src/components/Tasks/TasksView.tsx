import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard, SortableTaskCard } from '../Gantt/TaskCard/index';
import './TasksView.css';

interface TasksViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    groupId?: string | null;
}

const TasksList = observer(({ tasks, isAddingTask, setIsAddingTask, handleCreateTask, onTaskClick, handleDuplicateTask, handleDeleteTask, currentDate }: any) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'tasks-list',
        data: {
            type: 'tasks-list',
            date: currentDate
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`tasks-list ${isOver ? 'droppable-over' : ''}`}
            style={isOver ? { backgroundColor: 'var(--bg-card-hover)', minHeight: '50px' } : undefined}
        >
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

            {tasks.length > 0 && (
                <SortableContext
                    id="tasks-list"
                    items={tasks.map((t: Task) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task: Task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onTaskClick={onTaskClick}
                            onDuplicate={handleDuplicateTask}
                            onDelete={handleDeleteTask}
                            containerData={{ type: 'tasks-list', date: currentDate }}
                        />
                    ))}
                </SortableContext>
            )}

            {tasks.length === 0 && !isAddingTask && (
                <div className="empty-tasks">
                    <p>No tasks scheduled for this day</p>
                </div>
            )}
        </div>
    );
});

export const TasksView = observer(({ tasks, onTaskClick, groupId }: TasksViewProps) => {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [currentDate, setCurrentDate] = useState(store.viewDate);
    const today = startOfDay(new Date());
    const isToday = isSameDay(currentDate, today);

    // Filter tasks for the current date
    const tasksForDate = tasks.filter(t => {
        if (!t.scheduledDate) return false;
        return isSameDay(t.scheduledDate, currentDate);
    }).sort((a, b) => {
        if (store.settings.general.generalSettings.moveTasksBottom) {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
        }
        return 0;
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
        setCurrentDate(addDays(currentDate, -1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const goToNextDay = () => {
        setCurrentDate(addDays(currentDate, 1));
    };

    const getTargetGroup = () => {
        if (groupId === null) return null; // Brain Dump
        if (groupId) return store.groups.find(g => g.id === groupId); // Specific group
        return store.activeGroup; // Fallback
    };

    const handleCreateTask = (title: string) => {
        if (!title) return;

        const targetGroup = getTargetGroup();

        if (groupId === null) {
            const newTask = new Task(title);
            newTask.scheduledDate = currentDate;
            store.dumpAreaTasks.push(newTask);
            return;
        }

        if (targetGroup) {
            const newTask = new Task(title);
            newTask.scheduledDate = currentDate;
            targetGroup.addTask(newTask);
        }
    };

    const handleDuplicateTask = (task: Task) => {
        const targetGroup = getTargetGroup();

        if (groupId === null) {
            const clone = task.clone();
            store.dumpAreaTasks.push(clone);
            return;
        }

        if (targetGroup) {
            targetGroup.duplicateTask(task.id);
        }
    };

    const handleDeleteTask = (task: Task) => {

        const targetGroup = getTargetGroup();
        if (targetGroup) {
            targetGroup.removeTask(task.id);
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
            <TasksList
                tasks={tasksForDate}
                isAddingTask={isAddingTask}
                setIsAddingTask={setIsAddingTask}
                handleCreateTask={handleCreateTask}
                onTaskClick={onTaskClick}
                handleDuplicateTask={handleDuplicateTask}
                handleDeleteTask={handleDeleteTask}
                currentDate={currentDate}
            />
        </div>
    );
});
