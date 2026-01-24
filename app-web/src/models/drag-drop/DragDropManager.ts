import { DragEndEvent } from '@dnd-kit/core';
import { isSameDay, startOfDay } from 'date-fns';
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
        // If activeId starts with 'calendar-' or 'timebox-', we ignore it (Isolation).
        // This prevents Scheduler items from reacting to Sidebar/List targets (Optimistic moves).
        if (activeId.startsWith('calendar-') || activeId.startsWith('timebox-')) return;

        const taskId = activeId;
        const task = store.getTaskById(taskId);
        if (!task) return;

        const isTemplate = store.templates.some(t => t.id === task.id);

        const overId = over.id as string;
        let overData = over.data.current as DragData | undefined;
        if (overData?.type === 'task' && overData.containerData) {
            overData = { ...overData.containerData };
        }

        if (!overData) return;

        // SKIP optimistic updates for Templates
        if (isTemplate) {
            // Handle Calendar/Timebox Live Preview Tracking ONLY
            if (overData.type === 'calendar-cell' || overData.type === 'timebox-slot') {
                const { date, hour, minute: slotMinute } = overData;
                if (date && hour !== undefined) {
                    const minute = slotMinute || 0;
                    runInAction(() => {
                        store.setDragOverLocation({
                            date: startOfDay(date),
                            hour: Number(hour),
                            minute: Number(minute)
                        });
                    });
                }
            }
            return;
        }

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
                    task.groupId = groupId; // Update groupId (might be null for Inbox)
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

        // Handle Calendar/Timebox Live Preview Tracking
        if (overData.type === 'calendar-cell' || overData.type === 'timebox-slot') {
            const { date, hour, minute: slotMinute } = overData;

            if (date && hour !== undefined) {
                const minute = slotMinute || 0;
                runInAction(() => {
                    store.setDragOverLocation({
                        date: startOfDay(date),
                        hour: Number(hour),
                        minute: Number(minute)
                    });
                });
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

        let task = store.getTaskById(taskId);
        let activeCalendarEvent: any = undefined;

        if (!task && taskId.startsWith('evt_')) {
            activeCalendarEvent = store.calendarStore.getEventById(taskId);
            // Create a proxy task object for the strategy to use? 
            // Or handle it directly here if simple?
            // Strategies expect a Task object mostly.
            if (activeCalendarEvent) {
                // Create a transient Task-like object wrapper if needed, 
                // BUT strategies invoke `task.scheduledDate = ...` etc.
                // We should probably rely on `CalendarDropStrategy` to handle this or 
                // we handle it here specially.
                // Let's create a proxy that delegates to CalendarStore.updateEvent on save?
                // Simpler: Just handle the update HERE for calendar events and return.
            }
        }

        if (!task && !activeCalendarEvent) {
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
        // BUT we must allow Sidebar/Kanban items to interact with Calendar/Timebox.
        // So the restriction is: origin=calendar/timebox MUST drop on calendar/timebox
        // AND origin=sidebar/kanban CAN drop ANYWHERE (except maybe restricted areas?)

        const origin = active.data.current?.origin;
        if (origin === 'calendar' || origin === 'timebox') {
            // If starting from Calendar/Timebox, can ONLY go to Calendar/Timebox
            if (dropType !== 'calendar-cell' && dropType !== 'timebox-slot') {
                console.warn('[DragDropManager] Isolation rule blocked drop:', { origin, dropType });
                return;
            }
        }

        // CLONE TEMPLATES if needed
        const isTemplate = store.templates.some(t => t.id === taskId);
        if (isTemplate && task) {
            if (dropType === 'kanban-column' || dropType === 'calendar-cell' || dropType === 'timebox-slot') {
                const clone = task.clone();
                clone.isTemplate = false;
                runInAction(() => {
                    if (store.activeGroup) {
                        store.activeGroup.addTask(clone);
                    } else {
                        store.workspaceStore.activeWorkspace?.dumpAreaTasks.push(clone);
                    }
                });
                task = clone;
            } else {
                console.warn('[DragDropManager] Copied template dropped on invalid target:', dropType);
                return;
            }
        }

        // No restriction for Sidebar/Kanban/TasksView dropping on Calendar/Timebox

        // Centralized GroupId & List Management
        if (task) {
            runInAction(() => {
                const currentOwner = store.groups.find(g => g.tasks.find(t => t.id === taskId)) ||
                    (store.dumpAreaTasks.find(t => t.id === taskId) ? { tasks: store.dumpAreaTasks } : null);

                let targetGroupId: string | null | undefined = undefined;

                if (dropType === 'kanban-column' || dropType === 'calendar-cell' || dropType === 'timebox-slot' || dropType === 'tasks-list') {
                    targetGroupId = null; // Always move to Inbox/Null when dropped on a view
                } else if (dropType === 'sidebar-list') {
                    targetGroupId = overData!.groupId;
                }

                if (targetGroupId !== undefined) {
                    // Determine target list
                    const targetList = targetGroupId === null ? store.dumpAreaTasks : store.groups.find(g => g.id === targetGroupId)?.tasks;

                    if (targetList && currentOwner && (currentOwner.tasks !== targetList)) {
                        // Remove from old
                        if ('removeTask' in currentOwner) {
                            (currentOwner as any).removeTask(taskId);
                        } else if (Array.isArray(currentOwner.tasks)) {
                            const idx = currentOwner.tasks.findIndex((t: Task) => t.id === taskId);
                            if (idx > -1) currentOwner.tasks.splice(idx, 1);
                        }

                        // Add to new
                        task.groupId = targetGroupId;
                        targetList.push(task);

                        // Clear schedule when moving to the sidebar (lists are unscheduled)
                        if (dropType === 'sidebar-list') {
                            task.scheduledDate = null;
                            task.scheduledTime = null;
                        }

                        console.log(`[DragDropManager] Moved task ${taskId} to group ${targetGroupId}`);
                    } else if (targetGroupId !== undefined) {
                        // Even if already in the list (or list not found), ensure groupId is sync'd
                        task.groupId = targetGroupId;

                        // Also clear schedule if dropped back onto its own list in the sidebar (for safety)
                        if (dropType === 'sidebar-list') {
                            task.scheduledDate = null;
                            task.scheduledTime = null;
                        }
                    }
                }
            });
        }

        // SPECIAL HANDLING FOR CALENDAR EVENTS
        if (activeCalendarEvent) {
            if (dropType === 'calendar-cell' || dropType === 'timebox-slot') {
                const { date, hour, minute } = overData;
                if (date && hour !== undefined) {
                    const newDate = new Date(date);
                    newDate.setHours(Number(hour), Number(minute || 0), 0, 0);

                    // Calculate end time to preserve duration
                    const durationMs = activeCalendarEvent.end.getTime() - activeCalendarEvent.start.getTime();
                    const newEnd = new Date(newDate.getTime() + durationMs);

                    store.calendarStore.updateEvent(activeCalendarEvent, {
                        start: newDate,
                        end: newEnd
                    });
                    console.log(`[DragDropManager] Updated Calendar Event ${taskId} to ${newDate}`);
                }
            } else {
                console.warn('[DragDropManager] Calendar Event dropped on invalid target (must remain in calendar/timebox).');
            }
            return;
        }

        const strategy = this.strategies.get(dropType);
        if (strategy && task) {
            strategy.handle(task, overData, event, { activeId, overId: over.id as string, isReordering });
        } else {
            console.warn('[DragDropManager] No strategy found for type or task invalid:', dropType);
        }
    }
}

export const dragDropManager = new DragDropManager();
