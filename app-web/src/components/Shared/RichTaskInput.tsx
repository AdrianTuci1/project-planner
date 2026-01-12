import React, { useState } from 'react';
import {
    Plus,
    Flag,
    Link,
    Repeat,
    Clock
} from 'lucide-react';
import './RichTaskInput.css';

interface RichTaskInputProps {
    onAddTask: (title: string, meta: any) => void;
    placeholder?: string;
}

export const RichTaskInput = ({ onAddTask, placeholder = "Add a task" }: RichTaskInputProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('0:00');

    const handleSubmit = () => {
        if (title.trim()) {
            onAddTask(title, { duration });
            setTitle('');
            setIsExpanded(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        } else if (e.key === 'Escape') {
            setIsExpanded(false);
        }
    };

    if (!isExpanded) {
        return (
            <div className="collapsed-input" onClick={() => setIsExpanded(true)}>
                <Plus size={16} />
                <span>{placeholder}</span>
            </div>
        );
    }

    return (
        <div className="rich-input-container">
            {/* Top Row: Input + Timer */}
            <div className="rich-input-row">
                <input
                    className="rich-text-input"
                    placeholder="What needs to be done?"
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <div className="rich-duration-badge">
                    {duration}
                </div>
            </div>

            {/* Bottom Row: Controls */}
            <div className="rich-controls-row">
                <span className="rich-btn-text">Select Label</span>

                <div className="rich-icon-group">
                    <Flag size={14} className="rich-icon-btn" />
                    <Link size={14} className="rich-icon-btn" />
                    <Repeat size={14} className="rich-icon-btn" />
                </div>
            </div>
        </div>
    );
};
