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
            gsap.from('.hero__badge-1', {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                delay: 0.2
            })
            gsap.from('.hero__badge-2', {
                y: 50,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                delay: 0.2
            })
        }, heroRef)

        return () => ctx.revert()
    }, [])

    return (
        <section className="hero" ref={heroRef} id="home">
            <div className="container hero__container">
                {/* Badges/Pills can go here if needed */}
                <div className="hero__title-wrapper">
                    <span className="hero__badge-1">🎉</span>
                    <h1 className="hero__title">
                        Make every day count.
                    </h1>
                    <span className="hero__badge-2">🚀</span>
                </div>

                <p className="hero__subtitle">
                    The all-in-one productivity hub designed for modern professionals. From seamless team collaboration to precision time blocking, we help you conquer your goals and reclaim your free time.
                </p>

                <div className="hero__actions">
                    <Button variant="primary" onClick={() => window.location.href = `${import.meta.env.VITE_APP_URL}/signup`}>Try Simplu - It's free </Button>
                </div>

                <div className="hero__caption">
                    14 days free trial. No credit card required.
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
