import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    X,
    User,
    CreditCard,
    Settings,
    Calendar,
    Tag,
    Grid,
    Zap,
    Download,
    Cloud,
    LogOut,
    Users,
    ChevronRight,
    ArrowLeft,
    Mail,
    Lock
} from 'lucide-react';
import './SettingsModal.css';
import { GeneralSettings } from './GeneralSettings';
import { LabelsSettings } from './LabelsSettings';
import { PowerFeaturesSettings } from './PowerFeaturesSettings';
import { CalendarSettings } from './CalendarSettings';
import { DueDatesSettings } from './DueDatesSettings';

interface SettingsModalProps {
    onClose: () => void;
}

export const SettingsModal = observer(({ onClose }: SettingsModalProps) => {
    const { settings } = store;

    const handleInvite = () => {
        settings.inviteUser();
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-container" onClick={e => e.stopPropagation()}>
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <div className="settings-user-info">
                        <div className="settings-avatar-sm">T</div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{settings.account.displayName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{settings.account.email}</div>
                        </div>
                    </div>

                    <div className="settings-section-title">User Settings</div>
                    <div className={`settings-nav-item ${settings.activeTab === 'account' ? 'active' : ''}`} onClick={() => { settings.setActiveTab('account'); settings.setAccountView('main'); }}>
                        <User size={16} /> Account Settings
                    </div>
                    <div className="settings-nav-item"><CreditCard size={16} /> Subscription</div>

                    <div className="settings-separator" />

                    <div className="settings-section-title">Team</div>
                    <div className={`settings-nav-item ${settings.activeTab === 'team' ? 'active' : ''}`} onClick={() => settings.setActiveTab('team')}>
                        <Users size={16} /> Manage Team
                    </div>

                    <div className="settings-separator" />

                    <div className="settings-section-title">App Settings</div>
                    <div className={`settings-nav-item ${settings.activeTab === 'general' ? 'active' : ''}`} onClick={() => settings.setActiveTab('general')}>
                        <Settings size={16} /> General settings
                    </div>
                    <div className={`settings-nav-item ${settings.activeTab === 'calendar' ? 'active' : ''}`} onClick={() => settings.setActiveTab('calendar')}>
                        <Calendar size={16} /> Calendar accounts
                    </div>
                    <div className={`settings-nav-item ${settings.activeTab === 'labels' ? 'active' : ''}`} onClick={() => settings.setActiveTab('labels')}>
                        <Tag size={16} /> Labels
                    </div>
                    <div className="settings-nav-item"><Grid size={16} /> Integrations</div>

                    <div className="settings-separator" />

                    <div className="settings-section-title">Power Features</div>
                    <div className={`settings-nav-item ${settings.activeTab === 'power' ? 'active' : ''}`} onClick={() => settings.setActiveTab('power')}>
                        <Zap size={16} /> Toggle power features
                    </div>
                    {/* Dynamic Power Features Menu */}
                    {settings.powerFeatures.dueDatesEnabled && (
                        <div className={`settings-nav-item ${settings.activeTab === 'due_dates' ? 'active' : ''}`} onClick={() => settings.setActiveTab('due_dates')}>
                            <div style={{ width: 16 }} /> {/* Indent */}
                            <Calendar size={16} />Due dates
                        </div>
                    )}

                    <div className="settings-separator" />


                    <div className="settings-nav-item"><Download size={16} /> Download apps</div>
                    <div className="settings-nav-item"><Cloud size={16} /> Account data</div>

                    <div className="settings-separator" />

                    <div className="settings-nav-item" style={{ color: 'var(--accent-pink)' }}>
                        <LogOut size={16} /> Log out
                    </div>
                </div>

                {/* Content */}
                <div className="settings-content">
                    <header className="settings-header">
                        <span>
                            {settings.activeTab === 'account' && 'Account Settings'}
                            {settings.activeTab === 'team' && 'Team Management'}
                            {settings.activeTab === 'general' && 'General Settings'}
                            {settings.activeTab === 'labels' && 'Label Settings'}
                            {settings.activeTab === 'power' && 'Power Features'}
                            {settings.activeTab === 'due_dates' && 'Due Dates Settings'}
                            {settings.activeTab === 'calendar' && 'Calendar Integration'}
                        </span>
                        <button className="icon-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </header>

                    <div className="settings-scroll-area">
                        {settings.activeTab === 'account' && (
                            <>
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
                            </>
                        )}

                        {settings.activeTab === 'team' && (
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
                        )}

                        {settings.activeTab === 'general' && <GeneralSettings />}
                        {settings.activeTab === 'labels' && <LabelsSettings />}
                        {settings.activeTab === 'power' && <PowerFeaturesSettings />}
                        {settings.activeTab === 'due_dates' && <DueDatesSettings />}
                        {settings.activeTab === 'calendar' && <CalendarSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
});
