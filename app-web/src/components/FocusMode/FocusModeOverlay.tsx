import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Timebox } from '../Gantt/Timebox';
import { KanbanColumn } from '../Gantt/KanbanBoard'; // We need to export this from KanbanBoard or duplicate/adapt
import { Task } from '../../models/core';
import { isSameDay, startOfDay } from 'date-fns';
import { X } from 'lucide-react';
import './FocusModeOverlay.css'; // We'll create this

export const FocusModeOverlay = observer(() => {
    const today = startOfDay(new Date());

    const getTasksForDay = (date: Date) => {
        return store.filteredTasks.filter(t => {
            if (!t.scheduledDate) return false;
            return isSameDay(t.scheduledDate, date);
        });
    };

    const todayTasks = getTasksForDay(today);

    // We might need to handle drag and drop context if we want drag and drop to work here.
    // KanbanColumn uses useDroppable. If we just render it, it might work if wrapped in DndContext.
    // But KanbanBoard usually wraps everything in DndContext. GroupView doesn't seem to wrap headers/etc in DndContext unless it's in KanbanBoard.
    // Actually, looking at GroupView, DndContext is likely in App.tsx or MainView.tsx?
    // Let's check MainView or wherever DndContext is.
    // Assuming DndContext is high up, then reusing KanbanColumn should work.

    // However, KanbanColumn is not exported from KanbanBoard.tsx in the previous file view.
    // I need to export KanbanColumn from KanbanBoard.tsx first.

    return (
        <div className="focus-mode-overlay">
            <div className="focus-header">
                <button
                    className="exit-focus-btn"
                    onClick={() => store.toggleFocusMode()}
                >
                    Exit today-only mode
                </button>
            </div>

            <div className="focus-content">
                <div className="focus-list-section">
                    {/* We can reproduce the column logic here or export/import KanbanColumn */}
                    {/* For now, let's assume we will export KanbanColumn from KanbanBoard */}
                    <KanbanColumn
                        date={today}
                        tasks={todayTasks}
                        isToday={false}
                        isAdding={false} // Todo: handle adding state locally if needed
                        onAddClick={() => { }} // Todo
                        onTaskClick={(t: Task) => store.openTaskModal(t)}
                        onDuplicate={(t: Task) => store.duplicateTask(t)}
                        onDelete={(t: Task) => store.deleteTask(t.id)}
                        onCreate={(title: string) => {
                            const newTask = new Task(title);
                            newTask.scheduledDate = today;
                            if (store.activeGroup) {
                                store.activeGroup.addTask(newTask);
                            } else {
                                store.dumpAreaTasks.push(newTask);
                            }
                        }}
                        onCancel={() => { }}
                        groupId={store.activeGroupId}
                    />
                </div>
                <div className="focus-calendar-section">
                    <Timebox hideHeader={true} />
                </div>
            </div>
        </div>
    );
});
