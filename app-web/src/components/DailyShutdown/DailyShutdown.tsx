import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { dailyShutdownModel } from '../../models/DailyShutdownModel';
import { Task } from '../../models/core';
import { format, addDays, isSameDay } from 'date-fns';
import { X, ArrowRight } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import './DailyShutdown.css';
import { TaskCard, SortableTaskCard } from '../Gantt/TaskCard/index';
import { GroupList } from '../Shared/GroupList';

export const DailyShutdown = observer(() => {
    const [step, setStep] = useState(1);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [addingColumn, setAddingColumn] = useState<string | null>(null);
    const [shutdownSourceGroupId, setShutdownSourceGroupId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    if (!store.isDailyShutdownOpen) return null;

    const today = new Date();
    const tomorrow = addDays(today, 1);

    const todaysTasks = store.allTasks.filter(t =>
        t.scheduledDate && isSameDay(t.scheduledDate, today)
    );
    const completedTasks = todaysTasks.filter(t => t.status === 'done');
    const missedTasks = todaysTasks.filter(t => t.status !== 'done');

    // Calculate source tasks based on selected group
    const sourceTasks = (() => {
        if (shutdownSourceGroupId === null) {
            return store.dumpAreaTasks;
        }
        const group = store.groups.find(g => g.id === shutdownSourceGroupId);
        if (group) {
            // Show unscheduled tasks from the group
            return group.tasks.filter(t => !t.scheduledDate);
        }
        return [];
    })();

    const tomorrowTasks = store.allTasks.filter(t =>
        t.scheduledDate && isSameDay(t.scheduledDate, tomorrow)
    );

    // Stats calculation from model
    const totalDuration = dailyShutdownModel.totalDuration;
    const completedTasksStats = dailyShutdownModel.completedTasks;

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveTask(active.data.current?.task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);

        if (!over) return;

        const activeTask = active.data.current?.task as Task;
        const overContainer = over.data.current?.sortable?.containerId || over.id;

        if (overContainer === 'tomorrow-list') {
            // Dragging to Tomorrow
            if (!activeTask.scheduledDate || !isSameDay(activeTask.scheduledDate, tomorrow)) {

                // If currently in dump
                const inDumpIndex = store.dumpAreaTasks.findIndex(t => t.id === activeTask.id);
                if (inDumpIndex > -1) {
                    store.dumpAreaTasks.splice(inDumpIndex, 1);
                    // Add to selected group if one is selected, else first group
                    if (shutdownSourceGroupId) {
                        const group = store.groups.find(g => g.id === shutdownSourceGroupId);
                        if (group) group.addTask(activeTask);
                    } else if (store.groups.length > 0) {
                        store.groups[0].addTask(activeTask);
                    }
                }

                activeTask.scheduledDate = tomorrow;
                activeTask.scheduledTime = undefined;
            }
        } else if (overContainer === 'source-list') {
            // Dragging back to Source (Brain Dump or Group)
            activeTask.scheduledDate = undefined;
            activeTask.scheduledTime = undefined;

            // Remove from dump if it was there (shouldn't happen if it had date, but for safety)
            const dumpIndex = store.dumpAreaTasks.findIndex(t => t.id === activeTask.id);
            if (dumpIndex > -1) store.dumpAreaTasks.splice(dumpIndex, 1);

            // Remove from any group it might be in (if moving to a different group)
            let currentGroup = store.groups.find(g => g.tasks.some(t => t.id === activeTask.id));
            if (currentGroup && currentGroup.id !== shutdownSourceGroupId) {
                currentGroup.removeTask(activeTask.id);
                currentGroup = undefined; // effectively removed
            }

            if (shutdownSourceGroupId === null) {
                // Move to Brain Dump
                // Ensure not in dump already
                if (!store.dumpAreaTasks.find(t => t.id === activeTask.id)) {
                    store.dumpAreaTasks.push(activeTask);
                }
            } else {
                // Move to Selected Group
                const targetGroup = store.groups.find(g => g.id === shutdownSourceGroupId);
                if (targetGroup) {
                    if (!targetGroup.tasks.find(t => t.id === activeTask.id)) {
                        targetGroup.addTask(activeTask);
                    }
                }
            }
        }
    };

    const handleCreateTask = (columnId: string, title: string) => {
        if (!title.trim()) return;

        const newTask = new Task(title);

        switch (columnId) {
            case 'completed':
                newTask.scheduledDate = today;
                newTask.status = 'done';
                if (store.activeGroup) store.activeGroup.addTask(newTask);
                else store.dumpAreaTasks.push(newTask);
                break;
            case 'missed':
                newTask.scheduledDate = today;
                if (store.activeGroup) store.activeGroup.addTask(newTask);
                else store.dumpAreaTasks.push(newTask);
                break;
            case 'source-list':
                if (shutdownSourceGroupId === null) {
                    store.dumpAreaTasks.push(newTask);
                } else {
                    const group = store.groups.find(g => g.id === shutdownSourceGroupId);
                    if (group) group.addTask(newTask);
                    else store.dumpAreaTasks.push(newTask);
                }
                break;
            case 'tomorrow':
                newTask.scheduledDate = tomorrow;
                if (shutdownSourceGroupId) {
                    const group = store.groups.find(g => g.id === shutdownSourceGroupId);
                    if (group) group.addTask(newTask);
                    else if (store.groups.length > 0) store.groups[0].addTask(newTask);
                } else if (store.activeGroup) {
                    store.activeGroup.addTask(newTask);
                } else if (store.groups.length > 0) {
                    store.groups[0].addTask(newTask);
                } else {
                    store.dumpAreaTasks.push(newTask);
                }
                break;
        }
    };

    const renderProgressBar = () => {
        if (totalDuration === 0) return (
            <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }}></div>
            </div>
        );

        return (
            <div className="progress-bar" style={{ display: 'flex' }}>
                {completedTasksStats.map((task) => {
                    const percentage = ((task.actualDuration || 0) / totalDuration) * 100;
                    if (percentage === 0) return null;
                    const color = task.labels.length > 0 ? store.getLabelColor(task.labels[0]) : '#E3C099';

                    return (
                        <div
                            key={task.id}
                            style={{
                                width: `${percentage}%`,
                                backgroundColor: color,
                                height: '100%'
                            }}
                            title={`${task.title}: ${dailyShutdownModel.formatTime(task.actualDuration || 0)}`}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="daily-shutdown-overlay">
                <button className="close-btn" onClick={() => store.toggleDailyShutdown()}>
                    <X size={16} />
                </button>

                {/* Sidebar */}
                <div className="daily-shutdown-sidebar">
                    <div className="step-indicator">
                        Step {step}
                    </div>

                    {step === 1 ? (
                        <>
                            <h1 className="daily-shutdown-title">Let's review today's work ✍️</h1>
                            <div className="stats-summary">
                                <div className="stat-row">
                                    <span>{completedTasks.length} tasks completed</span>
                                    <span>{dailyShutdownModel.formatTime(totalDuration)}</span>
                                </div>

                                {renderProgressBar()}

                                <div className="labels-legend" style={{ marginTop: '16px' }}>
                                    {completedTasksStats.map(task => { // Iterate tasks, not labels
                                        const color = task.labels.length > 0 ? store.getLabelColor(task.labels[0]) : '#E3C099';
                                        return (
                                            <div key={task.id} className="stat-row" style={{ fontSize: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: color }}>●</span>
                                                    <span>{task.title}</span>
                                                </div>
                                                <span>{dailyShutdownModel.formatTime(task.actualDuration || 0)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="daily-shutdown-title">What do you want to get done tomorrow?</h1>
                            <div className="daily-shutdown-subtitle">
                                Let's add some tasks you need to get done tomorrow. Feel free to pull tasks from any of your lists as well.
                            </div>
                        </>
                    )}

                    <div className="shutdown-footer">
                        {step === 1 ? (
                            <button className="next-step-btn" onClick={() => setStep(2)}>
                                Next step <ArrowRight size={16} />
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="next-step-btn" style={{ background: '#333', width: '50px' }} onClick={() => setStep(1)}>
                                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <button className="next-step-btn" onClick={() => store.toggleDailyShutdown()}>
                                    Finish <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {step === 1 ? (
                    <div className="daily-shutdown-content">
                        {/* Column 1: Completed Today */}
                        <div className="shutdown-column">
                            <div className="column-header">
                                <h2>Here's what you did today</h2>
                                <p>Feel free to make any corrections</p>
                            </div>
                            <div className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('completed')}
                                    actualTime={completedTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={completedTasks.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'completed' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('completed', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                {completedTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onTaskClick={() => { }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Missed Today */}
                        <div className="shutdown-column">
                            <div className="column-header">
                                <h2>What you missed</h2>
                                <p>We'll roll these over to tomorrow</p>
                            </div>
                            <div className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('missed')}
                                    actualTime={missedTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={missedTasks.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'missed' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('missed', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                {missedTasks.map(task => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onTaskClick={() => { }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="shutdown-step-2-content">
                        {/* Left Panel: Source List (Brain Dump or Group) */}
                        <div className="left-panel">
                            <div className="brain-dump-header">
                                <GroupList
                                    activeGroupId={shutdownSourceGroupId}
                                    onSelectGroup={setShutdownSourceGroupId}
                                    className="shutdown-group-selector"
                                />
                            </div>
                            <div className="shutdown-task-list kanban-sortable-area" style={{ flex: 1, overflowY: 'auto' }}>
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('source-list')}
                                    actualTime={sourceTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={sourceTasks.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'source-list' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('source-list', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="source-list"
                                    items={sourceTasks.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {sourceTasks.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            containerData={{ type: 'shutdown-list', id: 'source-list' }}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        </div>

                        {/* Right Panel: Tomorrow */}
                        <div className="right-panel">
                            <div className="column-header">
                                <h2>Tomorrow</h2>
                                <p>Add some tasks</p>
                            </div>

                            <div className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('tomorrow')}
                                    actualTime={tomorrowTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={tomorrowTasks.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'tomorrow' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('tomorrow', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="tomorrow-list"
                                    items={tomorrowTasks.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {tomorrowTasks.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            containerData={{ type: 'shutdown-list', id: 'tomorrow' }}
                                        />
                                    ))}
                                </SortableContext>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <DragOverlay>
                {activeTask ? (
                    <TaskCard task={activeTask} isGhost />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
});
