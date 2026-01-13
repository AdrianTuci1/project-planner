import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { CalendarClock } from 'lucide-react';
import './GeneralSettings.css'; // Reuse existing styles or create new ones

export const DueDatesSettings = observer(() => {
    const { settings } = store;
    const { dueDates } = settings;

    return (
        <div className="general-settings-container">
            <div className="settings-section">
                <div className="settings-section-header">
                    <CalendarClock size={20} style={{ marginRight: 10, verticalAlign: 'middle' }} />
                    Due Dates
                </div>

                <div className="setting-row">
                    <span className="setting-label">
                        Show indicator on task card if due date is within
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="number"
                            className="form-input"
                            style={{ width: 60, textAlign: 'center' }}
                            value={dueDates.thresholdDays}
                            onChange={(e) => dueDates.setThreshold(parseInt(e.target.value) || 0)}
                        />
                        <span style={{ fontSize: '14px', color: 'var(--text-main)' }}>days</span>
                    </div>
                </div>
            </div>
        </div>
    );
});
