import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';
import { store } from '../../models/store';
import { GroupList } from '../Shared/GroupList';

interface ListSelectionContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const ListSelectionContext = observer(({
    ui,
    task
}: ListSelectionContextProps) => {
    if (!ui.listContext.isOpen) return null;

    // Determine current group ID
    const currentGroupId = store.groups.find(g => g.tasks.some(t => t.id === task.id))?.id ||
        (store.dumpAreaTasks.some(t => t.id === task.id) ? null : undefined);

    const handleSelectGroup = (groupId: string | null) => {
        // "Manual" Move Logic (similar to what was inline)
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
        task.groupId = groupId; // Ensure groupId is set (null for Inbox)

        // Clear schedule when moving to a group/inbox (lists are unscheduled)
        task.scheduledDate = null;
        task.scheduledTime = null;

        if (groupId === null) {
            store.dumpAreaTasks.push(task);
        } else {
            const g = store.groups.find(g => g.id === groupId);
            if (g) g.addTask(task);
        }

        ui.closeListContext();
    };

    return (
        <div
            className="modal-overlay-transparent"
            onClick={() => ui.closeListContext()}
        >
            <div
                style={{
                    position: 'absolute',
                    top: ui.listContext.position.y,
                    left: ui.listContext.position.x,
                    width: '240px',
                    background: 'var(--bg-primary)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    zIndex: 1200,
                    border: '1px solid var(--border-color)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <GroupList
                    activeGroupId={currentGroupId as any}
                    onSelectGroup={handleSelectGroup}
                    className="task-modal-grouplist"
                />
            </div>
        </div>
    );
});
