import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    Calendar as CalendarIcon,
    Layout,
    PanelLeft
} from 'lucide-react';
import { addDays } from 'date-fns';
import '../Layout/KanbanLayout.css';

export const TopBar = observer(() => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
                    <div className="topbar-button trial-button">
                        Free Trial (14 days left)
                    </div>

                    <div className="topbar-button filter">
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

                    <div className="avatar-button min-w-[32px] min-h-[32px] w-8 h-8">
                        {store.currentUser?.initials || 'T'}
                    </div>
                </div>

                {/* Right Sidebar Toggle (if needed matching HTML structure ending) */}
                {/* <PanelRight /> in HTML it was another collapse icon */}
            </div>
        </div>
    );
});
