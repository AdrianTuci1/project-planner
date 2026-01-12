import { DragEndEvent } from '@dnd-kit/core';
import { isSameDay } from 'date-fns';
import { runInAction } from 'mobx';
import { store } from '../store';
import { Task } from '../core';
import { DragData } from './types';
import { DragStrategy } from './DragStrategy';
import { CalendarDropStrategy } from './strategies/CalendarDropStrategy';
import { TimeboxDropStrategy } from './strategies/TimeboxDropStrategy';
import { KanbanDropStrategy } from './strategies/KanbanDropStrategy';
import { SidebarDropStrategy } from './strategies/SidebarDropStrategy';
import { TasksListDropStrategy } from './strategies/TasksListDropStrategy';

export class DragDropManager {
    private strategies: Map<string, DragStrategy> = new Map();

    constructor() {
        this.strategies.set('calendar-cell', new CalendarDropStrategy());
        this.strategies.set('month-cell', new CalendarDropStrategy()); // Use same strategy
        this.strategies.set('timebox-slot', new TimeboxDropStrategy());
        this.strategies.set('kanban-column', new KanbanDropStrategy());
        this.strategies.set('sidebar-list', new SidebarDropStrategy());
        this.strategies.set('tasks-list', new TasksListDropStrategy());
    }

    public handleDragOver(event: DragEndEvent) {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id as string;
        // Sidebar/Lists use raw IDs, Calendar uses 'calendar-' prefix.
        // We only want to handle List-to-List optimistic updates here.
        // If activeId starts with 'calendar-', we ignore it (Isolation).
        if (activeId.startsWith('calendar-')) return;

        const taskId = activeId;
        const task = store.allTasks.find(t => t.id === taskId);
        if (!task) return;

        const overId = over.id as string;
        let overData = over.data.current as DragData | undefined;
        if (overData?.type === 'task' && overData.containerData) {
            overData = { ...overData.containerData };
        }

        if (!overData) return;

        // Identify containers
        // We rely on checking if task is already in the target group/list

        // Handle Sidebar Group Switching
        if (overData.type === 'sidebar-list') {
            const { groupId } = overData;
            const targetList = groupId === null ? store.dumpAreaTasks : store.groups.find(g => g.id === groupId)?.tasks;

            // If dragging over a list (or item in list) and task is NOT in that list:
            // Move it there.
            if (targetList && !targetList.find(t => t.id === taskId)) {
                // Remove from old
                runInAction(() => {
                    const oldGroup = store.groups.find(g => g.tasks.find(t => t.id === taskId));
                    if (oldGroup) {
                        oldGroup.removeTask(taskId);
                    } else if (store.dumpAreaTasks.find(t => t.id === taskId)) {
                        const idx = store.dumpAreaTasks.findIndex(t => t.id === taskId);
                        if (idx > -1) store.dumpAreaTasks.splice(idx, 1);
                    }
                });

                // If coming from Kanban/Calendar (has date), clear it so it "moves" to sidebar
                if (task.scheduledDate) {
                    runInAction(() => {
                        task.scheduledDate = undefined;
                        task.scheduledTime = undefined;
                    });
                }

                // Add to new (at specific index if over a specific item?)
                // Simplest: Add to end or let dnd-kit sort it?
                // Be careful: if we just push, it jumps to end.
                // Ideally we insert at the correct index if over is an item.
                // Getting index from 'over' is hard without 'sortable' context access here easily.
                // BUT: dnd-kit handling 'sortable' moves usually requires finding index.
                // For now, let's just push to list to make it appear.
                // Actually, if we use SortableContext, simply having it in the list allows `onDragOver` from `useSortable` to work?
                // No, `useSortable` usage in component handles the transform, but the ITEM must be in the list for SortableContext to render a placeholder for it.

                runInAction(() => {
                    targetList.push(task);
                });
            }

            // Reorder within Sidebar list if over a task
            if (over.id && over.id !== activeId && !over.id.toString().startsWith('sidebar-list')) {
                const overTaskId = over.id as string;
                if (targetList && targetList.find(t => t.id === overTaskId)) {
                    const oldIdx = targetList.findIndex(t => t.id === taskId);
                    const newIdx = targetList.findIndex(t => t.id === overTaskId);
                    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
                        runInAction(() => {
                            const [moved] = targetList.splice(oldIdx, 1);
                            targetList.splice(newIdx, 0, moved);
                        });
                    }
                }
            }
        }

        // Handle Kanban Column Switching (Optimistic scheduling)
        if (overData.type === 'kanban-column') {
            const { date } = overData;
            if (date) {
                // 1. Update Date (Move between columns)
                if (!task.scheduledDate || !isSameDay(task.scheduledDate, date)) {
                    runInAction(() => {
                        task.scheduledDate = new Date(date);
                        task.scheduledDate.setHours(0, 0, 0, 0); // Always set date to midnight
                        // Keep scheduledTime if it exists (Calendar -> Kanban move preserves appointment time)
                        // If it came from Sidebar (no date), scheduledTime is likely undefined, which is correct.
                    });
                }

                // 2. Update Order (Reorder within column)
                // Only possible if we are over another task in the same column
                if (over.id && over.id !== activeId && !over.id.toString().startsWith('kanban-column')) {
                    const overTaskId = over.id as string;

                    const taskOwner = store.groups.find(g => g.tasks.find(t => t.id === taskId)) ||
                        (store.dumpAreaTasks.find(t => t.id === taskId) ? { tasks: store.dumpAreaTasks } : null);

                    const overOwner = store.groups.find(g => g.tasks.find(t => t.id === overTaskId)) ||
                        (store.dumpAreaTasks.find(t => t.id === overTaskId) ? { tasks: store.dumpAreaTasks } : null);

                    // Reorder Logic (Cross-group support)
                    if (taskOwner && overOwner) {
                        const sourceList = taskOwner.tasks as Task[];
                        const targetList = overOwner.tasks as Task[];

                        const oldIdx = sourceList.findIndex(t => t.id === taskId);
                        const newIdx = targetList.findIndex(t => t.id === overTaskId);

                        if (oldIdx !== -1 && newIdx !== -1) {
                            runInAction(() => {
                                if (taskOwner === overOwner) {
                                    // Same list reorder
                                    if (oldIdx !== newIdx) {
                                        const [moved] = sourceList.splice(oldIdx, 1);
                                        sourceList.splice(newIdx, 0, moved);
                                    }
                                } else {
                                    // Cross-list move (Change Group)
                                    const [moved] = sourceList.splice(oldIdx, 1);
                                    targetList.splice(newIdx, 0, moved);
                                }
                            });
                        }
                    }
                }
            }
        }

        // Handle Tasks List Reordering (Optimistic)
        if (overData.type === 'tasks-list') {
            const { date } = overData;

            // 1. Update Date (Move to this list/day)
            // This handles dragging from Kanban or Sidebar to Tasks View
            if (date && (!task.scheduledDate || !isSameDay(task.scheduledDate, date))) {
                runInAction(() => {
                    task.scheduledDate = new Date(date);
                    task.scheduledDate.setHours(0, 0, 0, 0);
                    // Keep scheduledTime if present
                });
            }

            // Only reorder within the same list (Tasks View usually shows mixed groups or active group? 
            // TasksView currently filters by date.
            // If we drag over a task in tasks-list, we should reorder.

            if (over.id && over.id !== activeId && !over.id.toString().startsWith('tasks-list')) {
                const overTaskId = over.id as string;

                const taskOwner = store.groups.find(g => g.tasks.find(t => t.id === taskId)) ||
                    (store.dumpAreaTasks.find(t => t.id === taskId) ? { tasks: store.dumpAreaTasks } : null);

                const overOwner = store.groups.find(g => g.tasks.find(t => t.id === overTaskId)) ||
                    (store.dumpAreaTasks.find(t => t.id === overTaskId) ? { tasks: store.dumpAreaTasks } : null);

                // Only allow reordering if in same group/owner context? 
                // TasksView shows tasks from ALL groups for the day.
                // Reordering across groups in a "Day View" is tricky because the order is often derived.
                // However, if the user explicitly drags, maybe we should just update the array order in the group?
                // But wait, TasksView uses `tasks` prop passed from parent.
                // MainView passes `store.allTasks`. 
                // `allTasks` is a getter, not a mutable array.
                // Reordering in `allTasks` getter is impossible.
                // Tasks are sorted by time/etc in Calendar, but in TasksView?
                // TasksView uses `verticalListSortingStrategy`.

                // If we want reordering in TasksView, it implies tasks have a specific order that is preserved.
                // Since `allTasks` aggregates groups, true reordering might require changing the task's group task list order.

                // For now, let's enable visual reordering if they act on the same underlying list (same group).
                if (taskOwner && overOwner && taskOwner === overOwner) {
                    const list = taskOwner.tasks as Task[];
                    const oldIdx = list.findIndex(t => t.id === taskId);
                    const newIdx = list.findIndex(t => t.id === overTaskId);

                    if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
                        runInAction(() => {
                            const [moved] = list.splice(oldIdx, 1);
                            list.splice(newIdx, 0, moved);
                        });
                    }
                }
            }
        }
    }

    public handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        console.log('[DragDropManager] handleDragEnd', {
            activeId: active.id,
            overId: over?.id,
            activeData: active.data.current,
            overData: over?.data.current
        });

        if (!over) {
            console.warn('[DragDropManager] No drop target (over is null)');
            return;
        }

        const activeId = active.id as string;
        // Handle namespaced IDs (e.g. calendar-123 or timebox-123)
        let taskId = activeId;
        if (activeId.startsWith('calendar-')) taskId = activeId.replace('calendar-', '');
        else if (activeId.startsWith('timebox-')) taskId = activeId.replace('timebox-', '');

        const task = store.allTasks.find(t => t.id === taskId);

        if (!task) {
            console.warn('Task not found for DnD:', taskId);
            return;
        }

        let overData = over.data.current as DragData | undefined;
        if (!overData) return;

        // normalization for dropping on sortable items
        if (overData.type === 'task' && overData.containerData) {
            overData = {
                ...(overData.containerData as DragData),
            };
        }

        const dropType = overData.type;
        console.log('[DragDropManager] Processing drop:', { dropType, origin: active.data.current?.origin });

        // Helper to determine if we are reordering within the same container
        const activeContainerId = active.data.current?.sortable?.containerId;
        const overContainerId = over.data.current?.sortable?.containerId || over.id;
        const isReordering = activeContainerId === overContainerId;

        // ISOLATION RULE: Calendar/Timebox items can ONLY interact with calendar cells OR Timebox slots
        const origin = active.data.current?.origin;
        if (origin === 'calendar' || origin === 'timebox') {
            if (dropType !== 'calendar-cell' && dropType !== 'timebox-slot') {
                console.warn('[DragDropManager] Isolation rule blocked drop:', { origin, dropType });
                return;
            }
        }

        const strategy = this.strategies.get(dropType);
        if (strategy) {
            strategy.handle(task, overData, event, { activeId, overId: over.id as string, isReordering });
        } else {
            console.warn('[DragDropManager] No strategy found for type:', dropType);
        }
    }
}

export const dragDropManager = new DragDropManager();
