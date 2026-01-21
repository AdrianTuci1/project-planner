import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Search, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import './SearchSpotlight.css';

interface SearchSpotlightProps {
    onClose: () => void;
}

export const SearchSpotlight = observer(({ onClose }: SearchSpotlightProps) => {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Focus input on mount
        inputRef.current?.focus();

        // Close on Escape key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const filteredTasks = query.trim()
        ? store.allTasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()))
        : [];

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) {
            return <span>{text}</span>;
        }
        const regex = new RegExp(`(${highlight})`, 'gi');
        const parts = text.split(regex);
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="highlight-match">
                            {part}
                        </span>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </span>
        );
    };

    return (
        <div className="spotlight-overlay" onClick={onClose}>
            <div className="spotlight-container" onClick={e => e.stopPropagation()}>
                <div className="spotlight-search-bar">
                    <Search className="spotlight-icon" size={20} />
                    <input
                        ref={inputRef}
                        className="spotlight-input"
                        placeholder="Search tasks..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                </div>
                <div className="spotlight-results">
                    {query.trim() === '' ? (
                        <div className="spotlight-no-results">
                            Type to search for tasks...
                        </div>
                    ) : filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <div
                                key={task.id}
                                className="spotlight-result-item"
                                onClick={() => {
                                    store.openTaskModal(task);
                                    onClose();
                                }}
                            >
                                <div className="spotlight-result-content">
                                    <div className="spotlight-result-header">
                                        <span className="spotlight-result-title">
                                            {highlightText(task.title, query)}
                                        </span>
                                        <span className="spotlight-result-date">
                                            {task.scheduledDate
                                                ? format(new Date(task.scheduledDate), 'MMM d, yyyy')
                                                : ''}
                                        </span>
                                    </div>
                                    <div className="spotlight-result-meta">
                                        {task.labelId && (() => {
                                            const label = store.getLabel(task.labelId);
                                            if (!label) return null;
                                            return (
                                                <div className="spotlight-meta-item">
                                                    <div className="spotlight-label">
                                                        <div
                                                            className="spotlight-label-dot"
                                                            style={{ backgroundColor: label.color }}
                                                        />
                                                        <span>{label.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        <div className="spotlight-meta-item">
                                            <Link2 size={12} className="spotlight-meta-icon" style={{ transform: 'rotate(-45deg)' }} />
                                            <span>
                                                {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                                            </span>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="spotlight-no-results">
                            No tasks found for "{query}"
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
