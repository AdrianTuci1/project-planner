import React from 'react';
import { observer } from 'mobx-react-lite';
import { format, addMinutes } from 'date-fns';
import { CalendarEventContextMenu } from './CalendarEventContextMenu';

interface CalendarEventCardProps {
    event: any; // Using any for flexibility with Task/CalendarEvent mix, but ideally CalendarEvent
    style?: React.CSSProperties;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    setNodeRef?: (node: HTMLElement | null) => void;
    attributes?: any;
    listeners?: any;
    onResizeStart?: (e: React.MouseEvent | React.TouchEvent) => void;
}

// Google Icon Component
const GoogleIcon = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="cal-provider-icon" style={{ flexShrink: 0 }}>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export const CalendarEventCard = observer(({
    event,
    style,
    className,
    onClick,
    setNodeRef,
    attributes,
    listeners,
    onResizeStart
}: CalendarEventCardProps) => {

    const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number } | null>(null);

    // Determine provider icon
    const isGoogle = event.provider === 'google' || event.accountId?.includes('google'); // fallback check

    // Time formatting - Safely handle dates
    let startTime = '';
    let endTime = '';
    const durationMins = event.duration || 60;
    let isAllDay = false;

    try {
        if (event.allDay !== undefined) {
            isAllDay = event.allDay;
            // If all day, calculate dummy start/end purely for verification or debugging if needed, 
            // but we won't show it.
        } else if (event.start && !event.start.dateTime && event.start.date) {
            isAllDay = true;
        } else if (event.rawStart && !event.rawStart.dateTime && event.rawStart.date) {
            isAllDay = true;
        }

        if (event.scheduledDate) {
            const start = new Date(event.scheduledDate);
            if (!isNaN(start.getTime())) {
                startTime = format(start, 'h:mm');
                endTime = format(addMinutes(start, durationMins), 'h:mm');
            }
        } else if (event.rawStart) {
            // Fallback to raw start if scheduledDate missing
            const start = new Date(event.rawStart.dateTime || event.rawStart.date);
            if (!isNaN(start.getTime())) {
                startTime = format(start, 'h:mm');
                endTime = format(addMinutes(start, durationMins), 'h:mm');
            }
        }
    } catch (e) {
        console.error("Error formatting time for event", event, e);
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setContextMenu({
            x: rect.left - 5, // Small gap
            y: rect.top
        });
    };

    return (
        <>
            <div
                ref={setNodeRef}
                style={{
                    ...style,
                    color: 'white',
                    // Keep the calendar event look
                    backgroundColor: '#1e293b',
                    borderLeft: `3px solid ${event.color || '#4285F4'}`
                }}
                className={`task-card calendar-event is-calendar-event ${className || ''}`}
                onClick={onClick}
                onContextMenu={handleContextMenu}
                {...listeners}
                {...attributes}
            >
                <div className="tc-header" style={{ gap: '6px', alignItems: isAllDay ? 'center' : 'flex-start', height: '100%', overflow: 'hidden' }}>

                    {/* Always show icon if it's external provider */}
                    {isGoogle && <GoogleIcon />}

                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <div
                            className="tc-title"
                            style={{
                                fontSize: '11px',
                                marginBottom: 0,
                                color: 'white',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: 600,
                                lineHeight: 1.1
                            }}
                        >
                            {event.title}
                        </div>

                        {/* Always show time if valid date exists and NOT all day */}
                        {startTime && !isAllDay && (
                            <div style={{
                                fontSize: '9px',
                                color: '#e2e8f0', // lighter slate for better readability on dark
                                marginTop: '2px',
                                lineHeight: 1
                            }}>
                                {startTime} - {endTime}
                            </div>
                        )}
                    </div>
                </div>

                {/* Resize Handle - kept generic */}
                <div
                    className="resize-handle"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onResizeStart?.(e);
                    }}
                />
            </div>

            <CalendarEventContextMenu
                isOpen={!!contextMenu}
                onClose={() => setContextMenu(null)}
                position={contextMenu || { x: -100, y: 0 }}
                event={event}
            />
        </>
    );
});
