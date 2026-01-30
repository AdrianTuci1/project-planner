import './GridFeatures.css'


export default function GridFeatures() {
    const features = [
        {
            id: 1,
            subtitle: "Flow State",
            title: "Enter the zone and stay there.",
            description: "Deep work meets effortless rhythm. Use our seamless sprints to break big projects into focused intervals, keeping your momentum high and your mind remarkably clear.",
            image: "/visuals/part4.png",
            gradient: '/gradients/grad1.jpg'
        },
        {
            id: 2,
            subtitle: "Unified Hub",
            title: "Everything in one place.",
            description: "Connect to over 5,000+ tools and let the systems handle the busywork. Your emails, messages, and leads automatically align on your canvas, so you never lose the thread.",
            image: "/visuals/integration.png",
            gradient: '/gradients/grad2.avif'
        },
        {
            id: 3,
            subtitle: "Autopilot",
            title: "Build routines that stick.",
            description: "Consistency without the mental load. Automate your daily rituals and recurring wins so they appear exactly when needed, keeping your habits strong and your focus sharp.",
            image: "/visuals/part5.png",
            gradient: '/gradients/grad3.webp'
        }
    ]

    return (
        <section className="grid-features" id="how-it-works">
            <div className="container">
                <h2 className="grid-features__header">
                    Tools for the<br />
                    <span>modern high-achiever</span>.
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
                                        <img src={feature.gradient} alt="" />
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

