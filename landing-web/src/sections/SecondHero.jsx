import './SecondHero.css'

export default function SecondHero() {
    return (
        <section className="features">
            <div className="container features__container">
                <h2 className="features__title">
                    Simplu is your<br />
                    <span>Business Orchestrator</span>
                </h2>

                <div className="features__description">
                    <div className="features__text-block">
                        <h3>One infinite canvas for all your business apps and agents</h3>
                        <p>A beautiful canvas to organize your apps, agents, conversations, and outputs meaningfully.</p>
                    </div>
                </div>

                <div className="features__visual">
                    <div className="features__visual-placeholder">
                        Dashboard/Orchestrator Visual
                    </div>
                </div>
            </div>
        </section>
    )
}
