import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Flag,
    Link2,
    RotateCw,
} from 'lucide-react';
import { TaskUIModel } from '../../../models/TaskUIModel';
import { store } from '../../../models/store';
import './TaskCard.css';
import { TimeEntryContext } from '../../ContextMenu/TimeEntryContext';
import { LabelContext } from '../../ContextMenu/LabelContext';
import { MakeRecurringTaskContext } from '../../ContextMenu/MakeRecurringTaskContext';

interface CreatingTaskCardProps {
    onCreate?: (title: string) => void;
    onCancel?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

export const CreatingTaskCard = observer(({
    onCreate,
    onCancel,
    style,
    className
}: CreatingTaskCardProps) => {
    const ui = useMemo(() => new TaskUIModel(), []);

    return (
        <div
            tabIndex={0}
            className={`task-card creating hovered ${className || ''}`}
            style={style}
            onBlur={(e) => ui.handleBlur(e, true, onCancel, onCreate)}
        >
            <div className="tc-header">
                <input
                    autoFocus
                    className="tc-title-input"
                    placeholder="Task name"
                    value={ui.draftTitle}
                    onChange={e => ui.setDraftTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            ui.handleCreateTask(e, onCreate, onCancel);
                        }
                    }}
                    onClick={e => e.stopPropagation()}
                />
            </div>

            <div className="tc-footer">
                <div
                    className="tc-label"
                    onClick={(e) => ui.openLabelContext(e)}
                >
                    Select Label
                </div>
                <div className="tc-actions">
                    <Flag size={14} className="tc-action-icon" />
                    <Link2
                        size={14}
                        className="tc-action-icon"
                        onClick={(e) => { e.stopPropagation(); ui.setSubtaskMode(!ui.isSubtaskMode); }}
                    />
                    <RotateCw
                        size={14}
                        className="tc-action-icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            ui.openRecurrenceContext(e, 'set');
                        }}
                    />
                </div>
            </div>

            {/* Context Menus needed for creating state interaction if we want label/recurrence selection to work during creation (advanced) 
                Note: In original code, these were present. 
                However, usually creating a task with labels/recurrence requires the onCreate to accept more than string.
                The current interface `onCreate?: (title: string) => void` suggests we might lose this data unless ui model handles it or we update signature.
                Original `TaskCard` creates a `TaskUIModel` but `onCreate` only takes title. 
                So effectively selecting label/recurrence during creation might NOT save it unless `store` captures it or `onCreate` uses `ui` state?
                Let's stick to original behavior: The context menus were rendered.
            */}

            <LabelContext
                isOpen={ui.labelContext.isOpen}
                onClose={() => ui.closeLabelContext()}
                position={ui.labelContext.position}
                labels={store.availableLabels}
                recentLabels={store.availableLabels.slice(0, 3)}
                onSelectLabel={(label) => {
                    // Logic for creation mode? 
                    // Original code: task.labels = [label.name]; 
                    // But here task is undefined.
                    // So likely this feature was broken or limited in original creation mode without a task object.
                    // We'll leave it as is visually or try to handle it if we create a temporary task.
                    ui.closeLabelContext();
                }}
            />

            <MakeRecurringTaskContext
                isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'set'}
                onClose={() => ui.closeRecurrenceContext()}
                position={ui.recurrenceContext.position}
                selectedRecurrence={'none'} // default
                hasSpecificTime={false}
                specificTime={'9:00 AM'}
                onSelectRecurrence={() => ui.closeRecurrenceContext()}
                onToggleSpecificTime={() => { }}
                onChangeTime={() => { }}
            />
        </div>
    );
});
