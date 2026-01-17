
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../../models/core';
import { TaskCardBase } from './TaskCardBase';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TemplateTaskCardProps {
    task: Task;
    style?: React.CSSProperties;
}

export const TemplateTaskCard = observer(({ task, style }: TemplateTaskCardProps) => {
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
            type: 'template',
            origin: 'templates-view'
        }
    });

    const dndStyle = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Custom style to match the "Task Template" look
    // The user image shows a dark "Task Template" header area.
    // We can wrap TaskCardBase or just style it.
    // Let's wrap it to reuse the layout but inject styles.

    const templateStyle: React.CSSProperties = {
        ...style,
        ...dndStyle,
        opacity: isDragging ? 0.5 : 1,
        border: isDragging ? '1px dashed #A78BFA' : '1px solid transparent', // distinct visual for drag
    };

    return (
        <div ref={setNodeRef} style={templateStyle} {...attributes} {...listeners}>
            {/* We can overlay a header like the image if we want, or just rely on TaskCardBase structure with CSS overrides */}
            {/* The image shows "TASK TEMPLATE" as a header ON TOP of the card content? Or is that string part of the image? */}
            {/* It looks like a ribbon or header. Let's add a small header div above or inside. */}

            <div className="template-card-wrapper" style={{
                position: 'relative',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '6px',
                overflow: 'hidden'
            }}>
                <TaskCardBase
                    task={task}
                    isDragging={isDragging}
                    style={{ border: 'none', background: 'transparent' }}
                // We might need to disable some interactions like completion check?
                // TaskCardBase checks toggle status on click. Maybe we should disable that for templates.
                // But TaskCardBase doesn't have "readOnly" prop. 
                // For now, let it be. Completing a template in the list might be weird but acceptable MVP.
                />
            </div>
        </div>
    );
});
