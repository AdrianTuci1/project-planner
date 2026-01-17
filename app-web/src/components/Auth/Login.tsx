import React from 'react';
import { AuthLayout } from './AuthLayout';
import { Link } from 'react-router-dom';

interface LoginProps {
    onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    return (
        <AuthLayout imageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" imageAlt="Abstract Dark Background">
            <h1 className="auth-title">Log in</h1>
            <p className="auth-subtitle">Welcome back! Please enter your details.</p>

            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                <div>
                    <label className="auth-label">Email</label>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Enter your email"
                    />
                </div>

                <div>
                    <label className="auth-label">Password</label>
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    className="auth-button"
                    type="submit"
                >
                    Sign in
                </button>

                <div className="auth-footer" style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link>
                </div>
            </form>
        </AuthLayout>
    );
};
