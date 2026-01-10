import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import {
    Calendar,
    Clock,
    Tag,
    RotateCw,
    Plus,
    Trash2,
    MoreVertical,
    Repeat,
    Copy,
    Link
} from 'lucide-react';
import { format } from 'date-fns';
import './TaskModal.css';

interface TaskModalProps {
    task: Task;
    onClose: () => void;
}

export const TaskModal = observer(({ task, onClose }: TaskModalProps) => {
    const [ui] = useState(() => new TaskUIModel());

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-card-modal" onClick={e => e.stopPropagation()}>
                {/* Header Section */}
                <div className="tc-header-new">
                    <button
                        className={`task-check-circle ${task.status === 'done' ? 'checked' : ''}`}
                        onClick={() => task.toggleStatus()}
                    />
                    <input
                        value={task.title}
                        placeholder="Task title..."
                        onChange={(e) => task.title = e.target.value}
                        className="tc-title-input-large"
                    />
                    <div className="tc-header-actions">
                        <button className="icon-btn-ghost" onClick={(e) => ui.openActionContext(e)}>
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </div>

                <div className="tc-content-new">
                    {/* Meta Info Rows */}
                    <div className="tc-meta-rows">
                        {/* Task Date */}
                        <div className="meta-row">
                            <div className="meta-row-label">
                                <Calendar size={18} />
                                <span>Task date</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-main">
                                    {task.scheduledDate ? format(task.scheduledDate, 'EEEE, d MMM') : 'No date set'}
                                </span>
                                <span className="value-sub">(Move to List)</span>
                            </div>
                        </div>

                        {/* Estimated Time */}
                        <div className="meta-row">
                            <div className="meta-row-label">
                                <Clock size={18} />
                                <span>Estimated time</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-main">
                                    {task.duration ? `${Math.floor(task.duration / 60)}h ${task.duration % 60}m` : '0h 20m'}
                                </span>
                            </div>
                        </div>

                        {/* Actual Time */}
                        <div className="meta-row">
                            <div className="meta-row-label">
                                <Clock size={18} />
                                <span>Actual time</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-placeholder">Click to edit</span>
                                <span className="value-sub">(Start timer)</span>
                            </div>
                        </div>

                        {/* Label */}
                        <div className="meta-row">
                            <div className="meta-row-label">
                                <Tag size={18} />
                                <span>Label</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-placeholder">
                                    {task.labels.length > 0 ? task.labels.join(', ') : 'Select a label'}
                                </span>
                            </div>
                        </div>

                        {/* Repeats */}
                        <div className="meta-row">
                            <div className="meta-row-label">
                                <RotateCw size={18} />
                                <span>Repeats</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-placeholder">Does not repeat</span>
                            </div>
                        </div>
                    </div>

                    <div className="tc-spacer-line" />

                    {/* Notes Section */}
                    <div className="tc-section">
                        <div className="tc-section-label">Notes</div>
                        <textarea
                            className="tc-notes-textarea"
                            placeholder="Add any notes to the task..."
                            value={task.description}
                            onChange={(e) => task.description = e.target.value}
                        />
                    </div>

                    <div className="tc-spacer-line" />

                    {/* Subtasks Section */}
                    <div className="tc-section">
                        <div className="tc-section-label">Subtasks</div>
                        <div className="tc-subtasks-list">
                            {task.subtasks.map((sub: any) => (
                                <div key={sub.id} className="tc-subtask-item">
                                    <div
                                        className={`tc-subtask-check ${sub.isCompleted ? 'checked' : ''}`}
                                        onClick={() => sub.toggle()}
                                    />
                                    <input
                                        className="tc-subtask-input"
                                        value={sub.title}
                                        onChange={(e) => sub.title = e.target.value}
                                    />
                                </div>
                            ))}
                            <button className="tc-add-subtask-btn" onClick={() => ui.setSubtaskMode(true)}>
                                <Plus size={18} />
                                <span>Add subtask</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Context Menu */}
                {ui.actionContext.isOpen && (
                    <div
                        className="modal-overlay-transparent"
                        onClick={() => ui.closeActionContext()}
                    >
                        <div
                            className="tc-context-menu"
                            style={{
                                top: ui.actionContext.position.y,
                                left: ui.actionContext.position.x
                            }}
                        >
                            <div className="context-item">
                                <Repeat size={16} />
                                <span>Repeat task</span>
                            </div>
                            <div className="context-item" onClick={() => { }}>
                                <Copy size={16} />
                                <span>Duplicate</span>
                            </div>
                            <div className="context-item">
                                <Link size={16} />
                                <span>Copy link</span>
                            </div>
                            <div className="context-divider" />
                            <div className="context-item delete" onClick={() => { }}>
                                <Trash2 size={16} />
                                <span>Delete Task</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

