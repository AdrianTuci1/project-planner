import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import {
    Check,
    Plus,
    Flag,
    Link2,
    RotateCw,
    Play,
    GripVertical,
    MoreVertical,
    Copy,
    Trash2
} from 'lucide-react';
import { TimeEntryContext } from '../../ContextMenu/TimeEntryContext';
import { ContextMenu, MenuItem } from '../../ContextMenu/ContextMenu';
import { LabelContext } from '../../ContextMenu/LabelContext';
import { MakeRecurringTaskContext } from '../../ContextMenu/MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from '../../ContextMenu/RecurringTaskActionsContext';
import { TaskUIModel } from '../../../models/TaskUIModel';
import { store } from '../../../models/store';
import { format, getHours, getMinutes } from 'date-fns';
import './TaskCard.css';

interface StandardTaskCardProps {
    task: Task;
    onTaskClick?: (task: Task) => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;
}

export const StandardTaskCard = observer(({
    task,
    onTaskClick,
    onDuplicate,
    onDelete,
    style,
    className
}: StandardTaskCardProps) => {
    const ui = useMemo(() => new TaskUIModel(), []);

    const formatTime = (minutes: number = 0) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    const formatTimeMinimal = (minutes: number = 0) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}:${m}`;
    };

    return (
        <>
            <div
                tabIndex={0}
                className={`task-card ${ui.isHovered ? 'hovered' : ''} ${className || ''}`}
                style={style}
                onMouseEnter={() => ui.setHovered(true)}
                onMouseLeave={() => ui.setHovered(false)}
                onClick={() => onTaskClick?.(task)}
                onContextMenu={(e) => ui.openActionContext(e)}
            >
                <div className="tc-header">
                    <div className="tc-checkbox-wrapper" onClick={(e) => { e.stopPropagation(); task.toggleStatus(); }}>
                        <div className={`tc-checkbox ${task.status === 'done' ? 'checked' : ''}`}>
                            {task.status === 'done' && <Check size={12} />}
                        </div>
                    </div>

                    <span className={`tc-title ${task.status === 'done' ? 'completed' : ''}`}>
                        {task.title}
                    </span>

                    <div
                        className="tc-time-badge"
                        onClick={(e) => { e.stopPropagation(); ui.setTimeExpanded(!ui.isTimeExpanded); }}
                    >
                        {formatTimeMinimal(task.duration || 0)}
                    </div>
                </div>

                {(ui.isHovered || (task.labels && task.labels.length > 0) || (task.scheduledDate && (getHours(task.scheduledDate) !== 0 || getMinutes(task.scheduledDate) !== 0))) && (
                    <div className="tc-footer">
                        {ui.isHovered ? (
                            <>
                                <div
                                    className="tc-label"
                                    onClick={(e) => ui.openLabelContext(e)}
                                >
                                    {task.labels && task.labels.length > 0 ? (
                                        <>
                                            <div
                                                className="tc-label-dot"
                                                style={{ backgroundColor: store.getLabelColor(task.labels[0]) }}
                                            />
                                            {task.labels[0]}
                                        </>
                                    ) : (
                                        "Select Label"
                                    )}
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
                                        className={`tc-action-icon ${task.recurrence && task.recurrence !== 'none' ? 'active' : ''}`}
                                        style={task.recurrence && task.recurrence !== 'none' ? { color: 'var(--accent-primary)' } : undefined}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (task.recurrence && task.recurrence !== 'none') {
                                                ui.openRecurrenceContext(e, 'actions');
                                            } else {
                                                ui.openRecurrenceContext(e, 'set');
                                            }
                                        }}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                {task.labels && task.labels.length > 0 && (
                                    <div className="tc-label">
                                        <div
                                            className="tc-label-dot"
                                            style={{ backgroundColor: store.getLabelColor(task.labels[0]) }}
                                        />
                                        {task.labels[0]}
                                    </div>
                                )}
                                {task.scheduledDate && (getHours(task.scheduledDate) !== 0 || getMinutes(task.scheduledDate) !== 0) && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {format(task.scheduledDate, 'h:mmaaa')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {ui.isSubtaskMode && (
                    <>
                        <div className="tc-divider" />
                        <div className="tc-subtasks-list" onClick={e => e.stopPropagation()}>
                            {task.subtasks.map((sub, index) => (
                                <div
                                    key={sub.id}
                                    className="tc-subtask-item"
                                    draggable
                                    onDragStart={(e) => {
                                        e.stopPropagation();
                                        e.dataTransfer.setData('text/plain', index.toString());
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                                        if (fromIndex !== index) {
                                            task.reorderSubtask(fromIndex, index);
                                        }
                                    }}
                                >
                                    <GripVertical size={12} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                                    <div
                                        className={`tc-checkbox ${sub.isCompleted ? 'checked' : ''}`}
                                        onClick={() => sub.isCompleted = !sub.isCompleted}
                                    >
                                        {sub.isCompleted && <Check size={10} />}
                                    </div>
                                    <span style={{ fontSize: '13px', color: 'var(--text-main)', textDecoration: sub.isCompleted ? 'line-through' : 'none' }}>
                                        {sub.title}
                                    </span>
                                    <MoreVertical size={12} className="tc-action-icon" style={{ marginLeft: 'auto' }} />
                                </div>
                            ))}
                            <div className="tc-add-subtask">
                                <Plus size={14} />
                                <input
                                    className="tc-subtask-input"
                                    placeholder="Add subtask"
                                    value={ui.newSubtaskTitle}
                                    onChange={e => ui.setNewSubtaskTitle(e.target.value)}
                                    onKeyDown={(e) => ui.handleAddSubtask(e, task)}
                                />
                            </div>
                        </div>
                    </>
                )}

                {ui.isTimeExpanded && (
                    <div className="tc-time-expanded" onClick={e => e.stopPropagation()}>
                        <div className="tc-play-btn">
                            <Play size={20} fill="currentColor" />
                        </div>
                        <div className="tc-time-column" onClick={(e) => ui.openTimeContext(e, 'actual')}>
                            <span className="tc-time-label">Actual</span>
                            <span className="tc-time-value">{formatTime(task.actualDuration)}</span>
                        </div>
                        <div className="tc-time-column" onClick={(e) => ui.openTimeContext(e, 'estimated')}>
                            <span className="tc-time-label">Estimated</span>
                            <span className="tc-time-value">{formatTime(task.duration)}</span>
                        </div>
                    </div>
                )}
            </div>

            <TimeEntryContext
                isOpen={ui.timeContext.isOpen}
                onClose={() => ui.closeTimeContext()}
                position={ui.timeContext.position}
                title={ui.timeContext.type === 'actual' ? 'Edit Actual Time' : 'Edit Estimated Time'}
                initialValue={ui.timeContext.type === 'actual' ? task.actualDuration : task.duration}
                onSave={(val) => {
                    if (ui.timeContext.type === 'actual') task.actualDuration = val;
                    else task.duration = val;
                }}
            />

            <LabelContext
                isOpen={ui.labelContext.isOpen}
                onClose={() => ui.closeLabelContext()}
                position={ui.labelContext.position}
                labels={store.availableLabels}
                recentLabels={store.availableLabels.slice(0, 3)}
                onSelectLabel={(label) => {
                    task.labels = [label.name];
                    ui.closeLabelContext();
                }}
            />

            <MakeRecurringTaskContext
                isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'set'}
                onClose={() => ui.closeRecurrenceContext()}
                position={ui.recurrenceContext.position}
                selectedRecurrence={task.recurrence}
                hasSpecificTime={!!task.scheduledDate && (getHours(task.scheduledDate) !== 0 || getMinutes(task.scheduledDate) !== 0)}
                specificTime={task.scheduledDate ? format(task.scheduledDate, 'h:mm a') : '9:00 AM'}
                onSelectRecurrence={(type) => {
                    task.recurrence = type;
                    ui.closeRecurrenceContext();
                }}
                onToggleSpecificTime={(enabled) => {
                    if (!enabled) {
                        if (task.scheduledDate) {
                            const newDate = new Date(task.scheduledDate);
                            newDate.setHours(0, 0, 0, 0);
                            task.scheduledDate = newDate;
                        }
                    } else {
                        if (task.scheduledDate) {
                            const newDate = new Date(task.scheduledDate);
                            newDate.setHours(9, 0, 0, 0);
                            task.scheduledDate = newDate;
                        } else {
                            const now = new Date();
                            now.setHours(9, 0, 0, 0);
                            task.scheduledDate = now;
                        }
                    }
                }}
                onChangeTime={(timeStr) => {
                    const [time, period] = timeStr.split(' ');
                    const [hoursStr, minutesStr] = time.split(':');
                    let hours = parseInt(hoursStr);
                    const minutes = parseInt(minutesStr);
                    if (period === 'PM' && hours < 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;

                    if (task.scheduledDate) {
                        const newDate = new Date(task.scheduledDate);
                        newDate.setHours(hours, minutes);
                        task.scheduledDate = newDate;
                    } else {
                        const now = new Date();
                        now.setHours(hours, minutes);
                        task.scheduledDate = now;
                    }
                }}
            />

            <RecurringTaskActionsContext
                isOpen={ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'actions'}
                onClose={() => ui.closeRecurrenceContext()}
                position={ui.recurrenceContext.position}
                recurrenceDescription={`Repeats ${task.recurrence}`}
                onStopRepeating={() => {
                    task.recurrence = 'none';
                    ui.closeRecurrenceContext();
                }}
                onUpdateRecurrence={() => {
                    ui.closeRecurrenceContext();
                    setTimeout(() => {
                        // Logic to reopen in set mode if needed
                    }, 10);
                }}
            />

            <ContextMenu
                isOpen={ui.actionContext.isOpen}
                onClose={() => ui.closeActionContext()}
                position={ui.actionContext.position}
            >
                <MenuItem
                    icon={<Copy size={14} />}
                    label="Duplicate"
                    onClick={() => {
                        onDuplicate?.(task);
                        ui.closeActionContext();
                    }}
                />
                <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    onClick={() => {
                        onDelete?.(task);
                        ui.closeActionContext();
                    }}
                />
            </ContextMenu>
        </>
    );
});
