import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Task } from '../../models/core';
import { SidebarTaskList } from './SidebarTaskList';
import { Calendar, AlertCircle } from 'lucide-react';

export const DueDateContent = observer(() => {
    const allDueTasks = store.allTasks
        .filter(t => t.dueDate && t.status !== 'done')
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdueTasks = allDueTasks.filter(t => new Date(t.dueDate!) < today);
    const upcomingTasks = allDueTasks.filter(t => new Date(t.dueDate!) >= today);

    if (allDueTasks.length === 0) {
        return (
            <div className="sidebar-tasks-container">
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
                            maxWidth: '80%',
                            height: 'auto',
                            marginBottom: '10px'
                        }}
                    />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>You have no upcoming tasks</span>
                </div>
            </div>
        );
    }

    const renderSection = (title: string, tasks: Task[], icon: React.ReactNode, type: 'overdue' | 'upcoming') => {
        if (tasks.length === 0) return null;

        return (
            <div className="sidebar-due-section">
                <div className="sidebar-section-header" style={{
                    padding: '0 10px 6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: type === 'overdue' ? '#ff4d4f' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}>
                    {icon}
                    {title.toUpperCase()}
                </div>
                <SidebarTaskList
                    tasks={tasks}
                    activeGroup={null}
                    onDuplicate={(t: Task) => store.dumpAreaTasks.push(t.clone())}
                    onDelete={(t: Task) => store.deleteTask(t.id)}
                    isSortable={false}
                    id={`due-${type}`}
                />
            </div>
        );
    };

    return (
        <div className="sidebar-tasks-container" style={{ gap: 30 }}>
            {renderSection('Overdue', overdueTasks, <AlertCircle size={14} />, 'overdue')}
            {renderSection('Upcoming', upcomingTasks, <Calendar size={14} />, 'upcoming')}
        </div>
    );
});
