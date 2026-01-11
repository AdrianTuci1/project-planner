import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import {
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CreateListModal } from '../Sidebar/CreateListModal';
import { GroupList } from '../Shared/GroupList';
import { ContextMenu, MenuItem, MenuSeparator } from '../ContextMenu/ContextMenu';
import { sidebarUI } from '../../models/SidebarUIModel';
import { TaskCard, SortableTaskCard } from '../Gantt/TaskCard/index';
import './Sidebar.css';

const SidebarTaskList = observer(({ tasks, activeGroup, onDuplicate, onDelete }: any) => {
    const { isOver, setNodeRef } = useDroppable({
        id: 'sidebar-list',
        data: {
            type: 'sidebar-list',
            groupId: store.activeGroupId // pass null or ID
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`sidebar-tasks-list`}
            style={{ minHeight: '50px' }} // Removed background color change on drag
        >
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
        </div>
    );
});

export const Sidebar = observer(() => {
    const activeGroup = store.activeGroup;

    const handleCreateTask = (title: string) => {
        if (title) {
            if (store.activeGroupId === null) {
                store.addTaskToDump(title);
            } else if (activeGroup) {
                const newTask = new Task(title);
                activeGroup.addTask(newTask);
            }
            sidebarUI.setAddingTask(false);
        }
    };

    return (
        <>
            <aside className="sidebar">
                {/* App Header / User */}
                <div className="sidebar-header">
                    <img className="user-avatar" src="/logo.png" alt="" />
                    <span className="app-name">
                        simplu
                    </span>
                </div>

                <GroupList
                    activeGroupId={store.activeGroupId}
                />
                {/* ... existing header code ... */}

                {/* Logic for duplicate/delete handlers tailored for wrapper */}
                {/* We just need to pass them down or inline them in the wrapper call */}

                <div className="sidebar-tasks-container">
                    <div className="sidebar-add-task">
                        {/* ... */}
                        <TaskCard
                            isGhost
                            onAddClick={() => sidebarUI.setAddingTask(true)}
                        />
                        {sidebarUI.isAddingTask && (
                            <div className="sidebar-task-creation">
                                <TaskCard
                                    isCreating
                                    onCreate={handleCreateTask}
                                    onCancel={() => sidebarUI.setAddingTask(false)}
                                />
                            </div>
                        )}
                    </div>

                    <SidebarTaskList
                        tasks={store.applyGlobalFilters((store.activeGroupId === null ? store.dumpAreaTasks : activeGroup?.tasks || [])).filter(t => !t.scheduledDate)}
                        activeGroup={activeGroup}
                        onDuplicate={(t: Task) => {
                            if (store.activeGroupId === null) {
                                const clone = t.clone();
                                store.dumpAreaTasks.push(clone);
                            } else {
                                activeGroup?.duplicateTask(t.id);
                            }
                        }}
                        onDelete={(t: Task) => {
                            if (store.activeGroupId === null) {
                                store.dumpAreaTasks = store.dumpAreaTasks.filter(task => task.id !== t.id);
                            } else {
                                activeGroup?.removeTask(t.id);
                            }
                        }}
                    />
                </div>

            </aside>

        </>
    );
});
