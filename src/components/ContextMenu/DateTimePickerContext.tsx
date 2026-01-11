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
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    selectedDate?: Date;
    onSelect: (date: Date) => void;
    onRemoveTime?: () => void;
}

export const DateTimePickerContext = observer(({
    isOpen,
    onClose,
    position,
    selectedDate,
    onSelect,
    onRemoveTime
}: DateTimePickerContextProps) => {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());
    const [isTimePickerVisible, setIsTimePickerVisible] = useState(!!selectedDate && (getHours(selectedDate) !== 0 || getMinutes(selectedDate) !== 0));

    React.useEffect(() => {
        if (selectedDate) {
            setViewDate(selectedDate);
            setIsTimePickerVisible(getHours(selectedDate) !== 0 || getMinutes(selectedDate) !== 0);
        }
    }, [selectedDate]);

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
        onSelect(newDate);
    };

    const handleTimeChange = (type: 'hours' | 'minutes', value: number) => {
        let newDate = selectedDate ? new Date(selectedDate) : new Date(viewDate);
        if (type === 'hours') {
            newDate = setHours(newDate, value);
        } else {
            newDate = setMinutes(newDate, value);
        }
        onSelect(newDate);
    };

    const hours = selectedDate ? getHours(selectedDate) : 9;
    const minutes = selectedDate ? getMinutes(selectedDate) : 0;

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
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
                                onSelect(newDate);
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
                                        if (e.target.value === '') return; // Allow empty while typing? Or handle differently. Better to safeguard.
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
                                    onRemoveTime?.();
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
