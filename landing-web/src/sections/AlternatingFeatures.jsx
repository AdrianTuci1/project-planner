import FeatureCard from '../components/FeatureCard'
import './AlternatingFeatures.css'

export default function AlternatingFeatures() {

    const featuresData = [
        {
            id: 1,
            title: "Design your perfect day.",
            description: "Stop reacting and start commanding your hours. Drag your tasks directly onto your calendar to create a bulletproof plan that protects your deep work and eliminates decision fatigue.",
            reversed: false,
            image: '/visuals/part1.png',
            gradient: '/gradients/grad1.jpg'
        },
        {
            id: 2,
            title: "Insights that inspire.",
            description: "Get a crystal-clear view of where your time actually goes. Our playful insights transform raw data into a visual roadmap, helping you spot burnout before it happens and celebrate your wins.",
            reversed: true,
            image: '/visuals/part2.png',
            gradient: '/gradients/grad2.avif'
        },
        {
            id: 3,
            title: "Master the shutdown.",
            description: "End the day with a clean slate and a quiet mind. Our signature shutdown ritual helps you review your progress, offload leftover tasks, and mentally transition to what matters most.",
            reversed: false,
            image: '/visuals/part3.png',
            gradient: '/gradients/grad3.webp'
        }
    ]

    return (
        <section className="alternating-features" id="features">

            <div className="alternating-features__header-wrapper">
                <h2 className="alternating-features__header">
                    Everything you need to<br />
                    <span>own your day</span>.
                </h2>
            </div>
            <div className="alternating-features__list">
                {featuresData.map(feature => (
                    <FeatureCard
                        key={feature.id}
                        title={feature.title}
                        description={feature.description}
                        reversed={feature.reversed}
                        image={feature.image}
                        gradient={feature.gradient}
                    />
                ))}
            </div>
        </section>
    )
}
