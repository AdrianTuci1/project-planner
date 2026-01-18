import React from 'react';
import { CheckSquare, Inbox, Calendar, Settings } from 'lucide-react';
import './BottomDock.css';

export type DockTab = 'tasks' | 'inbox' | 'timebox' | 'settings';

interface BottomDockProps {
    activeTab: DockTab;
    onTabChange: (tab: DockTab) => void;
}

export const BottomDock = ({ activeTab, onTabChange }: BottomDockProps) => {
    return (
        <div className="bottom-dock">
            <button
                className={`dock-item ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => onTabChange('tasks')}
            >
                <CheckSquare size={20} />
                <span>Tasks</span>
            </button>

            <button
                className={`dock-item ${activeTab === 'inbox' ? 'active' : ''}`}
                onClick={() => onTabChange('inbox')}
            >
                <Inbox size={20} />
                <span>Inbox</span>
            </button>

            <button
                className={`dock-item ${activeTab === 'timebox' ? 'active' : ''}`}
                onClick={() => onTabChange('timebox')}
            >
                <Calendar size={20} />
                <span>Timebox</span>
            </button>

            <button
                className={`dock-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => onTabChange('settings')}
            >
                <Settings size={20} />
                <span>Settings</span>
            </button>
        </div>
    );
};
