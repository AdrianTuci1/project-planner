import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import Button from '../components/Button'
import './Hero.css'

export default function Hero() {
    const heroRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from('.hero__title', {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                delay: 0.2
            })
            gsap.from('.hero__subtitle', {
                y: 30,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                delay: 0.4
            })
            gsap.from('.hero__actions', {
                y: 20,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                delay: 0.6
            })
            gsap.from('.hero__visual', {
                scale: 0.95,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out',
                delay: 0.8
            })
        }, heroRef)

        return () => ctx.revert()
    }, [])

    return (
        <section className="hero" ref={heroRef} id="home">
            <div className="container hero__container">
                {/* Badges/Pills can go here if needed */}

                <h1 className="hero__title">
                    Your business management home
                </h1>

                <p className="hero__subtitle">
                    End your business chaos forever. We give you a collaborative canvas and powerful AI workflows without configuration overhead.
                </p>

                <div className="hero__actions">
                    <Button variant="primary">Get Access</Button>
                    <Button variant="secondary" style={{ border: 'none' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            ▶ Watch the demo
                        </span>
                    </Button>
                </div>

                <div className="hero__caption">
                    Simplu is currently in BETA
                </div>

                <div className="hero__visual">
                    {/* Placeholder for the large hero image */}
                    <div className="hero__image-placeholder">
                        <img src="/hero.png" alt="hero" />
                    </div>
                </div>
            </div>
        </section>
    )
}
