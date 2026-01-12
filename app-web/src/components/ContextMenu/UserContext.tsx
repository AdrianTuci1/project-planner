import React from 'react';
import { ContextMenu, MenuItem, MenuSeparator } from './ContextMenu';

import {
    Settings,
    BarChart2,
    Calendar,
    Moon,
    Command,
    HelpCircle,
    MessageSquare,
    LogOut
} from 'lucide-react';

interface UserContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    onSettings?: () => void;
    onAnalytics?: () => void;
    onDailyPlanning?: () => void;
    onDailyShutdown?: () => void;
    onKeyboardShortcuts?: () => void;
    onHelpSupport?: () => void;
    onGiveFeedback?: () => void;
    onLogout?: () => void;
}

export const UserContext: React.FC<UserContextProps> = ({
    isOpen,
    onClose,
    position,
    onSettings,
    onAnalytics,
    onDailyPlanning,
    onDailyShutdown,
    onKeyboardShortcuts,
    onHelpSupport,
    onGiveFeedback,
    onLogout,
}) => {
    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuItem
                icon={<Settings size={16} />}
                label="Settings"
                onClick={onSettings}
            />
            <MenuItem
                icon={<BarChart2 size={16} />}
                label="Analytics"
                onClick={onAnalytics}
            />
            <MenuItem
                icon={<Calendar size={16} />}
                label="Daily planning"
                onClick={onDailyPlanning}
            />
            <MenuItem
                icon={<Moon size={16} />}
                label="Daily shutdown"
                onClick={onDailyShutdown}
            />
            <MenuItem
                icon={<Command size={16} />}
                label="Keyboard shortcuts"
                onClick={onKeyboardShortcuts}
            />
            <MenuItem
                icon={<HelpCircle size={16} />}
                label="Help & support"
                onClick={onHelpSupport}
            />
            <MenuItem
                icon={<MessageSquare size={16} />}
                label="Give feedback"
                onClick={onGiveFeedback}
            />
            <MenuSeparator />
            <MenuItem
                icon={<LogOut size={16} />}
                label="Log out"
                onClick={onLogout}
            />
        </ContextMenu>
    );
};
