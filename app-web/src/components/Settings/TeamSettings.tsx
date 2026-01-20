import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';

export const TeamSettings = observer(() => {
    const { settings } = store;

    const handleInvite = () => {
        // Pass the active workspace ID to the invite function
        const workspaceId = store.activeWorkspace?.id;
        settings.inviteUser(workspaceId);
    };

    // Helper to check if user is owner of the current team workspace or is just a member.
    // Ideally we assume the "Team" tab manages the "Team Workspace".
    // For now, we replicate the existing UI logic.
    // Todo: Check if user is actually Owner or Member of the active team workspace.

    return (
        <div>
            <h3>Your Team</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: 20 }}>
                Manage members of your workspace.
            </p>

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
                {/* List would go here */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 10, borderBottom: '1px solid var(--border-subtle)'
                }}>
                    <div className="settings-avatar-sm" style={{ width: 32, height: 32, fontSize: 12 }}>T</div>
                    <div style={{ fontSize: 14 }}>Tuci (You)</div>
                    <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Owner</div>
                </div>
            </div>
        </div>
    );
});
