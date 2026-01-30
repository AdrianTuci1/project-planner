import './SecondHero.css'

export default function SecondHero() {
    return (
        <section className="features">
            <div className="container features__container">
                <h2 className="features__title">
                    Collaboration<br />
                    <span>reimagined</span>
                </h2>

                <div className="features__description">
                    <div className="features__text-block">
                        <h3>Forget the endless emails and scattered tools. <span>Build together</span> in real-time on one shared, beautiful canvas.</h3>
                    </div>
                </div>

                <div className="features__visual">
                    <div className="features__visual-placeholder">
                        <img src="/visuals/visual.png" alt="team" />

                        {/* Cursor Indicators */}
                        <div className="cursor-indicator" style={{ top: '20%', left: '10%' }}>
                            <div className="cursor-indicator__pointer">
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L6 26L18 14L26 22L28 20L20 12L28 10L6 4Z" fill="#FF6B6B" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="cursor-indicator__label" style={{ backgroundColor: '#FF6B6B' }}>Adrian</div>
                        </div>

                        <div className="cursor-indicator" style={{ top: '45%', left: '65%' }}>
                            <div className="cursor-indicator__pointer">
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L6 26L18 14L26 22L28 20L20 12L28 10L6 4Z" fill="#4ECDC4" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="cursor-indicator__label" style={{ backgroundColor: '#4ECDC4' }}>Maria</div>
                        </div>

                        <div className="cursor-indicator" style={{ top: '60%', left: '35%' }}>
                            <div className="cursor-indicator__pointer">
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L6 26L18 14L26 22L28 20L20 12L28 10L6 4Z" fill="#370bd6ff" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="cursor-indicator__label" style={{ backgroundColor: '#370bd6ff' }}>Alex</div>
                        </div>

                        <div className="cursor-indicator" style={{ top: '25%', left: '90%' }}>
                            <div className="cursor-indicator__pointer">
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L6 26L18 14L26 22L28 20L20 12L28 10L6 4Z" fill="#FFD93D" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="cursor-indicator__label" style={{ backgroundColor: '#FFD93D' }}>Sarah</div>
                        </div>

                        <div className="cursor-indicator" style={{ top: '70%', left: '65%' }}>
                            <div className="cursor-indicator__pointer">
                                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 4L6 26L18 14L26 22L28 20L20 12L28 10L6 4Z" fill="#48058bff" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className="cursor-indicator__label" style={{ backgroundColor: '#48058bff' }}>David</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
