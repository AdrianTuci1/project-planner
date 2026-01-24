import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { api } from '../../services/api';
import { ArrowLeft, Users, ChevronRight, Crown, Camera } from 'lucide-react';
import { ContextMenu, MenuItem } from '../ContextMenu/ContextMenu';
import './TeamSettings.css';

export const TeamSettings = observer(() => {
    const { settings, authStore } = store;
    const user = authStore.user;
    const teamWorkspace = store.workspaceStore.workspaces.find(w => w.type === 'team');
    const teamId = teamWorkspace?.id;
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [teamName, setTeamName] = useState(teamWorkspace?.name || 'My Team');

    // Context Menu State
    const [menuState, setMenuState] = useState<{ isOpen: boolean; x: number; y: number; memberId?: string }>({
        isOpen: false,
        x: 0,
        y: 0
    });

    // File Upload Logic
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && teamId) {
            try {
                const url = await api.uploadFile(file);
                await store.workspaceStore.updateWorkspace(teamId, { avatarUrl: url });
            } catch (err) {
                console.error("Failed to upload team logo", err);
                alert("Failed to upload team logo.");
            }
        }
    };

    const handleLogoClick = () => {
        if (isOwner) {
            fileInputRef.current?.click();
        }
    };

    const handleCreateTeam = async () => {
        setIsCreating(true);
        setError(null);
        try {
            await store.workspaceStore.createTeamWorkspace();
            await store.workspaceStore.initializeData();
            await authStore.checkAuth();
        } catch (err: any) {
            setError("Failed to create team: " + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateName = async () => {
        if (!teamId || !teamName.trim()) return;
        setIsUpdating(true);
        setError(null);
        try {
            await store.workspaceStore.updateWorkspace(teamId, { name: teamName });
        } catch (err: any) {
            setError("Failed to update name: " + err.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleInvite = () => {
        if (teamId) settings.inviteUser(teamId);
    };

    const handleMemberClick = (e: React.MouseEvent, memberId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuState({
            isOpen: true,
            x: e.clientX,
            y: e.clientY,
            memberId
        });
    };

    const closeMenu = () => {
        setMenuState(prev => ({ ...prev, isOpen: false }));
    };

    const isOwner = teamWorkspace && (teamWorkspace.ownerId === user?.sub || teamWorkspace.ownerId === user?.username);

    // If no team exists, show create UI (same as before)
    if (!teamWorkspace) {
        return (
            <div className="team-settings-container">
                <p className="team-settings-description">
                    Collaborate with your team in a shared workspace.
                </p>

                {/* Create Team Section */}
                <div className="create-team-section">
                    <div className="section-label">
                        Create a new team
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            className="create-team-btn"
                            onClick={handleCreateTeam}
                            disabled={isCreating}
                        >
                            <span style={{ fontSize: 16 }}>+</span>
                            {isCreating ? 'Creating...' : 'Create Team Workspace'}
                        </button>
                    </div>

                    <div className="team-warning-alert">
                        <span>⚠️</span>
                        <div>
                            <strong>Note:</strong> You can have only one public team workspace. If you want to join another workspace later, you must delete or leave your current workspace.
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // MANAGE VIEW
    if (settings.teamView === 'manage') {
        return (
            <div className="settings-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="back-btn" onClick={() => settings.setTeamView('summary')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                    {isOwner && (
                        <button
                            className="btn-danger-text"
                            style={{ color: 'var(--accent-red)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={async () => {
                                if (confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
                                    if (teamWorkspace?.id) {
                                        try {
                                            await store.workspaceStore.deleteTeamWorkspace(teamWorkspace.id);
                                            settings.setActiveTab('general'); // Or close modal?
                                        } catch (e: any) {
                                            alert(e.message);
                                        }
                                    }
                                }
                            }}
                        >
                            Delete Team
                        </button>
                    )}
                </div>

                <div className="form-group" style={{ marginBottom: 30 }}>
                    <label className="form-label">Team Profile</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    width: 64, height: 64, borderRadius: 12,
                                    background: 'var(--primary)', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: 24,
                                    flexShrink: 0,
                                    cursor: isOwner ? 'pointer' : 'default',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onClick={handleLogoClick}
                                className={isOwner ? "team-logo-upload-trigger" : ""}
                            >
                                {teamWorkspace.avatarUrl ? (
                                    <img src={teamWorkspace.avatarUrl} alt="Team Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        {isOwner && (
                                            <div className="logo-upload-overlay">
                                                <Camera size={20} color="white" />
                                            </div>
                                        )}
                                        {teamName.charAt(0).toUpperCase()}
                                    </>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <input
                                    className="form-input"
                                    style={{ margin: 0, flex: 1, minWidth: 200 }}
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    disabled={!isOwner}
                                    placeholder="Team Name"
                                />
                                {isOwner && (
                                    <button
                                        className="btn-primary"
                                        onClick={handleUpdateName}
                                        disabled={isUpdating || !teamName.trim() || teamName === teamWorkspace.name}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {isUpdating ? 'Saving...' : 'Rename'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {isOwner && (
                    <>
                        <div className="invite-section" style={{ marginTop: 30 }}>
                            <label className="form-label" style={{ marginBottom: 4 }}>Invite new member</label>
                            <div className="invite-row">
                                <input
                                    className="form-input"
                                    placeholder="colleague@example.com"
                                    value={settings.emailToInvite}
                                    onChange={(e) => settings.setEmailToInvite(e.target.value)}
                                />
                                <button className="btn-primary" onClick={handleInvite}>Invite</button>
                            </div>
                        </div>

                        <div style={{ marginTop: 30 }}>
                            <div className="form-label">Active Members</div>
                            {/* Member Row - Needs iteration if real members existed. For now showing Self + Mock if needed or just Self */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: 10, borderBottom: '1px solid var(--border-subtle)'
                            }}>
                                {/* Use settings.account for current user to reflect latest changes */}
                                {settings.account.avatarUrl ? (
                                    <img
                                        src={settings.account.avatarUrl}
                                        alt={settings.account.displayName}
                                        style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="settings-avatar-sm" style={{ width: 32, height: 32, fontSize: 12 }}>
                                        {settings.account.displayName?.charAt(0).toUpperCase() || user?.initials || 'U'}
                                    </div>
                                )}

                                <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {settings.account.displayName || user?.name || 'You'}
                                    <Crown size={14} className="text-warning" style={{ color: '#F59E0B' }} fill="currentColor" />
                                </div>
                                <div
                                    style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}
                                    className="member-role-label"
                                >
                                    Owner
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {error && <div className="error-message" style={{ marginTop: 10 }}>{error}</div>}

                {/* Context Menu */}
                <ContextMenu
                    isOpen={menuState.isOpen}
                    onClose={closeMenu}
                    position={{ x: menuState.x, y: menuState.y }}
                >
                    <MenuItem
                        label="Make team owner"
                        icon={<Crown size={14} />}
                        onClick={() => {
                            alert("Transfer ownership not implemented yet.");
                            closeMenu();
                        }}
                    />
                    <MenuItem
                        label="Remove from team"
                        icon={<Users size={14} />}
                        color="#EF4444"
                        onClick={() => {
                            alert("Remove member not implemented yet.");
                            closeMenu();
                        }}
                    />
                </ContextMenu>
            </div>
        );
    }

    // SUMMARY VIEW (Default)
    return (
        <div>
            <h2 className="calendar-settings-title">Your Team</h2>
            <p className="calendar-settings-description">
                Manage your team workspace and members.
            </p>

            <div className="connected-account-card">
                <div className="account-info">
                    <div style={{
                        width: 40, height: 40, borderRadius: 6,
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', marginRight: 12
                    }}>
                        {teamName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{teamWorkspace.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {isOwner ? 'Owner' : 'Member'} • {teamWorkspace.members?.length || 1} members
                        </div>
                    </div>
                </div>
                <button className="manage-btn" onClick={() => settings.setTeamView('manage')}>
                    Manage <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
});
