import React from 'react';
import { observer } from 'mobx-react-lite';
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import { MonthCell } from './MonthCell';

export const MonthGrid = observer(({ tasks, onTaskClick }: { tasks: Task[], onTaskClick: (task: Task) => void }) => {
    const start = startOfWeek(startOfMonth(store.viewDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(store.viewDate), { weekStartsOn: 0 });

    const days = [];
    let day = start;
    while (day <= end) {
        days.push(day);
        day = addDays(day, 1);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7));
    }

    return (
        <div className="month-grid">
            {/* Header */}
            <div className="month-header-row">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="month-header-cell">{d}</div>
                ))}
            </div>

            {/* Rows */}
            {weeks.map((week, i) => (
                <div key={i} className="month-row">
                    {week.map(date => (
                        <MonthCell key={date.toString()} date={date} tasks={tasks} onTaskClick={onTaskClick} />
                    ))}
                </div>
            ))}
        </div>
    );
});
