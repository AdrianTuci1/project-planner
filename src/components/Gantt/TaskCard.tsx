import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
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
import { TimeEntryContext } from '../ContextMenu/TimeEntryContext';
import { ContextMenu, MenuItem } from '../ContextMenu/ContextMenu';
import { TaskUIModel } from '../../models/TaskUIModel';
import { format, getHours, getMinutes } from 'date-fns';
import './TaskCard.css';

export interface TaskCardProps {
    task?: Task;
    isGhost?: boolean;
    isCreating?: boolean;
    onAddClick?: () => void;
    onTaskClick?: (task: Task) => void;
    onCreate?: (title: string) => void;
    onCancel?: () => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;
}

export const TaskCard = observer(({
    task,
    isGhost,
    isCreating,
    onAddClick,
    onTaskClick,
    onCreate,
    onCancel,
    onDuplicate,
    onDelete,
    style,
    className
}: TaskCardProps) => {
    const ui = useMemo(() => new TaskUIModel(), []);

    if (isGhost) {
        return (
            <div className="add-task-ghost" onClick={onAddClick}>
                <Plus size={16} />
                <span>Add a task</span>
            </div>
        );
    }

    if (!task && !isCreating) return null;

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
                className={`task-card ${ui.isHovered || isCreating ? 'hovered' : ''} ${isCreating ? 'creating' : ''} ${className || ''}`}
                style={style}
                onMouseEnter={() => ui.setHovered(true)}
                onMouseLeave={() => ui.setHovered(false)}
                onBlur={(e) => ui.handleBlur(e, isCreating, onCancel, onCreate)}
                onClick={() => !isCreating && onTaskClick?.(task!)}
                onContextMenu={(e) => ui.openActionContext(e)}
            >
                <div className="tc-header">
                    {!isCreating && (
                        <div className="tc-checkbox-wrapper" onClick={(e) => { e.stopPropagation(); task?.toggleStatus(); }}>
                            <div className={`tc-checkbox ${task?.status === 'done' ? 'checked' : ''}`}>
                                {task?.status === 'done' && <Check size={12} />}
                            </div>
                        </div>
                    )}

                    {isCreating ? (
                        <input
                            autoFocus
                            className="tc-title-input"
                            placeholder="Task name"
                            value={ui.draftTitle}
                            onChange={e => ui.setDraftTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); // Prevent newline
                                    e.stopPropagation();
                                    ui.handleCreateTask(e, onCreate, onCancel);
                                }
                            }}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`tc-title ${task?.status === 'done' ? 'completed' : ''}`}>
                            {task?.title}
                        </span>
                    )}

                    {(task?.duration || 0) > 0 && (
                        <div
                            className="tc-time-badge"
                            onClick={(e) => { e.stopPropagation(); ui.setTimeExpanded(!ui.isTimeExpanded); }}
                        >
                            {formatTimeMinimal(task?.duration || 0)}
                        </div>
                    )}
                </div>

                {(ui.isHovered || isCreating || (task?.labels && task.labels.length > 0) || (task?.scheduledDate && (getHours(task.scheduledDate) !== 0 || getMinutes(task.scheduledDate) !== 0))) && (
                    <div className="tc-footer">
                        {(ui.isHovered || isCreating) ? (
                            <>
                                <div className="tc-label">
                                    {task?.labels && task.labels.length > 0 ? (
                                        <>
                                            <div className="tc-label-dot" />
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
                                    <RotateCw size={14} className="tc-action-icon" />
                                </div>
                            </>
                        ) : (
                            <>
                                {task?.labels && task.labels.length > 0 && (
                                    <div className="tc-label">
                                        <div className="tc-label-dot" />
                                        {task.labels[0]}
                                    </div>
                                )}
                                {task?.scheduledDate && (getHours(task.scheduledDate) !== 0 || getMinutes(task.scheduledDate) !== 0) && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {format(task.scheduledDate, 'h:mmaaa')}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {ui.isSubtaskMode && task && (
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
                            <span className="tc-time-value">{formatTime(task?.actualDuration)}</span>
                        </div>
                        <div className="tc-time-column" onClick={(e) => ui.openTimeContext(e, 'estimated')}>
                            <span className="tc-time-label">Estimated</span>
                            <span className="tc-time-value">{formatTime(task?.duration)}</span>
                        </div>
                    </div>
                )}
            </div>

            {task && (
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
            )}

            <ContextMenu
                isOpen={ui.actionContext.isOpen}
                onClose={() => ui.closeActionContext()}
                position={ui.actionContext.position}
            >
                <MenuItem
                    icon={<Copy size={14} />}
                    label="Duplicate"
                    onClick={() => {
                        onDuplicate?.(task!);
                        ui.closeActionContext();
                    }}
                />
                <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    onClick={() => {
                        onDelete?.(task!);
                        ui.closeActionContext();
                    }}
                />
            </ContextMenu>
        </>
    );
});
