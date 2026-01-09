import React from 'react';
import { ContextMenu, MenuItem, MenuSeparator } from './ContextMenu';

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
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
                    </svg>
                }
                label="Settings"
                onClick={onSettings}
            />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 3v18h18M7 16l4-4 4 4 6-6" />
                    </svg>
                }
                label="Analytics"
                onClick={onAnalytics}
            />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                    </svg>
                }
                label="Daily planning"
                onClick={onDailyPlanning}
            />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v18m0-18a9 9 0 019 9m-9-9a9 9 0 00-9 9m18 0a9 9 0 01-9 9m9-9H3m9 9a9 9 0 01-9-9" />
                    </svg>
                }
                label="Daily shutdown"
                onClick={onDailyShutdown}
            />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M9 9h6v6H9z" />
                    </svg>
                }
                label="Keyboard shortcuts"
                onClick={onKeyboardShortcuts}
            />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4m0-4h.01" />
                    </svg>
                }
                label="Help & support"
                onClick={onHelpSupport}
            />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                    </svg>
                }
                label="Give feedback"
                onClick={onGiveFeedback}
            />
            <MenuSeparator />
            <MenuItem
                icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9" />
                    </svg>
                }
                label="Log out"
                onClick={onLogout}
            />
        </ContextMenu>
    );
};
