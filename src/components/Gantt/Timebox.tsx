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
    const topPosition = minutesSinceMidnight * (100 / 60); // 100px per hour scale

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
                <table className="timebox-table">
                    <tbody className="timebox-body">
                        {hours.map(hour => (
                            <tr key={hour} className="hour-row">
                                <td className="time-label-cell">
                                    <span className="time-text">
                                        {hour === 0 ? '12 AM' :
                                            hour < 12 ? `${hour} AM` :
                                                hour === 12 ? '12 PM' :
                                                    `${hour - 12} PM`}
                                    </span>
                                </td>
                                <td className="timebox-content-cell">
                                    {/* Sub-slots for 15-min intervals if needed for drop targets, 
                                        but visually the row is the hour. 
                                        We can keep the sub-divs logic if we want to retain strict 15-min slots 
                                        inside the cell, or just use the cell as a container. 
                                        Keeping strict structure for consistency with previous logic.
                                    */}
                                    {[0, 15, 30, 45].map(minute => (
                                        <div key={minute} className="time-slot-sub">
                                            {/* Content or drop zones go here */}
                                        </div>
                                    ))}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {/* Current Time Line - Overlayed */}
                <div className="current-time-line" style={{ top: `${topPosition}px` }} />
            </div>
        </div >
    );
});
