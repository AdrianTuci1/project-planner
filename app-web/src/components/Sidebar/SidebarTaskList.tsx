import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { SortableTaskCard, TaskCard } from '../Gantt/TaskCard/index';
// import './Sidebar.css'; // Assuming styles are global or extracted later

interface SidebarTaskListProps {
    tasks: Task[];
    activeGroup: any; // Type as needed
    onDuplicate: (t: Task) => void;
    onDelete: (t: Task) => void;
    isSortable?: boolean;
    id?: string;
    containerData?: any;
}

export const SidebarTaskList = observer(({
    tasks,
    activeGroup,
    onDuplicate,
    onDelete,
    isSortable = true,
    id = 'sidebar-list',
    containerData
}: SidebarTaskListProps) => {
    const sortedTasks = [...tasks].sort((a, b) => {
        if (store.settings.general.generalSettings.moveTasksBottom) {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
        }
        return 0;
    });

    const { isOver, setNodeRef } = useDroppable({
        id: id,
        data: containerData || {
            type: 'sidebar-list',
            groupId: store.activeGroupId === 'default' ? null : store.activeGroupId
        },
        disabled: !isSortable
    });

    return (
        <div
            ref={isSortable ? setNodeRef : undefined}
            className={`sidebar-tasks-list ${isOver ? 'droppable-over' : ''}`}
            style={{ minHeight: isSortable ? '200px' : '0px' }}
        >
            {isSortable ? (
                <SortableContext
                    id={id}
                    items={sortedTasks.map((t: Task) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {sortedTasks.map((task: Task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onDuplicate={onDuplicate}
                            onDelete={onDelete}
                            onTaskClick={(t) => store.openTaskModal(t)}
                            containerData={containerData || { type: 'sidebar-list', groupId: store.activeGroupId === 'default' ? null : store.activeGroupId }}
                        />
                    ))}
                </SortableContext>
            ) : (
                sortedTasks.map((task: Task) => (
                    // Use standard TaskCard for non-sortable list
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                        onTaskClick={(t) => store.openTaskModal(t)}
                    // Add style or className to match look if needed
                    />
                ))
            )}
        </div>
    );
});
