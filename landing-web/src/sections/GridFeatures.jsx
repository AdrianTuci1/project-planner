import './GridFeatures.css'


export default function GridFeatures() {
    const features = [
        {
            id: 1,
            subtitle: "Deep work",
            title: "Sprint your way to done.",
            description: "High-intensity focus meets guilt-free breaks. Use our built-in timer to break big projects into bite-sized sprints, keeping your brain fresh and your momentum high until the finish line.",
            image: "/visuals/part4.png"
        },
        {
            id: 2,
            subtitle: "Connectivity",
            title: "Your apps, finally in sync.",
            description: "Connect to over 5,000+ tools and let the robots do the heavy lifting. Automate your workflow so that a message in Slack or a lead in CRM instantly becomes a task in your planner.",
            image: "/visuals/integration.png"
        },
        {
            id: 3,
            subtitle: "Habits",
            title: "Set it, then forget it.",
            description: "Build consistency without the mental clutter. Whether it’s a weekly report or your daily yoga, automate your routine tasks so they appear exactly when you need them—and stay out of the way when you don’t.",
            image: "/visuals/part5.png"
        }
    ]

    return (
        <section className="grid-features" id="how-it-works">
            <div className="container">
                <h2 className="grid-features__header">
                    Tools for the modern <br /> high-achiever.
                </h2>
                <div className="grid-features__grid">
                    {features.map(feature => (
                        <div key={feature.id} className="grid-feature-card">
                            <div className="grid-feature-card__content">
                                <span className="grid-feature-card__subtitle">{feature.subtitle}</span>
                                <h3 className="grid-feature-card__title">{feature.title}</h3>
                                <p className="grid-feature-card__description">{feature.description}</p>
                            </div>
                            <div className="visual-wrapper">
                                <div className="grid-feature-card__visual">
                                    <div className="grid-feature-card__overlay">
                                    </div>
                                    <div className="grid-feature-card__frame">
                                        <div className="grid-feature-card__image-container">
                                            <img src={feature.image} alt={feature.title} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

