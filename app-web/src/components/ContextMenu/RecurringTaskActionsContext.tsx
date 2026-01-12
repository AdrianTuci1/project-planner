import React from 'react';
import { observer } from 'mobx-react-lite';
import { ContextMenu, MenuItem } from './ContextMenu';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';

interface RecurringTaskActionsContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const RecurringTaskActionsContext = observer(({
    ui,
    task
}: RecurringTaskActionsContextProps) => {
    return (
        <ContextMenu
            isOpen={ui.recurrenceContext.isOpen}
            onClose={() => ui.closeRecurrenceContext()}
            position={ui.recurrenceContext.position}
        >
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20v-6M6 20V10m12 10V4" />
                        <circle cx="12" cy="8" r="2" />
                    </svg>
                }
                label={task.recurrence || 'Recurring'}
                arrow
                onClick={() => {
                    // Switch to 'set' mode to edit recurrence
                    // We need a way to switch modes in UI model.
                    // As per TaskUIModel: mode: 'set' | 'actions'
                    ui.recurrenceContext.mode = 'set';
                    // Context closes/re-renders? 
                    // If we change mode, TaskModal will re-render and show MakeRecurringTaskContext because of conditional rendering there.
                    // So we just update the model.
                }}
            />

            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <rect x="9" y="9" width="6" height="6" />
                    </svg>
                }
                label="Stop repeating"
                onClick={() => {
                    task.recurrence = 'none';
                    ui.closeRecurrenceContext();
                }}
            />

            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                    </svg>
                }
                label="Update all incomplete tasks to match this task"
                onClick={() => {
                    // Placeholder for future logic
                    console.log("Update all incomplete tasks - not implemented");
                    ui.closeRecurrenceContext();
                }}
            />

            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                }
                label="Delete all instances"
                onClick={() => {
                    // Placeholder for future logic
                    console.log("Delete all instances - not implemented");
                    ui.closeRecurrenceContext();
                }}
            />
        </ContextMenu >
    );
});
