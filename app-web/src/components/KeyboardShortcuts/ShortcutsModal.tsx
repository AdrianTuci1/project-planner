import React from 'react';
import { X } from 'lucide-react';
import './ShortcutsModal.css';

interface ShortcutsModalProps {
    onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ onClose }) => {
    // Prevent click propagation from the modal content to the overlay
    const handleContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div className="shortcuts-modal-overlay" onClick={onClose}>
            <div className="shortcuts-modal-content" onClick={handleContentClick}>
                <div className="shortcuts-modal-header">
                    <h2>Keyboard shortcuts</h2>
                    <button className="shortcuts-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="shortcuts-modal-body">
                    {/* MOST POPULAR */}
                    <div className="shortcuts-section">
                        <h3>Most Popular</h3>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">?</kbd>
                            </div>
                            <span className="shortcut-desc">View keyboard shortcuts</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + K</kbd>
                            </div>
                            <span className="shortcut-desc">Task search</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">SHIFT + F</kbd>
                            </div>
                            <span className="shortcut-desc">Show only today</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">B</kbd>
                            </div>
                            <span className="shortcut-desc">Create Braindump task</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">T</kbd>
                            </div>
                            <span className="shortcut-desc">Create task today</span>
                        </div>
                    </div>

                    {/* TASK ACTIONS */}
                    <div className="shortcuts-section">
                        <h3>Task Actions</h3>
                        <div className="shortcuts-section-desc">
                            A trick to remember these: "C is for complete", "S is for subtasks", "L is for labels" etc...
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">Enter</kbd>
                            </div>
                            <span className="shortcut-desc">Edit / save description</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + Enter</kbd>
                            </div>
                            <span className="shortcut-desc">Create task (from modal)</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + Delete</kbd>
                            </div>
                            <span className="shortcut-desc">Delete task</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + L</kbd>
                            </div>
                            <span className="shortcut-desc">Select label</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + I</kbd>
                            </div>
                            <span className="shortcut-desc">Toggle time section</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + E</kbd>
                            </div>
                            <span className="shortcut-desc">Set estimated/planned time</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + B</kbd>
                            </div>
                            <span className="shortcut-desc">Set actual time</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + SHIFT + ENTER</kbd>
                            </div>
                            <span className="shortcut-desc">Start (or stop) timer</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">Esc</kbd>
                            </div>
                            <span className="shortcut-desc">De-select task</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">C</kbd>
                            </div>
                            <span className="shortcut-desc">Mark as complete</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">S</kbd>
                            </div>
                            <span className="shortcut-desc">View / hide subtasks</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + S</kbd>
                            </div>
                            <span className="shortcut-desc">Create new subtask</span>
                        </div>
                    </div>

                    {/* NAVIGATION */}
                    <div className="shortcuts-section">
                        <h3>Navigation</h3>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">D</kbd>
                            </div>
                            <span className="shortcut-desc">Day view (in calendar mode)</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">W</kbd>
                            </div>
                            <span className="shortcut-desc">Week view (in calendar mode)</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">M</kbd>
                            </div>
                            <span className="shortcut-desc">Month view (in calendar mode)</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">Shift + T</kbd>
                            </div>
                            <span className="shortcut-desc">Go to (and select first task) today</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">Shift + B</kbd>
                            </div>
                            <span className="shortcut-desc">Select first task of the braindump</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">Tab</kbd>
                            </div>
                            <span className="shortcut-desc">Switch between Calendar and Kanban view</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">↓</kbd>
                            </div>
                            <span className="shortcut-desc">Next Task</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">↑</kbd>
                            </div>
                            <span className="shortcut-desc">Previous Task</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">→</kbd>
                            </div>
                            <span className="shortcut-desc">Select first task on next day</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">←</kbd>
                            </div>
                            <span className="shortcut-desc">Select first task on previous day</span>
                        </div>

                        <div className="shortcut-item">
                            <div className="shortcut-keys">
                                <kbd className="kbd">⌘ + SHIFT + P</kbd>
                            </div>
                            <span className="shortcut-desc">Go to Daily Planning</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
