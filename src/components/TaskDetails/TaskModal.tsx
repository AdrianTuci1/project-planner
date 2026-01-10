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
import { format, setHours, setMinutes, getHours, getMinutes } from 'date-fns';
import { DateTimePickerContext } from '../ContextMenu/DateTimePickerContext';
import { TimeInputContext } from '../ContextMenu/TimeInputContext';
import { CreateLabelContext } from '../ContextMenu/CreateLabelContext';
import { MakeRecurringTaskContext } from '../ContextMenu/MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from '../ContextMenu/RecurringTaskActionsContext';
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
                        <div
                            className="meta-row"
                            onClick={(e) => {
                                const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                if (valueEl) {
                                    const rect = valueEl.getBoundingClientRect();
                                    ui.setContextPosition({ x: rect.left, y: rect.bottom + 4 });
                                } else {
                                    ui.setContextPosition({ x: e.clientX, y: e.clientY });
                                }
                                ui.setContextMenuOpen(true);
                            }}
                        >
                            <div className="meta-row-label">
                                <Calendar size={18} />
                                <span>Task date</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-main">
                                    {task.scheduledDate ? format(task.scheduledDate, 'EEEE, d MMM' + (getHours(task.scheduledDate) !== 0 || getMinutes(task.scheduledDate) !== 0 ? ' HH:mm' : '')) : 'No date set'}
                                </span>
                                <span className="value-sub">(Move to List)</span>
                            </div>
                        </div>

                        {/* Estimated Time */}
                        {/* Estimated Time */}
                        <div
                            className="meta-row"
                            onClick={(e) => {
                                const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                ui.openTimeContext(e, 'estimated', pos);
                            }}
                        >
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
                        {/* Actual Time */}
                        <div
                            className="meta-row"
                            onClick={(e) => {
                                const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                ui.openTimeContext(e, 'actual', pos);
                            }}
                        >
                            <div className="meta-row-label">
                                <Clock size={18} />
                                <span>Actual time</span>
                            </div>
                            <div className="meta-row-value">
                                {task.actualDuration ? (
                                    <span className="value-main">
                                        {Math.floor(task.actualDuration / 60)}h {task.actualDuration % 60}m
                                    </span>
                                ) : (
                                    <span className="value-placeholder">Click to edit</span>
                                )}
                                <span className="value-sub">(Start timer)</span>
                            </div>
                        </div>

                        {/* Label */}
                        {/* Label */}
                        <div
                            className="meta-row"
                            onClick={(e) => {
                                const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                ui.openLabelContext(e, pos);
                            }}
                        >
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
                        <div
                            className="meta-row"
                            onClick={(e) => {
                                const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                ui.openRecurrenceContext(
                                    e,
                                    task.recurrence && task.recurrence !== 'none' ? 'actions' : 'set',
                                    pos
                                );
                            }}
                        >
                            <div className="meta-row-label">
                                <RotateCw size={18} />
                                <span>Repeats</span>
                            </div>
                            <div className="meta-row-value">
                                <span className="value-placeholder">
                                    {task.recurrence && task.recurrence !== 'none' ? task.recurrence : 'Does not repeat'}
                                </span>
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
                            onChange={(e) => {
                                task.description = e.target.value;
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
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

            <DateTimePickerContext
                isOpen={ui.isContextMenuOpen}
                onClose={() => ui.setContextMenuOpen(false)}
                position={ui.contextPosition}
                selectedDate={task.scheduledDate}
                onSelect={(date) => {
                    task.scheduledDate = date;
                }}
                onRemoveTime={() => {
                    if (task.scheduledDate) {
                        task.scheduledDate = setHours(setMinutes(new Date(task.scheduledDate), 0), 0);
                    }
                }}
            />

            <TimeInputContext
                isOpen={ui.timeContext.isOpen}
                onClose={() => ui.closeTimeContext()}
                position={ui.timeContext.position}
                title={ui.timeContext.type === 'estimated' ? 'Set estimated time' : 'Set actual time'}
                initialDuration={ui.timeContext.type === 'estimated' ? task.duration : task.actualDuration}
                onSave={(duration) => {
                    if (ui.timeContext.type === 'estimated') {
                        task.duration = duration;
                    } else {
                        task.actualDuration = duration;
                    }
                }}
            />

            <CreateLabelContext
                isOpen={ui.labelContext.isOpen}
                onClose={() => ui.closeLabelContext()}
                position={ui.labelContext.position}
                onCreateLabel={(name) => {
                    task.labels.push(name);
                }}
            />

            {ui.recurrenceContext.mode === 'set' ? (
                <MakeRecurringTaskContext
                    isOpen={ui.recurrenceContext.isOpen}
                    onClose={() => ui.closeRecurrenceContext()}
                    position={ui.recurrenceContext.position}
                    selectedRecurrence={task.recurrence}
                    onSelectRecurrence={(type) => {
                        task.recurrence = type;
                        ui.closeRecurrenceContext();
                    }}
                />
            ) : (
                <RecurringTaskActionsContext
                    isOpen={ui.recurrenceContext.isOpen}
                    onClose={() => ui.closeRecurrenceContext()}
                    position={ui.recurrenceContext.position}
                    recurrenceDescription={task.recurrence}
                    onStopRepeating={() => {
                        task.recurrence = 'none';
                        ui.closeRecurrenceContext();
                    }}
                // Note: Update All and Delete All not fully implemented yet in basic Task model
                />
            )}
        </div>
    );
});

