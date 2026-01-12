import React from 'react';
import { observer } from 'mobx-react-lite';
import { ContextMenu, MenuItem } from './ContextMenu';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import { store } from '../../models/store';

interface RecurringTaskActionsContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const RecurringTaskActionsContext = observer(({
    ui,
    task
}: RecurringTaskActionsContextProps) => {

    const [view, setView] = React.useState<'menu' | 'stop-confirmation'>('menu');

    if (view === 'stop-confirmation') {
        return (
            <ContextMenu
                isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'actions'}
                onClose={() => ui.closeRecurrenceContext()}
                position={ui.recurrenceContext.position}
            >
                <div style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Do you still want to keep the tasks?
                </div>
                <MenuItem
                    label="Keep the tasks"
                    onClick={() => {
                        store.stopRecurrence(task);
                        ui.closeRecurrenceContext();
                    }}
                />
                <MenuItem
                    label="Delete all occurrences" color="var(--text-danger)"
                    onClick={() => {
                        store.deleteRecurringSeries(task);
                        ui.closeRecurrenceContext();
                    }}
                />
            </ContextMenu>
        );
    }

    return (
        <ContextMenu
            isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'actions'}
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
                    ui.recurrenceContext.mode = 'set';
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
                    setView('stop-confirmation');
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
                    store.updateRecurringSeries(task);
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
                    store.deleteRecurringSeries(task);
                    ui.closeRecurrenceContext();
                }}
            />
        </ContextMenu >
    );
});
