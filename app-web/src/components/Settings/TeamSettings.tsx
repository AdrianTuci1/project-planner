import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
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

    const isOwner = teamWorkspace && (teamWorkspace.ownerId === user?.sub || teamWorkspace.ownerId === user?.username);

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

    return (
        <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 20 }}>
                Manage members and settings of your workspace.
            </p>

            {/* Team Card with Edit */}
            <div style={{
                padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8, marginBottom: 30
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isOwner ? 16 : 0 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 6,
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        {teamName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{teamWorkspace.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {isOwner ? 'Owner' : 'Member'}
                        </div>
                    </div>
                    {!isOwner && (
                        <button className="btn-secondary" style={{ marginLeft: 'auto', fontSize: 12 }} disabled>
                            Leave Team
                        </button>
                    )}
                </div>

                {isOwner && (
                    <div className="rename-section" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <input
                            className="form-input"
                            style={{ margin: 0 }}
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Team Name"
                        />
                        <button
                            className="btn-secondary"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={handleUpdateName}
                            disabled={isUpdating || !teamName.trim() || teamName === teamWorkspace.name}
                        >
                            {isUpdating ? 'Saving...' : 'Rename'}
                        </button>
                    </div>
                )}
            </div>

            {isOwner && (
                <>
                    <div className="invite-section">
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
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: 10, borderBottom: '1px solid var(--border-subtle)'
                        }}>
                            <div className="settings-avatar-sm" style={{ width: 32, height: 32, fontSize: 12 }}>{user?.initials || 'U'}</div>
                            <div style={{ fontSize: 14 }}>{user?.name || 'You'}</div>
                            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Owner</div>
                        </div>
                    </div>
                </>
            )}
            {error && <div className="error-message" style={{ marginTop: 10 }}>{error}</div>}
        </div>
    );
});
