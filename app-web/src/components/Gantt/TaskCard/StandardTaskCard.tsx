import React, { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../models/core';
import { TaskCardBase } from './TaskCardBase';

interface StandardTaskCardProps {
    task: Task;
    onTaskClick?: (task: Task) => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;
}

export const StandardTaskCard = observer(({
    task,
    onTaskClick,
    onDuplicate,
    onDelete,
    style,
    className
}: StandardTaskCardProps) => {

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: {
            type: 'task',
            task: task,
            origin: 'standard'
        }
    });

    const combinedStyle: React.CSSProperties = {
        ...style,
        transform: CSS.Translate.toString(transform),
    };

    return (
        <TaskCardBase
            task={task}
            onTaskClick={onTaskClick}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            style={combinedStyle}
            className={className}
            setNodeRef={setNodeRef}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
        />
    );
});
