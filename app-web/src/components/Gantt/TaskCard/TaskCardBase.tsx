import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { format, differenceInDays, isTomorrow, isYesterday, isToday } from 'date-fns';
import {
    Check,
    Flag,
    Link2,
    RotateCw,
    Play,
    Copy,
    Trash2,
    Timer,
    Paperclip,
    Target
} from 'lucide-react';
import { TimeEntryContext } from '../../ContextMenu/TimeEntryContext';
import { ContextMenu, MenuItem } from '../../ContextMenu/ContextMenu';
import { LabelContext } from '../../ContextMenu/LabelContext';
import { MakeRecurringTaskContext } from '../../ContextMenu/MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from '../../ContextMenu/RecurringTaskActionsContext';
import { PriorityContext } from '../../ContextMenu/PriorityContext';
import { TaskUIModel } from '../../../models/TaskUIModel';
import { store } from '../../../models/store';
import { SubtaskList } from '../../Shared/SubtaskList';
import { TaskContextMenu } from './TaskContextMenu';
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
    containerData?: any; // Add containerData prop
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
    isOverlay,
    containerData
}: TaskCardBaseProps) => {
    const ui = useMemo(() => new TaskUIModel(), []);

    // Check if it's a template
    const isTemplate = store.templates.some(t => t.id === task.id);

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

    const isAnyContextOpen = ui.isSubtaskMode ||
        ui.timeContext.isOpen ||
        ui.labelContext.isOpen ||
        ui.recurrenceContext.isOpen ||
        ui.priorityContext.isOpen ||
        ui.actionContext.isOpen;

    return (
        <>
            <div
                ref={setNodeRef}
                {...listeners}
                {...attributes}
                tabIndex={0}
                className={`task-card ${ui.isHovered || isAnyContextOpen ? 'hovered' : ''} ${isDragging ? 'ghost' : ''} ${className || ''}`}
                style={{ ...combinedStyle, paddingBottom: isTemplate ? '0' : undefined, overflow: 'hidden' }} // Adjust padding/overflow for badge
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

                {(ui.isHovered || isAnyContextOpen || task.labelId || (task.scheduledDate && task.scheduledTime) || (task.dueDate) || (task.attachments && task.attachments.length > 0) || (task.priority !== 'none') || (task.subtasks.length > 0) || (task.recurrence && task.recurrence !== 'none')) && (
                    <div className="tc-footer">
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', width: '100%' }}>

                            {/* Labels */}
                            <div
                                className={`tc-label ${!task.labelId ? 'footer-reveal-item' : ''}`}
                                onClick={(e) => ui.openLabelContext(e)}
                                style={{ padding: 0, height: 'auto' }}
                            >
                                {task.labelId ? (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {(() => {
                                            const label = store.getLabel(task.labelId);
                                            if (!label) return null;
                                            return (
                                                <div key={label.id} className="tc-label-chip" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <div
                                                        className="tc-label-dot"
                                                        style={{ backgroundColor: label.color }}
                                                    />
                                                    {label.name}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>Select Label</span>
                                )}
                            </div>

                            {/* Priority */}
                            <div
                                className={`tc-action-icon ${task.priority === 'none' ? 'footer-reveal-item' : ''}`}
                                style={{ cursor: 'pointer', display: 'flex' }}
                                onClick={(e) => ui.openPriorityContext(e)}
                            >
                                <Flag
                                    size={14}
                                    className={task.priority !== 'none' ? 'active' : ''}
                                    style={{
                                        color: task.priority === 'high' ? '#EF4444' :
                                            task.priority === 'medium' ? '#F97316' :
                                                task.priority === 'low' ? '#3B82F6' : undefined,
                                        fill: task.priority === 'high' ? '#EF4444' :
                                            task.priority === 'medium' ? '#F97316' :
                                                task.priority === 'low' ? '#3B82F6' : 'none'
                                    }}
                                />
                            </div>

                            {/* Scheduled Time */}
                            {task.scheduledDate && task.scheduledTime && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 11, color: 'var(--text-muted)' }}>
                                    {(() => {
                                        const [h, m] = task.scheduledTime.split(':').map(Number);
                                        const date = new Date();
                                        date.setHours(h, m);
                                        return format(date, 'h:mmaaa');
                                    })()}
                                </div>
                            )}

                            {/* Subtasks */}
                            <div
                                className={`${task.subtasks.length === 0 ? 'footer-reveal-item' : ''}`}
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

                            {/* Recurrence */}
                            <div className={`${(!task.recurrence || task.recurrence === 'none') ? 'footer-reveal-item' : ''}`}>
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

                            {/* Attachments */}
                            {task.attachments && task.attachments.length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                    <Paperclip size={12} />
                                    <span>{task.attachments.length}</span>
                                </div>
                            )}

                            {/* Due Date */}
                            {task.dueDate && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '11px' }}>
                                    <Target size={12} />
                                    <span>
                                        {(() => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const due = new Date(task.dueDate);
                                            due.setHours(0, 0, 0, 0);

                                            if (isToday(due)) return "Due today";
                                            if (isTomorrow(due)) return "Due tomorrow";
                                            if (isYesterday(due)) return "Due yesterday";

                                            const days = differenceInDays(due, today);
                                            if (days > 0) return `Due in ${days} days`;
                                            return `Due ${Math.abs(days)} days ago`;
                                        })()}
                                    </span>
                                </div>
                            )}
                        </div>
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
                {isTemplate && (
                    <div style={{
                        background: 'repeating-linear-gradient(45deg, #1f2937, #1f2937 10px, #374151 10px, #374151 20px)',
                        color: '#A78BFA',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        padding: '4px',
                        letterSpacing: '0.5px',
                        borderTop: '1px solid #374151',
                        borderBottomLeftRadius: '6px',
                        borderBottomRightRadius: '6px',
                        marginTop: 'auto', // Push to bottom
                        width: 'calc(100% + 12px)', // Stretch full width: 100% + left + right padding (6+6)
                        marginLeft: '-6px', // Counteract left padding
                        marginBottom: '-2px' // Counteract bottom padding (if not removed) or 0
                    }}>
                        TASK TEMPLATE
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

            <LabelContext ui={ui} task={task} />

            {ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'set' && (
                <MakeRecurringTaskContext ui={ui} task={task} />
            )}

            {ui.recurrenceContext.isOpen && ui.recurrenceContext.mode === 'actions' && (
                <RecurringTaskActionsContext ui={ui} task={task} />
            )}

            <PriorityContext ui={ui} task={task} />

            <TaskContextMenu
                isOpen={ui.actionContext.isOpen}
                onClose={() => ui.closeActionContext()}
                position={ui.actionContext.position}
                task={task}
                onMarkAsComplete={() => task.toggleStatus()}
                onDuplicate={() => onDuplicate?.(task)}
                onRemoveFromTimebox={() => task.setScheduling(undefined, undefined)}
                onRemoveFromList={() => store.moveTaskToInbox(task.id)}
                onDelete={() => onDelete?.(task)}
            />

        </>
    );
});
