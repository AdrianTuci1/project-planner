import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = [
    {
        question: "Where did you hear about us?",
        options: ["LinkedIn", "Instagram", "Friend", "Agency", "Twitter", "Other"]
    },
    {
        question: "Who are you?",
        options: ["Student", "Freelancer", "Founder", "Product Manager", "Developer", "Other"]
    },
    {
        question: "What will you use the app for?",
        options: ["Personal Productivity", "Work Management", "Team Collaboration", "Education", "Other"]
    }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});

    const handleSelect = (option: string) => {
        setAnswers(prev => ({ ...prev, [currentStep]: option }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const stepData = STEPS[currentStep];
    const isSelected = (option: string) => answers[currentStep] === option;
    const canProceed = !!answers[currentStep];

    return (
        <AuthLayout imageSrc="https://images.unsplash.com/photo-1635326444826-06c8f8447838?q=80&w=2670&auto=format&fit=crop" imageAlt="Abstract 3D Shape">
            <div className="auth-step-indicator" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-muted)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Step {currentStep + 1} of {STEPS.length}
            </div>

            <h1 className="auth-title">{stepData.question}</h1>
            <p className="auth-subtitle">Select the best option that describes you.</p>

            <div className="auth-form">
                <div className="auth-chip-grid">
                    {stepData.options.map((option) => (
                        <div
                            key={option}
                            className={`auth-chip ${isSelected(option) ? 'selected' : ''}`}
                            onClick={() => handleSelect(option)}
                        >
                            {option}
                        </div>
                    ))}
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
};
