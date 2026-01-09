import React from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';
import {
    Plus,
    CheckSquare,
} from 'lucide-react';
import './KanbanBoard.css';

interface KanbanBoardProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
}

export const KanbanBoard = observer(({ tasks, onTaskClick }: KanbanBoardProps) => {
    // Use store date for columns
    const startDate = startOfDay(store.viewDate);
    // Show 3 days starting from selected date
    const columns = [0, 1, 2].map(offset => addDays(startDate, offset));

    // Determine "today" for UI badges relative to real time, not view time
    const today = startOfDay(new Date());

    const getTasksForDay = (date: Date) => {
        return tasks.filter(t => {
            if (!t.scheduledDate) return false;
            return isSameDay(t.scheduledDate, date);
        });
    };

    return (
        <div className="kanban-board">
            <div className="kanban-body">
                {columns.map(date => {
                    const dayTasks = getTasksForDay(date);
                    const isToday = isSameDay(date, today);

                    return (
                        <div key={date.toString()} className="day-column">
                            <div className="day-header">
                                <span className="day-name">{format(date, 'EEE')}</span>
                                <span>{format(date, 'MMM d')}</span>
                                {isToday && <span className="today-badge">Today</span>}
                            </div>

                            <div className="add-task-ghost">
                                <Plus size={16} />
                                <span>Add a task</span>
                                {/* Mock duration on right */}
                                {isToday && <span style={{ marginLeft: 'auto', fontSize: 10, background: 'var(--bg-input)', padding: '2px 4px', borderRadius: 4 }}>1:15 / 3:25</span>}
                            </div>

                            {dayTasks.map(task => (
                                <div
                                    key={task.id}
                                    className="board-task-card"
                                    onClick={() => onTaskClick(task)}
                                >
                                    <div className="btc-header">
                                        <div
                                            className={`task-check-btn ${task.status === 'done' ? 'checked' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); task.toggleStatus(); }}
                                        >
                                            {task.status === 'done' ? <CheckSquare size={18} /> : <div className="btc-checkbox" />}
                                        </div>
                                        <span className="btc-title" style={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                                            {task.title}
                                        </span>
                                        {task.duration && (
                                            <span className="btc-time-badge">{task.duration}:00</span> /* Mock format */
                                        )}
                                    </div>

                                    <div className="btc-footer">
                                        {task.labels.length > 0 && (
                                            <div className="btc-label">
                                                <div className="label-dot" />
                                                {task.labels[0]}
                                            </div>
                                        )}
                                        {/* Mock Time */}
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                            9:30pm
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
