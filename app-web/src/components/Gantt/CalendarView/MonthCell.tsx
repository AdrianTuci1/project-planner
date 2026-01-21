import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';

export const MonthCell = observer(({ date, tasks, onTaskClick }: { date: Date, tasks: Task[], onTaskClick: (task: Task) => void }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `month-cell-${date.toISOString()}`,
        data: {
            type: 'month-cell',
            date: date
        }
    });

    const dayTasks = tasks.filter(t => t.scheduledDate && isSameDay(t.scheduledDate, date));
    const isCurrentMonth = isSameMonth(date, store.viewDate);
    const isToday = isSameDay(date, new Date());

    return (
        <div
            ref={setNodeRef}
            className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isOver ? 'is-over' : ''}`}
        >
            <div className={`month-day-number ${isToday ? 'today' : ''}`}>{format(date, 'd')}</div>
            <div className="month-cell-tasks">
                {dayTasks.map(task => {
                    const labelColor = task.labelId ? store.getLabelColor(task.labelId) : 'transparent';
                    return (
                        <div
                            key={task.id}
                            className="month-task-item"
                            onClick={(e) => { e.stopPropagation(); onTaskClick(task); }}
                            style={{ backgroundColor: labelColor !== 'transparent' ? labelColor + '20' : 'transparent', borderLeft: `3px solid ${labelColor}` }}
                        >
                            <span className="month-task-title">{task.title}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
