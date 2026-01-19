import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import { SidebarTaskList } from '../Sidebar/SidebarTaskList';
import { GroupList } from '../Shared/GroupList';
import { TemplatesView } from '../Sidebar/TemplatesView';
import { sidebarUI } from '../../models/SidebarUIModel';
import { TaskCard } from '../Gantt/TaskCard/index';
import './Sidebar.css';
import { SidebarViewToggle } from './SidebarViewToggle';


interface SidebarProps {
    hideHeader?: boolean;
}

export const Sidebar = observer(({ hideHeader = false }: SidebarProps) => {
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
                    {(() => {
                        const dueTasks = store.allTasks.filter(t => t.dueDate).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

                        if (dueTasks.length === 0) {
                            return (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'flex-start',
                                    opacity: 1,
                                    marginTop: '20px'
                                }}>
                                    <img
                                        src="/due-date.png"
                                        alt="No upcoming tasks"
                                        style={{
                                            maxWidth: '80%', // Slightly larger for this view if needed, but 80% is safe
                                            height: 'auto',
                                            marginBottom: '10px'
                                        }}
                                    />
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You have no upcoming tasks</span>
                                </div>
                            );
                        }

                        return (
                            <SidebarTaskList
                                tasks={dueTasks}
                                activeGroup={null} // No group context for flat list
                                onDuplicate={(t: Task) => store.dumpAreaTasks.push(t.clone())} // Fallback or implement specific logic
                                onDelete={(t: Task) => store.deleteTask(t.id)}
                                isSortable={false}
                            />
                        );
                    })()}
                </div>
            )}

            {/* Templates Content */}
            {sidebarUI.sidebarView === 'templates' && (
                <TemplatesView />
            )}

            {/* Sidebar Footer - Personal/Team Switch */}
            <div className="sidebar-footer">
                <div className="workspace-switcher">
                    <button
                        className={`workspace-btn ${store.activeWorkspace?.type === 'personal' ? 'active' : ''}`}
                        onClick={() => {
                            const personal = store.workspaces.find(w => w.type === 'personal');
                            if (personal) store.setActiveWorkspace(personal.id);
                        }}
                    >
                        Personal
                    </button>
                    <button
                        className={`workspace-btn ${store.activeWorkspace?.type === 'team' ? 'active' : ''}`}
                        onClick={() => {
                            const team = store.workspaces.find(w => w.type === 'team');
                            if (team) {
                                store.setActiveWorkspace(team.id);
                            } else {
                                // If for some reason team doesn't exist (should be created in init), nothing happens?
                                // Assuming init creates it.
                            }
                        }}
                    >
                        Team
                    </button>
                </div>
            </div>
        </aside>
    );
});
