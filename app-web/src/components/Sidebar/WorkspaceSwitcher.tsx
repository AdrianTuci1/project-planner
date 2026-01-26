import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { ChevronUp, Check, Plus } from 'lucide-react';
import { CachedAvatar } from '../Shared/CachedAvatar';
import './WorkspaceSwitcher.css';

export const WorkspaceSwitcher = observer(() => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="workspace-switcher">

            {/* Workspace Menu Trigger */}
            <div
                className={`workspace-trigger ${isMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <div className="workspace-info">
                    <div className={`workspace-avatar ${store.activeWorkspace?.type === 'personal' ? 'personal' : 'team'}`}>
                        <CachedAvatar
                            url={store.activeWorkspace?.avatarUrl}
                            alt="Ws"
                            fallback={store.activeWorkspace?.type === 'personal' ? 'P' : 'T'}
                            style={{ width: '100%', height: '100%' }}
                            borderRadius="inherit"
                        />
                    </div>
                    <span className="workspace-name">
                        {store.activeWorkspace?.name || 'Workspace'}
                    </span>
                </div>
                <ChevronUp
                    size={14}
                    className="trigger-chevron"
                    style={{ transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
            </div>

            {/* Workspace Dropdown Menu */}
            {isMenuOpen && (
                <>
                    <div
                        className="workspace-menu-backdrop"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="workspace-menu">
                        <div className="menu-section-label">
                            Workspaces
                        </div>

                        {store.workspaces.map(ws => (
                            <div
                                key={ws.id}
                                className={`menu-item ${store.activeWorkspace?.id === ws.id ? 'active' : ''}`}
                                onClick={() => {
                                    store.setActiveWorkspace(ws.id);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <div className={`workspace-avatar ${ws.type === 'personal' ? 'personal' : 'team'}`}>
                                    <CachedAvatar
                                        url={ws.avatarUrl}
                                        alt="Ws"
                                        fallback={ws.type === 'personal' ? 'P' : 'T'}
                                        style={{ width: '100%', height: '100%' }}
                                        borderRadius="inherit"
                                    />
                                </div>
                                <span className="workspace-name">{ws.name}</span>
                                {store.activeWorkspace?.id === ws.id && <Check size={14} className="menu-item-check" />}
                            </div>
                        ))}

                        {/* Create Team Option if no Team exists */}
                        {!store.workspaces.some(w => w.type === 'team') && (
                            <div
                                className="menu-item create-team-item"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    store.openSettings('team');
                                }}
                            >
                                <div className="create-team-avatar">
                                    <Plus size={12} />
                                </div>
                                <span className="workspace-name">Create Team</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
});
