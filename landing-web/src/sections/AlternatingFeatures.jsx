import FeatureCard from '../components/FeatureCard'
import './AlternatingFeatures.css'

export default function AlternatingFeatures() {

    const featuresData = [
        {
            id: 1,
            title: "Build your day like a pro.",
            description: "Stop reacting to notifications and start commanding your hours. Drag your tasks directly onto your calendar to create a bulletproof plan that protects your deep work and eliminates decision fatigue.",
            reversed: false,
            image: '/visuals/part1.png',
        },
        {
            id: 2,
            title: "See the magic in numbers.",
            description: "Get a crystal-clear view of where your time actually goes. Our playful insights transform boring data into a visual roadmap, helping you spot burnout before it happens and celebrate your most productive streaks.",
            reversed: true,
            image: '/visuals/part2.png',
        },
        {
            id: 3,
            title: `The "off" switch you deserve.`,
            description: `End the day with a clean slate and a quiet mind. Our signature shutdown ritual helps you review your wins, offload leftover tasks, and mentally transition from "hustle mode" to "home mode" in seconds.`,
            reversed: false,
            image: '/visuals/part3.png',
        }
    ]

    return (
        <section className="alternating-features" id="features">

            <div className="alternating-features__header-wrapper">
                <h2 className="alternating-features__header">
                    Simplu has everything you need to own your day.
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
                    />
                ))}
            </div>
        </section>
    )
}
