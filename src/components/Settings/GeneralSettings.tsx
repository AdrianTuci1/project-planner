import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

export const GeneralSettings = () => {
    // Mock State
    const [moveTasksBottom, setMoveTasksBottom] = useState(true);
    const [markCompleteSubtasks, setMarkCompleteSubtasks] = useState(true);
    const [autoSetActualTime, setAutoSetActualTime] = useState(false);
    const [deepLinkDetection, setDeepLinkDetection] = useState(true);

    const [startWeekOn, setStartWeekOn] = useState('Sunday');
    const [showWeekends, setShowWeekends] = useState(true);
    const [workdayThreshold, setWorkdayThreshold] = useState(true);
    const [workloadThreshold, setWorkloadThreshold] = useState('8 hours');
    const [showDeclinedEvents, setShowDeclinedEvents] = useState(true);
    const [startDayAt, setStartDayAt] = useState('12:00 AM');
    const [calendarIncrements, setCalendarIncrements] = useState('15 minute');
    const [timeFormat, setTimeFormat] = useState('12 hour');

    const [darkMode, setDarkMode] = useState('Dark mode');

    const [autoStartNextTask, setAutoStartNextTask] = useState(false);

    const [sidebarLayout, setSidebarLayout] = useState('Show one list');

    const [addNewTasksTo, setAddNewTasksTo] = useState('Top of list');
    const [detectLabel, setDetectLabel] = useState(true);
    const [defaultEstimatedTime, setDefaultEstimatedTime] = useState('0 mins');

    const [rolloverNextDay, setRolloverNextDay] = useState(true);
    const [rolloverRecurring, setRolloverRecurring] = useState(false);
    const [rolloverTo, setRolloverTo] = useState('Bottom of list');

    return (
        <div className="general-settings-container">
            {/* After Task Completion */}
            <div className="settings-section">
                <div className="settings-section-header">After Task Completion</div>

                <div className="setting-row">
                    <span className="setting-label">Move tasks (and subtasks) to the bottom of the list on complete</span>
                    <Toggle active={moveTasksBottom} onChange={() => setMoveTasksBottom(!moveTasksBottom)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Mark tasks as complete when subtasks are complete</span>
                    <Toggle active={markCompleteSubtasks} onChange={() => setMarkCompleteSubtasks(!markCompleteSubtasks)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Automatically set "actual time" when task is complete</span>
                    <Toggle active={autoSetActualTime} onChange={() => setAutoSetActualTime(!autoSetActualTime)} />
                </div>
            </div>

            <div className="settings-group-decoration">
                <div className="setting-row">
                    <span className="setting-label">Enable deep link detection for external apps</span>
                    <Toggle active={deepLinkDetection} onChange={() => setDeepLinkDetection(!deepLinkDetection)} />
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
                        value={startWeekOn}
                        onChange={setStartWeekOn}
                        options={['Sunday', 'Monday', 'Saturday']}
                    />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Show weekends</span>
                    <Toggle active={showWeekends} onChange={() => setShowWeekends(!showWeekends)} />
                </div>
            </div>

            <div className="settings-group-decoration">
                <div className="setting-row">
                    <span className="setting-label">Set a workday threshold?</span>
                    <Toggle active={workdayThreshold} onChange={() => setWorkdayThreshold(!workdayThreshold)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Workload Threshold</span>
                    <Select
                        value={workloadThreshold}
                        onChange={setWorkloadThreshold}
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
                <Toggle active={showDeclinedEvents} onChange={() => setShowDeclinedEvents(!showDeclinedEvents)} />
            </div>

            <div className="setting-row">
                <span className="setting-label">Start day at</span>
                <Select
                    value={startDayAt}
                    onChange={setStartDayAt}
                    options={['12:00 AM', '6:00 AM', '8:00 AM', '9:00 AM']}
                />
            </div>

            <div className="setting-row">
                <span className="setting-label">Calendar time increments</span>
                <Select
                    value={calendarIncrements}
                    onChange={setCalendarIncrements}
                    options={['15 minute', '30 minute', '1 hour']}
                />
            </div>

            <div className="setting-row">
                <span className="setting-label">Time format</span>
                <Select
                    value={timeFormat}
                    onChange={setTimeFormat}
                    options={['12 hour', '24 hour']}
                />
            </div>

            {/* Appearance */}
            <div className="settings-section">
                <div className="settings-section-header">Appearance</div>
                <div className="setting-row">
                    <div style={{ width: '100%' }}>
                        <Select
                            value={darkMode}
                            onChange={setDarkMode}
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
                    <Toggle active={autoStartNextTask} onChange={() => setAutoStartNextTask(!autoStartNextTask)} />
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
                        value={sidebarLayout}
                        onChange={setSidebarLayout}
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
                        value={addNewTasksTo}
                        onChange={setAddNewTasksTo}
                        options={['Top of list', 'Bottom of list']}
                    />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Detect label in task title</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Toggle active={detectLabel} onChange={() => setDetectLabel(!detectLabel)} />
                        <span className="settings-info-link">(what is this?)</span>
                    </div>
                </div>

                <div className="setting-row">
                    <span className="setting-label">Default estimated time (for new tasks)</span>
                    <Select
                        value={defaultEstimatedTime}
                        onChange={setDefaultEstimatedTime}
                        options={['0 mins', '15 mins', '30 mins', '1 hour']}
                    />
                </div>
            </div>

            {/* Task Rollover */}
            <div className="settings-section">
                <div className="settings-section-header">Task Rollover</div>

                <div className="setting-row">
                    <span className="setting-label">Roll-over tasks to the next day</span>
                    <Toggle active={rolloverNextDay} onChange={() => setRolloverNextDay(!rolloverNextDay)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Roll-over recurring tasks</span>
                    <Toggle active={rolloverRecurring} onChange={() => setRolloverRecurring(!rolloverRecurring)} />
                </div>

                <div className="setting-row">
                    <span className="setting-label">Roll over tasks to the</span>
                    <Select
                        value={rolloverTo}
                        onChange={setRolloverTo}
                        options={['Bottom of list', 'Top of list']}
                    />
                </div>
            </div>
        </div>
    );
};
