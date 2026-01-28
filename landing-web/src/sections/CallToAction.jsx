import Button from '../components/Button'
import './CallToAction.css'

export default function CallToAction() {
    return (
        <section className="cta">
            <div className="container">
                <div className="cta__content">
                    <h2 className="cta__title">
                        Ready to transform your workflow?
                    </h2>
                    <p className="cta__description">
                        Join thousands of teams already using Simplu to orchestrate their business operations seamlessly.
                    </p>
                    <div className="cta__buttons">
                        <Button variant="primary">Get Started Free</Button>
                    </div>
                </div>
            </div>
        </section>
    )
}
