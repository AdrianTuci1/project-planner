import './Footer.css'

export default function Footer() {
    return (
        <footer className="footer" id="contact">
            <div className="container footer__container">
                <div className="footer__brand">
                    <img src="/logo.png" alt="Logo" style={{ marginBottom: '1rem', width: '42px', height: '42px' }} />
                    <p className="footer__copyright">Copyright © 2026</p>
                </div>

                <div className="footer__links">
                    <div className="footer__column">
                        <h4>Product</h4>
                        <a href="#">Download</a>
                        <a href="#">Privacy</a>
                    </div>
                    <div className="footer__column">
                        <h4>Resources</h4>
                        <a href="#">Help Center</a>
                    </div>
                    <div className="footer__column">
                        <h4>Connect</h4>
                        <a href="#">X (Twitter)</a>
                        <a href="#">LinkedIn</a>
                    </div>
                </div>
            </div>
            <div className="container" style={{ textAlign: 'right', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--color-secondary)' }}>
                Designed & built by Simplu Inc.
            </div>
        </footer>
    )
}
