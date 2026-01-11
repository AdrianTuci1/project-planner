import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    Calendar as CalendarIcon,
    Layout,
    PanelLeft,
    PanelRight,
    Search
} from 'lucide-react';
import { addDays } from 'date-fns';
import '../Layout/KanbanLayout.css';

import { UserContext } from '../ContextMenu/UserContext';
import { FilterContext } from '../ContextMenu/FilterContext';
import { SettingsModal } from '../Settings/SettingsModal';
import { SearchSpotlight } from './SearchSpotlight';

const topbarStyles = `
  .trial-button {
    background: linear-gradient(90deg, #8B5CF6, #EC4899);
    border: none !important;
    color: white !important;
    font-weight: 500;
  }
  .trial-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;
// Inject styles
const styleSheet = document.createElement("style");
styleSheet.innerText = topbarStyles;
document.head.appendChild(styleSheet);

export const TopBar = observer(() => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [filterMenuOpen, setFilterMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false); // New state for search
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const handleUserClick = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPosition({ x: rect.right - 200, y: rect.bottom + 5 });
        setUserMenuOpen(true);
    };

    const handleFilterClick = (e: React.MouseEvent) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPosition({ x: rect.left, y: rect.bottom + 5 });
        setFilterMenuOpen(true);
    };

    const toggleSidebar = () => {
        store.isSidebarOpen = !store.isSidebarOpen;
    };

    const goToToday = () => {
        store.setDate(new Date());
    };

    const goToPreviousDay = () => {
        store.setDate(addDays(store.viewDate, -1));
    };

    const goToNextDay = () => {
        store.setDate(addDays(store.viewDate, 1));
    };

    return (
        <div className="kanban-topbar">
            {/* LEFT SECTION */}
            <div className="topbar-left">
                <div onClick={toggleSidebar} style={{ cursor: 'pointer', display: 'flex' }}>
                    <PanelLeft
                        size={18}
                        className="collapse-icon"
                        style={{ color: 'var(--text-secondary)' }}
                    />
                </div>

                <div className="topbar-button" onClick={goToToday}>
                    Today
                </div>

                <div className="week-navigation-buttons">
                    <ChevronLeft
                        size={18}
                        className="nav-button"
                        onClick={goToPreviousDay}
                    />
                    <ChevronRight
                        size={18}
                        className="nav-button"
                        onClick={goToNextDay}
                    />
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="topbar-right">
                <div className="topbar-actions">
                    <div className="topbar-button trial-button" onClick={() => store.openUpgradeModal()}>
                        Free Trial (14 days left)
                    </div>

                    <div
                        className="topbar-button"
                        onClick={() => setIsSearchOpen(true)}
                    >
                        <Search size={14} />
                    </div>

                    <div
                        className={`topbar-button filter ${filterMenuOpen ? 'active' : ''}`}
                        onClick={handleFilterClick}
                    >
                        <Filter size={14} />
                        Filter
                    </div>

                    <div className="topbar-toggle">
                        <div
                            className={`option ${store.viewMode === 'calendar' ? 'active' : ''}`}
                            onClick={() => store.setViewMode('calendar')}
                        >
                            <CalendarIcon size={14} />
                            <span>Calendar</span>
                        </div>
                        <div
                            className={`option ${store.viewMode === 'tasks' ? 'active' : ''}`}
                            onClick={() => store.setViewMode('tasks')}
                        >
                            <Layout size={14} style={{ transform: 'rotate(270deg)' }} />
                            <span>Kanban Board</span>
                        </div>
                    </div>

                    <div
                        className="avatar-button"
                        onClick={handleUserClick}
                    >
                        {store.currentUser?.initials[0] || 'T'}
                    </div>
                </div>

                <div onClick={() => store.toggleRightSidebar()} style={{ cursor: 'pointer', display: 'flex' }}>
                    <PanelRight
                        size={18}
                        className="collapse-icon"
                        style={{ color: 'var(--text-secondary)' }}
                    />
                </div>
            </div>

            {isSearchOpen && (
                <SearchSpotlight onClose={() => setIsSearchOpen(false)} />
            )}

            <UserContext
                isOpen={userMenuOpen}
                onClose={() => setUserMenuOpen(false)}
                position={menuPosition}
                onSettings={() => {
                    setUserMenuOpen(false);
                    setIsSettingsOpen(true);
                }}
                onAnalytics={() => {
                    setUserMenuOpen(false);
                    store.toggleAnalytics();
                }}
                onDailyShutdown={() => {
                    setUserMenuOpen(false);
                    store.toggleDailyShutdown();
                }}
                onLogout={() => console.log('Logout')}
            />

            {isSettingsOpen && (
                <SettingsModal onClose={() => setIsSettingsOpen(false)} />
            )}

            <FilterContext
                isOpen={filterMenuOpen}
                onClose={() => setFilterMenuOpen(false)}
                position={menuPosition}
                labels={store.availableLabels}
                selectedLabels={store.filterLabelIds}
                showComplete={store.showCompletedTasks}
                showTimeboxed={store.showTimeboxedTasks}
                onToggleLabel={(id) => store.toggleFilterLabel(id)}
                onToggleComplete={(val) => store.toggleShowCompleted(val)}
                onToggleTimeboxed={(val) => store.toggleShowTimeboxed(val)}
                onSelectAll={() => store.filterLabelIds = store.availableLabels.map(l => l.id)}
                onClearAll={() => store.filterLabelIds = []}
            />
        </div>
    );
});
