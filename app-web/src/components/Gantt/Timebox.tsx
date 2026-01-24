import React from 'react';
import { observer } from 'mobx-react-lite';
import { format, isSameDay, startOfDay, addDays, subDays, getHours, getMinutes } from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Calendar, RefreshCw } from 'lucide-react';
import { Task } from '../../models/core';
import { store } from '../../models/store';
import { CalendarCell } from './CalendarView/CalendarCell';
import { ActiveCalendarsContext } from './ActiveCalendarsContext';
import { CalendarEventCard } from './TaskCard/CalendarEventCard';
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

    // Fetch Calendar Events Logic (Internal)
    React.useEffect(() => {
        if (store.activeWorkspace?.type === 'personal') {
            // Fetch for current day + buffer
            const start = startOfDay(store.timeboxDate);
            const end = addDays(start, 1);
            store.calendarStore.fetchEvents(start, end);

            if (store.settings.calendar.calendars.length === 0) {
                store.settings.calendar.fetchCalendars();
            }
        }
    }, [store.timeboxDate, store.activeWorkspace?.type]);

    const calendarEvents = store.activeWorkspace?.type === 'personal' ? (store.calendarStore.events as any[]) : [];

    // Get tasks for the timebox day
    const allEvents = [...store.allTasks, ...calendarEvents] as Task[];

    const tasks = allEvents.filter(t => {
        const isCalendarEvent = t.id.startsWith('evt_') || (t as any).isCalendarEvent;
        // Robust check: if allDay explicitly set (from backend), use it. Fallback to rawStart.dateTime check.
        const isAllDay = (t as any).allDay !== undefined ? (t as any).allDay : (isCalendarEvent && !(t as any).rawStart?.dateTime);

        if (isCalendarEvent && isAllDay) return false; // Exclude all day events from grid

        return t.scheduledDate && t.scheduledTime && isSameDay(t.scheduledDate, store.timeboxDate);
    });

    const allDayEvents = allEvents.filter(t => {
        const isCalendarEvent = t.id.startsWith('evt_') || (t as any).isCalendarEvent;
        if (!isCalendarEvent) return false;

        const isAllDay = (t as any).allDay !== undefined ? (t as any).allDay : !(t as any).rawStart?.dateTime;

        if (isAllDay) {
            const eDate = new Date((t as any).scheduledDate || (t as any).rawStart?.date);
            return isSameDay(eDate, store.timeboxDate);
        }
        return false;
    });

    // Resize Logic (Copied from CalendarView to ensure parity)
    const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, task: Task) => {
        e.preventDefault();
        e.stopPropagation();

        const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const startDuration = task.duration || 15;

        const handle = e.target as HTMLElement;
        const card = handle.closest('.task-card') as HTMLElement;
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
                // If it is a calendar event, we must sync via CalendarStore
                if (task.id.startsWith('evt_')) {
                    const event = store.calendarStore.getEventById(task.id);
                    if (event) {
                        // Calculate new end time
                        const newEnd = new Date(event.start.getTime() + newDuration * 60000);
                        store.calendarStore.updateEvent(event, { end: newEnd });
                    }
                } else {
                    task.duration = newDuration;
                }
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
                        {/* All Day Row inside Table */}
                        {allDayEvents.length > 0 && (
                            <tr className="all-day-row">
                                <td className="time-label-cell all-day-label-cell">
                                    <span className="all-day-label-text">All Day</span>
                                </td>
                                <td className="timebox-content-cell all-day-content-cell">
                                    <div className="all-day-events-container">
                                        {allDayEvents.map(ev => (
                                            <CalendarEventCard
                                                key={ev.id}
                                                event={ev}
                                                style={{
                                                    height: '24px',
                                                    width: '100%',
                                                    minWidth: '100px',
                                                    flex: '1 0 auto',
                                                    fontSize: '11px'
                                                }}
                                                className="all-day-card"
                                            />
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        )}

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
            {store.activeWorkspace?.type !== 'team' && (
                <>
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
                        <div ref={menuRef}>
                            <ActiveCalendarsContext />
                        </div>
                    )}
                </>
            )}
        </div>
    );
});
