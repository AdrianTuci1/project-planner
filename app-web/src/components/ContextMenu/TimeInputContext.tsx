import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { ContextMenu, MenuHeader } from './ContextMenu';
import './TimeInputContext.css';
import { Task } from '../../models/core';
import { TaskUIModel } from '../../models/TaskUIModel';

interface TimeInputContextProps {
    ui: TaskUIModel;
    task: Task;
}

export const TimeInputContext = observer(({
    ui,
    task,
}: TimeInputContextProps) => {
    // Derived state
    const title = ui.timeContext.type === 'estimated' ? 'Set estimated time' : 'Set actual time';
    const initialDuration = ui.timeContext.type === 'estimated' ? (task.duration || 0) : (task.actualDuration || 0);

    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);

    useEffect(() => {
        if (ui.timeContext.isOpen) {
            setHours(Math.floor(initialDuration / 60));
            setMinutes(initialDuration % 60);
        }
    }, [ui.timeContext.isOpen, initialDuration]);

    const handleSave = () => {
        const totalMinutes = hours * 60 + minutes;

        if (ui.timeContext.type === 'estimated') {
            task.duration = totalMinutes;
        } else {
            task.actualDuration = totalMinutes;
        }

        ui.closeTimeContext();
    };

    return (
        <ContextMenu
            isOpen={ui.timeContext.isOpen}
            onClose={() => ui.closeTimeContext()}
            position={ui.timeContext.position}
        >
            <MenuHeader title={title} onClose={() => ui.closeTimeContext()} />
            <div className="time-input-content">
                <div className="time-inputs-row">
                    <div className="time-input-field">
                        <label className="time-input-label">Hours</label>
                        <input
                            type="number"
                            min="0"
                            className="context-menu-input"
                            value={hours}
                            onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                    </div>
                    <div className="time-input-field">
                        <label className="time-input-label">Minutes</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            className="context-menu-input"
                            value={minutes}
                            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        />
                    </div>
                </div>
                <div className="context-menu-button-group">
                    <button className="context-menu-button" onClick={() => ui.closeTimeContext()}>
                        Cancel
                    </button>
                    <button className="context-menu-button primary" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </ContextMenu>
    );
});
