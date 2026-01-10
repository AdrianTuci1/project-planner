import React, { useState } from 'react';
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
    Users
} from 'lucide-react';
import './SettingsModal.css';
import { GeneralSettings } from './GeneralSettings';
import { LabelsSettings } from './LabelsSettings';
import { PowerFeaturesSettings } from './PowerFeaturesSettings';
import { CalendarSettings } from './CalendarSettings';

interface SettingsModalProps {
    onClose: () => void;
}

export const SettingsModal = observer(({ onClose }: SettingsModalProps) => {
    const [activeTab, setActiveTab] = useState('account');
    const [emailToInvite, setEmailToInvite] = useState('');

    const handleInvite = () => {
        if (emailToInvite) {
            alert(`Invited ${emailToInvite} to the team!`); // Mock invitation
            setEmailToInvite('');
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-container" onClick={e => e.stopPropagation()}>
                {/* Sidebar */}
                <div className="settings-sidebar">
                    <div className="settings-user-info">
                        <div className="settings-avatar-sm">T</div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>Tuci</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>adrian.tucicovenco@gmail.com</div>
                        </div>
                    </div>

                    <div className="settings-section-title">User Settings</div>
                    <div className={`settings-nav-item ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                        <User size={16} /> Account Settings
                    </div>
                    <div className="settings-nav-item"><CreditCard size={16} /> Subscription</div>

                    <div className="settings-separator" />

                    <div className="settings-section-title">Team</div>
                    <div className={`settings-nav-item ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
                        <Users size={16} /> Manage Team
                    </div>

                    <div className="settings-separator" />

                    <div className="settings-section-title">App Settings</div>
                    <div className={`settings-nav-item ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
                        <Settings size={16} /> General settings
                    </div>
                    <div className={`settings-nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
                        <Calendar size={16} /> Calendar accounts
                    </div>
                    <div className={`settings-nav-item ${activeTab === 'labels' ? 'active' : ''}`} onClick={() => setActiveTab('labels')}>
                        <Tag size={16} /> Labels
                    </div>
                    <div className="settings-nav-item"><Grid size={16} /> Integrations</div>

                    <div className="settings-separator" />

                    <div className="settings-section-title">Power Features</div>
                    <div className={`settings-nav-item ${activeTab === 'power' ? 'active' : ''}`} onClick={() => setActiveTab('power')}>
                        <Zap size={16} /> Toggle power features
                    </div>

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
                            {activeTab === 'account' && 'Account Settings'}
                            {activeTab === 'team' && 'Team Management'}
                            {activeTab === 'general' && 'General Settings'}
                            {activeTab === 'labels' && 'Label Settings'}
                            {activeTab === 'power' && 'Power Features'}
                            {activeTab === 'calendar' && 'Calendar Integration'}
                        </span>
                        <button className="icon-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </header>

                    <div className="settings-scroll-area">
                        {activeTab === 'account' && (
                            <>
                                <div className="avatar-upload-section">
                                    <div className="large-avatar">T</div>
                                    <button className="btn-secondary">Upload photo</button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input className="form-input" defaultValue="Tuci" />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input className="form-input" defaultValue="adrian.tucicovenco@gmail.com" />
                                    <button className="btn-secondary" style={{ marginTop: 8 }}>Change Email</button>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Password</label>
                                    <button className="btn-secondary">Change Password</button>
                                </div>

                                <div style={{ marginTop: 40, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                                    <label className="form-label">App Version</label>
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>3.7.5</div>
                                </div>
                            </>
                        )}

                        {activeTab === 'team' && (
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
                                            value={emailToInvite}
                                            onChange={(e) => setEmailToInvite(e.target.value)}
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

                        {activeTab === 'general' && <GeneralSettings />}
                        {activeTab === 'labels' && <LabelsSettings />}
                        {activeTab === 'power' && <PowerFeaturesSettings />}
                        {activeTab === 'calendar' && <CalendarSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
});
