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
import { AccountSettings } from './AccountSettings';

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
                        {settings.activeTab === 'account' && <AccountSettings />}

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
