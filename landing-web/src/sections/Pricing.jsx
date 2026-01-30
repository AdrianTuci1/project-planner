import { useState } from 'react'
import Button from '../components/Button'
import './Pricing.css'

const plans = [
    {
        icon: "👾",
        name: "Free",
        price: { monthly: 0, yearly: 0 },
        description: "Perfect for exploring new ways to organize your day.",
        buttonText: "Get Started",
        features: [
            "Unlimited tasks",
            "Inbox mapping",
            "Team collaboration",
            "Core analytics",
        ],
        popular: false
    },
    {
        icon: "🎨",
        name: "Pro",
        price: { monthly: 10, yearly: 8 },
        description: "For professionals who want a refined, focused workflow.",
        buttonText: "Join Waitlist",
        features: [
            "Everything in Free",
            "Advanced Labels",
            "Full Calendar Sync",
            "Unlimited Subtasks",
            "Routine Automations",
            "Timeboxing",
            "Teams (up to 10)",
        ],
        popular: true
    },
    {
        icon: "🚁",
        name: "Infinite",
        price: { monthly: 20, yearly: 16 },
        description: "The ultimate experience for visionaries and large teams.",
        buttonText: "Join Waitlist",
        features: [
            "Everything in Pro",
            "Unlimited team members",
            "Priority Support",
            "Early Access",
        ],
        popular: false
    }
]

export default function Pricing() {
    const [isYearly, setIsYearly] = useState(false)

    return (
        <section className="pricing" id="pricing">
            <div className="container">
                <div className="pricing__header">
                    <h2>Start your journey <span>today</span>.</h2>
                    <h3>Try it free</h3>

                    <div className="pricing__toggle-wrapper">
                        <div className="pricing__toggle-inner">
                            <div
                                className={`pricing__toggle-option ${!isYearly ? "active" : ""}`}
                                onClick={() => setIsYearly(false)}
                            >
                                Monthly
                            </div>
                            <div
                                className={`pricing__toggle-option ${isYearly ? "active" : ""}`}
                                onClick={() => setIsYearly(true)}
                            >
                                Yearly <span className="save-badge">-20%</span>
                            </div>
                            <div className={`pricing__toggle-slider ${isYearly ? "year-active" : ""}`} />
                        </div>
                    </div>
                </div>

                <div className="pricing__cards">
                    {plans.map((plan, index) => (
                        <div key={index} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
                            {plan.popular && <div className="popular-badge">Most popular</div>}
                            <div className="pricing-card__header">
                                <div className="pricing-card__title-row">
                                    <div className="pricing-card__icon">{plan.icon}</div>
                                    <h4>{plan.name}</h4>
                                </div>
                                <div className="price">
                                    ${isYearly ? plan.price.yearly * 12 : plan.price.monthly}
                                    <span>{isYearly ? '/year' : '/month'}</span>
                                </div>
                                <p style={{ height: '60px' }}>{plan.description}</p>
                            </div>
                            <Button
                                variant="primary"
                                style={{ width: '100%' }}
                                onClick={() => window.location.href = `${import.meta.env.VITE_APP_URL}/signup`}
                            >
                                {plan.buttonText}
                            </Button>
                            <ul className="pricing-card__features">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
