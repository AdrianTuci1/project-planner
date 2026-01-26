import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { api } from '../../services/api';
import { ArrowLeft, Users, ChevronRight, Crown, Camera, Mail, Plus } from 'lucide-react';
import { ContextMenu, MenuItem } from '../ContextMenu/ContextMenu';
import './TeamSettings.css';
import { useCachedImage } from '../../utils/ImageCache';

export const TeamSettings = observer(() => {
    const { settings, authStore } = store;
    const user = authStore.user;
    const teamWorkspace = store.workspaceStore.workspaces.find(w => w.type === 'team');
    const { cachedUrl: teamAvatarUrl } = useCachedImage(teamWorkspace?.avatarUrl);
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

    React.useEffect(() => {
        if (teamId) {
            store.workspaceStore.fetchMemberDetails(teamId);
        }
    }, [teamId]);

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

    // If no team exists, show create UI
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
            <div className="team-settings-container settings-fade-in">
                <div className="manage-view-header">
                    <button className="back-btn" onClick={() => settings.setTeamView('summary')}>
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>

                {/* Team Profile Section */}
                <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ position: 'relative' }}>
                            <div
                                style={{
                                    width: 80, height: 80, borderRadius: 16,
                                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: 'var(--text-secondary)',
                                    flexShrink: 0,
                                    cursor: isOwner ? 'pointer' : 'default',
                                    overflow: 'hidden'
                                }}
                                onClick={handleLogoClick}
                                className={isOwner ? "team-logo-upload-trigger" : ""}
                            >
                                {teamAvatarUrl ? (
                                    <img src={teamAvatarUrl} alt="Team Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ fontSize: 32, fontWeight: 600, color: 'var(--primary)' }}>
                                        {teamName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                {isOwner && (
                                    <div className="logo-upload-overlay">
                                        <Camera size={24} color="white" />
                                    </div>
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

                        <div style={{ flex: 1, display: 'flex', gap: 12 }}>
                            <input
                                className="invite-input"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                disabled={!isOwner}
                                placeholder="Team Name"
                            />
                            {isOwner && (
                                <button
                                    className="invite-btn"
                                    onClick={handleUpdateName}
                                    disabled={isUpdating || !teamName.trim() || teamName === teamWorkspace.name}
                                >
                                    {isUpdating ? 'Saving...' : 'Rename'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="manage-divider" />

                {isOwner && (
                    <>
                        {/* Invite Section (Restored Style) */}
                        <div className="invite-section" style={{ marginTop: 30 }}>
                            <label className="form-label" style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 500 }}>Invite new member</label>
                            <div className="invite-row" style={{ display: 'flex', gap: 10 }}>
                                <input
                                    className="form-input"
                                    placeholder="colleague@example.com"
                                    value={settings.emailToInvite}
                                    onChange={(e) => settings.setEmailToInvite(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <button className="btn-primary" onClick={handleInvite}>Invite</button>
                            </div>
                        </div>

                        {/* Members Section (Restored Style) */}
                        <div style={{ marginTop: 30 }}>
                            <div className="form-label" style={{ marginBottom: 8, display: 'block', fontSize: 14, fontWeight: 500 }}>Active Members</div>
                            {teamWorkspace.members.map((memberId: string) => {
                                const memberDetail = store.workspaceStore.memberDetails.get(memberId);
                                const isMemberOwner = teamWorkspace.ownerId === memberId;
                                const isMe = memberId === user?.sub || memberId === user?.username;

                                return (
                                    <div
                                        key={memberId}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '10px 0',
                                            borderBottom: '1px solid var(--border-subtle)'
                                        }}
                                        onClick={(e) => !isMe && isOwner && handleMemberClick(e, memberId)}
                                        className={!isMe && isOwner ? "member-clickable" : ""}
                                    >
                                        {memberDetail?.avatarUrl ? (
                                            <img
                                                src={memberDetail.avatarUrl}
                                                alt={memberDetail.name}
                                                style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <div className="settings-avatar-sm" style={{ width: 32, height: 32, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', borderRadius: 6 }}>
                                                {(memberDetail?.name?.charAt(0) || 'U').toUpperCase()}
                                            </div>
                                        )}

                                        <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                                            {memberDetail?.name || (isMe ? (settings.account.displayName || user?.name) : 'Loading...')}
                                            {isMemberOwner && <Crown size={14} className="text-warning" style={{ color: '#F59E0B' }} fill="currentColor" />}
                                        </div>
                                        <div
                                            style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}
                                            className="member-role-label"
                                        >
                                            {isMemberOwner ? 'Owner' : 'Member'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="manage-divider" />
                    </>
                )}

                {/* Danger Zone */}
                <div style={{ marginBottom: 40 }}>

                    <div className="member-row" style={{ justifyContent: 'space-between', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <div>
                            <div className="member-name">{isOwner ? 'Delete Team Workspace' : 'Leave Team'}</div>
                            <div className="member-email">{isOwner ? 'Permanently delete this team and all its data' : 'Leave this team workspace'}</div>
                        </div>
                        {isOwner ? (
                            <button
                                className="disconnect-btn"
                                onClick={async () => {
                                    if (confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
                                        if (teamWorkspace?.id) {
                                            try {
                                                await store.workspaceStore.deleteTeamWorkspace(teamWorkspace.id);
                                                settings.setActiveTab('general');
                                            } catch (e: any) {
                                                alert(e.message);
                                            }
                                        }
                                    }
                                }}
                            >
                                Delete Team
                            </button>
                        ) : (
                            <button
                                className="disconnect-btn"
                                onClick={async () => {
                                    if (confirm("Are you sure you want to leave this team?")) {
                                        if (teamWorkspace?.id) {
                                            try {
                                                await store.workspaceStore.leaveWorkspace(teamWorkspace.id);
                                            } catch (e: any) {
                                                alert(e.message);
                                            }
                                        }
                                    }
                                }}
                            >
                                Leave Team
                            </button>
                        )}
                    </div>
                </div>

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
                        onClick={async () => {
                            if (menuState.memberId && teamWorkspace?.id) {
                                if (confirm("Transfer ownership? You will lose owner privileges.")) {
                                    try {
                                        await store.workspaceStore.assignOwner(teamWorkspace.id, menuState.memberId);
                                    } catch (e: any) {
                                        alert(e.message);
                                    }
                                }
                            }
                            closeMenu();
                        }}
                    />
                    <MenuItem
                        label="Remove from team"
                        icon={<Users size={14} />}
                        color="#EF4444"
                        onClick={async () => {
                            if (menuState.memberId && teamWorkspace?.id) {
                                if (confirm("Remove this member from the team?")) {
                                    try {
                                        await store.workspaceStore.removeMember(teamWorkspace.id, menuState.memberId);
                                    } catch (e: any) {
                                        alert(e.message);
                                    }
                                }
                            }
                            closeMenu();
                        }}
                    />
                </ContextMenu>
            </div>
        );
    }

    // SUMMARY VIEW (Default)
    return (
        <div className="team-settings-container">
            <h2 className="team-settings-title">Your Team</h2>
            <p className="team-settings-description">
                Manage your team workspace and members.
            </p>

            <div className="connected-account-card">
                <div className="account-info">
                    {teamAvatarUrl ? (
                        <img
                            src={teamAvatarUrl}
                            alt="Team Logo"
                            style={{
                                width: 40, height: 40, borderRadius: 8,
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: 'var(--primary)', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: 18
                        }}>
                            {teamName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div style={{ fontWeight: 600, fontSize: 15 }}>{teamWorkspace.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                            {isOwner ? 'Owner' : 'Member'} • {teamWorkspace.members?.length || 1} members
                        </div>
                    </div>
                </div>
                <button className="manage-btn" onClick={() => settings.setTeamView('manage')}>
                    Manage <ChevronRight size={14} />
                </button>
            </div>

            {/* Warning Alert - Always visible in summary view as requested */}
            <div className="team-warning-alert">
                <span>⚠️</span>
                <div>
                    <strong>Note:</strong> You can have only one public team workspace. If you want to join another workspace later, you must delete or leave your current workspace.
                </div>
            </div>
        </div>
    );
});
