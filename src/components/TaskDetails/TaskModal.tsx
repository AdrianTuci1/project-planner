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
                                <span className="value-sub">(Move to List)</span>
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
                selectedDate={(() => {
                    if (!task.scheduledDate) return undefined;
                    const d = new Date(task.scheduledDate);
                    if (task.scheduledTime) {
                        const [h, m] = task.scheduledTime.split(':').map(Number);
                        d.setHours(h, m);
                    }
                    return d;
                })()}
                onSelect={(date) => {
                    const h = date.getHours();
                    const m = date.getMinutes();
                    // If the picker returns a time component, or if we already had a time and preserving it (handled by picker logic),
                    // we update the time string.
                    // Special case: If 00:00, we treat it as specific time "00:00" ONLY if scheduledTime was already set or we are explicitly in time mode?
                    // Actually, let's trust the picker. If it sends hours/mins, we use them.

                    // We need to decouple the Date (midnight) from the Time string.
                    const newDate = new Date(date);
                    newDate.setHours(0, 0, 0, 0);

                    if (h !== 0 || m !== 0) {
                        // Explicit time set
                        const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                        task.setScheduling(newDate, timeStr);
                    } else {
                        // Midnight value.
                        // If we are coming from a time-change (e.g. set to 12:00 AM), we want to keep it as time "00:00".
                        // If we are just picking a date (which defaults to midnight), we might want to KEEP existing time.

                        // BUT, DateTimePickerContext's handleDateClick preserves existing time.
                        // So if we receive 00:00, it means either:
                        // A) Exisiting time was 00:00 (or undefined)
                        // B) User explicitly set 12:00 AM

                        // Let's assume if we are receiving this onSelect, checking if we originally had a time matches best.
                        if (task.scheduledTime) {
                            // If we had a time, and we got 00:00, it effectively means "00:00".
                            task.setScheduling(newDate, "00:00");
                        } else {
                            // No previous time, and got 00:00 => Date only.
                            task.setScheduling(newDate, undefined);
                        }
                    }
                }}
                onRemoveTime={() => {
                    if (task.scheduledDate) {
                        task.setScheduling(task.scheduledDate, undefined);
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

            <LabelContext
                isOpen={ui.labelContext.isOpen}
                onClose={() => ui.closeLabelContext()}
                position={ui.labelContext.position}
                labels={store.availableLabels}
                recentLabels={store.availableLabels.slice(0, 3)}
                onSelectLabel={(label) => {
                    task.labels = [label.id];
                    ui.closeLabelContext();
                }}
                onCreateLabel={(name, color) => {
                    const newLabel = store.addLabel(name, color);
                    task.labels = [newLabel.id];
                    ui.closeLabelContext();
                }}
            />

            {ui.recurrenceContext.mode === 'set' ? (
                <MakeRecurringTaskContext
                    isOpen={ui.recurrenceContext.isOpen}
                    onClose={() => ui.closeRecurrenceContext()}
                    position={ui.recurrenceContext.position}
                    selectedRecurrence={task.recurrence}
                    hasSpecificTime={!!task.scheduledTime}
                    specificTime={(() => {
                        if (task.scheduledTime) {
                            const [h, m] = task.scheduledTime.split(':').map(Number);
                            const d = new Date();
                            d.setHours(h, m);
                            return format(d, 'h:mm a');
                        }
                        return '9:00 AM';
                    })()}
                    onSelectRecurrence={(type) => {
                        task.recurrence = type;
                        ui.closeRecurrenceContext();
                    }}
                    onToggleSpecificTime={(enabled) => {
                        if (!enabled) {
                            if (task.scheduledDate) {
                                task.setScheduling(task.scheduledDate, undefined);
                            }
                        } else {
                            const d = task.scheduledDate ? new Date(task.scheduledDate) : startOfDay(new Date());
                            d.setHours(0, 0, 0, 0);
                            task.setScheduling(d, "09:00");
                        }
                    }}
                    onChangeTime={(timeStr) => {
                        const [time, period] = timeStr.split(' ');
                        const [hoursStr, minutesStr] = time.split(':');
                        let hours = parseInt(hoursStr);
                        const minutes = parseInt(minutesStr);
                        if (period === 'PM' && hours < 12) hours += 12;
                        if (period === 'AM' && hours === 12) hours = 0;

                        const newTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                        task.setScheduling(task.scheduledDate, newTime);
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

