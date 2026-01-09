import React from 'react';
import { observer } from 'mobx-react-lite';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
                    <div style={{ width: 8, height: 8, background: 'var(--text-muted)', borderRadius: '50%' }} />
                    Timebox
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                    <ChevronLeft size={14} />
                    <span>Today</span>
                    <ChevronRight size={14} />
                </div>
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
