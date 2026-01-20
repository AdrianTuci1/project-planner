import React, { useState } from 'react';
import { Onboarding } from '../components/Auth/Onboarding';
import { AuthLayout } from '../components/Auth/AuthLayout';
import { useNavigate, Link } from 'react-router-dom';

type SignupPhase = 'onboarding' | 'registration';

interface SignupPageProps {
    onComplete: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = () => {
    // SignupPage now just delegates to Onboarding which handles the full flow including registration
    const navigate = useNavigate();

    const handleComplete = () => {
        // After registration/onboarding, go to root (which will redirect to login if not authenticated, or app if auto-login)
        navigate('/');
    };

    return <Onboarding onComplete={handleComplete} />;
};
