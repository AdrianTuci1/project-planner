import React from 'react';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import { ContextMenu, MenuItem } from './ContextMenu';
import { Flag } from 'lucide-react';

interface PriorityContextProps {
    ui: TaskUIModel;
    task: Task;
}

import { observer } from 'mobx-react-lite';

export const PriorityContext: React.FC<PriorityContextProps> = observer(({ ui, task }) => {
    const handleSelectPriority = (priority: 'high' | 'medium' | 'low' | 'none') => {
        task.priority = priority;
        ui.closePriorityContext();
    };

    return (
        <ContextMenu
            isOpen={ui.priorityContext.isOpen}
            onClose={() => ui.closePriorityContext()}
            position={ui.priorityContext.position}
        >
            <MenuItem
                icon={<Flag size={14} color="#EF4444" fill="#EF4444" />}
                label="High"
                onClick={() => handleSelectPriority('high')}
                checkmark={task.priority === 'high'}
            />
            <MenuItem
                icon={<Flag size={14} color="#F97316" fill="#F97316" />}
                label="Medium"
                onClick={() => handleSelectPriority('medium')}
                checkmark={task.priority === 'medium'}
            />
            <MenuItem
                icon={<Flag size={14} color="#3B82F6" fill="#3B82F6" />}
                label="Low"
                onClick={() => handleSelectPriority('low')}
                checkmark={task.priority === 'low'}
            />
            <div className="context-divider" />
            <MenuItem
                icon={<Flag size={14} />}
                label="None"
                onClick={() => handleSelectPriority('none')}
                checkmark={task.priority === 'none'}
            />
        </ContextMenu>
    );
});
