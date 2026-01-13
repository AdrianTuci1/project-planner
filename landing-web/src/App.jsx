import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import Navbar from './components/Navbar'
import UserHero from './sections/Hero'
import SecondHero from './sections/SecondHero'
import AlternatingFeatures from './sections/AlternatingFeatures'
import GridFeatures from './sections/GridFeatures'
import Pricing from './sections/Pricing'
import Footer from './components/Footer'
import './App.css'

function App() {
  useEffect(() => {
    const lenis = new Lenis()

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <div className="app">
      <Navbar />
      <main>
        <UserHero />
        <AlternatingFeatures />
        <GridFeatures />
        <SecondHero />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}

export default App
