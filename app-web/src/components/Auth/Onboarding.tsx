import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { store } from '../../models/store';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import {
    Linkedin, Instagram, Users, Building2, Twitter, Globe,
    GraduationCap, Briefcase, Rocket, LayoutList, Code, User,
    CheckCircle2, Target, Zap, BookOpen
} from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = [
    {
        question: "Where did you hear about us?",
        options: [
            { label: "LinkedIn", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/LinkedIn_logo_initials.png/250px-LinkedIn_logo_initials.png" },
            { label: "Instagram", image: "https://cdn.simpleicons.org/instagram/E4405F" },
            { label: "Friend / Colleague", emoji: "🥷🏼" },
            { label: "Agency", emoji: "🏰" },
            { label: "X", image: "https://img.freepik.com/free-vector/new-2023-twitter-logo-x-icon-design_1017-45418.jpg?semt=ais_hybrid&w=740&q=80" }, // Use black for X logo
            { label: "Other", emoji: "🌐" }
        ],
        field: "source",
        columns: 2
    },
    {
        question: "Who are you?",
        options: [
            { label: "Student", emoji: "🎓" },
            { label: "Freelancer", emoji: "💻" },
            { label: "Founder", emoji: "🚀" },
            { label: "Product Manager", emoji: "🧑🏼‍🎨" },
            { label: "Developer", emoji: "👨‍💻" },
            { label: "Other", emoji: "💼" }
        ],
        field: "role",
        columns: 2
    },
    {
        question: "What will you use the app for?",
        options: [
            { label: "Personal Productivity", emoji: "✅" },
            { label: "Work Management", emoji: "🎯" },
            { label: "Team Collaboration", emoji: "🤝" },
            { label: "Education", emoji: "📚" },
            { label: "Other", emoji: "⚡" }
        ],
        field: "usage",
        columns: 1
    }
];

export const Onboarding: React.FC<OnboardingProps> = observer(({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});

    // Additional state for registration fields if not collected elsewhere?
    // The user flow seems to be: Select options -> "Get Started" -> Create Account.
    // However, the current Onboarding file doesn't have email/password inputs. 
    // It seems "Onboarding" might be *after* signup or *part* of signup.
    // The prompt says "la onboarding trebuie sa putem creea cont". 
    // So I should probably add a step for Email/Password or assume they are passed/handled.
    // Looking at the code, it ends with "Get Started". I should probably add a final step for Account Creation.

    // Let's add a state for email/password form at the end.
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleSelect = (option: string) => {
        setAnswers(prev => ({ ...prev, [currentStep]: option }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            // Reached "Get Started", show account creation form
            setIsCreatingAccount(true);
        }
    };

    const handleBack = () => {
        if (isCreatingAccount) {
            setIsCreatingAccount(false);
            return;
        }
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Transform answers to semantic keys
            const formattedOnboarding = Object.keys(answers).reduce((acc: any, key: any) => {
                const stepIndex = parseInt(key);
                if (STEPS[stepIndex]) {
                    acc[STEPS[stepIndex].field] = answers[key];
                }
                return acc;
            }, {});

            store.authStore.setPendingOnboarding(formattedOnboarding);
            await store.authStore.register(email, password, name);

            // Auto-confirmed and logged in
            onComplete();
        } catch (err: any) {
            alert("Registration failed: " + err.message);
        }
    };

    const stepData = STEPS[currentStep];
    const isSelected = (optionLabel: string) => answers[currentStep] === optionLabel;
    const canProceed = !!answers[currentStep];

    if (isCreatingAccount) {
        return (
            <AuthLayout imageSrc="/onb.png" imageAlt="Abstract">
                <div className="auth-brand-header">
                    <div className="auth-logo-wrapper">
                        <img src="/logo.png" alt="Logo" className="auth-logo" />
                    </div>
                    <span className="auth-brand-name">simplu</span>
                </div>
                <h1 className="auth-title">Create your account</h1>
                <p className="auth-subtitle">Start your journey with us.</p>

                <form className="auth-form" onSubmit={handleRegister}>
                    <div>
                        <label className="auth-label">Full Name</label>
                        <input
                            className="auth-input"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="auth-label">Email</label>
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="auth-label">Password</label>
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {store.authStore.error && (
                        <div style={{ color: 'red', marginTop: 10 }}>{store.authStore.error}</div>
                    )}

                    <div className="auth-nav-buttons" style={{ marginTop: 'var(--space-6)' }}>
                        <button
                            type="button"
                            className="auth-back-button"
                            onClick={handleBack}
                            disabled={store.authStore.isLoading}
                        >
                            Back
                        </button>
                        <button
                            className="auth-button"
                            type="submit"
                            disabled={store.authStore.isLoading}
                            style={{ flex: 1, cursor: store.authStore.isLoading ? 'wait' : 'pointer' }}
                        >
                            {store.authStore.isLoading ? "Creating..." : "Create Account"}
                        </button>
                    </div>

                    <div className="auth-separator" style={{
                        display: 'flex', alignItems: 'center', margin: 'var(--space-6) 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)'
                    }}>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border-primary)' }}></span>
                        <span style={{ padding: '0 var(--space-4)' }}>OR</span>
                        <span style={{ flex: 1, height: '1px', background: 'var(--border-primary)' }}></span>
                    </div>

                    <button
                        type="button"
                        className="auth-button-secondary"
                        // Transform answers to semantic keys
                        onClick={() => {
                            // Transform answers to semantic keys
                            const formattedOnboarding = Object.keys(answers).reduce((acc: any, key: any) => {
                                const stepIndex = parseInt(key);
                                if (STEPS[stepIndex]) {
                                    acc[STEPS[stepIndex].field] = answers[key];
                                }
                                return acc;
                            }, {});

                            store.authStore.setPendingOnboarding(formattedOnboarding);
                            store.authStore.loginWithGoogle();
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Sign up with Google
                    </button>
                </form>
            </AuthLayout >
        );
    }

    return (
        <AuthLayout imageSrc="/onb.png" imageAlt="Abstract 3D Shape">
            <div className="auth-brand-header">
                <div className="auth-logo-wrapper">
                    <img src="/logo.png" alt="Logo" className="auth-logo" />
                </div>
                <span className="auth-brand-name">simplu</span>
            </div>

            <h1 className="auth-title">{stepData.question}</h1>
            <p className="auth-subtitle">Select the best option that describes you.</p>

            <div className="auth-form">
                <div className={`auth-option-grid ${stepData.columns === 2 ? 'two-columns' : ''}`}>
                    {stepData.options.map((option) => {
                        // @ts-ignore - Dynamic options structure
                        const { emoji, image } = option;
                        const isSelectedOption = isSelected(option.label);
                        return (
                            <div
                                key={option.label}
                                className={`auth-option-card ${isSelectedOption ? 'selected' : ''}`}
                                onClick={() => handleSelect(option.label)}
                            >
                                {image ? (
                                    <img src={image} alt={option.label} className="auth-option-image" />
                                ) : (
                                    <span className="auth-option-emoji">{emoji}</span>
                                )}
                                <span className="auth-option-label">{option.label}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="auth-nav-buttons">
                    {currentStep > 0 && (
                        <button
                            className="auth-back-button"
                            onClick={handleBack}
                        >
                            Back
                        </button>
                    )}

                    <button
                        className="auth-button"
                        onClick={handleNext}
                        disabled={!canProceed}
                        style={{ flex: 1, opacity: !canProceed ? 0.5 : 1, cursor: !canProceed ? 'not-allowed' : 'pointer' }}
                    >
                        {currentStep === STEPS.length - 1 ? "Get Started" : "Next"}
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
});
