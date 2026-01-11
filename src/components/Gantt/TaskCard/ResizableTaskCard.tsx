import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { format } from 'date-fns';
import { Check } from 'lucide-react';
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
    containerData
}: ResizableTaskCardProps) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `calendar-${task.id}`,
        data: {
            type: 'task',
            task: task,
            origin: 'calendar',
            containerData
        }
    });

    // Determine background color
    const backgroundColor = task.labels.length > 0 ? store.getLabelColor(task.labels[0]) : '#e6c581ff';

    // Merge styles
    const combinedStyle: React.CSSProperties = {
        ...style,
        backgroundColor,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Recommended for dnd-kit
        cursor: 'grab',
        ...style, // allow override
    };

    // Font size logic based on height (approximated by duration usually, but here relies on parent styling or explicit height)
    // We'll trust the parent 'style' passed in contains height/width/top etc.

    return (
        <div
            ref={setNodeRef}
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
