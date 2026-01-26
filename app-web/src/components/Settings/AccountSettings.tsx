import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { api } from '../../services/api';
import {
    Mail,
    ChevronRight,
    Lock,
    ArrowLeft
} from 'lucide-react';
import './AccountSettings.css';

export const AccountSettings = observer(() => {
    const { settings } = store;

    // File Upload Logic
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const url = await api.uploadFile(file);
                settings.account.avatarUrl = url;
            } catch (err) {
                console.error("Failed to upload avatar", err);
                alert("Failed to upload avatar.");
            }
        }
    };

    return (
        <div className="account-settings-container">
            {settings.accountView === 'main' && (
                <>
                    <div className="avatar-upload-section">
                        {settings.account.avatarUrl ? (
                            <img
                                src={settings.account.avatarUrl}
                                alt="Profile"
                                className="large-avatar"
                                style={{ objectFit: 'cover' }}
                            />
                        ) : (
                            <div className="large-avatar">
                                {settings.account.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <button className="btn-secondary" onClick={() => fileInputRef.current?.click()}>Upload photo</button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
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

                        {/* Google / Federated Login Notice */}
                        {(store.authStore.user?.identities && store.authStore.user.identities.length > 0) ? (
                            <div className="connected-account-card">
                                <div className="account-info">
                                    <div className="google-icon-wrapper">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="account-email" style={{ marginBottom: 2 }}>{settings.account.email}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Managed by Google</div>
                                    </div>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', paddingRight: 12 }}>
                                    Cannot change email/password
                                </div>
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                    </div>

                    <div style={{ marginTop: 40, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                        <label className="form-label">App Version</label>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>1.0.0</div>
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
