import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { KanbanBoard } from '../Gantt/KanbanBoard';
import { CalendarView } from '../Gantt/CalendarView';
import { Timebox } from '../Gantt/Timebox';
import { TasksView } from '../Tasks/TasksView';
import { TopBar } from '../Navigation/TopBar';
import { TaskModal } from '../TaskDetails/TaskModal';
import { UpgradeModal } from '../Upgrade/UpgradeModal';
import { TaskTimer } from '../Timer/TaskTimer';
import { Task } from '../../models/core';
import { Sidebar } from '../Layout/Sidebar';
import { AccountSettings } from '../Settings/AccountSettings';
import { BottomDock, DockTab } from '../Navigation/BottomDock';
import './GroupView.css';

interface GroupViewProps {
    groupId: string;
}

export const GroupView = observer(({ groupId }: GroupViewProps) => {
    const group = store.groups.find(g => g.id === groupId);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 800);
    const [activeDockTab, setActiveDockTab] = useState<DockTab>('tasks');

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 800);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!group) return <div>Group not found</div>;

    const globalTasks = store.filteredTasks;
    const hasTasks = globalTasks.length > 0;

    const handleTaskClick = (task: Task) => {
        store.openTaskModal(task);
    };

    if (isMobile) {
        return (
            <div className="group-view-wrapper mobile">
                <div className="group-content mobile-content">
                    {activeDockTab === 'tasks' && (
                        <TasksView
                            tasks={globalTasks}
                            onTaskClick={handleTaskClick}
                            groupId={groupId}
                        />
                    )}
                    {activeDockTab === 'inbox' && (
                        <Sidebar hideHeader />
                    )}
                    {activeDockTab === 'timebox' && (
                        <Timebox />
                    )}
                    {activeDockTab === 'settings' && (
                        <AccountSettings />
                    )}
                </div>

                <BottomDock
                    activeTab={activeDockTab}
                    onTabChange={setActiveDockTab}
                />

                {/* Task Details Modal */}
                {store.activeTask && (
                    <TaskModal task={store.activeTask} onClose={() => store.closeTaskModal()} />
                )}
            </div>
        );
    }

    return (
        <div className="group-view-wrapper">
            {/* Main Content Area (TopBar + Content) */}
            <div className="group-main-area">
                <TopBar />
                <div className="group-content">
                    {store.viewMode === 'tasks' ? (
                        <KanbanBoard
                            tasks={globalTasks}
                            onTaskClick={handleTaskClick}
                            groupId={store.activeGroupId}
                        />
                    ) : (
                        <CalendarView
                            tasks={globalTasks}
                            onTaskClick={handleTaskClick}
                        />
                    )}
                </div>
                {/* Task Timer */}
                <TaskTimer />
            </div>

            {/* Right Sidebar (Timebox or TasksView based on view mode) */}
            {store.isRightSidebarOpen && (
                store.viewMode === 'tasks' ? (
                    <Timebox />
                ) : (
                    <TasksView
                        tasks={globalTasks}
                        onTaskClick={handleTaskClick}
                        groupId={groupId}
                    />
                )
            )}

            {/* Task Details Modal */}
            {store.activeTask && (
                <TaskModal task={store.activeTask} onClose={() => store.closeTaskModal()} />
            )}

            {/* Upgrade Modal */}
            <UpgradeModal />

        </div>
    );
});
