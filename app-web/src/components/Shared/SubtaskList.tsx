import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Task } from '../../models/core';
import { Check, Plus, GripVertical, Trash2 } from 'lucide-react';
import './SubtaskList.css';

interface SubtaskListProps {
    task: Task;
    autoFocusNew?: boolean;
}

export const SubtaskList = observer(({ task, autoFocusNew = false }: SubtaskListProps) => {
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const handleAddSubtask = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (newSubtaskTitle.trim()) {
                task.addSubtask(newSubtaskTitle);
                setNewSubtaskTitle('');
                // Keep focus logic if needed, but the simple state reset works for now
                // We rely on the input staying rendered
            }
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        e.stopPropagation();
        const dragIndexStr = e.dataTransfer.getData('text/plain');
        if (!dragIndexStr) return;

        const dragIndex = parseInt(dragIndexStr, 10);
        if (dragIndex !== dropIndex) {
            task.reorderSubtask(dragIndex, dropIndex);
        }
    };

    return (
        <div className="tc-subtasks-list" onClick={e => e.stopPropagation()}>
            {task.subtasks.map((sub, index) => (
                <div
                    key={sub.id}
                    className="tc-subtask-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                >
                    <div className="tc-subtask-drag-handle">
                        <GripVertical size={12} />
                    </div>
                    <div
                        className={`tc-subtask-check ${sub.isCompleted ? 'checked' : ''}`}
                        onClick={() => sub.isCompleted = !sub.isCompleted}
                    >
                        {sub.isCompleted && <Check size={10} />}
                    </div>
                    <input
                        className="tc-subtask-input"
                        value={sub.title}
                        onChange={(e) => sub.title = e.target.value}
                        style={{ textDecoration: sub.isCompleted ? 'line-through' : 'none' }}
                    />
                    <div className="tc-subtask-delete" onClick={() => task.removeSubtask(sub.id)}>
                        <Trash2 size={12} />
                    </div>
                </div>
            ))}
            <div className="tc-add-subtask">
                <Plus size={14} />
                <input
                    className="tc-subtask-input"
                    placeholder="Add subtask"
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={handleAddSubtask}
                    autoFocus={autoFocusNew}
                />
            </div>
        </div>
    );
});
