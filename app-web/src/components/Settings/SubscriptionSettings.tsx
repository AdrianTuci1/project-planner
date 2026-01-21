import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { CreditCard, ExternalLink, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const SubscriptionSettings = observer(() => {
    const { settings } = store;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Placeholder for actual subscription data from store/backend
    // TODO: Connect to actual user subscription state
    const subscriptionStatus = "Free Trial 🥳";
    const daysLeft = 2; // Calculate this based on trial end date

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

    const handleChangePlan = async () => {
        // Logic to determine if we send them to portal or checkout
        // For now, let's assume portal handles upgrades too or we redirect to a checkout for specific plan
        // If they are on free, maybe we want to go straight to checkout?
        // For simplicity, let's try portal first as it handles "Update plan" usually.
        // Or if specific requirement: "All options redirect to stripe"
        handleCreatePortalSession();
    };

    return (
        <div className="settings-panel">
            <p className="settings-description">Manage your billing and membership plan.</p>

            {error && (
                <div className="error-banner" style={{ marginBottom: '16px', padding: '10px', background: 'rgba(255,0,0,0.1)', color: 'red', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className="settings-group">
                <div className="settings-label">MEMBERSHIP</div>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {subscriptionStatus}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(ends in {daysLeft} days)</span>
                </div>

                <div className="settings-label">MANAGE MEMBERSHIP</div>

                <div className="settings-action-list">
                    <button
                        className="settings-action-btn"
                        onClick={handleCreatePortalSession}
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', background: 'none', border: 'none', padding: '8px 0', fontSize: '15px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                        View invoices <ExternalLink size={14} style={{ marginLeft: '8px' }} />
                    </button>

                    <button
                        className="settings-action-btn"
                        onClick={handleChangePlan}
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', background: 'none', border: 'none', padding: '8px 0', fontSize: '15px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                        Change Plan <ExternalLink size={14} style={{ marginLeft: '8px' }} />
                    </button>

                    <button
                        className="settings-action-btn"
                        onClick={handleCreatePortalSession}
                        disabled={isLoading}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-primary)', background: 'none', border: 'none', padding: '8px 0', fontSize: '15px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                        Cancel Membership <ExternalLink size={14} style={{ marginLeft: '8px' }} />
                    </button>
                </div>
            </div>
        </div>
    );
});
