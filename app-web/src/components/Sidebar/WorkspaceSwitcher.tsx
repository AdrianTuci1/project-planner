import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { ChevronUp, Check, Plus } from 'lucide-react';

export const WorkspaceSwitcher = observer(() => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="workspace-switcher" style={{ flex: 1, position: 'relative' }}>

            {/* Workspace Menu Trigger */}
            <div
                className="workspace-trigger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isMenuOpen ? 'var(--bg-surface-hover)' : 'transparent',
                    border: '1px solid var(--border-subtle)',
                    userSelect: 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: store.activeWorkspace?.type === 'personal' ? 'var(--primary)' : 'var(--accent-purple)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold'
                    }}>
                        {store.activeWorkspace?.type === 'personal' ? 'P' : 'T'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {store.activeWorkspace?.name || 'Workspace'}
                    </span>
                </div>
                <ChevronUp size={14} style={{ opacity: 0.5 }} />
            </div>

            {/* Workspace Dropdown Menu */}
            {isMenuOpen && (
                <>
                    <div
                        style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="workspace-menu" style={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 0,
                        right: 0,
                        marginBottom: 5,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: 4,
                        zIndex: 100
                    }}>
                        <div className="menu-label" style={{ padding: '4px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                            WORKSPACES
                        </div>

                        {store.workspaces.map(ws => (
                            <div
                                key={ws.id}
                                className="menu-item"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px',
                                    borderRadius: 6, cursor: 'pointer',
                                    background: store.activeWorkspace?.id === ws.id ? 'var(--bg-active)' : 'transparent'
                                }}
                                onClick={() => {
                                    store.setActiveWorkspace(ws.id);
                                    setIsMenuOpen(false);
                                }}
                            >
                                <div style={{
                                    width: 20, height: 20, borderRadius: 4,
                                    background: ws.type === 'personal' ? 'var(--primary)' : 'var(--accent-purple)',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10
                                }}>
                                    {ws.type === 'personal' ? 'P' : 'T'}
                                </div>
                                <span style={{ fontSize: 13, flex: 1 }}>{ws.name}</span>
                                {store.activeWorkspace?.id === ws.id && <Check size={14} />}
                            </div>
                        ))}

                        {/* Create Team Option if no Team exists */}
                        {!store.workspaces.some(w => w.type === 'team') && (
                            <div
                                className="menu-item"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px',
                                    borderRadius: 6, cursor: 'pointer', marginTop: 4,
                                    color: 'var(--text-secondary)'
                                }}
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    store.openSettings('team');
                                }}
                            >
                                <div style={{ width: 20, height: 20, borderRadius: 4, border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={12} />
                                </div>
                                <span style={{ fontSize: 13 }}>Create Team</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
});
