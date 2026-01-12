import { observer } from 'mobx-react-lite';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../../models/core';
import { TaskCardBase } from './TaskCardBase';

interface SortableTaskCardProps {
    task: Task;
    onTaskClick?: (task: Task) => void;
    onDuplicate?: (task: Task) => void;
    onDelete?: (task: Task) => void;
    className?: string;
    containerData?: any;
}

export const SortableTaskCard = observer(({
    task,
    onTaskClick,
    onDuplicate,
    onDelete,
    className,
    containerData
}: SortableTaskCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task.id,
        data: {
            type: 'task',
            task: task,
            origin: 'sortable',
            containerData
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TaskCardBase
            task={task}
            onTaskClick={onTaskClick}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            className={className}
            setNodeRef={setNodeRef}
            attributes={attributes}
            listeners={listeners}
            isDragging={isDragging}
            style={style}
        />
    );
});
