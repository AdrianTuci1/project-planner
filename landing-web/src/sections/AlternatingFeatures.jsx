import FeatureCard from '../components/FeatureCard'
import './AlternatingFeatures.css'

export default function AlternatingFeatures() {

    const featuresData = [
        {
            id: 1,
            title: "No tabs. Hello AI cards.",
            description: "Completely reimagining the traditional tab interfaces to dedicated AI Cards with detailed context. Each card combines multiple connected apps based on your task.",
            reversed: false
        },
        {
            id: 2,
            title: "Categories for Memory & Context",
            description: "Organize your canvas by categorizing your tasks. Right-click on the empty Canvas to create a new category. Each category has its own context and memory that makes it a hyper-personalized experience.",
            reversed: true
        },
        {
            id: 3,
            title: "Surf the web with Built-in Browsing",
            description: "We understand browsing is still essential to any kind of work, and we have implemented state-of-the-art browsing capabilities directly in the canvas.",
            reversed: false
        }
    ]

    return (
        <section className="alternating-features" id="features">

            <div className="alternating-features__header-wrapper">
                <h2 className="alternating-features__header">
                    simplu does all your time consuming operations
                </h2>
            </div>
            <div className="alternating-features__list">
                {featuresData.map(feature => (
                    <FeatureCard
                        key={feature.id}
                        title={feature.title}
                        description={feature.description}
                        reversed={feature.reversed}
                    />
                ))}
            </div>
        </section>
    )
}
