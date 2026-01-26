import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    X,
    Check,
    Sparkles,
    Infinity,
    Smartphone,
    Clock,
    Calendar,
    Tag,
    List,
    Repeat,
    Heart,
    Inbox,
    PersonStanding,
    Wrench
} from 'lucide-react';
import { api } from '../../services/api';
import './UpgradeModal.css';

export const UpgradeModal = observer(() => {
    const [billedYearly, setBilledYearly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!store.isUpgradeModalOpen) return null;

    const handleUpgrade = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const planType = billedYearly ? 'yearly' : 'monthly';
            const { url } = await api.createCheckoutSession(planType);
            if (url) {
                window.location.href = url;
            } else {
                setError("Failed to create checkout session.");
            }
        } catch (err: any) {
            console.error("Upgrade failed:", err);
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="upgrade-modal-overlay" onClick={() => store.closeUpgradeModal()}>
            <div className="upgrade-modal-container" onClick={e => e.stopPropagation()}>
                <button className="close-button" onClick={() => store.closeUpgradeModal()}>
                    <X size={20} />
                </button>

                <div className="upgrade-modal-header">
                    <div className="upgrade-title">
                        <Sparkles size={24} color="#FFD700" fill="#FFD700" />
                        Ready for an upgrade?
                        <Sparkles size={24} color="#FFD700" fill="#FFD700" />
                    </div>
                    <div className="upgrade-subtitle">
                        Increase your productivity with powerful features
                    </div>
                </div>

                <div className="upgrade-content">
                    {/* Header for Pricing Columns */}
                    <div className="comparison-header">
                        <div className="feature-name" style={{ flex: 2 }}></div> {/* Spacer */}

                        <div className="plan-column">
                            <div className="plan-name">Basic</div>
                            <div className="plan-price">Free</div>
                            <div className="plan-action">
                                <div className="current-plan-badge">Your Plan</div>
                            </div>
                        </div>

                        <div className="plan-column">
                            <div className="plan-name">Pro</div>
                            <div className="plan-price">
                                {billedYearly ? '$119.99/year' : '$14.99/mo'}
                            </div>
                            <div className="plan-action">
                                <button
                                    className="upgrade-button"
                                    onClick={handleUpgrade}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Processing...' : 'Upgrade'}
                                </button>
                            </div>
                            <div className="billing-toggle">
                                <input
                                    type="checkbox"
                                    id="billing-switch"
                                    className="toggle-switch-input"
                                    checked={billedYearly}
                                    onChange={() => setBilledYearly(!billedYearly)}
                                />
                                <label htmlFor="billing-switch" className="toggle-switch-label"></label>
                                <span>Billed Yearly</span>
                                <span className="save-badge">Save 20%</span>
                            </div>
                        </div>
                    </div>

                    {error && <div className="upgrade-error-message" style={{ color: '#EF4444', textAlign: 'center', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

                    {/* Feature List */}
                    <div className="feature-scroll-area">
                        <FeatureRow icon={<Infinity size={16} color="#3B82F6" />} name="Unlimited tasks" basic={true} pro={true} />
                        <FeatureRow icon={<Inbox size={16} color="#8B5CF6" />} name="Inbox" basic={true} pro={true} />
                        <FeatureRow icon={<Smartphone size={16} color="#10B981" />} name="iPhone & iPad App" basic={true} pro={true} />
                        <FeatureRow icon={<PersonStanding size={16} color="#8B5CF6" />} name="Join teams" basic={true} pro={true} />
                        <FeatureRow icon={<Clock size={16} color="#F59E0B" />} name="Timebox mode" basic={false} pro={true} />
                        <FeatureRow icon={<Calendar size={16} color="#10B981" />} name="Google Calendar Integration" basic={false} pro={true} />
                        <FeatureRow icon={<Calendar size={16} color="#EF4444" />} name="Apple Calendar Integration" basic={false} pro={true} />
                        <FeatureRow icon={<Tag size={16} color="#EC4899" />} name="Labels & Filters" basic={false} pro={true} />
                        <FeatureRow icon={<List size={16} color="#F97316" />} name="Subtasks" basic={false} pro={true} />
                        <FeatureRow icon={<Repeat size={16} color="#3B82F6" />} name="Recurring Tasks" basic={false} pro={true} />
                        <FeatureRow icon={<Wrench size={16} color="#8B5CF6" />} name="Create teams" basic={false} pro={true} />
                        <FeatureRow icon={<Heart size={16} color="#EF4444" />} name="Support an Independent Developer" basic={false} pro={true} />
                    </div>

                    <div className="modal-footer">
                        {/* <a href="#" className="footer-link">
                            🧐 Student or non profit? <span>Click here</span> for 50% off any plan
                        </a>
                        <a href="#" className="footer-link">
                            💫 Tired of subscriptions? <span>Click here</span> to purchase a lifetime license ($300)
                        </a> */}
                    </div>
                </div>
            </div>
        </div>
    );
});

const FeatureRow = ({ icon, name, basic, pro }: { icon: React.ReactNode, name: string, basic: boolean, pro: boolean }) => (
    <div className="feature-row">
        <div className="feature-name">
            {icon}
            <span style={{ marginLeft: 10 }}>{name}</span>
        </div>
        <div className="feature-check">
            {basic ? <Check size={16} className="check-icon" /> : <div className="dash-icon">—</div>}
        </div>
        <div className="feature-check">
            {pro ? <Check size={16} className="check-icon" /> : <div className="dash-icon">—</div>}
        </div>
    </div>
);
