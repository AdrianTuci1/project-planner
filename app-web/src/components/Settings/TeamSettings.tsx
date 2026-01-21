import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { api } from '../../services/api';

export const TeamSettings = observer(() => {
    const { settings, authStore } = store;
    const user = authStore.user;
    const teamId = user?.teamId || null;
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCreateTeam = async () => {
        setIsCreating(true);
        setError(null);
        try {
            // Create the real team workspace via store action
            await store.workspaceStore.createTeamWorkspace();

            // Refresh data to ensure UI updates
            await store.workspaceStore.initializeData();
            // authStore.checkAuth(); 
        } catch (err: any) {
            setError("Failed to create team: " + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleInvite = () => {
        // Use resolved team ID
        const workspaceId = store.workspaceStore.activeWorkspaceId;
        if (workspaceId) settings.inviteUser(workspaceId);
    };

    const isOwner = teamId && teamId === `team-${user?.sub}`; // Or user.username if sub not available, but usually sub is ID.

    if (!teamId) {
        return (
            <div>
                <h3>Team Workspace</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 20 }}>
                    Collaborate with your team in a shared workspace.
                </p>

                <div style={{
                    padding: 20,
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8,
                    background: 'var(--bg-surface-hover)'
                }}>
                    <div style={{ marginBottom: 15, fontWeight: 500 }}>You don't have any team workspace yet.</div>

                    <div className="alert alert-warning" style={{ fontSize: 13, marginBottom: 20, backgroundColor: '#fff3cd', color: '#856404', padding: 10, borderRadius: 6 }}>
                        Example: You can have only one public team workspace. If you want to join another workspace later, you must delete or leave your current workspace.
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleCreateTeam}
                        disabled={isCreating}
                    >
                        {isCreating ? 'Creating...' : 'Create Team Workspace'}
                    </button>
                    {error && <div style={{ color: 'red', marginTop: 10, fontSize: 13 }}>{error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div>
            <h3>Your Team</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 20 }}>
                Manage members of your workspace.
            </p>

            {/* Team Card */}
            <div style={{
                padding: 16, border: '1px solid var(--border-subtle)', borderRadius: 8, marginBottom: 30
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 6,
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold'
                    }}>
                        T
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>My Team</div>
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
            </div>

            {isOwner && (
                <>
                    <div className="invite-section">
                        <label className="form-label" style={{ marginBottom: 0 }}>Invite new member</label>
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
                        {/* List other members here */}
                    </div>
                </>
            )}
        </div>
    );
});
