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
    Trash2,
    Timer
} from 'lucide-react';
import { TimeEntryContext } from '../../ContextMenu/TimeEntryContext';
import { ContextMenu, MenuItem } from '../../ContextMenu/ContextMenu';
import { LabelContext } from '../../ContextMenu/LabelContext';
import { MakeRecurringTaskContext } from '../../ContextMenu/MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from '../../ContextMenu/RecurringTaskActionsContext';
import { TaskUIModel } from '../../../models/TaskUIModel';
import { store } from '../../../models/store';
import { format, getHours, getMinutes } from 'date-fns';
import { SubtaskList } from '../../Shared/SubtaskList';
import './TaskCard.css';


const ActiveTimerDisplay = ({ startTime, accumulated }: { startTime: number | null, accumulated: number }) => {
    const [elapsed, setElapsed] = React.useState(accumulated);

    React.useEffect(() => {
        if (!startTime) {
            setElapsed(accumulated);
            return;
        }

        const update = () => {
            const now = Date.now();
            const currentRun = Math.floor((now - startTime) / 1000);
            setElapsed(accumulated + currentRun);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime, accumulated]);

    const format = (total: number) => {
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
            width: '100%',
            padding: '4px 8px', // Add some internal padding back since we removed container padding
            backgroundColor: '#374151', // Dark background like the image
            height: '28px', // Match button height roughly
            borderRadius: '4px',
        }}>
            <Timer size={14} />
            <span style={{ fontSize: '12px', fontWeight: 500 }}>
                Timer active ({format(elapsed)})
            </span>
        </div>
    );
};

export interface TaskCardBaseProps {
    task: Task;
    onTaskClick?: (task: Task) => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;

    // DnD props
    setNodeRef?: (node: HTMLElement | null) => void;
    attributes?: any;
    listeners?: any;
    isDragging?: boolean;
    isOverlay?: boolean;
}

export const TaskCardBase = observer(({
    task,
    onTaskClick,
    onDuplicate,
    onDelete,
    style,
    className,
    setNodeRef,
    attributes,
    listeners,
    isDragging,
    isOverlay
}: TaskCardBaseProps) => {
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

    const combinedStyle: React.CSSProperties = {
        ...style,
        ...style,
        // opacity: isDragging ? 0.3 : 1, // Handled by CSS .ghost class now
        touchAction: 'none',
        cursor: isOverlay ? 'grabbing' : 'grab',
        zIndex: isDragging || isOverlay ? 999 : undefined
    };

    // If it's the overlay, force hover state or specific styles
    if (isOverlay) {
        combinedStyle.cursor = 'grabbing';
        combinedStyle.opacity = 1;
        combinedStyle.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
        combinedStyle.scale = '1.02';
    }

    return (
        <>
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                tabIndex={0}
                className={`task-card ${ui.isHovered ? 'hovered' : ''} ${isDragging ? 'ghost' : ''} ${className || ''}`}
                style={combinedStyle}
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

                {(ui.isHovered || (task.labels && task.labels.length > 0) || (task.scheduledDate && task.scheduledTime)) && (
                    <div className="tc-footer">
                        {ui.isHovered ? (
                            <>
                                <div
                                    className="tc-label"
                                    onClick={(e) => ui.openLabelContext(e)}
                                >
                                    {task.labels && task.labels.length > 0 ? (
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {task.labels.map(labelId => {
                                                const label = store.getLabel(labelId);
                                                if (!label) return null;
                                                return (
                                                    <div key={labelId} className="tc-label-chip" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <div
                                                            className="tc-label-dot"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        {label.name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        "Select Label"
                                    )}
                                </div>
                                <div className="tc-actions">
                                    <Flag size={14} className="tc-action-icon" />
                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                                        onClick={(e) => { e.stopPropagation(); ui.setSubtaskMode(!ui.isSubtaskMode); }}
                                    >
                                        <Link2
                                            size={14}
                                            className="tc-action-icon"
                                        />
                                        {task.subtasks.length > 0 && (
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                                {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                                            </span>
                                        )}
                                    </div>
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
                                    <div className="tc-label" style={{ display: 'flex', gap: '4px' }}>
                                        {task.labels.map(labelId => {
                                            const label = store.getLabel(labelId);
                                            if (!label) return null;
                                            return (
                                                <div
                                                    key={labelId}
                                                    className="tc-label-dot"
                                                    style={{ backgroundColor: label.color }}
                                                    title={label.name}
                                                />
                                            );
                                        })}
                                        {task.labels.length === 1 && store.getLabel(task.labels[0])?.name}
                                    </div>
                                )}
                                {task.scheduledDate && task.scheduledTime && (
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                        {(() => {
                                            const [h, m] = task.scheduledTime.split(':').map(Number);
                                            const date = new Date();
                                            date.setHours(h, m);
                                            return format(date, 'h:mmaaa');
                                        })()}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {ui.isSubtaskMode && (
                    <>
                        <div className="tc-divider" />
                        <SubtaskList task={task} />
                    </>
                )}

                {(ui.isTimeExpanded || store.activeTimerTaskId === task.id) && (
                    <div className={store.activeTimerTaskId ? "tc-time-recording" : "tc-time-expanded"} onClick={e => e.stopPropagation()}>
                        {store.activeTimerTaskId === task.id ? (
                            <ActiveTimerDisplay startTime={store.timerStartTime} accumulated={store.timerAccumulatedTime} />
                        ) : (
                            <>
                                <div
                                    className="tc-play-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        store.startTimer(task.id);
                                    }}
                                >
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
                            </>
                        )}
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
                    task.labels = [label.id];
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
