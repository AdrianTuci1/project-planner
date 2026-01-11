import { Task } from "../../models/core";
import { TaskUIModel } from "../../models/TaskUIModel";
import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    setHours,
    setMinutes,
    getHours,
    getMinutes
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { ContextMenu } from './ContextMenu';
import './DateTimePickerContext.css';

interface DateTimePickerContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const DateTimePickerContext = observer(({
    ui,
    task
}: DateTimePickerContextProps) => {
    // Derived state from task
    const selectedDate = (() => {
        if (!task.scheduledDate) return undefined;
        const d = new Date(task.scheduledDate);
        if (task.scheduledTime) {
            const [h, m] = task.scheduledTime.split(':').map(Number);
            d.setHours(h, m);
        }
        return d;
    })();

    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(!!selectedDate && (getHours(selectedDate) !== 0 || getMinutes(selectedDate) !== 0));

    React.useEffect(() => {
        if (selectedDate) {
            setViewDate(selectedDate);
            setIsTimePickerVisible(getHours(selectedDate) !== 0 || getMinutes(selectedDate) !== 0);
        }
    }, [selectedDate]);

    const handleSelect = (date: Date) => {
        const h = date.getHours();
        const m = date.getMinutes();
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);

        if (h !== 0 || m !== 0) {
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            task.setScheduling(newDate, timeStr);
        } else {
            if (task.scheduledTime) {
                task.setScheduling(newDate, "00:00");
            } else {
                task.setScheduling(newDate, undefined);
            }
        }
    };

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const handleDateClick = (day: Date) => {
        const newDate = new Date(day);
        if (selectedDate) {
            newDate.setHours(getHours(selectedDate));
            newDate.setMinutes(getMinutes(selectedDate));
        }
        handleSelect(newDate);
    };

    const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
        let newDate = selectedDate ? new Date(selectedDate) : new Date(viewDate);
        if (type === 'hours') {
            newDate = setHours(newDate, value);
        } else {
            newDate = setMinutes(newDate, value);
        }
        handleSelect(newDate);
    };

    const hours = selectedDate ? getHours(selectedDate) : 9;
    const minutes = selectedDate ? getMinutes(selectedDate) : 0;

    return (
        <ContextMenu
            isOpen={ui.isContextMenuOpen}
            onClose={() => ui.setContextMenuOpen(false)}
            position={ui.contextPosition}
        >
            <div className="dtp-container" onClick={e => e.stopPropagation()}>
                <div className="dtp-header">
                    <span className="dtp-month">{format(viewDate, 'MMMM yyyy')}</span>
                    <div className="dtp-nav">
                        <button className="dtp-nav-btn" onClick={() => setViewDate(subMonths(viewDate, 1))}>
                            <ChevronLeft size={16} />
                        </button>
                        <button className="dtp-nav-btn" onClick={() => setViewDate(addMonths(viewDate, 1))}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="dtp-grid-header">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(dow => (
                        <div key={dow} className="dtp-dow">{dow}</div>
                    ))}
                </div>

                <div className="dtp-grid">
                    {days.map(day => (
                        <div
                            key={day.toString()}
                            className={`dtp-day ${!isSameMonth(day, monthStart) ? 'other-month' : ''} ${selectedDate && isSameDay(day, selectedDate) ? 'selected' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
                            onClick={() => handleDateClick(day)}
                        >
                            {format(day, 'd')}
                        </div>
                    ))}
                </div>

                <div className="dtp-time-section">
                    {!isTimePickerVisible ? (
                        <button
                            className="dtp-add-time-btn"
                            onClick={() => {
                                setIsTimePickerVisible(true);
                                let baseDate = selectedDate ? new Date(selectedDate) : new Date(viewDate);
                                // Default to 9:00 AM
                                const newDate = setHours(setMinutes(baseDate, 0), 9);
                                handleSelect(newDate);
                            }}
                        >
                            Add to Timebox
                        </button>
                    ) : (
                        <>
                            <div className="dtp-time-inputs">
                                <input
                                    className="dtp-time-input"
                                    value={hours.toString().padStart(2, '0')}
                                    onChange={e => {
                                        let val = parseInt(e.target.value);
                                        if (e.target.value === '') return;
                                        if (isNaN(val)) return;
                                        val = Math.max(0, Math.min(23, val)); // 0-23
                                        handleTimeChange('hours', val);
                                    }}
                                />
                                <span className="dtp-time-separator">:</span>
                                <input
                                    className="dtp-time-input"
                                    value={minutes.toString().padStart(2, '0')}
                                    onChange={e => {
                                        let val = parseInt(e.target.value);
                                        if (e.target.value === '') return;
                                        if (isNaN(val)) return;
                                        val = Math.max(0, Math.min(59, val));
                                        handleTimeChange('minutes', val);
                                    }}
                                />
                            </div>
                            <button
                                className="dtp-remove-btn"
                                onClick={() => {
                                    setIsTimePickerVisible(false);
                                    if (task.scheduledDate) {
                                        task.setScheduling(task.scheduledDate, undefined);
                                    }
                                }}
                            >
                                Remove from Timebox
                            </button>
                        </>
                    )}
                </div>
            </div>
        </ContextMenu>
    );
});
