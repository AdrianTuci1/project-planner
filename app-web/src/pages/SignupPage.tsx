import React, { useState } from 'react';
import { Onboarding } from '../components/Auth/Onboarding';
import { AuthLayout } from '../components/Auth/AuthLayout';
import { useNavigate, Link } from 'react-router-dom';

type SignupPhase = 'onboarding' | 'registration';

interface SignupPageProps {
    onComplete: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onComplete }) => {
    const [phase, setPhase] = useState<SignupPhase>('onboarding');
    const navigate = useNavigate();

    // Registration state
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleOnboardingComplete = () => {
        setPhase('registration');
    };

    const handleRegistrationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In a real app, you would call an API to register the user here.
        // For now, we mock the success and call onComplete.
        console.log("Registering user:", { displayName, email, password });
        onComplete();
    };

    if (phase === 'onboarding') {
        return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    return (
        <AuthLayout imageSrc="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" imageAlt="Abstract Dark Background">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Set up your profile to get started.</p>

            <form className="auth-form" onSubmit={handleRegistrationSubmit}>
                <div>
                    <label className="auth-label">Display Name</label>
                    <input
                        className="auth-input"
                        type="text"
                        placeholder="John Doe"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="auth-label">Email</label>
                    <input
                        className="auth-input"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label className="auth-label">Password</label>
                    <input
                        className="auth-input"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                    />
                </div>

                <div className="auth-nav-buttons">
                    <button
                        className="auth-back-button"
                        type="button"
                        onClick={() => setPhase('onboarding')}
                    >
                        Back
                    </button>
                    <button
                        className="auth-button"
                        type="submit"
                        style={{ flex: 1 }}
                    >
                        Create Account
                    </button>
                </div>

                <div className="auth-footer" style={{ marginTop: 'var(--space-6)', textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Log in</Link>
                </div>
            </form>
        </AuthLayout>
    );
};
