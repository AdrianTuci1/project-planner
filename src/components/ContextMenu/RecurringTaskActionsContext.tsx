import React from 'react';
import { ContextMenu, MenuItem } from './ContextMenu';

interface RecurringTaskActionsContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    recurrenceDescription?: string;
    onUpdateRecurrence?: () => void;
    onStopRepeating?: () => void;
    onUpdateAllTasks?: () => void;
    onDeleteAllInstances?: () => void;
}

export const RecurringTaskActionsContext: React.FC<RecurringTaskActionsContextProps> = ({
    isOpen,
    onClose,
    position,
    recurrenceDescription = 'Every weekday (Mon - Fri) at 12:30 AM',
    onUpdateRecurrence,
    onStopRepeating,
    onUpdateAllTasks,
    onDeleteAllInstances,
}) => {
    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20v-6M6 20V10m12 10V4" />
                        <circle cx="12" cy="8" r="2" />
                    </svg>
                }
                label={recurrenceDescription}
                arrow
                onClick={onUpdateRecurrence}
            />

            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <rect x="9" y="9" width="6" height="6" />
                    </svg>
                }
                label="Stop repeating"
                onClick={onStopRepeating}
            />

            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2" />
                    </svg>
                }
                label="Update all incomplete tasks to match this task"
                onClick={onUpdateAllTasks}
            />

            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                }
                label="Delete all instances"
                onClick={onDeleteAllInstances}
            />
        </ContextMenu >
    );
};
