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
    Trash2,
    Flag
} from 'lucide-react';
import { format, startOfDay } from 'date-fns';

import { DateTimePickerContext } from '../ContextMenu/DateTimePickerContext';
import { TimeInputContext } from '../ContextMenu/TimeInputContext';
import { LabelContext } from '../ContextMenu/LabelContext';
import { store } from '../../models/store';
import { MakeRecurringTaskContext } from '../ContextMenu/MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from '../ContextMenu/RecurringTaskActionsContext';
import { PriorityContext } from '../ContextMenu/PriorityContext';
import { SubtaskList } from '../Shared/SubtaskList';
import { GroupList } from '../Shared/GroupList';
import './TaskModal.css';
import { AttachmentsSection } from './Attachments/AttachmentsSection';

interface TaskModalProps {
    task: Task;
    onClose: () => void;
}

export const TaskModal = observer(({ task, onClose }: TaskModalProps) => {
    const [ui] = useState(() => new TaskUIModel()); // Local UI model for the modal? 
    // Actually main UIStore has the state. 
    // But this 'ui' variable seems to be a local TaskUIModel instance based on line 37.
    // Let's check imports.
    // Access global 'store.ui' for isTemplateCreationMode.

    // We need to check if it's a template OR if we are in template creation mode.
    const isTemplate = store.templates.some(t => t.id === task.id) || store.isTemplateCreationMode;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="task-card-modal" onClick={e => e.stopPropagation()}>
                {/* Template Banner */}
                {isTemplate && (
                    <div style={{
                        background: 'repeating-linear-gradient(45deg, #1f2937, #1f2937 10px, #374151 10px, #374151 20px)',
                        color: '#A78BFA',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 500,
                        borderBottom: '1px solid #374151',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px'
                    }}>
                        You are editing a task template
                    </div>
                )}

                {/* Header Section */}
                <div className="tc-header-new" style={isTemplate ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined}>
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
                                const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                ui.openDatePicker(e, 'scheduled', pos);
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

                        {/* Due Date - Conditional */}
                        {store.settings.powerFeatures.dueDatesEnabled && (
                            <div
                                className="meta-row"
                                onClick={(e) => {
                                    const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                    const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                    ui.openDatePicker(e, 'due', pos);
                                }}
                            >
                                <div className="meta-row-label">
                                    <Calendar size={18} className="text-red-500" /> {/* Distinguish with color? */}
                                    <span>Due Date</span>
                                </div>
                                <div className="meta-row-value chip-style">
                                    <span className="value-main">
                                        {task.dueDate ? format(task.dueDate, 'd MMM yyyy') : 'Set due date'}
                                    </span>
                                </div>
                            </div>
                        )}

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

                        {/* Priority */}
                        {store.settings.powerFeatures.taskPriorityEnabled && (
                            <div
                                className="meta-row"
                                onClick={(e) => {
                                    const valueEl = e.currentTarget.querySelector('.meta-row-value');
                                    const pos = valueEl ? { x: valueEl.getBoundingClientRect().left, y: valueEl.getBoundingClientRect().bottom + 4 } : undefined;
                                    ui.openPriorityContext(e, pos);
                                }}
                            >
                                <div className="meta-row-label">
                                    {(() => {
                                        const color = task.priority === 'high' ? '#EF4444' :
                                            task.priority === 'medium' ? '#F97316' :
                                                task.priority === 'low' ? '#3B82F6' : undefined;
                                        return <Flag size={18} color={color} fill={color || 'none'} />;
                                    })()}
                                    <span>Priority</span>
                                </div>
                                <div className="meta-row-value">
                                    <span className="value-main" style={{ textTransform: 'capitalize' }}>
                                        {task.priority || 'None'}
                                    </span>
                                </div>
                            </div>
                        )}

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

                    {store.settings.powerFeatures.attachmentsEnabled && (
                        <AttachmentsSection task={task} />
                    )}

                    {isTemplate && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px',
                            marginTop: '24px',
                            paddingTop: '16px',
                            borderTop: '1px solid var(--border)'
                        }}>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 500
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (store.isTemplateCreationMode) {
                                        store.taskStore.addTemplate(task);
                                    }
                                    onClose();
                                }}
                                style={{
                                    backgroundColor: '#A78BFA',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#1F2937',
                                    padding: '6px 16px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: 600
                                }}
                            >
                                {store.isTemplateCreationMode ? 'Create Template' : 'Update Template'}
                            </button>
                        </div>
                    )}
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

            <PriorityContext ui={ui} task={task} />

            {/* List Selection Context */}
            <ListSelectionContext ui={ui} task={task} />
        </div>
    );
});

