import React, { useState } from 'react';
import { UserContext } from './UserContext';
import { LabelContext } from './LabelContext';
import { CreateLabelContext } from './CreateLabelContext';
import { FilterContext } from './FilterContext';
import { MakeRecurringTaskContext } from './MakeRecurringTaskContext';
import { RecurringTaskActionsContext } from './RecurringTaskActionsContext';
import './ContextMenu.css';

type MenuType =
    | 'user'
    | 'label'
    | 'createLabel'
    | 'filter'
    | 'makeRecurring'
    | 'recurringActions'
    | null;

export const ContextMenuDemo: React.FC = () => {
    const [activeMenu, setActiveMenu] = useState<MenuType>(null);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const openMenu = (menu: MenuType, event: React.MouseEvent) => {
        const button = event.currentTarget as HTMLElement;
        const rect = button.getBoundingClientRect();
        setMenuPosition({
            x: rect.left,
            y: rect.bottom + 8,
        });
        setActiveMenu(menu);
    };

    return (
        <div
            style={{
                padding: '40px',
                minHeight: '100vh',
                background: 'var(--bg-app)',
            }}
        >
            <h1
                style={{
                    color: 'var(--text-main)',
                    fontSize: 'var(--text-2xl)',
                    marginBottom: 'var(--space-6)',
                }}
            >
                Context Menu Demo
            </h1>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--space-4)',
                    maxWidth: '800px',
                }}
            >
                <button
                    className="context-menu-button"
                    onClick={(e) => openMenu('user', e)}
                    style={{ padding: 'var(--space-3)' }}
                >
                    User Context
                </button>

                <button
                    className="context-menu-button"
                    onClick={(e) => openMenu('label', e)}
                    style={{ padding: 'var(--space-3)' }}
                >
                    Label Context
                </button>

                <button
                    className="context-menu-button"
                    onClick={(e) => openMenu('createLabel', e)}
                    style={{ padding: 'var(--space-3)' }}
                >
                    Create Label Context
                </button>

                <button
                    className="context-menu-button"
                    onClick={(e) => openMenu('filter', e)}
                    style={{ padding: 'var(--space-3)' }}
                >
                    Filter Context
                </button>

                <button
                    className="context-menu-button"
                    onClick={(e) => openMenu('makeRecurring', e)}
                    style={{ padding: 'var(--space-3)' }}
                >
                    Make Recurring Task
                </button>

                <button
                    className="context-menu-button"
                    onClick={(e) => openMenu('recurringActions', e)}
                    style={{ padding: 'var(--space-3)' }}
                >
                    Recurring Task Actions
                </button>
            </div>

            <div
                style={{
                    marginTop: 'var(--space-8)',
                    padding: 'var(--space-4)',
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                }}
            >
                <h2
                    style={{
                        color: 'var(--text-main)',
                        fontSize: 'var(--text-lg)',
                        marginBottom: 'var(--space-3)',
                    }}
                >
                    Instructions
                </h2>
                <ul
                    style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                        lineHeight: 1.6,
                    }}
                >
                    <li>Click any button above to open the corresponding context menu</li>
                    <li>Click outside the menu or press Escape to close it</li>
                    <li>All menus are fully functional with interactive elements</li>
                    <li>These are standalone components ready for integration</li>
                </ul>
            </div>

            {/* Render all context menus */}
            <UserContext
                isOpen={activeMenu === 'user'}
                onClose={() => setActiveMenu(null)}
                position={menuPosition}
                onSettings={() => console.log('Settings clicked')}
                onAnalytics={() => console.log('Analytics clicked')}
                onDailyPlanning={() => console.log('Daily planning clicked')}
                onDailyShutdown={() => console.log('Daily shutdown clicked')}
                onKeyboardShortcuts={() => console.log('Keyboard shortcuts clicked')}
                onHelpSupport={() => console.log('Help & support clicked')}
                onGiveFeedback={() => console.log('Give feedback clicked')}
                onLogout={() => console.log('Log out clicked')}
            />

            <LabelContext
                isOpen={activeMenu === 'label'}
                onClose={() => setActiveMenu(null)}
                position={menuPosition}
                onCreateLabel={() => {
                    setActiveMenu('createLabel');
                }}
                onEditLabels={() => console.log('Edit labels clicked')}
                onSelectLabel={(label) => console.log('Selected label:', label)}
            />

            <CreateLabelContext
                isOpen={activeMenu === 'createLabel'}
                onClose={() => setActiveMenu(null)}
                position={menuPosition}
                onCreateLabel={(name, color) => {
                    console.log('Created label:', name, color);
                }}
            />

            <FilterContext
                isOpen={activeMenu === 'filter'}
                onClose={() => setActiveMenu(null)}
                position={menuPosition}
                onToggleLabel={(labelId) => console.log('Toggled label:', labelId)}
                onSelectAll={() => console.log('Select all clicked')}
                onClearAll={() => console.log('Clear all clicked')}
                onToggleComplete={(value) => console.log('Show complete:', value)}
                onToggleTimeboxed={(value) => console.log('Show timeboxed:', value)}
                onEditLabels={() => console.log('Edit labels clicked')}
            />

            <MakeRecurringTaskContext
                isOpen={activeMenu === 'makeRecurring'}
                onClose={() => setActiveMenu(null)}
                position={menuPosition}
                selectedRecurrence="weekday"
                onSelectRecurrence={(type) => console.log('Selected recurrence:', type)}
                onToggleSpecificTime={(enabled) => console.log('Specific time:', enabled)}
                onChangeTime={(time) => console.log('Time changed:', time)}
            />

            <RecurringTaskActionsContext
                isOpen={activeMenu === 'recurringActions'}
                onClose={() => setActiveMenu(null)}
                position={menuPosition}
                onUpdateRecurrence={() => console.log('Update recurrence clicked')}
                onStopRepeating={() => console.log('Stop repeating clicked')}
                onUpdateAllTasks={() => console.log('Update all tasks clicked')}
                onDeleteAllInstances={() => console.log('Delete all instances clicked')}
            />
        </div>
    );
};
