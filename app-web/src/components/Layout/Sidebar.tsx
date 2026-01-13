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
import { SidebarTaskList } from '../Sidebar/SidebarTaskList';
import { GroupList } from '../Shared/GroupList';
import { ContextMenu, MenuItem, MenuSeparator } from '../ContextMenu/ContextMenu';
import { sidebarUI } from '../../models/SidebarUIModel';
import { TaskCard, SortableTaskCard } from '../Gantt/TaskCard/index';
import './Sidebar.css';
import { SidebarViewToggle } from './SidebarViewToggle';


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
        <aside className="sidebar">
            {/* App Header / User */}
            <div className="sidebar-header">
                <div className="avatar-wrapper">
                    <img className="user-avatar" src="/logo.png" alt="" />
                </div>
                <span className="app-name">
                    simplu
                </span>
                <SidebarViewToggle />
            </div>

            {/* Main Menu Content */}
            {sidebarUI.sidebarView === 'main' && (
                <>
                    <GroupList
                        activeGroupId={store.activeGroupId}
                    />

                    <div className="sidebar-tasks-container">
                        <div className="sidebar-add-task">
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
                            onDelete={(t: Task) => store.deleteTask(t.id)}
                        />
                    </div>
                </>
            )}

            {/* Due Date Content */}
            {sidebarUI.sidebarView === 'due' && (
                <div className="sidebar-tasks-container">
                    <div className="sidebar-section-header" style={{ padding: '0 10px 10px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        UPCOMING
                    </div>
                    <SidebarTaskList
                        tasks={store.allTasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())}
                        activeGroup={null} // No group context for flat list
                        onDuplicate={(t: Task) => store.dumpAreaTasks.push(t.clone())} // Fallback or implement specific logic
                        onDelete={(t: Task) => store.deleteTask(t.id)}
                        isSortable={false}
                    />
                </div>
            )}

            {/* Templates Content Placeholder */}
            {sidebarUI.sidebarView === 'templates' && (
                <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Coming Soon: Templates View
                </div>
            )}

        </aside>
    );
});
