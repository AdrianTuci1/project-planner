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

    useEffect(() => {
        general.loadSettings();
    }, []);

    return (
        <div className="general-settings-container">
            {/* After Task Completion */}
            <div className="settings-section">
                <div className="settings-section-header">After Task Completion</div>

                <div className="setting-row">
                    <span className="setting-label">Move tasks (and subtasks) to the bottom of the list on complete</span>
                    <Toggle active={general.moveTasksBottom} onChange={() => general.setSetting('moveTasksBottom', !general.moveTasksBottom)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Mark tasks as complete when subtasks are complete</span>
                    <Toggle active={general.markCompleteSubtasks} onChange={() => general.setSetting('markCompleteSubtasks', !general.markCompleteSubtasks)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Automatically set "actual time" when task is complete</span>
                    <Toggle active={general.autoSetActualTime} onChange={() => general.setSetting('autoSetActualTime', !general.autoSetActualTime)} />
                </div>
            </div>

            <div className="settings-group-decoration">
                <div className="setting-row">
                    <span className="setting-label">Enable deep link detection for external apps</span>
                    <Toggle active={general.deepLinkDetection} onChange={() => general.setSetting('deepLinkDetection', !general.deepLinkDetection)} />
                </div>
                <div className="setting-indent">
                    <button className="setting-action-btn">
                        Manage <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Calendar / Kanban Settings */}
            <div className="settings-section">
                <div className="settings-section-header">Calendar / Kanban Settings</div>

                <div className="setting-row">
                    <span className="setting-label">Start week on</span>
                    <Select
                        value={general.startWeekOn}
                        onChange={(val) => general.setSetting('startWeekOn', val)}
                        options={['Sunday', 'Monday', 'Saturday']}
                    />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Show weekends</span>
                    <Toggle active={general.showWeekends} onChange={() => general.setSetting('showWeekends', !general.showWeekends)} />
                </div>
            </div>

            <div className="settings-group-decoration">
                <div className="setting-row">
                    <span className="setting-label">Set a workday threshold?</span>
                    <Toggle active={general.workdayThreshold} onChange={() => general.setSetting('workdayThreshold', !general.workdayThreshold)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Workload Threshold</span>
                    <Select
                        value={general.workloadThreshold}
                        onChange={(val) => general.setSetting('workloadThreshold', val)}
                        options={['4 hours', '6 hours', '8 hours', '10 hours']}
                    />
                </div>

                <div className="setting-indent">
                    <div className="setting-label" style={{ marginBottom: 12 }}>Exclude tasks with these labels from workload calculation:</div>
                    <button className="setting-action-btn">
                        Add label to exclusion list
                    </button>
                </div>
            </div>

            <div className="setting-row">
                <span className="setting-label">Show declined events</span>
                <Toggle active={general.showDeclinedEvents} onChange={() => general.setSetting('showDeclinedEvents', !general.showDeclinedEvents)} />
            </div>

            <div className="setting-row">
                <span className="setting-label">Start day at</span>
                <Select
                    value={general.startDayAt}
                    onChange={(val) => general.setSetting('startDayAt', val)}
                    options={['12:00 AM', '6:00 AM', '8:00 AM', '9:00 AM']}
                />
            </div>

            <div className="setting-row">
                <span className="setting-label">Calendar time increments</span>
                <Select
                    value={general.calendarIncrements}
                    onChange={(val) => general.setSetting('calendarIncrements', val)}
                    options={['15 minute', '30 minute', '1 hour']}
                />
            </div>

            <div className="setting-row">
                <span className="setting-label">Time format</span>
                <Select
                    value={general.timeFormat}
                    onChange={(val) => general.setSetting('timeFormat', val)}
                    options={['12 hour', '24 hour']}
                />
            </div>

            {/* Appearance */}
            <div className="settings-section">
                <div className="settings-section-header">Appearance</div>
                <div className="setting-row">
                    <div style={{ width: '100%' }}>
                        <Select
                            value={general.darkMode}
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
                    <Toggle active={general.autoStartNextTask} onChange={() => general.setSetting('autoStartNextTask', !general.autoStartNextTask)} />
                </div>

                <div className="setting-indent">
                    <button className="setting-action-btn">
                        Change Timer Background <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Braindump & Lists */}
            <div className="settings-section">
                <div className="settings-section-header">Braindump & Lists</div>

                <div className="setting-row">
                    <span className="setting-label">Sidebar layout</span>
                    <Select
                        value={general.sidebarLayout}
                        onChange={(val) => general.setSetting('sidebarLayout', val)}
                        options={['Show one list', 'Show all lists']}
                    />
                </div>
            </div>

            {/* New Task / Update Task */}
            <div className="settings-section">
                <div className="settings-section-header">New Task / Update Task</div>

                <div className="setting-row">
                    <span className="setting-label">Add new tasks to the</span>
                    <Select
                        value={general.addNewTasksTo}
                        onChange={(val) => general.setSetting('addNewTasksTo', val)}
                        options={['Top of list', 'Bottom of list']}
                    />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Detect label in task title</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Toggle active={general.detectLabel} onChange={() => general.setSetting('detectLabel', !general.detectLabel)} />
                        <span className="settings-info-link">(what is this?)</span>
                    </div>
                </div>

                <div className="setting-row">
                    <span className="setting-label">Default estimated time (for new tasks)</span>
                    <Select
                        value={general.defaultEstimatedTime}
                        onChange={(val) => general.setSetting('defaultEstimatedTime', val)}
                        options={['0 mins', '15 mins', '30 mins', '1 hour']}
                    />
                </div>
            </div>

            {/* Task Rollover */}
            <div className="settings-section">
                <div className="settings-section-header">Task Rollover</div>

                <div className="setting-row">
                    <span className="setting-label">Roll-over tasks to the next day</span>
                    <Toggle active={general.rolloverNextDay} onChange={() => general.setSetting('rolloverNextDay', !general.rolloverNextDay)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Roll-over recurring tasks</span>
                    <Toggle active={general.rolloverRecurring} onChange={() => general.setSetting('rolloverRecurring', !general.rolloverRecurring)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Roll over tasks to the</span>
                    <Select
                        value={general.rolloverTo}
                        onChange={(val) => general.setSetting('rolloverTo', val)}
                        options={['Bottom of list', 'Top of list']}
                    />
                </div>
            </div>
        </div>
    );
});
