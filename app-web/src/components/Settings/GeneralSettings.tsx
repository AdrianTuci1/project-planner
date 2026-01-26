import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import './GeneralSettings.css';

const Toggle = ({ active, onChange }: { active: boolean; onChange: () => void }) => (
    <label className="setting-toggle">
        <input type="checkbox" checked={active} onChange={onChange} />
        <span className="toggle-slider"></span>
    </label>
);

const Select = ({ value, onChange, options }: { value: string; onChange: (val: string) => void; options: string[] }) => (
    <div className="setting-select-wrapper">
        <select
            className="setting-select"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
        <ChevronDown size={14} className="setting-select-arrow" />
    </div>
);

export const GeneralSettings = observer(() => {
    const { settings } = store;
    const general = settings.general;



    return (
        <div className="general-settings-container">
            {/* After Task Completion */}
            <div className="settings-section">
                <div className="settings-section-header">After Task Completion</div>

                <div className="setting-row">
                    <span className="setting-label">Move tasks (and subtasks) to the bottom of the list on complete</span>
                    <Toggle active={general.generalSettings.moveTasksBottom} onChange={() => general.setSetting('moveTasksBottom', !general.generalSettings.moveTasksBottom)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Mark tasks as complete when subtasks are complete</span>
                    <Toggle active={general.generalSettings.markCompleteSubtasks} onChange={() => general.setSetting('markCompleteSubtasks', !general.generalSettings.markCompleteSubtasks)} />
                </div>

            </div>

            {/* Calendar / Kanban Settings */}
            <div className="settings-section">
                <div className="settings-section-header">Calendar / Kanban Settings</div>

                <div className="setting-row">
                    <span className="setting-label">Start week on</span>
                    <Select
                        value={general.generalSettings.startWeekOn}
                        onChange={(val) => general.setSetting('startWeekOn', val)}
                        options={['Sunday', 'Monday', 'Saturday']}
                    />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Show weekends</span>
                    <Toggle active={general.generalSettings.showWeekends} onChange={() => general.setSetting('showWeekends', !general.generalSettings.showWeekends)} />
                </div>
            </div>

            <div className="setting-row">
                <span className="setting-label">Show declined events</span>
                <Toggle active={general.generalSettings.showDeclinedEvents} onChange={() => general.setSetting('showDeclinedEvents', !general.generalSettings.showDeclinedEvents)} />
            </div>

            {/* Appearance */}
            <div className="settings-section">
                <div className="settings-section-header">Appearance</div>
                <div className="setting-row">
                    <div style={{ width: '100%' }}>
                        <Select
                            value={general.generalSettings.darkMode}
                            onChange={(val) => general.setSetting('darkMode', val)}
                            options={['Dark mode', 'Light mode', 'System default']}
                        />
                    </div>
                </div>
            </div>

            {/* Timer Settings */}
            <div className="settings-section">
                <div className="settings-section-header">Timer Settings</div>

                <div className="setting-row">
                    <span className="setting-label">Auto start next task after task completion</span>
                    <Toggle active={general.generalSettings.autoStartNextTask} onChange={() => general.setSetting('autoStartNextTask', !general.generalSettings.autoStartNextTask)} />
                </div>

                <div className="setting-indent">
                    <button className="setting-action-btn">
                        Change Timer Background <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* New Task / Update Task */}
            <div className="settings-section">
                <div className="settings-section-header">New Task / Update Task</div>

                <div className="setting-row">
                    <span className="setting-label">Add new tasks to the</span>
                    <Select
                        value={general.generalSettings.addNewTasksTo}
                        onChange={(val) => general.setSetting('addNewTasksTo', val)}
                        options={['Top of list', 'Bottom of list']}
                    />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Detect label in task title</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Toggle active={general.generalSettings.detectLabel} onChange={() => general.setSetting('detectLabel', !general.generalSettings.detectLabel)} />
                        <span className="settings-info-link">(what is this?)</span>
                    </div>
                </div>

                <div className="setting-row">
                    <span className="setting-label">Default estimated time (for new tasks)</span>
                    <Select
                        value={general.generalSettings.defaultEstimatedTime}
                        onChange={(val) => general.setSetting('defaultEstimatedTime', val)}
                        options={['0 mins', '15 mins', '30 mins', '1 hour']}
                    />
                </div>
            </div>

        </div>
    );
});
