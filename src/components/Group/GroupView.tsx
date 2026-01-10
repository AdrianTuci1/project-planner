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
import { Task } from '../../models/core';
import './GroupView.css';

interface GroupViewProps {
    groupId: string;
}

export const GroupView = observer(({ groupId }: GroupViewProps) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const group = store.groups.find(g => g.id === groupId);
    if (!group) return <div>Group not found</div>;

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
                        group.tasks.length > 0 ? (
                            <KanbanBoard
                                tasks={group.tasks}
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
                            tasks={group.tasks}
                            onTaskClick={handleTaskClick}
                        />
                    )}
                </div>
            </div>

            {/* Right Sidebar (Timebox or TasksView based on view mode) */}
            {store.isRightSidebarOpen && (
                store.viewMode === 'tasks' ? (
                    <Timebox />
                ) : (
                    <TasksView
                        tasks={group.tasks}
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
