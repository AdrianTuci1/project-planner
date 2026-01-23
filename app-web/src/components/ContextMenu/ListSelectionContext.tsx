import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import { store } from '../../models/store';
import { ContextMenu, MenuItem, MenuSeparator } from './ContextMenu';
import { Plus } from 'lucide-react';
import { CreateListModal } from '../Sidebar/CreateListModal';

interface ListSelectionContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const ListSelectionContext = observer(({
    ui,
    task
}: ListSelectionContextProps) => {
    const [showCreateList, setShowCreateList] = useState(false);

    if (!ui.listContext.isOpen && !showCreateList) return null;

    // Determine current state
    const currentGroupId = task.groupId;
    const isTaskInInbox = store.dumpAreaTasks.some(t => t.id === task.id) && !task.scheduledDate;



    const handleSelectGroup = (groupId: string | null) => {
        // "Manual" Move Logic
        const currentGroup = store.groups.find(g => g.tasks.includes(task));
        const isDump = store.dumpAreaTasks.includes(task);

        // Remove from current
        if (currentGroup) {
            currentGroup.removeTask(task.id);
        } else if (isDump) {
            const index = store.dumpAreaTasks.indexOf(task);
            if (index > -1) store.dumpAreaTasks.splice(index, 1);
        }

        // Add to new
        const targetGroupId = groupId === 'default' ? null : groupId;
        task.groupId = targetGroupId; // Ensure groupId is set (null for Inbox)

        // Clear schedule when moving to a group/inbox (lists are unscheduled)
        task.scheduledDate = null;
        task.scheduledTime = null;

        if (targetGroupId === null) {
            store.dumpAreaTasks.push(task);
        } else {
            const g = store.groups.find(g => g.id === targetGroupId);
            if (g) g.addTask(task);
        }

        ui.closeListContext();
    };

    return (
        <>
            <ContextMenu
                isOpen={ui.listContext.isOpen}
                onClose={() => ui.closeListContext()}
                position={ui.listContext.position}
            >
                <MenuItem
                    label="Inbox"
                    icon={<span>📪</span>}
                    checkmark={isTaskInInbox}
                    onClick={() => handleSelectGroup('default')}
                />
                <MenuSeparator />
                {store.groups.map(group => (
                    <MenuItem
                        key={group.id}
                        label={group.name}
                        icon={<span>{group.icon}</span>}
                        checkmark={currentGroupId === group.id}
                        onClick={() => handleSelectGroup(group.id)}
                    />
                ))}

                <MenuSeparator />
                <MenuItem
                    label="New List"
                    icon={<Plus size={14} />}
                    onClick={() => {
                        setShowCreateList(true);
                    }}
                />
            </ContextMenu>

            {showCreateList && (
                <CreateListModal
                    onClose={() => {
                        setShowCreateList(false);
                        ui.closeListContext();
                    }}
                />
            )}
        </>
    );
});

