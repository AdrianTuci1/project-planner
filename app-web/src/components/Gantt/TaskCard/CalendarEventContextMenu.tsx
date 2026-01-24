import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../../../models/store';
import { Trash2, ExternalLink, Calendar as CalendarIcon, Mail } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface CalendarEventContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    event: any;
}

// Reusing Google Icon
const GoogleIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const CalendarEventContextMenu = observer(({
    isOpen,
    onClose,
    position,
    event
}: CalendarEventContextMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Delay slighty to avoid immediate close from the triggering click
        const timeout = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 10);

        return () => {
            clearTimeout(timeout);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    // Time formatting
    const startTime = event.scheduledDate ? format(new Date(event.scheduledDate), 'h:mm') : '';
    const duration = event.duration || 60;
    const endTime = event.scheduledDate ? format(addMinutes(new Date(event.scheduledDate), duration), 'h:mm') : '';

    const handleRedirect = () => {
        if (event.htmlLink) {
            window.open(event.htmlLink, '_blank');
        }
        onClose();
    };

    const handleDelete = () => {
        store.calendarStore.deleteEvent(event);
        onClose();
    };

    const calendarName = event.calendarId === 'primary' ? 'Primary Calendar' : 'Calendar';
    const accountEmail = store.settings.calendar.connectedEmail || 'connected.account@example.com';

    // Portal content
    const content = (
        <div
            ref={menuRef}
            className="context-menu"
            style={{
                position: 'fixed',
                top: position.y,
                left: position.x,
                zIndex: 9999, // High z-index for portal
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
                width: '280px',
                padding: '16px',
                animation: 'fadeIn 0.1s ease-out',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transform: 'translateX(-100%)', // Shift to left of anchor point
                marginLeft: '-8px' // Slight Gap
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header / Actions Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '40px' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        lineHeight: 1.3,
                        wordBreak: 'break-word'
                    }}>
                        {event.title}
                    </h3>
                </div>

                {/* Actions Top Right */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '4px'
                }}>
                    {event.htmlLink && (
                        <button
                            onClick={handleRedirect}
                            className="action-icon-btn"
                            title="Open in Google Calendar"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                                padding: '4px',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <ExternalLink size={16} />
                        </button>
                    )}
                    <button
                        onClick={handleDelete}
                        className="action-icon-btn delete-btn"
                        title="Delete Event"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '4px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Event Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Date & Time */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <CalendarIcon size={14} />
                        <span>
                            {event.scheduledDate ? format(new Date(event.scheduledDate), 'EEEE, MMMM do') : 'Date N/A'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-main)', marginLeft: '22px', fontWeight: 500 }}>
                        {startTime} - {endTime}
                    </div>
                </div>

                {/* Description */}
                {event.description && (
                    <div style={{
                        marginTop: '4px',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        maxHeight: '100px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        padding: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '4px'
                    }}>
                        {event.description}
                    </div>
                )}

                <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

                {/* Account / Calendar Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <Mail size={14} />
                    <span>{accountEmail}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <GoogleIcon size={14} />
                    <span>Google Calendar</span>
                    <span style={{
                        fontSize: '10px',
                        backgroundColor: event.color || '#4285F4',
                        color: 'white',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 500,
                        marginLeft: 'auto'
                    }}>
                        {calendarName}
                    </span>
                </div>
            </div>

            <style>{`
                .action-icon-btn:hover {
                    background-color: var(--bg-hover) !important;
                    color: var(--text-main) !important;
                }
                .action-icon-btn.delete-btn:hover {
                    background-color: rgba(239, 68, 68, 0.1) !important;
                    color: var(--accent-red) !important;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-100%) translateY(4px); }
                    to { opacity: 1; transform: translateX(-100%) translateY(0); }
                }
            `}</style>
        </div>
    );

    return ReactDOM.createPortal(content, document.body);
});
