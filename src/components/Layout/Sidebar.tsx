import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    Plus,
    Settings,
    ChevronDown,
    ChevronRight,
    List
} from 'lucide-react';
import { useState } from 'react';
import { SettingsModal } from '../Settings/SettingsModal';
import { CreateListModal } from '../Sidebar/CreateListModal';
import './Sidebar.css';

export const Sidebar = observer(() => {
    const [showSettings, setShowSettings] = useState(false);
    const [showCreateList, setShowCreateList] = useState(false);
    const [isListsExpanded, setIsListsExpanded] = useState(false);

    return (
        <>
            <aside className="sidebar">
                {/* App Header / User */}
                <div className="sidebar-header">
                    <div className="user-avatar" />
                    <span className="app-name">
                        Brain Force
                    </span>
                    <Settings
                        size={16}
                        className="settings-icon"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowSettings(true)}
                    />
                </div>

                {/* Lists Toggle Header */}
                <div
                    className="nav-group-header"
                    onClick={() => setIsListsExpanded(!isListsExpanded)}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <List size={16} />
                        <span>Lists</span>
                    </div>
                    {isListsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </div>

                {isListsExpanded && (
                    <div className="lists-menu">
                        {/* Brain Dump List */}
                        <div
                            onClick={() => store.activeGroupId = null}
                            className={`sub-nav-item ${store.activeGroupId === null ? 'active' : ''}`}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span>🧠</span>
                                <span>Brain Dump</span>
                            </div>
                            <span className="count">{store.dumpAreaTasks.length}</span>
                        </div>

                        {/* User Groups */}
                        {store.groups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => store.activeGroupId = group.id}
                                className={`sub-nav-item ${store.activeGroupId === group.id ? 'active' : ''}`}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span>🐙</span>
                                    <span>{group.name}</span>
                                </div>
                                <span className="count">{group.tasks.length}</span>
                            </div>
                        ))}

                        {/* New List Button */}
                        <div
                            className="sub-nav-item new-list"
                            onClick={() => setShowCreateList(true)}
                        >
                            <Plus size={14} />
                            <span>New List</span>
                        </div>
                    </div>
                )}

                {/* Create Task Mini Card */}
                <div className="create-task-wrapper">
                    <div className="card-container-create">
                        <div className="card-header">
                            <textarea
                                className="card-description"
                                placeholder="What needs to be done?"
                                rows={1}
                                onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                            />
                            <div className="card-time-estimate">0:00</div>
                        </div>
                        <div className="card-footer creation">
                            <div className="card-left-buttons">
                                <div className="card-no-label">Select Label</div>
                                <div className="subtask-button-container">
                                    <List size={12} />
                                </div>
                                <div className="subtask-button-container">
                                    <Settings size={12} /> {/* Placeholder for Repeat/Settings */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
            {showCreateList && <CreateListModal onClose={() => setShowCreateList(false)} />}
        </>
    );
});
