import React from 'react';
import { observer } from 'mobx-react-lite';
import { format, isSameDay, startOfDay, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { store } from '../../models/store';
import './Timebox.css';

export const Timebox = observer(() => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    // Mock current time line (e.g. at 9:30 AM = 9 * 60 + 30 mins)
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const topPosition = minutesSinceMidnight; // Assuming 1px per minute for simplicity or mapping

    const isToday = isSameDay(store.timeboxDate, new Date());

    return (
        <div className="timebox-container">
            <div className="timebox-header">
                <div className="timebox-title">
                    <Clock size={14} />
                    <span>Timebox</span>
                </div>
                <div className="timebox-nav">
                    <button
                        className="nav-btn"
                        onClick={() => store.setTimeboxDate(subDays(store.timeboxDate, 1))}
                        title="Previous Day"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className={`today-btn ${isToday ? 'active' : ''}`}
                        onClick={() => store.setTimeboxDate(new Date())}
                    >
                        Today
                    </button>
                    <button
                        className="nav-btn"
                        onClick={() => store.setTimeboxDate(addDays(store.timeboxDate, 1))}
                        title="Next Day"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <div className="timebox-date-row">
                <span className="date-text">
                    {format(store.timeboxDate, 'EEE')}
                </span>
                <span className="today-badge">{format(store.timeboxDate, 'd')}</span>

            </div>

            <div className="timebox-grid">
                {/* Current Time Line */}
                <div className="current-time-line" style={{ top: `${topPosition}px` }} />

                {hours.map(hour => (
                    <div key={hour} className="time-slot">
                        {[0, 15, 30, 45].map(minute => (
                            <div key={minute} className="time-slot-sub">
                                {minute === 0 && (
                                    <span className="time-label">{format(new Date().setHours(hour, 0), 'h aa')}</span>
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
});
