import React, { useState } from 'react';
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
import './TaskCard.css';

interface TaskCardProps {
    task?: Task;
    isGhost?: boolean;
    isCreating?: boolean;
    onAddClick?: () => void;
    onTaskClick?: (task: Task) => void;
    onCreate?: (title: string) => void;
    onCancel?: () => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
}

export const TaskCard = observer(({ task, isGhost, isCreating, onAddClick, onTaskClick, onCreate, onCancel, onDuplicate, onDelete }: TaskCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isSubtaskMode, setIsSubtaskMode] = useState(false);
    const [isTimeExpanded, setIsTimeExpanded] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [draftTitle, setDraftTitle] = useState('');

    // Context Menu State
    const [timeContext, setTimeContext] = useState<{ isOpen: boolean; type: 'actual' | 'estimated'; position: { x: number; y: number } }>({
        isOpen: false,
        type: 'estimated',
        position: { x: 0, y: 0 }
    });

    const [actionContext, setActionContext] = useState<{ isOpen: boolean; position: { x: number; y: number } }>({
        isOpen: false,
        position: { x: 0, y: 0 }
    });

    const handleAddSubtask = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newSubtaskTitle.trim() && task) {
            task.addSubtask(newSubtaskTitle);
            setNewSubtaskTitle('');
        }
    };

    const handleCreateTask = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (draftTitle.trim() && onCreate) {
                onCreate(draftTitle);
                setDraftTitle('');
            } else if (onCancel) {
                onCancel();
            }
        } else if (e.key === 'Escape' && onCancel) {
            onCancel();
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        // If we are clicking inside a context menu or another part of the card, don't cancel
        if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) {
            return;
        }

        if (isCreating && !draftTitle.trim() && onCancel) {
            onCancel();
        }
        setIsSubtaskMode(false);
        setIsTimeExpanded(false);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        if (isCreating || isGhost) return;
        e.preventDefault();
        e.stopPropagation();
        setActionContext({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY }
        });
    };

    const handleOpenTimeContext = (e: React.MouseEvent, type: 'actual' | 'estimated') => {
        e.stopPropagation();
        setTimeContext({
            isOpen: true,
            type,
            position: { x: e.clientX, y: e.clientY }
        });
    };

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

    return (
        <>
            <div
                tabIndex={0}
                className={`task-card ${isHovered || isCreating ? 'hovered' : ''} ${isCreating ? 'creating' : ''}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onBlur={handleBlur}
                onClick={() => !isCreating && onTaskClick?.(task!)}
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
                            value={draftTitle}
                            onChange={e => setDraftTitle(e.target.value)}
                            onKeyDown={handleCreateTask}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span className={`tc-title ${task?.status === 'done' ? 'completed' : ''}`}>
                            {task?.title}
                        </span>
                    )}

                    <div
                        className="tc-time-badge"
                        onClick={(e) => { e.stopPropagation(); setIsTimeExpanded(!isTimeExpanded); }}
                    >
                        {formatTime(task?.duration || 0)}
                    </div>
                </div>

                <div className="tc-footer">
                    {(isHovered || isCreating) ? (
                        <>
                            <div className="tc-label">Select Label</div>
                            <div className="tc-actions">
                                <Flag size={14} className="tc-action-icon" />
                                <Link2
                                    size={14}
                                    className="tc-action-icon"
                                    onClick={(e) => { e.stopPropagation(); setIsSubtaskMode(!isSubtaskMode); }}
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
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                9:30pm
                            </div>
                        </>
                    )}
                </div>

                {isSubtaskMode && task && (
                    <>
                        <div className="tc-divider" />
                        <div className="tc-subtasks-list" onClick={e => e.stopPropagation()}>
                            {task.subtasks.map(sub => (
                                <div key={sub.id} className="tc-subtask-item">
                                    <GripVertical size={12} color="var(--text-muted)" />
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
                                    value={newSubtaskTitle}
                                    onChange={e => setNewSubtaskTitle(e.target.value)}
                                    onKeyDown={handleAddSubtask}
                                />
                            </div>
                        </div>
                    </>
                )}

                {isTimeExpanded && (
                    <div className="tc-time-expanded" onClick={e => e.stopPropagation()}>
                        <div className="tc-play-btn">
                            <Play size={20} fill="currentColor" />
                        </div>
                        <div className="tc-time-column" onClick={(e) => handleOpenTimeContext(e, 'actual')}>
                            <span className="tc-time-label">Actual</span>
                            <span className="tc-time-value">{formatTime(task?.actualDuration)}</span>
                        </div>
                        <div className="tc-time-column" onClick={(e) => handleOpenTimeContext(e, 'estimated')}>
                            <span className="tc-time-label">Estimated</span>
                            <span className="tc-time-value">{formatTime(task?.duration)}</span>
                        </div>
                    </div>
                )}
            </div>

            {task && (
                <TimeEntryContext
                    isOpen={timeContext.isOpen}
                    onClose={() => setTimeContext({ ...timeContext, isOpen: false })}
                    position={timeContext.position}
                    title={timeContext.type === 'actual' ? 'Edit Actual Time' : 'Edit Estimated Time'}
                    initialValue={timeContext.type === 'actual' ? task.actualDuration : task.duration}
                    onSave={(val) => {
                        if (timeContext.type === 'actual') task.actualDuration = val;
                        else task.duration = val;
                    }}
                />
            )}

            <ContextMenu
                isOpen={actionContext.isOpen}
                onClose={() => setActionContext({ ...actionContext, isOpen: false })}
                position={actionContext.position}
            >
                <MenuItem
                    icon={<Copy size={14} />}
                    label="Duplicate"
                    onClick={() => {
                        onDuplicate?.(task!);
                        setActionContext({ ...actionContext, isOpen: false });
                    }}
                />
                <MenuItem
                    icon={<Trash2 size={14} />}
                    label="Delete"
                    onClick={() => {
                        onDelete?.(task!);
                        setActionContext({ ...actionContext, isOpen: false });
                    }}
                />
            </ContextMenu>
        </>
    );
});
