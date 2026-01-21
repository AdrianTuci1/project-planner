import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { ChevronRight, Apple, ArrowLeft } from 'lucide-react';
import './CalendarSettings.css';

export const CalendarSettings = observer(() => {
    const { calendar } = store.settings;
    // Local state removed, using model

    // Check for auth code on mount
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) {
            calendar.handleGoogleCode(code);
        }
    }, []);

    // Google Icon component
    const GoogleIcon = ({ size = 18 }: { size?: number }) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );

    const handleConnectGoogle = () => {
        calendar.connectGoogle();
    };

    const handleDisconnect = () => {
        calendar.disconnect();
    };

    if (calendar.showManageView) {
        return (
            <div className="calendar-settings-container">
                <div className="manage-view-header">
                    <button className="back-btn" onClick={() => calendar.setShowManageView(false)}>
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div className="manage-header-title-row">
                        <div className="manage-title">
                            <GoogleIcon size={24} /> Google Calendar
                        </div>
                        <div className="manage-email">{calendar.connectedEmail}</div>
                    </div>

                    <div className="manage-divider" />
                </div>

                <div className="manage-row">
                    <div>
                        <div className="manage-section-title">Add tasks to Google Calendar</div>
                        <p className="manage-section-desc">
                            Choose to add Simplu tasks to your Google calendar, or keep them separate Note: this only applies to new tasks, and existing tasks will not be updated
                        </p>
                    </div>
                    <label className="calendar-switch">
                        <input
                            type="checkbox"
                            checked={calendar.addTasksToCalendar}
                            onChange={(e) => calendar.toggleAddTasksToCalendar(e.target.checked)}
                        />
                        <span className="calendar-slider" />
                    </label>
                </div>

                <div className="manage-divider" />

                <div style={{ marginBottom: 40 }}>
                    <div className="manage-section-title">Synced Calendars</div>
                    <p className="manage-section-desc" style={{ marginBottom: 16 }}>
                        Select which calendars you want to see in Simplu. Check the box to enable two-way sync.
                    </p>

                    <div className="sub-calendars-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {calendar.calendars[0]?.subCalendars?.map(sub => (
                            <label key={sub.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--bg-elevated)' }}>
                                <input
                                    type="checkbox"
                                    checked={sub.isVisible}
                                    onChange={() => calendar.toggleSubCalendarVisibility(calendar.calendars[0].id, sub.id)}
                                    style={{ width: 16, height: 16, marginRight: 12 }}
                                />
                                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sub.color, marginRight: 8 }}></div>
                                <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{sub.name}</span>
                            </label>
                        )) || <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading calendars...</div>}
                    </div>
                </div>

                <div className="manage-divider" />

                <div style={{ marginBottom: 40 }}>
                    <div className="manage-section-title">Event Updates</div>
                    <p className="manage-section-desc" style={{ marginBottom: 12 }}>
                        Would you like to send update emails to existing Google Calendar guests when you change an event in Simplu?
                    </p>

                    <select
                        value={calendar.calendars[0]?.guestUpdateStrategy || 'none'}
                        onChange={(e) => calendar.setGuestUpdateStrategy(calendar.calendars[0].id, e.target.value as any)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: 8,
                            border: '1px solid var(--border-subtle)',
                            backgroundColor: 'var(--bg-elevated)',
                            color: 'var(--text-primary)',
                            fontSize: 14,
                            width: '100%',
                            maxWidth: 300,
                            cursor: 'pointer'
                        }}
                    >
                        <option value="none">Update but don't send emails</option>
                        <option value="all">Send update emails</option>
                    </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 100 }}>
                    <button className="disconnect-btn" onClick={handleDisconnect}>
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="calendar-settings-container">
            <h2 className="calendar-settings-title">Connected calendars</h2>
            <p className="calendar-settings-description">
                Show calendar events in Simplu and optionally add tasks to Google calendar
            </p>

            {/* Connected Account Section */}
            {calendar.isConnected && (
                <div className="connected-account-card">
                    <div className="account-info">
                        <div className="google-icon-wrapper">
                            <GoogleIcon />
                        </div>
                        <span className="account-email">{calendar.connectedEmail}</span>
                    </div>
                    <button className="manage-btn" onClick={() => calendar.setShowManageView(true)}>
                        Manage <ChevronRight size={14} />
                    </button>
                </div>
            )}

            {/* Link New Calendar Section */}
            <div className="link-calendar-section">
                <div className="section-title">Link a new calendar</div>
                <div className="calendar-providers">
                    <button className="provider-btn" onClick={handleConnectGoogle}>
                        <GoogleIcon />
                        Add Google
                    </button>
                    <button className="provider-btn" onClick={() => alert('Apple Calendar integration coming soon')}>
                        <Apple size={16} />
                        Add Apple
                    </button>
                    {/* Outlook removed as per user request */}
                </div>
            </div>

            {/* Settings Card */}
            {calendar.isConnected && (
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-title">Calendar event settings</div>
                        <div className="settings-card-desc">Control how calendar events interact with your tasks</div>
                    </div>

                    <div className="feature-section">
                        <div className="section-title" style={{ fontSize: 16, marginBottom: 12 }}>Enable Feature</div>

                        <div className="feature-row">
                            <div className="feature-info">
                                <div className="feature-title">Create tasks from calendar events</div>
                                <div className="feature-desc">Show "Add as task" button on calendar events</div>
                                <a href="#" className="feature-link">What is this?</a>
                            </div>
                            <label className="calendar-switch">
                                <input
                                    type="checkbox"
                                    checked={calendar.createTasksFromEvents}
                                    onChange={(e) => calendar.toggleCreateTasksFromEvents(e.target.checked)}
                                />
                                <span className="calendar-slider" />
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
