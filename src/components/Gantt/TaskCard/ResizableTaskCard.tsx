import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { format } from 'date-fns';
import './TaskCard.css';

interface ResizableTaskCardProps {
    task: Task;
    onTaskClick?: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;
    // We might need these for resize logic if handled internally or via props
    onResizeStart?: (e: React.MouseEvent | React.TouchEvent) => void;
    containerData?: any;
}

export const ResizableTaskCard = observer(({
    task,
    onTaskClick,
    style,
    className,
    onResizeStart,
    containerData,
    dragPrefix // New prop for namespacing (e.g. 'timebox')
}: ResizableTaskCardProps & { dragPrefix?: string }) => {
    // Determine unique ID based on context. Default to 'calendar' for backward compat in CalendarView.
    // Ideally update CalendarView to pass 'calendar' prefix explicitly too.
    const prefix = dragPrefix || (containerData?.type === 'timebox-slot' ? 'timebox' : 'calendar');
    const draggableId = `${prefix}-${task.id}`;

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: draggableId,
        data: {
            type: 'task',
            task: task,
            origin: prefix, // Pass origin matches prefix
            containerData
        }
    });

    // Determine background color
    const backgroundColor = task.labels.length > 0 ? store.getLabelColor(task.labels[0]) : '#e6c581ff';

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
        setColWidth(parent.offsetWidth);

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
                // Inside deadzone -> Lock to column center (0)
                x = 0;
            } else {
                // Outside deadzone -> Snap to nearest column grid
                x = Math.round(x / snapStepX) * snapStepX;
            }
        }
    }

    const snappedTransform = transform ? {
        ...transform,
        x,
        y
    } : null;

    // Merge styles
    const combinedStyle: React.CSSProperties = {
        ...style,
        backgroundColor,
        transform: CSS.Translate.toString(snappedTransform),
        opacity: 1, // Always solid as requested
        zIndex: isDragging ? 100 : (style?.zIndex ?? 1), // Boost Z when dragging
        boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.25)' : undefined, // "Snappy" lift effect
        touchAction: 'none', // Recommended for dnd-kit
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: isDragging ? 'none' : 'auto', // Allow dropping "through" the card onto the slot
        ...style,
    };

    // Ensure override doesn't kill the drag visuals
    if (isDragging) {
        combinedStyle.zIndex = 100;
    }

    // Attach ref to listeners or element? 
    // attributes & listeners go to the div. We also need our measureRef.
    // We can merge refs.
    const setRefs = (node: HTMLDivElement | null) => {
        setNodeRef(node);
        // @ts-ignore
        measureRef.current = node;
    };

    // Font size logic based on height (approximated by duration usually, but here relies on parent styling or explicit height)
    // We'll trust the parent 'style' passed in contains height/width/top etc.

    return (
        <div
            ref={setRefs}
            style={combinedStyle}
            className={`calendar-event ${task.status === 'done' ? 'completed' : ''} ${className || ''}`}
            onClick={(e) => {
                onTaskClick?.(task);
            }}
            {...listeners}
            {...attributes}
        >
            <div className="event-content-wrapper">
                <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onClick={(e) => e.stopPropagation()} // dependent on mouse events
                    onChange={(e) => {
                        task.toggleStatus();
                    }}
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on checkbox
                    className="task-checkbox"
                />
                <div className="event-details">
                    <div className="event-title" style={{ fontSize: style?.fontSize }}>{task.title}</div>
                    {(task.duration || 0) > 20 && task.scheduledDate && (
                        <div className="event-time" style={{ fontSize: `calc(${style?.fontSize || '12px'} - 1px)` }}>
                            {format(task.scheduledDate, 'h:mm')}
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
        </div>
    );
});
