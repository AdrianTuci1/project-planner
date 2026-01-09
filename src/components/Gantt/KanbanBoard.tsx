import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, subDays, isSameDay, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { TaskCard } from './TaskCard';
import { kanbanModel } from '../../models/KanbanModel';
import './KanbanBoard.css';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const KanbanBoard = observer(({ tasks, onTaskClick }: KanbanBoardProps) => {
    const [addingTaskDate, setAddingTaskDate] = useState<Date | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync with store on mount and when store.viewDate changes
    useEffect(() => {
        kanbanModel.syncWithStore();
    }, [store.viewDate]);

    // Handle scroll to target date
    useLayoutEffect(() => {
        if (kanbanModel.pendingScrollToDate && containerRef.current) {
            const index = kanbanModel.dates.findIndex(d => isSameDay(d, kanbanModel.pendingScrollToDate!));
            if (index !== -1) {
                const columnWidth = containerRef.current.scrollWidth / kanbanModel.dates.length;
                const targetScrollLeft = index * columnWidth;

                // If it's the initial load or a large jump, don't use smooth behavior for immediate positioning
                const isInitial = !containerRef.current.scrollLeft;

                if (Math.abs(containerRef.current.scrollLeft - targetScrollLeft) > 5) {
                    kanbanModel.setScrollingProgrammatically(true);
                    containerRef.current.scrollTo({
                        left: targetScrollLeft,
                        behavior: isInitial ? 'auto' : 'smooth'
                    });

                    setTimeout(() => {
                        kanbanModel.setScrollingProgrammatically(false);
                    }, 500);
                }
                kanbanModel.clearPendingScrollToDate();
            }
        }
    }, [kanbanModel.dates, kanbanModel.pendingScrollToDate]);

    // Handle scroll position maintenance when prepending days
    useLayoutEffect(() => {
        if (kanbanModel.pendingScrollAdjustment && containerRef.current) {
            const newScrollWidth = containerRef.current.scrollWidth;
            const diff = newScrollWidth - kanbanModel.lastScrollWidth;
            containerRef.current.scrollLeft += diff;
            kanbanModel.clearPendingScrollAdjustment();
        }
    }, [kanbanModel.dates]);

    const handleScroll = () => {
        if (!containerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
        kanbanModel.handleScroll(scrollLeft, scrollWidth, clientWidth);
    };

    // Determine "today" for UI badges relative to real time
    const today = startOfDay(new Date());

    const getTasksForDay = (date: Date) => {
        return tasks.filter(t => {
            if (!t.scheduledDate) return false;
            return isSameDay(t.scheduledDate, date);
        });
    };

    const handleCreateTask = (title: string, date: Date) => {
        if (title && store.activeGroup) {
            const newTask = new Task(title);
            newTask.scheduledDate = date;
            store.activeGroup.addTask(newTask);
            setAddingTaskDate(null);
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
        <div className="kanban-board">
            <div
                className="kanban-body"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {kanbanModel.dates.map(date => {
                    const dayTasks = getTasksForDay(date);
                    const isToday = isSameDay(date, today);
                    const isAddingToThisDay = addingTaskDate && isSameDay(addingTaskDate, date);

                    return (
                        <div key={date.toISOString()} className="day-column">
                            <div className="day-header">
                                <span className="day-name">{format(date, 'EEE')}</span>
                                <span>{format(date, 'MMM d')}</span>
                                {isToday && <span className="today-badge">Today</span>}
                            </div>

                            <TaskCard
                                isGhost
                                onAddClick={() => setAddingTaskDate(date)}
                            />

                            {isAddingToThisDay && (
                                <TaskCard
                                    isCreating
                                    onCreate={(title) => handleCreateTask(title, date)}
                                    onCancel={() => setAddingTaskDate(null)}
                                />
                            )}

                            {dayTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onTaskClick={onTaskClick}
                                    onDuplicate={handleDuplicateTask}
                                    onDelete={handleDeleteTask}
                                />
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
