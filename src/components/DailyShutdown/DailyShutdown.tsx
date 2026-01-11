import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { dailyShutdownModel } from '../../models/DailyShutdownModel';
import { Task } from '../../models/core';
import { format, addDays, isSameDay } from 'date-fns';
import { X, ArrowRight, Brain, Circle } from 'lucide-react';
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

export const DailyShutdown = observer(() => {
    const [step, setStep] = useState(1);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [addingColumn, setAddingColumn] = useState<string | null>(null);

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
    const brainDumpTasks = store.dumpAreaTasks;
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
            if (!activeTask.scheduledDate || !isSameDay(activeTask.scheduledDate, tomorrow)) {
                const inDumpIndex = store.dumpAreaTasks.findIndex(t => t.id === activeTask.id);
                if (inDumpIndex > -1) {
                    store.dumpAreaTasks.splice(inDumpIndex, 1);
                    if (store.groups.length > 0) {
                        store.groups[0].addTask(activeTask);
                    }
                }
                activeTask.scheduledDate = tomorrow;
                activeTask.scheduledTime = undefined;
            }
        } else if (overContainer === 'brain-dump-list') {
            activeTask.scheduledDate = undefined;
            activeTask.scheduledTime = undefined;

            let foundInGroup = false;
            store.groups.forEach(g => {
                if (g.tasks.find(t => t.id === activeTask.id)) {
                    g.removeTask(activeTask.id);
                    foundInGroup = true;
                }
            });

            if (foundInGroup) {
                store.dumpAreaTasks.push(activeTask);
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
            case 'brain-dump':
                store.dumpAreaTasks.push(newTask);
                break;
            case 'tomorrow':
                newTask.scheduledDate = tomorrow;
                if (store.activeGroup) {
                    store.activeGroup.addTask(newTask);
                } else if (store.groups.length > 0) {
                    store.groups[0].addTask(newTask);
                } else {
                    store.dumpAreaTasks.push(newTask);
                }
                break;
        }
    };

    // Logic for Task Status switching is handled in core.ts Task model

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
                        {/* Left Panel: Brain Dump */}
                        <div className="left-panel">
                            <div className="brain-dump-header">
                                <div className="brain-dump-title">
                                    <Brain size={16} color="#ec4899" /> Brain Dump
                                </div>
                            </div>
                            <div className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('brain-dump')}
                                    actualTime={brainDumpTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={brainDumpTasks.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'brain-dump' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('brain-dump', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="brain-dump-list"
                                    items={brainDumpTasks}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {brainDumpTasks.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            containerData={{ type: 'shutdown-list', id: 'brain-dump' }}
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
                                    items={tomorrowTasks}
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
