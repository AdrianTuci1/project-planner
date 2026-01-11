import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import {
    Plus,
    ChevronDown,
    MoreVertical,
    Edit2
} from 'lucide-react';
import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { CreateListModal } from '../Sidebar/CreateListModal';
import { ContextMenu, MenuItem, MenuSeparator } from '../ContextMenu/ContextMenu';
import { sidebarUI } from '../../models/SidebarUIModel';
import { TaskCard, SortableTaskCard } from '../Gantt/TaskCard/index';
import { Trash2 } from 'lucide-react';
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
            className={`sidebar-tasks-list ${isOver ? 'droppable-over' : ''}`}
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
    const [showCreateList, setShowCreateList] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

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

                <div className="active-list-container">
                    <div
                        className="active-list-selector"
                        onClick={(e) => sidebarUI.handleListClick(e)}
                    >
                        <div className="active-list-icon">
                            {store.activeGroupId === null ? '🧠' : '🐙'}
                        </div>
                        <div className="active-list-info">
                            <span className="active-list-name">
                                {store.activeGroupId === null ? 'Brain Dump' : activeGroup?.name}
                            </span>
                        </div>
                        <ChevronDown size={16} className="active-list-chevron" />
                    </div>

                    {store.activeGroupId !== null && (
                        <div
                            className="active-list-actions-trigger"
                            onClick={(e) => sidebarUI.handleActionsClick(e)}
                        >
                            <MoreVertical size={18} />
                        </div>
                    )}
                </div>

                {/* Context Menu for Lists */}
                <ContextMenu
                    isOpen={sidebarUI.isMenuOpen}
                    onClose={() => sidebarUI.setMenuOpen(false)}
                    position={sidebarUI.menuPosition}
                    className="sidebar-list-context-menu"
                >
                    <MenuItem
                        label="Brain Dump"
                        icon={<span>🧠</span>}
                        selected={store.activeGroupId === null}
                        checkmark={store.activeGroupId === null}
                        onClick={() => {
                            store.activeGroupId = null;
                            sidebarUI.setMenuOpen(false);
                        }}
                    />
                    <MenuSeparator />
                    {store.groups.map(group => (
                        <MenuItem
                            key={group.id}
                            label={group.name}
                            icon={<span>🐙</span>}
                            selected={store.activeGroupId === group.id}
                            checkmark={store.activeGroupId === group.id}
                            onClick={() => {
                                store.activeGroupId = group.id;
                                sidebarUI.setMenuOpen(false);
                            }}
                        />
                    ))}
                    <MenuSeparator />
                    <MenuItem
                        label="New List"
                        icon={<Plus size={14} />}
                        onClick={() => {
                            sidebarUI.setMenuOpen(false);
                            setEditingGroupId(null);
                            setShowCreateList(true);
                        }}
                    />
                </ContextMenu>

                {/* List Actions Context Menu */}
                <ContextMenu
                    isOpen={sidebarUI.isActionsMenuOpen}
                    onClose={() => sidebarUI.setActionsMenuOpen(false)}
                    position={sidebarUI.actionsMenuPosition}
                >
                    <MenuItem
                        label="Edit List"
                        icon={<Edit2 size={14} />}
                        onClick={() => {
                            sidebarUI.setActionsMenuOpen(false);
                            setEditingGroupId(store.activeGroupId);
                            setShowCreateList(true);
                        }}
                    />
                    <MenuItem
                        label="Delete List"
                        icon={<Trash2 size={14} />}
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this list?')) {
                                store.deleteGroup(store.activeGroupId!);
                                sidebarUI.setActionsMenuOpen(false);
                            }
                        }}
                    />
                </ContextMenu>
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
                        tasks={(store.activeGroupId === null ? store.dumpAreaTasks : activeGroup?.tasks || []).filter(t => !t.scheduledDate)}
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

            {showCreateList && (
                <CreateListModal
                    groupId={editingGroupId}
                    onClose={() => {
                        setShowCreateList(false);
                        setEditingGroupId(null);
                    }}
                />
            )}
        </>
    );
});
