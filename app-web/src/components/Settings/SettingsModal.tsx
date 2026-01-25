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
    Cable,
} from 'lucide-react';
import './SettingsModal.css';
import { GeneralSettings } from './GeneralSettings';
import { TeamSettings } from './TeamSettings';
import { LabelsSettings } from './LabelsSettings';
import { PowerFeaturesSettings } from './PowerFeaturesSettings';
import { CalendarSettings } from './CalendarSettings';
import { DueDatesSettings } from './DueDatesSettings';
import { AccountSettings } from './AccountSettings';
import { SubscriptionSettings } from './SubscriptionSettings';
import { ApiTokenSettings } from './ApiTokenSettings';
import { AccountDataSettings } from './AccountDataSettings';

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
                        {settings.account.avatarUrl ? (
                            <img src={settings.account.avatarUrl} alt="User" className="settings-avatar-sm" style={{ objectFit: 'cover' }} />
                        ) : (
                            <div className="settings-avatar-sm">{settings.account.displayName.charAt(0).toUpperCase()}</div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: 600, fontSize: '13px' }}>{settings.account.displayName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{settings.account.email}</div>
                        </div>
                    </div>

                    <div className="settings-section-title">User Settings</div>
                    <div className={`settings-nav-item ${settings.activeTab === 'account' ? 'active' : ''}`} onClick={() => { settings.setActiveTab('account'); settings.setAccountView('main'); }}>
                        <User size={16} /> Account Settings
                    </div>
                    <div className={`settings-nav-item ${settings.activeTab === 'subscription' ? 'active' : ''}`} onClick={() => settings.setActiveTab('subscription')}>
                        <CreditCard size={16} /> Subscription
                    </div>

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
                    {settings.general.featuresSettings.dueDatesEnabled && (
                        <div className={`settings-nav-item ${settings.activeTab === 'due_dates' ? 'active' : ''}`} onClick={() => settings.setActiveTab('due_dates')}>
                            <div style={{ width: 16 }} /> {/* Indent */}
                            <Calendar size={16} />Due dates
                        </div>
                    )}
                    {settings.general.featuresSettings.apiTokenEnabled && (
                        <div className={`settings-nav-item ${settings.activeTab === 'api_token' ? 'active' : ''}`} onClick={() => settings.setActiveTab('api_token')}>
                            <div style={{ width: 16 }} /> {/* Indent */}
                            <Cable size={16} />API Token
                        </div>
                    )}


                    <div className="settings-separator" />


                    <div className="settings-nav-item"><Download size={16} /> Download apps</div>
                    <div className={`settings-nav-item ${settings.activeTab === 'account_data' ? 'active' : ''}`} onClick={() => settings.setActiveTab('account_data')}>
                        <Cloud size={16} /> Account data
                    </div>

                    <div className="settings-separator" />

                    <div className="settings-nav-item" style={{ color: 'var(--accent-pink)' }} onClick={() => store.authStore.logout()}>
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
                            {settings.activeTab === 'subscription' && 'Subscription'}
                            {settings.activeTab === 'api_token' && 'API Token'}
                            {settings.activeTab === 'account_data' && 'Account Data'}
                        </span>
                        <button className="icon-btn" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </header>

                    <div className="settings-scroll-area">
                        {settings.activeTab === 'account' && <AccountSettings />}

                        {settings.activeTab === 'team' && (
                            <TeamSettings />
                        )}

                        {settings.activeTab === 'general' && <GeneralSettings />}
                        {settings.activeTab === 'labels' && <LabelsSettings />}
                        {settings.activeTab === 'power' && <PowerFeaturesSettings />}
                        {settings.activeTab === 'due_dates' && <DueDatesSettings />}
                        {settings.activeTab === 'calendar' && <CalendarSettings />}
                        {settings.activeTab === 'subscription' && <SubscriptionSettings />}
                        {settings.activeTab === 'api_token' && <ApiTokenSettings />}
                        {settings.activeTab === 'account_data' && <AccountDataSettings />}
                    </div>
                </div>
            </div>
        </div>
    );
});
