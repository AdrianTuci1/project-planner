import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { CreditCard, ExternalLink, AlertTriangle, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { differenceInDays } from 'date-fns';
import './SubscriptionSettings.css';

export const SubscriptionSettings = observer(() => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const user = store.currentUser;
    const isPro = user?.plan === 'pro';
    const isTrialing = isPro && user?.subscriptionStatus === 'trialing';
    const isActive = isPro && user?.subscriptionStatus === 'active';

    let daysLeft = 0;
    if (isTrialing && user?.trialEndDate) {
        daysLeft = Math.max(0, differenceInDays(new Date(user.trialEndDate), new Date()) + 1);
    }

    const handleCreatePortalSession = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { url } = await api.createCustomerPortalSession();
            if (url) {
                window.location.href = url;
            } else {
                setError("Could not redirect to subscription portal.");
            }
        } catch (err) {
            console.error("Failed to create portal session:", err);
            setError("Failed to open subscription management.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePlan = () => {
        if (!isPro || isTrialing) {
            store.openUpgradeModal();
        } else {
            handleCreatePortalSession();
        }
    };

    return (
        <div className="subscription-settings-container">
            <p className="settings-description">Manage your billing and membership plan.</p>

            {error && (
                <div className="error-banner" style={{ marginBottom: '16px', padding: '10px', background: 'rgba(255,0,0,0.1)', color: 'red', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className={`plan-status-card ${isTrialing ? 'trialing' : ''} ${isActive ? 'active' : ''}`}>
                <div className="card-header">
                    <div>
                        <div className="plan-title">
                            {isActive ? 'Pro Plan' : isTrialing ? 'Free Trial' : 'Free Plan'}
                        </div>
                        <div className="plan-subtitle">
                            {isActive ? 'You have full access to all premium features.' :
                                isTrialing ? 'You are currently exploring premium features.' :
                                    'Limited features. Upgrade to unlock full potential.'}
                        </div>
                    </div>
                    <div className={`plan-badge ${isPro ? 'pro' : 'free'}`}>
                        {isPro ? 'PRO' : 'FREE'}
                    </div>
                </div>

                {isTrialing && (
                    <div className="trial-expiry-info">
                        <Sparkles size={16} color="#EC4899" />
                        <span>Your trial ends in <span className="trial-days">{daysLeft} days</span>.</span>
                    </div>
                )}

                {isActive && (
                    <div className="trial-expiry-info">
                        <CheckCircle2 size={16} color="#10B981" />
                        <span>Your subscription is active.</span>
                    </div>
                )}
            </div>

            <div className="settings-label">MANAGE MEMBERSHIP</div>

            <div className="settings-action-list">
                <button className="settings-action-btn" onClick={handleCreatePortalSession} disabled={isLoading}>
                    <span>View invoices</span>
                    <ExternalLink size={14} className="action-icon" />
                </button>

                <button className="settings-action-btn" onClick={handleChangePlan} disabled={isLoading}>
                    <span>Change Plan</span>
                    <ExternalLink size={14} className="action-icon" />
                </button>

                <button className="settings-action-btn danger" onClick={handleCreatePortalSession} disabled={isLoading}>
                    <span>Cancel Membership</span>
                    <AlertTriangle size={14} className="action-icon" />
                </button>
            </div>

            {!isActive && !isTrialing && (
                <div className="upgrade-cta">
                    <h3>Get the most out of Project Planner</h3>
                    <p>Unlock unlimited projects, team collaboration, and advanced analytics.</p>
                    <button className="premium-btn" onClick={() => store.openUpgradeModal()}>
                        Upgrade to Pro
                    </button>
                </div>
            )}
        </div>
    );
});
