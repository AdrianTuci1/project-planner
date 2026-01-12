import { ListSelectionContext } from "../ContextMenu/ListSelectionContext";
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import {
    Calendar,
    Clock,
    Tag,
    RotateCw,
    MoreVertical,
    Repeat,
    Copy,
    Link,
    Trash2
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';

import { DateTimePickerContext } from '../ContextMenu/DateTimePickerContext';
import { TimeInputContext } from '../ContextMenu/TimeInputContext';
import { LabelContext } from '../ContextMenu/LabelContext';
import { store } from '../../models/store';
import { MakeRecurringTaskContext } from '../ContextMenu/MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from '../ContextMenu/RecurringTaskActionsContext';
import { SubtaskList } from '../Shared/SubtaskList';
import { GroupList } from '../Shared/GroupList';
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
                            // Remove onClick from parent to avoid conflict with "Move to List" specifically?
                            // Or keep it as general context menu for the row.
                            // The user said: "Apasand pe (Move to list)". So specific click.
                            // But let's keep the general click for now or adjust.
                            // If we click "Move to List", we open the list selector.
                            // If we click elsewhere in the row, maybe date picker?
                            // The original code opened date picker on row click.
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
                            <div className="meta-row-value chip-style"> {/* Added chip-style class */}
                                <span className="value-main">
                                    {task.scheduledDate ? (() => {
                                        const dateStr = format(task.scheduledDate, 'EEEE, d MMM');
                                        if (task.scheduledTime) {
                                            const [h, m] = task.scheduledTime.split(':').map(Number);
                                            const timeDate = new Date();
                                            timeDate.setHours(h, m);
                                            return `${dateStr} ${format(timeDate, 'HH:mm')}`;
                                        }
                                        return dateStr;
                                    })() : 'No date set'}
                                </span>
                                <span
                                    className="value-sub clickable-sub" // Added clickable-sub class
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent opening date picker
                                        // Open GroupList popover
                                        // We need state for this in TaskUIModel or local state.
                                        // Since TaskUIModel isn't updated yet, let's use a local state wrapper or
                                        // ideally update TaskUIModel if we could.
                                        // But TaskModal is observer.
                                        // Let's use TaskUIModel for state.
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        ui.openListContext(e, { x: rect.left, y: rect.bottom + 4 });
                                    }}
                                >
                                    (Move to List)
                                </span>
                            </div>
                        </div>

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
                                    {task.labels.length > 0 ? (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {task.labels.map(labelId => {
                                                const label = store.getLabel(labelId);
                                                if (!label) return null;
                                                return (
                                                    <div key={labelId} className="tc-label-chip" style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        <div className="tc-label-dot" style={{ backgroundColor: label.color }} />
                                                        <span style={{ fontSize: '12px' }}>{label.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : 'Select a label'}
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
                        <SubtaskList task={task} autoFocusNew={ui.isSubtaskMode} />
                    </div>
                </div>
            </div>

            {/* Context Menu */}
            {ui.actionContext.isOpen && (
                <div
                    className="modal-overlay-transparent"
                    onClick={(e) => {
                        e.stopPropagation();
                        ui.closeActionContext();
                    }}
                >
                    <div
                        className="tc-context-menu"
                        style={{
                            top: ui.actionContext.position.y,
                            left: ui.actionContext.position.x
                        }}
                    >
                        <div className="context-item" onClick={() => {
                            store.duplicateTask(task);
                            ui.closeActionContext();
                        }}>
                            <Copy size={16} />
                            <span style={{ fontFamily: 'var(--font-primary)' }}>Duplicate</span>
                        </div>
                        <div className="context-divider" />
                        <div className="context-item delete" onClick={() => {
                            store.deleteTask(task.id);
                            ui.closeActionContext();
                            onClose();
                        }}>
                            <Trash2 size={16} />
                            <span style={{ fontFamily: 'var(--font-primary)' }}>Delete</span>
                        </div>
                    </div>
                </div>
            )}

            <DateTimePickerContext ui={ui} task={task} />

            <TimeInputContext ui={ui} task={task} />

            <LabelContext ui={ui} task={task} />

            {ui.recurrenceContext.mode === 'set' ? (
                <MakeRecurringTaskContext ui={ui} task={task} />
            ) : (
                <RecurringTaskActionsContext ui={ui} task={task} />
            )}

            {/* List Selection Context */}
            <ListSelectionContext ui={ui} task={task} />
        </div>
    );
});

