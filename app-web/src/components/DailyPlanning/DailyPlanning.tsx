import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import { format, subDays, isSameDay } from 'date-fns';
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
    DragOverEvent,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import '../DailyShutdown/DailyShutdown.css'; // Reuse styles
import { KanbanColumn } from '../Gantt/KanbanBoard';
import { TaskCard, SortableTaskCard } from '../Gantt/TaskCard/index';
import { GroupList } from '../Shared/GroupList';
import { runInAction } from 'mobx';
import { Timebox } from '../Gantt/Timebox';

const DroppableList = ({ id, children, className, style }: any) => {
    const { setNodeRef } = useDroppable({
        id,
        data: {
            type: 'planning-list',
            listId: id
        }
    });

    return (
        <div ref={setNodeRef} className={className} style={style}>
            {children}
        </div>
    );
};

export const DailyPlanning = observer(() => {
    const [step, setStep] = useState(1);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [addingColumn, setAddingColumn] = useState<string | null>(null);
    const [planningSourceGroupId, setPlanningSourceGroupId] = useState<string | null>('default');

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

    if (!store.isDailyPlanningOpen || !store.activeWorkspace) return null;

    const today = new Date();
    const yesterday = subDays(today, 1);

    const yesterdayTasks = store.allTasks.filter(t =>
        t.scheduledDate && isSameDay(t.scheduledDate, yesterday)
    );
    const completedYesterday = yesterdayTasks.filter(t => t.status === 'done');
    const missedYesterday = yesterdayTasks.filter(t => t.status !== 'done');

    const todayTasks = store.allTasks.filter(t =>
        t.scheduledDate && isSameDay(t.scheduledDate, today)
    );

    const sourceTasks = (() => {
        if (planningSourceGroupId === 'default') {
            return store.dumpAreaTasks.filter(t => !t.scheduledDate);
        }
        const group = store.groups.find(g => g.id === planningSourceGroupId);
        if (group) {
            return group.tasks.filter(t => !t.scheduledDate);
        }
        return [];
    })();

    // DnD Handlers
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        setActiveTask(active.data.current?.task);
    };

    const handleDragOver = (event: DragOverEvent) => {
        // Minimal DragOver: Only for highlighting, no mutations to avoid unmounting
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveTask(null);

        if (!over) return;

        const activeTask = active.data.current?.task as Task;
        const overContainer = over.data.current?.sortable?.containerId || over.id;

        // Handle Timebox Drop
        if (over.id === 'timebox-drop-area') {
            runInAction(() => {
                activeTask.scheduledDate = today;
                if (!activeTask.scheduledTime) activeTask.scheduledTime = "09:00";

                // Ensure task is in appropriate container
                // If task was in Dump, keep it there (it will be filtered out of backlog view by date).
                // If we are in a specific group view, we might want to move it to that group?
                // User expectation: "Drag to Timebox" -> Just schedule it. Don't change group.

                // If task is not in ANY container (rare/impossible?), put it in Dump.
                const inDump = store.dumpAreaTasks.some(t => t.id === activeTask.id);
                const inGroup = store.groups.some(g => g.tasks.some(t => t.id === activeTask.id));

                if (!inDump && !inGroup) {
                    store.dumpAreaTasks.push(activeTask);
                }
            });
            return;
        }

        if (overContainer === 'planning-today-list' || overContainer === 'planning-today-list-step3' || over.data.current?.type === 'kanban-column') {
            runInAction(() => {
                // 1. Set Date
                if (!activeTask.scheduledDate || !isSameDay(activeTask.scheduledDate, today)) {
                    activeTask.scheduledDate = today;
                    activeTask.scheduledTime = undefined;
                }

                // 2. Container Logic
                // If dragging from Source -> Today
                // If Source was Dump, Keep in Dump.
                // If Source was Group, Keep in Group.
                // If Source was Group A but we dragged to Today... 
                // We typically just schedule it. We don't steal it from Group A unless explicitly creating new task in different context.

                // HINT: If the user IS selecting a group in the source list `planningSourceGroupId`
                // and the task was in Dump, MAYBE they want to move it to that group?
                // But dragging to "Today" usually just means "Do this today".

                // Verification: If task is currently in Dump, and we touch it, do we assume ownership by selected group?
                // Original logic did: `if (inDump) { remove; add to group }`.
                // Let's preserve that "Move to Group" intent IF strict Move is desired, 
                // BUT mostly we just want to schedule.

                // SAFE FIX: Just schedule. Don't move containers unless necessary (e.g. orphan).
                const inDump = store.dumpAreaTasks.some(t => t.id === activeTask.id);
                const inGroup = store.groups.some(g => g.tasks.some(t => t.id === activeTask.id));

                if (!inDump && !inGroup) {
                    // Orphaned? Put in default location (Source Group or Dump)
                    if (planningSourceGroupId && planningSourceGroupId !== 'default') {
                        const group = store.groups.find(g => g.id === planningSourceGroupId);
                        if (group) group.addTask(activeTask);
                        else store.dumpAreaTasks.push(activeTask);
                    } else {
                        store.dumpAreaTasks.push(activeTask);
                    }
                }

                // If it WAS in Dump, and `planningSourceGroupId` is a Group, SHOULD we move it?
                // If I am looking at "Work" tasks, and I drag a "Personal" (Dump) task to Today...
                // It remains Personal (Dump) but Scheduled. That makes sense.
                // So removing the `splice` is the correct fix.
            });
        } else if (overContainer === 'planning-source-list') {
            runInAction(() => {
                activeTask.scheduledDate = undefined;
                activeTask.scheduledTime = undefined;

                const dumpIndex = store.dumpAreaTasks.findIndex(t => t.id === activeTask.id);
                const currentGroup = store.groups.find(g => g.tasks.find(t => t.id === activeTask.id));

                if (planningSourceGroupId === 'default') {
                    // Move to Brain Dump (Default)
                    if (currentGroup) {
                        currentGroup.removeTask(activeTask.id);
                    }
                    if (!store.dumpAreaTasks.find(t => t.id === activeTask.id)) {
                        store.dumpAreaTasks.push(activeTask);
                    }
                } else {
                    // Move to Selected Group
                    const targetGroup = store.groups.find(g => g.id === planningSourceGroupId);
                    if (targetGroup) {
                        // Remove from dump if present
                        if (dumpIndex > -1) store.dumpAreaTasks.splice(dumpIndex, 1);

                        // Remove from other group if present
                        if (currentGroup && currentGroup.id !== planningSourceGroupId) {
                            currentGroup.removeTask(activeTask.id);
                        }

                        // Add to target group
                        if (!targetGroup.tasks.find(t => t.id === activeTask.id)) {
                            targetGroup.addTask(activeTask);
                        }
                    }
                }
            });
        } else if (overContainer === 'completed-yesterday' || overContainer === 'missed-yesterday') {
            // Handle Step 1 Dragging
            if (activeTask) {
                runInAction(() => {
                    if (overContainer === 'completed-yesterday') {
                        activeTask.status = 'done';
                        activeTask.scheduledDate = yesterday;
                    } else if (overContainer === 'missed-yesterday') {
                        activeTask.status = 'todo';
                        activeTask.scheduledDate = yesterday;
                    }
                });
            }
        }
    };

    const handleCreateTask = (columnId: string, title: string) => {
        if (!title.trim()) return;
        const newTask = new Task(title);

        switch (columnId) {
            case 'completed-yesterday': // should manually create as done yesterday?
                newTask.scheduledDate = yesterday;
                newTask.status = 'done';
                if (store.activeGroup) store.activeGroup.addTask(newTask);
                else store.dumpAreaTasks.push(newTask);
                break;
            case 'missed-yesterday':
                newTask.scheduledDate = yesterday;
                if (store.activeGroup) store.activeGroup.addTask(newTask);
                else store.dumpAreaTasks.push(newTask);
                break;
            case 'planning-source-list':
                if (planningSourceGroupId === 'default') {
                    store.addTaskToDump(title);
                } else {
                    const group = store.groups.find(g => g.id === planningSourceGroupId);
                    if (group) group.addTask(newTask);
                    else store.dumpAreaTasks.push(newTask);
                }
                break;
            case 'planning-today-list':
                newTask.scheduledDate = today;
                if (planningSourceGroupId && planningSourceGroupId !== 'default') {
                    const group = store.groups.find(g => g.id === planningSourceGroupId);
                    if (group) group.addTask(newTask);
                } else if (store.activeGroup) {
                    store.activeGroup.addTask(newTask);
                } else if (store.groups.length > 0) {
                    store.groups[0].addTask(newTask);
                } else {
                    store.addTaskToDump(title);
                    const task = store.dumpAreaTasks[store.dumpAreaTasks.length - 1];
                    if (task) task.scheduledDate = today;
                }
                break;
        }
    };

    return (
        <DndContext
            id="daily-planning-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="daily-shutdown-overlay">
                <button className="close-btn" onClick={() => store.toggleDailyPlanning()}>
                    <X size={16} />
                </button>

                {/* Sidebar */}
                <div className="daily-shutdown-sidebar">
                    <div className="step-indicator">
                        Step {step}
                    </div>

                    {step === 1 ? (
                        <>
                            <h1 className="daily-shutdown-title">Let's review yesterday's work 🔙</h1>
                            <div className="stats-summary">
                                <div className="stat-row">
                                    <span>{completedYesterday.length} tasks completed</span>
                                </div>
                            </div>
                        </>
                    ) : step === 2 ? (
                        <>
                            <h1 className="daily-shutdown-title">What do you want to get done today? ☀️</h1>
                            <div className="daily-shutdown-subtitle">
                                Drag tasks from your backlog to today's list.
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="daily-shutdown-title">Let's finalize your day 🚀</h1>
                            <div className="daily-shutdown-subtitle">
                                Timebox your tasks to ensure a productive day.
                            </div>
                        </>
                    )}

                    <div className="shutdown-footer">
                        {step === 1 ? (
                            <button className="next-step-btn" onClick={() => setStep(2)}>
                                Next step <ArrowRight size={16} />
                            </button>
                        ) : step === 2 ? (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="next-step-btn" style={{ background: '#333', width: '50px' }} onClick={() => setStep(1)}>
                                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <button className="next-step-btn" onClick={() => setStep(3)}>
                                    Next step <ArrowRight size={16} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="next-step-btn" style={{ background: '#333', width: '50px' }} onClick={() => setStep(2)}>
                                    <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                <button className="next-step-btn" onClick={() => store.toggleDailyPlanning()}>
                                    Finish <ArrowRight size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {step === 1 ? (
                    <div className="daily-shutdown-content">
                        {/* Column 1: Completed Yesterday */}
                        <div className="shutdown-column">
                            <div className="column-header">
                                <h2>Completed Yesterday</h2>
                            </div>
                            <DroppableList id="completed-yesterday" className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('completed-yesterday')}
                                    actualTime={completedYesterday.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={completedYesterday.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'completed-yesterday' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('completed-yesterday', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="completed-yesterday"
                                    items={completedYesterday.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {completedYesterday.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            onTaskClick={() => { }}
                                            onDelete={() => store.deleteTask(task.id)}
                                            containerData={{ type: 'planning-list', id: 'completed-yesterday' }}
                                        />
                                    ))}
                                </SortableContext>
                            </DroppableList>
                        </div>

                        {/* Column 2: Missed Yesterday */}
                        <div className="shutdown-column">
                            <div className="column-header">
                                <h2>Missed Yesterday</h2>
                                <p>Moved to today automatically?</p>
                            </div>
                            <DroppableList id="missed-yesterday" className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('missed-yesterday')}
                                    actualTime={missedYesterday.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={missedYesterday.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'missed-yesterday' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('missed-yesterday', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="missed-yesterday"
                                    items={missedYesterday.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {missedYesterday.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            onTaskClick={() => { }}
                                            onDelete={() => store.deleteTask(task.id)}
                                            containerData={{ type: 'planning-list', id: 'missed-yesterday' }}
                                        />
                                    ))}
                                </SortableContext>
                            </DroppableList>
                        </div>
                    </div>
                ) : step === 2 ? (
                    <div className="shutdown-step-2-content">
                        {/* Left Panel: Source List */}
                        <div className="left-panel">
                            <div className="brain-dump-header">
                                <GroupList
                                    workspace={store.activeWorkspace!}
                                    activeGroupId={planningSourceGroupId}
                                    onSelectGroup={(id) => setPlanningSourceGroupId(id)}
                                    className="shutdown-group-selector"
                                />
                            </div>
                            <DroppableList id="planning-source-list" className="shutdown-task-list kanban-sortable-area" style={{ flex: 1, overflowY: 'auto' }}>
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('planning-source-list')}
                                />
                                {addingColumn === 'planning-source-list' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('planning-source-list', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="planning-source-list"
                                    items={sourceTasks.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {sourceTasks.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            onDelete={() => store.deleteTask(task.id)}
                                            containerData={{ type: 'planning-list', id: 'planning-source-list' }}
                                        />
                                    ))}
                                </SortableContext>
                            </DroppableList>
                        </div>

                        {/* Right Panel: Today */}
                        <div className="right-panel">
                            <div className="column-header">
                                <h2>Today</h2>
                            </div>

                            <DroppableList id="planning-today-list" className="shutdown-task-list kanban-sortable-area">
                                <TaskCard
                                    isGhost
                                    onAddClick={() => setAddingColumn('planning-today-list')}
                                    actualTime={todayTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)}
                                    estimatedTime={todayTasks.reduce((acc, t) => acc + (t.duration || 0), 0)}
                                />
                                {addingColumn === 'planning-today-list' && (
                                    <TaskCard
                                        isCreating
                                        onCreate={(title) => handleCreateTask('planning-today-list', title)}
                                        onCancel={() => setAddingColumn(null)}
                                    />
                                )}
                                <SortableContext
                                    id="planning-today-list"
                                    items={todayTasks.map(t => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {todayTasks.map(task => (
                                        <SortableTaskCard
                                            key={task.id}
                                            task={task}
                                            onDelete={() => store.deleteTask(task.id)}
                                            containerData={{ type: 'planning-list', id: 'planning-today-list' }}
                                        />
                                    ))}
                                </SortableContext>
                            </DroppableList>
                        </div>
                    </div>
                ) : (
                    // Step 3
                    <div className="shutdown-step-2-content" style={{ display: 'flex', gap: '20px', height: '100%' }}>
                        {/* Left: Today's list */}
                        <KanbanColumn
                            date={today}
                            tasks={todayTasks}
                            isToday={true}
                            isAdding={addingColumn === 'planning-today-list-step3'}
                            onAddClick={() => setAddingColumn('planning-today-list-step3')}
                            onTaskClick={(t: Task) => {/* Open task modal? */ }}
                            onDuplicate={(t: Task) => {/* duplicate logic */ }}
                            onDelete={(t: Task) => store.deleteTask(t.id)}
                            onCreate={(title: string) => handleCreateTask('planning-today-list', title)} // Reuse Step 2 logic? or specific Step 3?
                            onCancel={() => setAddingColumn(null)}
                        />

                        {/* Right: Timebox */}
                        <div className="right-panel" style={{ flex: 1, overflow: 'hidden' }}>
                            <DroppableList id="timebox-drop-area" className="timebox-wrapper" style={{ height: '100%', width: '100%' }}>
                                <Timebox hideHeader={true} />
                            </DroppableList>
                        </div>
                    </div>
                )}
            </div>
            <DragOverlay>
                {activeTask ? (
                    <TaskCard task={activeTask} isGhost />
                ) : null}
            </DragOverlay>
        </DndContext >
    );
});
