import React from 'react';
import { observer } from 'mobx-react-lite';
import { format, isSameDay, startOfDay, addDays, subDays, getHours, getMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar, RefreshCw } from 'lucide-react';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { CalendarCell } from './CalendarView/CalendarCell';
import './Timebox.css';

interface TimeboxProps {
    hideHeader?: boolean;
}

export const Timebox = observer(({ hideHeader }: TimeboxProps) => {
    const hours = Array.from({ length: 24 }).map((_, i) => i);
    // Mock current time line (e.g. at 9:30 AM = 9 * 60 + 30 mins)
    const now = new Date();
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const topPosition = minutesSinceMidnight * (100 / 60); // 100px per hour scale

    const isToday = isSameDay(store.timeboxDate, new Date());

    // Get tasks for the timebox day
    const tasks = store.allTasks.filter(t =>
        t.scheduledDate && t.scheduledTime && isSameDay(t.scheduledDate, store.timeboxDate)
    );

    React.useEffect(() => {
        if (store.settings.calendar.calendars.length === 0) {
            store.settings.calendar.fetchCalendars();
        }
    }, []);

    // Resize Logic (Copied from CalendarView to ensure parity)
    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, task: Task) => {
        e.preventDefault();
        e.stopPropagation();

        const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const startDuration = task.duration || 15;

        const handle = e.target as HTMLElement;
        const card = handle.closest('.calendar-event') as HTMLElement;
        const cell = card?.closest('.hour-cell') as HTMLElement; // CalendarCell renders .hour-cell

        if (!cell) return;

        const hourHeight = cell.clientHeight;

        const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
            const deltaY = currentY - startY;

            // hourHeight pixels = 60 minutes
            const deltaMinutes = (deltaY / hourHeight) * 60;

            let newDuration = startDuration + deltaMinutes;
            newDuration = Math.max(15, Math.round(newDuration / 15) * 15);

            if (newDuration !== task.duration) {
                task.duration = newDuration;
            }
        };

        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchend', handleUp);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('mouseup', handleUp);
        window.addEventListener('touchend', handleUp);
    };

    return (
        <div className="timebox-container">
            {!hideHeader && (
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
            )}

            <div className="timebox-date-row">
                <span className="date-text">
                    {format(store.timeboxDate, 'EEE')}
                </span>
                <span className="today-badge">{format(store.timeboxDate, 'd')}</span>

            </div>

            <div className="timebox-grid">
                <table className="timebox-table">
                    <tbody className="timebox-body">
                        {hours.map(hour => {
                            return (
                                <tr key={hour} className="hour-row">
                                    <td className="time-label-cell">
                                        <span className="time-text">
                                            {hour === 0 ? '12 AM' :
                                                hour < 12 ? `${hour} AM` :
                                                    hour === 12 ? '12 PM' :
                                                        `${hour - 12} PM`}
                                        </span>
                                    </td>
                                    <CalendarCell
                                        date={store.timeboxDate}
                                        hour={hour}
                                        tasks={tasks}
                                        onTaskClick={(t) => store.openTaskModal(t)}
                                        onResizeStart={handleResizeStart}
                                        className="timebox-content-cell"
                                        slotPrefix="timebox"
                                    />
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {/* Current Time Line - Overlayed */}
                <div className="current-time-line" style={{ top: `${topPosition}px` }} />
            </div>

            <TimeboxFooter />
        </div >
    );
});

const TimeboxFooter = observer(() => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Format last sync time (mocked)
    const lastSynced = "a few seconds ago";
    const hasCalendars = store.settings.calendar.calendars.length > 0;

    return (
        <div className="timebox-footer">
            <div className="sync-status">
                <RefreshCw size={12} className={`sync-icon-lucide ${!hasCalendars ? 'disabled' : ''}`} />
                <span className="sync-text">
                    {hasCalendars ? `Last synced ${lastSynced}` : 'Not connected'}
                </span>
            </div>

            <button
                ref={triggerRef}
                className={`calendar-menu-trigger ${isMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Manage Calendars"
            >
                <Calendar size={16} />
                {store.settings.calendar.isLoading && <div className="menu-loading-dot"></div>}
            </button>

            {isMenuOpen && (
                <div className="calendar-context-menu" ref={menuRef}>
                    <h3 className="menu-title">Active calendars</h3>
                    <div className="menu-calendars-list">
                        {store.settings.calendar.calendars.map(cal => (
                            <div key={cal.id} className="menu-calendar-item">
                                <label className="menu-calendar-label">
                                    <input
                                        type="checkbox"
                                        checked={cal.isVisible}
                                        onChange={() => store.settings.calendar.toggleCalendarVisibility(cal.id)}
                                        style={{ accentColor: cal.color }}
                                    />
                                    <span className="menu-calendar-name" style={{ color: cal.isVisible ? 'inherit' : '#888' }}>
                                        {cal.email || cal.name}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <button
                        className="menu-add-btn"
                        onClick={() => {
                            store.openSettings('calendar');
                            setIsMenuOpen(false);
                        }}
                    >
                        + Add calendar account
                    </button>

                </div>
            )}
        </div>
    );
});
