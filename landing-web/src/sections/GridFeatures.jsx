import './GridFeatures.css'
import aiCardsImg from '../assets/ai-cards.png'
import memoryContextImg from '../assets/memory-context.png'
import browsingImg from '../assets/browsing.png'

export default function GridFeatures() {
    const features = [
        {
            id: 1,
            subtitle: "No tabs",
            title: "Hello AI cards",
            description: "Completely reimagining the traditional tab interfaces to dedicated AI Cards with detailed context. Each card combines multiple connected apps based on your task and provides live status and insights.",
            image: aiCardsImg
        },
        {
            id: 2,
            subtitle: "Categories for",
            title: "Memory & Context",
            description: "Organize your canvas by categorizing your tasks. Right-click on the empty Canvas to create a new category. Each category has its own context and memory that makes it a hyper-personalized experience.",
            image: memoryContextImg
        },
        {
            id: 3,
            subtitle: "Surf the web with",
            title: "Built-in Browsing",
            description: "We understand browsing is still stands as essential to any kind of work, and we have implemented state-of-the-art browsing capabilities. Surf the web and get things done then and there itself.",
            image: browsingImg
        }
    ]

    return (
        <section className="grid-features" id="how-it-works">
            <div className="container">
                <h2 className="grid-features__header">
                    a beautiful canvas for<br />all your AI apps and agents
                </h2>
                <div className="grid-features__grid">
                    {features.map(feature => (
                        <div key={feature.id} className="grid-feature-card">
                            <div className="grid-feature-card__content">
                                <span className="grid-feature-card__subtitle">{feature.subtitle}</span>
                                <h3 className="grid-feature-card__title">{feature.title}</h3>
                                <p className="grid-feature-card__description">{feature.description}</p>
                            </div>
                            <div className="grid-feature-card__image">
                                <img src={feature.image} alt={feature.title} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

