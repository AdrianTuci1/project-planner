import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Check, Square, Pause, Play } from 'lucide-react';
import './TaskTimer.css';

export const TaskTimer = observer(() => {
    const [elapsed, setElapsed] = useState(0);
    const [message, setMessage] = useState<string | null>(null);
    const intervalRef = useRef<any>(null);

    const task = store.activeTimerTaskId ? store.getTaskById(store.activeTimerTaskId) : null;

    useEffect(() => {
        if (store.timerStatus === 'running') {
            const updateTime = () => {
                if (store.timerStartTime) {
                    const now = Date.now();
                    const currentRunDuration = Math.floor((now - store.timerStartTime) / 1000);
                    setElapsed(store.timerAccumulatedTime + currentRunDuration);
                }
            };

            // Initial update
            updateTime();

            intervalRef.current = setInterval(updateTime, 1000);
        } else {
            setElapsed(store.timerAccumulatedTime);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [store.timerStatus, store.timerStartTime, store.timerAccumulatedTime]);

    if (!task && !message) return null;
    if (!store.activeTimerTaskId && !message) return null;

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStop = () => {
        store.pauseTimer(); // Pause first to freeze time
        setMessage("✨ Time saved, closing timer now...");
        setTimeout(() => {
            store.stopTimer();
            setMessage(null);
        }, 2000);
    };

    const handleComplete = () => {
        store.pauseTimer();
        setMessage("🥳 Great job! Closing timer now...");

        // Mark task as done
        if (task) {
            task.status = 'done';
        }

        setTimeout(() => {
            store.stopTimer();
            setMessage(null);
        }, 2000);
    };

    const handleTogglePause = () => {
        if (store.timerStatus === 'running') {
            store.pauseTimer();
        } else {
            store.resumeTimer();
        }
    };

    return (
        <div className="task-timer-container">
            {message ? (
                <div className="task-timer-message">{message}</div>
            ) : (
                <>
                    <div className="task-timer-info">
                        <div className="task-timer-time">{formatTime(elapsed)}</div>
                        <div className="task-timer-task-name">{task?.title || 'Unknown Task'}</div>
                    </div>

                    <div className="task-timer-controls-wrapper">
                        {/* Hidden buttons appearing on hover */}
                        <div className="task-timer-controls">
                            <button className="timer-btn complete" onClick={handleComplete} title="Complete Task">
                                <Check size={16} />
                            </button>
                            <button className="timer-btn stop" onClick={handleStop} title="Stop Timer">
                                <Square size={12} fill="currentColor" />
                            </button>
                        </div>

                        {/* Always visible Pause/Play button */}
                        <button className="timer-btn pause task-timer-controls-trigger" onClick={handleTogglePause} title={store.timerStatus === 'running' ? "Pause" : "Resume"}>
                            {store.timerStatus === 'running' ? (
                                <Pause size={16} fill="currentColor" />
                            ) : (
                                <Play size={16} fill="currentColor" />
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
});
