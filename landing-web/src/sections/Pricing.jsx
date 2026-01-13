import { useState } from 'react'
import Button from '../components/Button'
import './Pricing.css'

const plans = [
    {
        name: "Free",
        price: { monthly: 0, yearly: 0 },
        description: "For those who want new experiences",
        buttonText: "Get Started",
        features: [
            "200 credits per month",
            "Free canvas"
        ],
        popular: false
    },
    {
        name: "Pro",
        price: { monthly: 50, yearly: 40 },
        description: "For those who want to experience a new way of managing work",
        buttonText: "Join Waitlist",
        features: [
            "One canvas",
            "2000 credits per month",
            "One additional seat"
        ],
        popular: true
    },
    {
        name: "Infinite",
        price: { monthly: 250, yearly: 200 },
        description: "For those who want an infinite experience, now and in the future",
        buttonText: "Join Waitlist",
        features: [
            "Two canvases",
            "Six seats",
            "50,000 credits per month"
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
                    <h2>Enter your Business canvas</h2>
                    <h3>Try it free today</h3>

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
                                <h4>{plan.name}</h4>
                                <div className="price">
                                    ${isYearly ? plan.price.yearly * 12 : plan.price.monthly}
                                    <span>{isYearly ? '/year' : '/month'}</span>
                                </div>
                                <p style={{ height: '60px' }}>{plan.description}</p>
                            </div>
                            <Button variant="primary" style={{ width: '100%' }}>{plan.buttonText}</Button>
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
