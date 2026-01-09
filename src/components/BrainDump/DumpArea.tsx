import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Plus, Circle, CheckCircle2 } from 'lucide-react';
import { Task } from '../../models/core';
import { TaskCard } from '../TaskDetails/TaskCard';
import { RichTaskInput } from '../Shared/RichTaskInput';
import { TopBar } from '../Navigation/TopBar';
import './DumpArea.css';

const TaskItem = observer(({ task, onClick }: { task: Task; onClick: () => void }) => {
    return (
        <div className="task-item" onClick={onClick}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    task.toggleStatus();
                }}
                className={`task-check-btn ${task.status === 'done' ? 'checked' : ''}`}
            >
                {task.status === 'done' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>

            <span className={`task-text ${task.status === 'done' ? 'completed' : ''}`}>
                {task.title}
            </span>

            {task.labels.map(label => (
                <span key={label} className="task-label">
                    {label}
                </span>
            ))}
        </div>
    );
});

export const DumpArea = observer(() => {
    const [inputVal, setInputVal] = useState('');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputVal.trim()) {
            store.addTaskToDump(inputVal);
            setInputVal('');
        }
    };

    return (
        <div className="dump-container">
            <div className="dump-header">
                <span style={{ fontSize: 'var(--text-2xl)' }}>🧠</span>
                <h1 className="dump-title">Brain Dump</h1>
            </div>

            {/* Rich Task Input */}
            <div className="task-input-wrapper" style={{ padding: '0 20px' }}>
                <RichTaskInput onAddTask={(title) => store.addTaskToDump(title)} />
            </div>

            {/* List */}
            <div className="task-list">
                {store.dumpAreaTasks.map(task => (
                    <TaskItem key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                ))}
            </div>

            {/* Modal */}
            {selectedTask && (
                <TaskCard task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
});
