import React from 'react';
import './Auth.css';

interface AuthLayoutProps {
    children: React.ReactNode;
    imageSrc?: string;
    imageAlt?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, imageSrc, imageAlt = "Auth Visual" }) => {
    return (
        <div className="auth-container">
            {/* Left Column: Content */}
            <div className="auth-content-col">
                <div className="auth-form-wrapper">
                    {children}
                </div>
            </div>

            {/* Right Column: Image */}
            <div className="auth-image-col">
                {imageSrc ? (
                    <img
                        src={imageSrc}
                        alt={imageAlt}
                        className="auth-image-placeholder"
                    />
                ) : (
                    // Default visual if no image
                    <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)',
                        position: 'relative'
                    }}>
                        <div className="auth-gradient-overlay" />
                    </div>
                )}
            </div>
        </div>
    );
};
