import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { GhostTaskCard } from './GhostTaskCard';
import { CreatingTaskCard } from './CreatingTaskCard';
import { StandardTaskCard } from './StandardTaskCard';
import './TaskCard.css';

export interface TaskCardProps {
    task?: Task;
    isGhost?: boolean;
    isCreating?: boolean;
    onAddClick?: () => void;
    onTaskClick?: (task: Task) => void;
    onCreate?: (title: string) => void;
    onCancel?: () => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    style?: React.CSSProperties;
    className?: string;
}

export const TaskCard = observer(({
    task,
    isGhost,
    isCreating,
    onAddClick,
    onTaskClick,
    onCreate,
    onCancel,
    onDuplicate,
    onDelete,
    style,
    className
}: TaskCardProps) => {

    if (isGhost) {
        return <GhostTaskCard onAddClick={onAddClick} />;
    }

    if (isCreating) {
        return (
            <CreatingTaskCard
                onCreate={onCreate}
                onCancel={onCancel}
                style={style}
                className={className}
            />
        );
    }

    if (!task) return null;

    return (
        <StandardTaskCard
            task={task}
            onTaskClick={onTaskClick}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            style={style}
            className={className}
        />
    );
});
