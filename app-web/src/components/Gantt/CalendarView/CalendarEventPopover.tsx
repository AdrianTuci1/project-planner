import React, { useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { format } from 'date-fns';
import { Trash2, X, ExternalLink, Calendar, Users, AlignLeft } from 'lucide-react';
import { Task } from '../../../models/core';
import { store } from '../../../models/store';
import './CalendarEventPopover.css';

interface CalendarEventPopoverProps {
    task: Task;
    onClose: () => void;
    position: { x: number, y: number }; // Position relative to viewport
}

// Reusing Google Icon from Settings (should be extracted ideally)
const GoogleIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const CalendarEventPopover = observer(({ task, onClose, position }: CalendarEventPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Format date string similar to screenshot: "Monday, January 19th 2:15pm - 4:15pm"
    const dateString = task.scheduledDate ? format(task.scheduledDate, 'EEEE, MMMM do') : '';
    const startStr = task.scheduledTime ? format(new Date(`2000-01-01T${task.scheduledTime}`), 'h:mm a') : '';
    // Calculate end time
    let endStr = '';
    if (task.scheduledDate && task.scheduledTime) {
        // Create a date object for calculation, date part doesn't matter for time diff
        const d = new Date(`2000-01-01T${task.scheduledTime}`);
        d.setMinutes(d.getMinutes() + (task.duration || 15));
        endStr = format(d, 'h:mm a');
    }
    const timeString = `${startStr} - ${endStr}`;

    const handleDelete = () => {
        // In a real app we might ask for confirmation or delete straight away
        // For Google Events, deletion might trigger another modal (not in scope but logically similar to update)
        store.deleteTask(task.id);
        onClose();
    };

    const handleOpenExternal = () => {
        // Mock external link if not present
        const url = (task as any).externalUrl || 'https://calendar.google.com';
        window.open(url, '_blank');
    };

    // Account email (mock or real)
    const accountEmail = store.settings.calendar.connectedEmail || 'connected.account@example.com';

    return (
        <div
            className="cal-event-popover"
            ref={popoverRef}
            style={{
                top: Math.min(position.y, window.innerHeight - 300), // Prevent overflow bottom
                left: Math.min(position.x, window.innerWidth - 320) // Prevent overflow right
            }}
        >
            <div className="popover-header">
                <div className="popover-actions">
                    <button className="popover-icon-btn" onClick={handleOpenExternal} title="Open in Calendar">
                        <ExternalLink size={16} />
                    </button>
                    <button className="popover-icon-btn" onClick={handleDelete} title="Delete">
                        <Trash2 size={16} />
                    </button>
                    <button className="popover-icon-btn close" onClick={onClose} title="Close">
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="popover-content">
                <h3 className="event-title">{task.title}</h3>
                <div className="event-datetime">
                    {dateString} <span className="time-separator">•</span> {timeString}
                </div>

                {task.description && (
                    <div className="event-row">
                        <AlignLeft size={16} className="row-icon" />
                        <div className="row-text desc">{task.description}</div>
                    </div>
                )}

                <div className="event-row">
                    <Calendar size={16} className="row-icon" />
                    <div className="row-text">{accountEmail}</div>
                </div>

                {/* Participants - Mocked for now or checking task.attendees if available */}
                <div className="event-row">
                    <GoogleIcon size={16} /> {/* Using Google Icon instead of generic calendar for provider */}
                    <div className="row-text">Google Calendar</div>
                </div>

                {/* If we had attendees data structure */}
                {/* 
                <div className="event-row">
                    <Users size={16} className="row-icon" />
                    <div className="row-text">2 guests</div>
                </div> 
                */}
            </div>
        </div>
    );
});
