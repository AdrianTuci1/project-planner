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
}

export const SidebarTaskList = observer(({ tasks, activeGroup, onDuplicate, onDelete, isSortable = true }: SidebarTaskListProps) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'sidebar-list',
        data: {
            type: 'sidebar-list',
            groupId: store.activeGroupId
        },
        disabled: !isSortable
    });

    return (
        <div
            ref={isSortable ? setNodeRef : undefined}
            className={`sidebar-tasks-list`}
            style={{ minHeight: '50px' }}
        >
            {isSortable ? (
                <SortableContext
                    id="sidebar-list"
                    items={tasks.map((t: Task) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task: Task) => (
                        <SortableTaskCard
                            key={task.id}
                            task={task}
                            onDuplicate={onDuplicate}
                            onDelete={onDelete}
                            containerData={{ type: 'sidebar-list', groupId: store.activeGroupId }}
                        />
                    ))}
                </SortableContext>
            ) : (
                tasks.map((task: Task) => (
                    // Use standard TaskCard for non-sortable list
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDuplicate={onDuplicate}
                        onDelete={onDelete}
                    // Add style or className to match look if needed
                    />
                ))
            )}
        </div>
    );
});
