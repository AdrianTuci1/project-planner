import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task, Workspace } from '../../models/core';
import { SidebarTaskList } from '../Sidebar/SidebarTaskList';
import { GroupList } from '../Shared/GroupList';
import { TemplatesView } from '../Sidebar/TemplatesView';
import { sidebarUI } from '../../models/SidebarUIModel';
import { TaskCard } from '../Gantt/TaskCard/index';
import './Sidebar.css';
import { SidebarViewToggle } from './SidebarViewToggle';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { NotificationContext } from '../ContextMenu/NotificationContext';
import { WorkspaceSwitcher } from '../Sidebar/WorkspaceSwitcher';


import { DueDateContent } from '../Sidebar/DueDateContent';

interface SidebarProps {
    hideHeader?: boolean;
}

export const Sidebar = observer(({ hideHeader = false }: SidebarProps) => {
    const activeGroup = store.activeGroup;
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationPosition, setNotificationPosition] = useState({ x: 0, y: 0 });

    const handleCreateTask = (title: string) => {
        if (title) {
            if (store.activeGroupId === 'default') {
                store.addTaskToDump(title);
            } else if (activeGroup) {
                store.createTaskInGroup(title, activeGroup);
            }
            sidebarUI.setAddingTask(false);
        }
    };

    return (
        <aside className="sidebar">
            {/* App Header / User */}
            {!hideHeader && (
                <div className="sidebar-header">
                    <div className="avatar-wrapper">
                        <img className="user-avatar" src="/logo.png" alt="" />
                    </div>
                    <span className="app-name">
                        simplu
                    </span>
                    <SidebarViewToggle />
                </div>
            )}

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
                            tasks={store.applyGlobalFilters((store.activeGroupId === 'default' ? store.dumpAreaTasks : activeGroup?.tasks || [])).filter(t => !t.scheduledDate)}
                            activeGroup={activeGroup}
                            onDuplicate={(t: Task) => {
                                if (store.activeGroupId === 'default') {
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
                <DueDateContent />
            )}

            {/* Templates Content */}
            {sidebarUI.sidebarView === 'templates' && (
                <TemplatesView />
            )}


            {/* Sidebar Footer - Personal/Team Switch */}
            <div className="sidebar-footer">
                <WorkspaceSwitcher />

                <div
                    className={`notification-icon-wrapper ${isNotificationOpen ? 'active' : ''}`}
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        // Position above the icon: y = rect.top
                        // The ContextMenu will need logic or CSS transform to go 'up' from this point
                        setNotificationPosition({
                            x: rect.left + rect.width / 2, // Center horizontally
                            y: rect.top - 8 // Slight gap above button
                        });
                        setIsNotificationOpen(true);
                    }}
                >
                    <Bell size={18} />
                    {store.notificationStore.hasUnread && <span className="notification-dot" />}
                </div>
            </div>

            <NotificationContext
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                position={notificationPosition}
            />
        </aside>
    );
});
