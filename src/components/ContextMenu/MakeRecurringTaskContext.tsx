import React, { useState } from 'react';
import { ContextMenu, MenuItem, MenuHeader, ToggleSwitch } from './ContextMenu';

type RecurrenceType =
    | 'none'
    | 'daily'
    | 'weekday'
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'yearly'
    | 'custom';

interface MakeRecurringTaskContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    selectedRecurrence?: RecurrenceType;
    hasSpecificTime?: boolean;
    specificTime?: string;
    onSelectRecurrence?: (type: RecurrenceType) => void;
    onToggleSpecificTime?: (enabled: boolean) => void;
    onChangeTime?: (time: string) => void;
}

export const MakeRecurringTaskContext: React.FC<MakeRecurringTaskContextProps> = ({
    isOpen,
    onClose,
    position,
    selectedRecurrence = 'none',
    hasSpecificTime = false,
    specificTime = '9:30 PM',
    onSelectRecurrence,
    onToggleSpecificTime,
    onChangeTime,
}) => {
    const [timeEnabled, setTimeEnabled] = useState(hasSpecificTime);
    const [time, setTime] = useState(specificTime);

    const handleToggleTime = (enabled: boolean) => {
        setTimeEnabled(enabled);
        onToggleSpecificTime?.(enabled);
    };

    const handleTimeChange = (newTime: string) => {
        setTime(newTime);
        onChangeTime?.(newTime);
    };

    const recurrenceOptions = [
        { type: 'none' as RecurrenceType, label: 'Does not repeat' },
        { type: 'daily' as RecurrenceType, label: 'Every day' },
        { type: 'weekday' as RecurrenceType, label: 'Every weekday', meta: '(Mon - Fri)' },
        { type: 'weekly' as RecurrenceType, label: 'Every week', meta: '(on Fri)' },
        { type: 'biweekly' as RecurrenceType, label: 'Every 2 weeks', meta: '(on Fri)' },
        { type: 'monthly' as RecurrenceType, label: 'Every month', meta: '(on the 2nd Fri)' },
        { type: 'yearly' as RecurrenceType, label: 'Every year', meta: '(on Jan 9th)' },
        { type: 'custom' as RecurrenceType, label: 'Custom...' },
    ];

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuHeader title="Make task recurring" onClose={onClose} />

            <div className="context-menu-content">
                {recurrenceOptions.map((option) => (
                    <MenuItem
                        key={option.type}
                        label={option.label}
                        meta={option.meta}
                        checkmark={selectedRecurrence === option.type}
                        onClick={() => onSelectRecurrence?.(option.type)}
                    />
                ))}
            </div>

            <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                <ToggleSwitch
                    label="At a specific time?"
                    checked={timeEnabled}
                    onChange={handleToggleTime}
                />

                {timeEnabled && (
                    <div className="time-selector">
                        <select
                            value={time}
                            onChange={(e) => handleTimeChange(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            {generateTimeOptions().map((timeOption) => (
                                <option key={timeOption} value={timeOption}>
                                    {timeOption}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </ContextMenu>
    );
};

// Helper function to generate time options
function generateTimeOptions(): string[] {
    const times: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const displayMinute = minute.toString().padStart(2, '0');
            times.push(`${displayHour}:${displayMinute} ${period}`);
        }
    }
    return times;
}
