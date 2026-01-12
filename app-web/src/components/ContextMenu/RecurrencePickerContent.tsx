import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { RecurrenceType } from '../../models/core';
import { MenuItem, MenuHeader, ToggleSwitch } from './ContextMenu';
import { format } from 'date-fns';

interface RecurrencePickerContentProps {
    selectedRecurrence: RecurrenceType | undefined;
    onSelectRecurrence: (type: RecurrenceType) => void;
    hasSpecificTime: boolean;
    onToggleSpecificTime: (enabled: boolean) => void;
    specificTime: string;
    onChangeTime: (timeStr: string) => void;
    onClose: () => void;
    baseDate: Date;
}

export const RecurrencePickerContent = observer(({
    selectedRecurrence,
    onSelectRecurrence,
    hasSpecificTime,
    onToggleSpecificTime,
    specificTime,
    onChangeTime,
    onClose,
    baseDate
}: RecurrencePickerContentProps) => {

    const recurrenceOptions = [
        { type: 'none' as RecurrenceType, label: 'Does not repeat' },
        { type: 'daily' as RecurrenceType, label: 'Every day' },
        { type: 'weekday' as RecurrenceType, label: 'Every weekday', meta: '(Mon - Fri)' },
        { type: 'weekly' as RecurrenceType, label: 'Every week', meta: `(on ${format(baseDate, 'eeee')})` },
        { type: 'biweekly' as RecurrenceType, label: 'Every 2 weeks', meta: `(on ${format(baseDate, 'eeee')})` },
        { type: 'monthly' as RecurrenceType, label: 'Every month', meta: `(on the ${format(baseDate, 'do')})` },
        { type: 'yearly' as RecurrenceType, label: 'Every year', meta: `(on ${format(baseDate, 'MMM do')})` },
        { type: 'custom' as RecurrenceType, label: 'Custom...' },
    ];

    return (
        <>
            <MenuHeader title="Make task recurring" onClose={onClose} />

            <div className="context-menu-content">
                {recurrenceOptions.map((option) => (
                    <MenuItem
                        key={option.type}
                        label={option.label}
                        meta={option.meta}
                        checkmark={selectedRecurrence === option.type}
                        onClick={() => {
                            onSelectRecurrence(option.type);
                        }}
                    />
                ))}
            </div>

            <div style={{ marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                <ToggleSwitch
                    label="At a specific time?"
                    checked={hasSpecificTime}
                    onChange={onToggleSpecificTime}
                />

                {hasSpecificTime && (
                    <div className="time-selector">
                        <select
                            value={specificTime}
                            onChange={(e) => onChangeTime(e.target.value)}
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
        </>
    );
});

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
