import React, { useState } from 'react';
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
import './GroupView.css';

interface GroupViewProps {
    groupId: string;
}

export const GroupView = observer(({ groupId }: GroupViewProps) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const group = store.groups.find(g => g.id === groupId);
    if (!group) return <div>Group not found</div>;

    const displayTasks = store.applyGlobalFilters(group.tasks);

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
    };

    return (
        <div className="group-view-wrapper">
            {/* Main Content Area (TopBar + Content) */}
            <div className="group-main-area">
                <TopBar />
                <div className="group-content">
                    {store.viewMode === 'tasks' ? (
                        displayTasks.length > 0 ? (
                            <KanbanBoard
                                tasks={displayTasks}
                                onTaskClick={handleTaskClick}
                                groupId={groupId}
                            />
                        ) : (
                            <div className="empty-gantt">
                                No tasks in this group.
                            </div>
                        )
                    ) : (
                        <CalendarView
                            tasks={displayTasks}
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
                        tasks={displayTasks}
                        onTaskClick={handleTaskClick}
                        groupId={groupId}
                    />
                )
            )}

            {/* Task Details Modal */}
            {selectedTask && (
                <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}

            {/* Upgrade Modal */}
            <UpgradeModal />

        </div>
    );
});
