import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    Mail,
    ChevronRight,
    Lock,
    ArrowLeft
} from 'lucide-react';
import './AccountSettings.css';

export const AccountSettings = observer(() => {
    const { settings } = store;

    return (
        <div className="account-settings-container">
            {settings.accountView === 'main' && (
                <>
                    <div className="avatar-upload-section">
                        <div className="large-avatar">T</div>
                        <button className="btn-secondary">Upload photo</button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            className="form-input"
                            value={settings.account.displayName}
                            onChange={(e) => settings.account.setDisplayName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email & Password</label>

                        {/* Email Card */}
                        <div className="connected-account-card" style={{ marginBottom: 16 }}>
                            <div className="account-info">
                                <Mail size={20} className="text-muted" />
                                <div>
                                    <div className="account-email" style={{ marginBottom: 2 }}>{settings.account.email}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Primary email</div>
                                </div>
                            </div>
                            <button className="manage-btn" onClick={() => settings.setAccountView('email')}>
                                Manage <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Password Card */}
                        <div className="connected-account-card">
                            <div className="account-info">
                                <Lock size={20} className="text-muted" />
                                <div>
                                    <div className="account-email" style={{ marginBottom: 2 }}>Password</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last changed 3 months ago</div>
                                </div>
                            </div>
                            <button className="manage-btn" onClick={() => settings.setAccountView('password')}>
                                Change <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: 40, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                        <label className="form-label">App Version</label>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>3.7.5</div>
                    </div>
                </>
            )}

            {settings.accountView === 'email' && (
                <div className="settings-fade-in">
                    <button className="back-btn" onClick={() => settings.setAccountView('main')}>
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div className="manage-header-title-row">
                        <div className="manage-title">
                            <Mail size={24} /> Change Email
                        </div>
                    </div>
                    <div className="manage-divider" />

                    <div className="form-group">
                        <label className="form-label">Current Email</label>
                        <input className="form-input" disabled value={settings.account.email} style={{ opacity: 0.7 }} />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Email Address</label>
                        <input
                            className="form-input"
                            placeholder="Enter new email address"
                            value={settings.account.changeEmail.newEmail}
                            onChange={(e) => settings.account.setChangeEmailField('newEmail', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter password to confirm"
                            value={settings.account.changeEmail.confirmPassword}
                            onChange={(e) => settings.account.setChangeEmailField('confirmPassword', e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                        <button className="btn-primary" onClick={() => settings.account.updateEmail()}>Update Email</button>
                    </div>
                </div>
            )}

            {settings.accountView === 'password' && (
                <div className="settings-fade-in">
                    <button className="back-btn" onClick={() => settings.setAccountView('main')}>
                        <ArrowLeft size={16} /> Back
                    </button>

                    <div className="manage-header-title-row">
                        <div className="manage-title">
                            <Lock size={24} /> Change Password
                        </div>
                    </div>
                    <div className="manage-divider" />

                    <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter current password"
                            value={settings.account.changePassword.currentPassword}
                            onChange={(e) => settings.account.setChangePasswordField('currentPassword', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter new password"
                            value={settings.account.changePassword.newPassword}
                            onChange={(e) => settings.account.setChangePasswordField('newPassword', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Confirm New Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Retype new password"
                            value={settings.account.changePassword.confirmNewPassword}
                            onChange={(e) => settings.account.setChangePasswordField('confirmNewPassword', e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                        <button className="btn-primary" onClick={() => settings.account.updatePassword()}>Update Password</button>
                    </div>
                </div>
            )}
        </div>
    );
});
