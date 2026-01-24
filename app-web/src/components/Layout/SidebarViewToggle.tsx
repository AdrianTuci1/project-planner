import React from 'react';
import { observer } from 'mobx-react-lite';
import { sidebarUI } from '../../models/SidebarUIModel';
import { store } from '../../models/store';
import './Sidebar.css';

export const SidebarViewToggle = observer(() => {
    const { settings } = store;

    const hasAdditionalViews = settings.general.featuresSettings.dueDatesEnabled || settings.general.featuresSettings.templatesEnabled;

    if (!hasAdditionalViews) {
        return null;
    }

    return (
        <div className="sidebar-nav-toggle compact">
            <button
                className={`nav-toggle-btn ${sidebarUI.sidebarView === 'main' ? 'active' : ''}`}
                onClick={() => sidebarUI.setSidebarView('main')}
                title="Main Menu"
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <circle cx="3" cy="6" r="1"></circle>
                    <circle cx="3" cy="12" r="1"></circle>
                    <circle cx="3" cy="18" r="1"></circle>
                </svg>
            </button>
            {settings.general.featuresSettings.dueDatesEnabled && (
                <button
                    className={`nav-toggle-btn ${sidebarUI.sidebarView === 'due' ? 'active' : ''}`}
                    onClick={() => sidebarUI.setSidebarView('due')}
                    title="Due Date"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="M2 12h2"></path>
                        <path d="M20 12h2"></path>
                    </svg>
                </button>
            )}
            {settings.general.featuresSettings.templatesEnabled && (
                <button
                    className={`nav-toggle-btn ${sidebarUI.sidebarView === 'templates' ? 'active' : ''}`}
                    onClick={() => sidebarUI.setSidebarView('templates')}
                    title="Templates"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </button>
            )}
        </div>
    );
});
