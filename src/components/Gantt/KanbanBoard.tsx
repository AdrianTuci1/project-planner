import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, subDays, isSameDay, startOfDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard, SortableTaskCard } from './TaskCard/index';
import { kanbanModel } from '../../models/KanbanModel';
import './KanbanBoard.css';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    groupId?: string | null;
}

const KanbanColumn = observer(({
    date,
    tasks,
    isToday,
    isAdding,
    onAddClick,
    onTaskClick,
    onDuplicate,
    onDelete,
    onCreate,
    onCancel,
    groupId
}: any) => {
    const columnId = `kanban-column-${date.toISOString()}`;
    const { isOver, setNodeRef } = useDroppable({
        id: columnId,
        data: {
            type: 'kanban-column',
            date: date,
            groupId: groupId // Pass group ID for identification
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`day-column ${isOver ? 'droppable-over' : ''}`}
        >
            <div className="day-header">
                <span className="day-name">{format(date, 'EEE')}</span>
                <span>{format(date, 'MMM d')}</span>
                {isToday && <span className="today-badge">Today</span>}
            </div>

            <TaskCard isGhost onAddClick={onAddClick} />

            {isAdding && (
                <TaskCard
                    key="create-task"
                    isCreating
                    onCreate={onCreate}
                    onCancel={onCancel}
                />
            )}

            <div className="kanban-sortable-area">
                <SortableContext id={columnId} items={tasks.map((t: Task) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task: Task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            className="kanban-task-card"
                            onTaskClick={onTaskClick}
                            onDuplicate={onDuplicate}
                            onDelete={onDelete}
                            containerData={{ type: 'kanban-column', date: date }}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
});

export const KanbanBoard = observer(({ tasks, onTaskClick, groupId }: KanbanBoardProps) => {
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

    const getTargetGroup = () => {
        if (groupId === null) return null; // Brain Dump
        if (groupId) return store.groups.find(g => g.id === groupId); // Specific group
        return store.activeGroup; // Fallback to active group (though ideally should not be used if props are correct)
    };

    const handleCreateTask = (title: string, date: Date) => {
        if (!title) return;

        const targetGroup = getTargetGroup();

        if (groupId === null) {
            // Brain dump logic if needed, though usually this view is for groups?
            // If Kanban is used for Brain Dump, we might need store.addTaskToDump(title) and set scheduledDate?
            // Assuming for now Brain Dump items in Kanban behave like tasks
            const newTask = new Task(title);
            newTask.scheduledDate = date;
            newTask.scheduledTime = undefined;
            store.dumpAreaTasks.push(newTask);
            return;
        }

        if (targetGroup) {
            const newTask = new Task(title);
            newTask.scheduledDate = date;
            newTask.scheduledTime = undefined;
            targetGroup.addTask(newTask);
            // We stay in create mode to allow adding multiple tasks
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
        if (confirm('Are you sure you want to delete this task?')) {
            if (groupId === null) {
                store.dumpAreaTasks = store.dumpAreaTasks.filter(t => t.id !== task.id);
                return;
            }

            const targetGroup = getTargetGroup();
            if (targetGroup) {
                targetGroup.removeTask(task.id);
            }
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
                        <KanbanColumn
                            key={date.toISOString()}
                            date={date}
                            tasks={dayTasks}
                            isToday={isToday}
                            isAdding={isAddingToThisDay}
                            onAddClick={() => setAddingTaskDate(date)}
                            onTaskClick={onTaskClick}
                            onDuplicate={handleDuplicateTask}
                            onDelete={handleDeleteTask}
                            onCreate={(title: string) => handleCreateTask(title, date)}
                            onCancel={() => setAddingTaskDate(null)}
                        />
                    );
                })}
            </div>
        </div>
    );
});
