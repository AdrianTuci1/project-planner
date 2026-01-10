import React from 'react';
import { observer } from 'mobx-react-lite';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { store } from '../../models/store';
import './Timebox.css';

export const Timebox = observer(() => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    // Mock current time line (e.g. at 9:30 AM = 9 * 60 + 30 mins)
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const topPosition = minutesSinceMidnight; // Assuming 1px per minute for simplicity or mapping

    return (
        <div className="timebox-container">
            <div className="timebox-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} />
                    Timebox
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <ChevronLeft size={14} onClick={() => store.setDate(new Date(store.viewDate.getTime() - 86400000))} style={{ cursor: 'pointer' }} />
                    <span onClick={() => store.setDate(new Date())} style={{ cursor: 'pointer' }}>Today</span>
                    <ChevronRight size={14} onClick={() => store.setDate(new Date(store.viewDate.getTime() + 86400000))} style={{ cursor: 'pointer' }} />
                </div>
            </div>

            <div className="timebox-date-row">
                <span className="date-text">
                    {format(store.viewDate, 'EEE d')}
                </span>
                {isSameDay(store.viewDate, startOfDay(new Date())) && (
                    <span className="today-badge">Today</span>
                )}
            </div>

            <div className="timebox-grid">
                {/* Current Time Line */}
                <div className="current-time-line" style={{ top: `${topPosition}px` }} />

                {hours.map(hour => (
                    <div key={hour} className="time-slot" style={{ height: 60 }}>
                        <span className="time-label">{format(new Date().setHours(hour, 0), 'h aa')}</span>
                    </div>
                ))}
            </div>
        </div>
    );
});
