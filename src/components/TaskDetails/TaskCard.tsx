import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import {
    X,
    Calendar,
    Clock,
    Tag,
    RotateCw,
    CheckSquare,
    Plus,
    Trash2,
    MoreVertical,
    Repeat,
    Copy,
    Link,
    GripVertical
} from 'lucide-react';
import { format } from 'date-fns';
import './TaskCard.css';

interface TaskCardProps {
    task: Task;
    onClose: () => void;
}

export const TaskCard = observer(({ task, onClose }: TaskCardProps) => {
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleAddSubtask = () => {
        if (newSubtaskTitle.trim()) {
            task.addSubtask(newSubtaskTitle);
            setNewSubtaskTitle('');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-card-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="tc-header">
                    <button
                        className={`task-check-btn ${task.status === 'done' ? 'checked' : ''}`}
                        onClick={() => task.toggleStatus()}
                    >
                        <CheckSquare size={20} />
                    </button>
                    <input
                        value={task.title}
                        onChange={(e) => task.title = e.target.value} // Direct mutation
                        className="tc-title-input"
                    />

                    <div className="context-menu-wrapper">
                        <button className="icon-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <MoreVertical size={18} />
                        </button>
                        {isMenuOpen && (
                            <div className="context-menu">
                                <div className="context-item"><Repeat size={14} /> Repeat task</div>
                                <div className="context-item"><Copy size={14} /> Duplicate</div>
                                <div className="context-item"><Link size={14} /> Copy link</div>
                                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                                <div className="context-item" style={{ color: 'var(--accent-pink)' }}>
                                    <Trash2 size={14} /> Delete
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="icon-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="tc-content">
                    {/* Properties Grid */}
                    <div className="tc-meta-grid">
                        <div className="meta-label">
                            <Calendar size={16} />
                            <span>Date</span>
                        </div>
                        <div className="meta-value">
                            {task.scheduledDate ? format(task.scheduledDate, 'MMM d, yyyy') : 'Set Date'}
                        </div>

                        <div className="meta-label">
                            <Clock size={16} />
                            <span>Estimate</span>
                        </div>
                        <div className="meta-value">
                            {task.duration ? `${task.duration}m` : '0:00'}
                        </div>

                        <div className="meta-label">
                            <Tag size={16} />
                            <span>Label</span>
                        </div>
                        <div className="meta-value">
                            {task.labels.length > 0 ? task.labels.join(', ') : 'Add Label'}
                        </div>
                    </div>

                    <div style={{ height: 1, backgroundColor: 'var(--border-subtle)', margin: 'var(--space-4) 0' }} />

                    {/* Subtasks - Matches Image better */}
                    <div className="subtask-list">
                        {task.subtasks.map(sub => (
                            <div key={sub.id} className="subtask-item">
                                <GripVertical size={14} color="var(--text-muted)" style={{ cursor: 'grab' }} />
                                <input
                                    type="checkbox"
                                    checked={sub.isCompleted}
                                    onChange={() => sub.isCompleted = !sub.isCompleted}
                                />
                                <input
                                    className="subtask-input"
                                    style={{ textDecoration: sub.isCompleted ? 'line-through' : 'none' }}
                                    value={sub.title}
                                    onChange={(e) => sub.title = e.target.value}
                                />
                                <MoreVertical size={14} className="icon-btn" />
                            </div>
                        ))}

                        <div className="add-subtask-row">
                            <Plus size={16} />
                            <input
                                className="subtask-input"
                                placeholder="Add subtask"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="tc-section-title">Notes</div>
                    <textarea
                        className="notes-area"
                        placeholder="Add any notes to the task"
                        value={task.description}
                        onChange={(e) => task.description = e.target.value}
                    />
                </div>
            </div>
        </div>
    );
});
