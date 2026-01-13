import { useEffect, useState } from 'react'
import Button from '../components/Button'
import './Navbar.css'

export default function Navbar() {
    const [activeSection, setActiveSection] = useState('home')

    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('section[id], footer[id]')
            let current = ''

            sections.forEach((section) => {
                const sectionTop = section.offsetTop
                const sectionHeight = section.clientHeight
                if (window.scrollY >= (sectionTop - 200)) { // Offset for navbar
                    current = section.getAttribute('id')
                }
            })

            // If we are at the bottom of the page, highlight the last item (Contact)
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 50) {
                // Try to find the footer or last section
                const footer = document.querySelector('footer[id]')
                if (footer) current = footer.getAttribute('id')
            }

            if (current) {
                setActiveSection(current)
            }
        }

        window.addEventListener('scroll', handleScroll)
        // Trigger once on mount
        handleScroll()

        return () => {
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const getLinkClass = (sectionId) => {
        return `navbar__link ${activeSection === sectionId ? 'active' : ''}`
    }

    const scrollToSection = (e, sectionId) => {
        e.preventDefault()
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <nav className="navbar">
            <div className="container navbar__container">
                <div className="navbar__logo">
                    <img src="/logo.png" alt="Logo" />
                    simplu
                </div>
                <div className="navbar__menu">
                    <a href="#home" className={getLinkClass('home')} onClick={(e) => scrollToSection(e, 'home')}>Home</a>
                    <a href="#features" className={getLinkClass('features')} onClick={(e) => scrollToSection(e, 'features')}>Features</a>
                    <a href="#how-it-works" className={getLinkClass('how-it-works')} onClick={(e) => scrollToSection(e, 'how-it-works')}>How to Use</a>
                    <a href="#pricing" className={getLinkClass('pricing')} onClick={(e) => scrollToSection(e, 'pricing')}>Pricing</a>
                    <a href="#contact" className={getLinkClass('contact')} onClick={(e) => scrollToSection(e, 'contact')}>Chat with us</a>
                </div>
                <div className="navbar__actions">
                    <Button variant="primary">Sign In</Button>
                </div>
            </div>
        </nav>
    )
}
