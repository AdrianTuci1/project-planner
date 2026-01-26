import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { format, addMinutes } from 'date-fns';
import { Check } from 'lucide-react';
import './TaskCard.css';
import { TaskContextMenu } from './TaskContextMenu';
import { CalendarEventCard } from './CalendarEventCard';

interface ResizableTaskCardProps {
    task: Task;
    onTaskClick?: (task: Task, e?: React.MouseEvent) => void;
    style?: React.CSSProperties;
    className?: string;
    // We might need these for resize logic if handled internally or via props
    onResizeStart?: (e: React.MouseEvent | React.TouchEvent) => void;
    containerData?: any;
    isCalendarEvent?: boolean;
}

// Separated View Component for use in DragOverlay
export const ResizableTaskCardView = observer(({
    task,
    onTaskClick,
    style,
    className,
    onResizeStart,
    setNodeRef,
    attributes,
    listeners,
    isDragging,
    completedStyle,
    measureRef,
    contextMenu,
    handleContextMenu,
    handleCloseContextMenu,
    handleMarkAsComplete,
    handleDuplicate,
    handleRemoveFromTimebox,
    handleDelete,
    startTime,
    endTime,
}: any) => {
    const isSmallTask = (task.duration || 15) <= 15;

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, ...completedStyle }}
            className={`task-card ${className || ''}`}
            onClick={(e) => {
                onTaskClick?.(task);
            }}
            onContextMenu={handleContextMenu}
            {...listeners}
            {...attributes}
        >

            <div className="tc-header" style={{ gap: '6px', alignItems: isSmallTask ? 'center' : 'flex-start', height: '100%', overflow: 'hidden', padding: isSmallTask ? '0' : undefined }}>
                <div className="tc-checkbox-wrapper" style={{ flexShrink: 0, paddingTop: isSmallTask ? '0' : '2px' }}>
                    <div
                        className={`tc-checkbox ${task.status === 'done' ? 'checked' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            store.taskStore.toggleTaskCompletion(task);
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                            width: (task.duration || 15) <= 15 ? '12px' : '14px',
                            height: (task.duration || 15) <= 15 ? '12px' : '14px',
                            borderColor: '#000' // Ensure checkmark border is visible/black
                        }}
                    >
                        {task.status === 'done' && <Check size={(task.duration || 15) <= 15 ? 8 : 10} style={{ color: '#fff' }} />}
                    </div>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: isSmallTask ? 'center' : 'flex-start', paddingTop: isSmallTask ? '0' : '1px' }}>
                    <div
                        className="tc-title"
                        style={{
                            // Dynamic font size based on duration passed via style prop, or calculate locally
                            fontSize: (task.duration || 15) <= 15 ? '10px' : '11px',
                            marginBottom: 0,
                            color: '#000',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            fontWeight: 600,
                            lineHeight: 1.1
                        }}
                    >
                        {task.title}
                    </div>

                    {(task.duration || 0) >= 30 && task.scheduledDate && (
                        <div style={{
                            fontSize: '9px',
                            color: 'rgba(0,0,0,0.7)',
                            marginTop: '2px',
                            lineHeight: 1
                        }}>
                            {startTime} - {endTime}
                        </div>
                    )}
                </div>
            </div>

            {/* Resize Handle */}
            <div
                className="resize-handle"
                onPointerDown={(e) => {
                    e.stopPropagation(); // Prevent drag
                    onResizeStart?.(e);
                }}
            />

            {/* Hidden Measure Ref */}
            <div ref={measureRef} style={{ display: 'none' }} />

            <TaskContextMenu
                isOpen={!!contextMenu}
                onClose={handleCloseContextMenu}
                position={contextMenu || { x: 0, y: 0 }}
                task={task}
                onMarkAsComplete={handleMarkAsComplete}
                onDuplicate={handleDuplicate}
                onRemoveFromTimebox={handleRemoveFromTimebox}
                onDelete={handleDelete}
            />
        </div >
    );
});

export const ResizableTaskCard = observer(({
    task,
    onTaskClick,
    style,
    className,
    onResizeStart,
    containerData,
    dragPrefix, // New prop for namespacing (e.g. 'timebox')
    isCalendarEvent: propIsCalendarEvent
}: ResizableTaskCardProps & { dragPrefix?: string }) => {
    // Determine unique ID based on context.
    const prefix = dragPrefix || (containerData?.type === 'timebox-slot' ? 'timebox' : 'calendar');
    const draggableId = `${prefix}-${task.id}`;

    // Determine if it is a calendar event (prop priority > id check > task property)
    const isCalendarEvent = propIsCalendarEvent ?? (task.id.startsWith('evt_') || (task as any).isCalendarEvent);

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: draggableId,
        data: {
            type: 'task',
            task: task,
            origin: prefix,
            containerData,
            isCalendarEvent // Pass this data along
        }
    });

    // Determine background color
    // If it's a calendar event, we'll let CSS handle the specific override via class, 
    // but we can provide a fallback here.
    const backgroundColor = isCalendarEvent
        ? '#1e293b' // Fallback matte blue
        : (task.labelId ? store.getLabelColor(task.labelId) : '#e6c581ff');

    // ... (rest of resize/measure logic) ...
    // Measure column width for horizontal snapping
    const [colWidth, setColWidth] = React.useState(0);
    const measureRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!measureRef.current?.parentElement) return;

        const parent = measureRef.current.parentElement;
        const resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                if (entry.contentBoxSize) {
                    setColWidth(entry.contentRect.width);
                }
            }
        });

        // Measure initially
        if (parent) {
            setColWidth(parent.offsetWidth);
        }

        // Observe
        resizeObserver.observe(parent);

        return () => resizeObserver.disconnect();
    }, []);

    // Snap to grid logic
    const snapStepY = 25; // 15 mins
    const snapStepX = colWidth || 1; // Default to 1 (no snap) if 0 to avoid NaN
    const stickyThreshold = 75; // Pixels to move before unlocking horizontal drag

    let x = transform ? transform.x : 0;
    let y = transform ? transform.y : 0;

    if (transform) {
        y = Math.round(y / snapStepY) * snapStepY;

        if (colWidth > 0) {
            // Horizontal Sticky Logic
            if (Math.abs(x) < stickyThreshold) {
                x = 0;
            } else {
                x = Math.round(x / snapStepX) * snapStepX;
            }
        }
    }

    const snappedTransform = transform ? {
        ...transform,
        x,
        y
    } : null;

    const isGlobalDragging = store.draggingTaskId === task.id;
    const effectiveIsDragging = isDragging || isGlobalDragging;

    const combinedStyle: React.CSSProperties = {
        ...style,
        backgroundColor: isCalendarEvent ? undefined : backgroundColor, // Let CSS override for calendar events
        transform: CSS.Translate.toString(snappedTransform),
        opacity: 1,
        zIndex: (style?.zIndex ?? 1),
        boxShadow: undefined,
        touchAction: 'none',
        cursor: effectiveIsDragging ? 'grabbing' : 'grab',
        pointerEvents: effectiveIsDragging ? 'none' : 'auto',
        ...style,
    };

    const { isOver: isOverDroppable, setNodeRef: setDroppableRef } = useDroppable({
        id: draggableId,
        data: {
            ...containerData,
            isTaskProxy: true
        }
    });

    const setRefs = (node: HTMLElement | null) => {
        setNodeRef(node);
        setDroppableRef(node);
        // @ts-ignore
        measureRef.current = node;
    };

    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isCalendarEvent) return; // Disable context menu for calendar events

        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: rect.left - 210,
            y: rect.top
        });
    };


    const handleCloseContextMenu = () => {
        setContextMenu(null);
    };

    const handleMarkAsComplete = () => {
        store.taskStore.toggleTaskCompletion(task);
    };

    const handleDuplicate = () => {
        store.duplicateTask(task);
    };

    const handleRemoveFromTimebox = () => {
        task.scheduledTime = undefined;
    };

    const handleDelete = () => {
        store.deleteTask(task.id);
    };

    const completedStyle: React.CSSProperties = task.status === 'done' ? {
        // "Decolorize a little" without losing opacity. 
        // Desaturate and slightly brighten to look "washed out" but solid.
        filter: 'saturate(0.7) brightness(0.7)',
    } : {};

    const startTime = task.scheduledDate ? format(task.scheduledDate, 'h:mm') : '';
    const endTime = task.scheduledDate ? format(addMinutes(task.scheduledDate, task.duration || 15), 'h:mm') : '';

    if (isCalendarEvent) {
        return (
            <CalendarEventCard
                event={task}
                style={combinedStyle}
                className={className}
                onClick={(e) => onTaskClick?.(task, e)}
                setNodeRef={setRefs}
                attributes={attributes}
                listeners={listeners}
                onResizeStart={onResizeStart}
            />
        );
    }

    return (
        <ResizableTaskCardView
            task={task}
            onTaskClick={onTaskClick}
            style={combinedStyle}
            className={className}
            onResizeStart={onResizeStart}
            setNodeRef={setRefs}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
            completedStyle={completedStyle}
            measureRef={measureRef}
            contextMenu={contextMenu}
            handleContextMenu={handleContextMenu}
            handleCloseContextMenu={handleCloseContextMenu}
            handleMarkAsComplete={handleMarkAsComplete}
            handleDuplicate={handleDuplicate}
            handleRemoveFromTimebox={handleRemoveFromTimebox}
            handleDelete={handleDelete}
            startTime={startTime}
            endTime={endTime}
        />
    );
});
