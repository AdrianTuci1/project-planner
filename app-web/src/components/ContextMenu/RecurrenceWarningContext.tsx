
import React from 'react';
import { observer } from 'mobx-react-lite';
import { TaskUIModel } from '../../models/TaskUIModel';
import { ContextMenu } from './ContextMenu';

interface RecurrenceWarningContextProps {
    ui: TaskUIModel;
}

export const RecurrenceWarningContext = observer(({ ui }: RecurrenceWarningContextProps) => {
    if (!ui.recurrenceWarningContext.isOpen) return null;

    return (
        <div
            className="context-menu"
            style={{
                position: 'fixed',
                top: ui.recurrenceWarningContext.position.y,
                left: ui.recurrenceWarningContext.position.x,
                padding: '12px',
                width: '240px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                zIndex: 10000,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                pointerEvents: 'none' // Don't block hover/mouse
            }}
        >
            Tasks in lists (or inbox) cannot be recurring. This is because they are not associated with a specific date
        </div>
    );
});
