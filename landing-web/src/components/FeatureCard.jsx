import Card from './Card'
import './FeatureCard.css'

export default function FeatureCard({ label, title, description, image, reversed = false, gradient }) {
    return (
        <div className={`feature-card ${reversed ? 'feature-card--reversed' : ''}`}>
            <div className="feature-card__content">
                <div className="feature-card-wrapper">
                    {label && <span className="feature-card__label">{label}</span>}
                    <h3 className="feature-card__title">{title}</h3>
                    <p className="feature-card__description">{description}</p>
                </div>
            </div>
            <div className="feature-card__visual">
                <div className="feature-card__overlay">
                    {gradient && <img src={gradient} alt="" />}
                </div>
                <div className="feature-card__frame">
                    <div className="feature-card__image-container">
                        <img src={image} alt={title} />
                    </div>
                </div>
            </div>
        </div>
    )
}
