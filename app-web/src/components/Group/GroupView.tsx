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
import { GuestUpdateModal } from '../Gantt/CalendarView/GuestUpdateModal';
import { runInAction } from 'mobx';
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

    const handleGuestUpdateConfirm = (strategy: 'all' | 'none') => {
        const pending = store.uiStore.pendingCalendarUpdate;
        if (pending) {
            const task = store.getTaskById(pending.taskId);
            if (task) {
                runInAction(() => {
                    task.scheduledDate = pending.newDate;
                    task.scheduledTime = pending.newTime;
                });
                console.log(`[GroupView] Updated calendar event with strategy: ${strategy}`);
            }
        }
        store.uiStore.closeGuestUpdateModal();
    };

    const handleGuestUpdateCancel = () => {
        store.uiStore.closeGuestUpdateModal();
    };


    // if (!group) return <div>Group not found</div>;
    // Instead of returning early, we continue rendering the layout.

    // Fallback for globalTasks if group logic is strict, but store.filteredTasks 
    // usually returns tasks based on activeGroup. If activeGroup is null, it might return empty or dump tasks.
    const globalTasks = store.filteredTasks;
    // Removed unused variable `hasTasks` to avoid lint warning if not used, 
    // keeping it if logic needed it, but previously it was defining but seemingly not used in render blocks shown.
    // Actually standardizing on provided code.

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

                {/* Upgrade Modal */}
                <UpgradeModal />

                {/* Guest Update Modal */}
                {store.uiStore.isGuestUpdateModalOpen && (
                    <GuestUpdateModal
                        isOpen={true}
                        onClose={handleGuestUpdateCancel}
                        onUpdateWithoutEmail={() => handleGuestUpdateConfirm('none')}
                        onUpdateWithEmail={() => handleGuestUpdateConfirm('all')}
                    />
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
                    {group ? (
                        store.viewMode === 'tasks' ? (
                            <KanbanBoard
                                tasks={globalTasks}
                                onTaskClick={handleTaskClick}
                                groupId={group.id}
                            />
                        ) : (
                            <CalendarView
                                tasks={globalTasks}
                                onTaskClick={handleTaskClick}
                            />
                        )
                    ) : (
                        // Brain Dump View (No Group)
                        store.viewMode === 'tasks' ? (
                            <KanbanBoard
                                tasks={store.applyGlobalFilters(store.dumpAreaTasks)}
                                onTaskClick={handleTaskClick}
                                groupId={null}
                            />
                        ) : (
                            <CalendarView
                                tasks={store.applyGlobalFilters(store.dumpAreaTasks)}
                                onTaskClick={handleTaskClick}
                            />
                        )
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

            {/* Guest Update Modal */}
            {store.uiStore.isGuestUpdateModalOpen && (
                <GuestUpdateModal
                    isOpen={true}
                    onClose={handleGuestUpdateCancel}
                    onUpdateWithoutEmail={() => handleGuestUpdateConfirm('none')}
                    onUpdateWithEmail={() => handleGuestUpdateConfirm('all')}
                />
            )}

        </div>
    );
});
