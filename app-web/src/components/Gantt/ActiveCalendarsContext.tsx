import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';

export const ActiveCalendarsContext = observer(() => {
    return (
        <div className="calendar-context-menu">
            <h3 className="menu-title">Active calendars</h3>
            <div className="menu-calendars-list">
                {/* Iterate over main accounts first */}
                {store.settings.calendar.calendars.map(cal => (
                    <div key={cal.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                        {/* Account Header (Main Calendar) */}
                        <div className="menu-calendar-item">
                            <label className="menu-calendar-label" style={{ fontWeight: 500 }}>
                                {cal.email || cal.name}
                            </label>
                        </div>

                        {/* Sub Calendars */}
                        {cal.subCalendars && cal.subCalendars.length > 0 ? (
                            <div style={{ paddingLeft: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {cal.subCalendars.map(sub => (
                                    <label key={sub.id} className="menu-calendar-label">
                                        <input
                                            type="checkbox"
                                            checked={sub.isVisible}
                                            onChange={() => store.settings.calendar.toggleSubCalendarVisibility(cal.id, sub.id)}
                                            style={{ accentColor: sub.color }}
                                        />
                                        <span className="menu-calendar-name" style={{ color: sub.isVisible ? 'inherit' : '#888', fontSize: 13 }}>
                                            {sub.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            // Fallback for accounts without sub-calendars (legacy support)
                            <div className="menu-calendar-item" style={{ paddingLeft: 12 }}>
                                <label className="menu-calendar-label">
                                    <input
                                        type="checkbox"
                                        checked={cal.isVisible}
                                        onChange={() => store.settings.calendar.toggleCalendarVisibility(cal.id)}
                                        style={{ accentColor: cal.color }}
                                    />
                                    <span className="menu-calendar-name" style={{ color: cal.isVisible ? 'inherit' : '#888' }}>
                                        Primary
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <button
                className="menu-add-btn"
                onClick={() => {
                    store.openSettings('calendar');
                    // setIsMenuOpen(false); // This will be handled by the parent closing the menu
                }}
            >
                + Add calendar account
            </button>
        </div>
    );
});
