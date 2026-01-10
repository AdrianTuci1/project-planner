import React from 'react';
import {
    Paperclip,
    Copy,
    BarChart2,
    Link,
    CalendarClock,
    Flag,
    Mail,
    Sun,
    ExternalLink
} from 'lucide-react';
import './PowerFeaturesSettings.css';

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradientClass: string;
    isEnabled?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, gradientClass, isEnabled = false }) => {
    const [checked, setChecked] = React.useState(isEnabled);

    return (
        <div className="power-feature-card">
            <div className={`feature-preview ${gradientClass}`}>
                <div className="feature-mock-ui">
                    <div className="mock-line" style={{ width: '40%', marginBottom: 4 }} />
                    <div className="mock-line" />
                    <div className="mock-line" />
                    <div className="mock-line short" />
                </div>
            </div>
            <div className="feature-content">
                <div className="feature-title-row">
                    {icon}
                    <h3>{title}</h3>
                </div>
                <div className="feature-description">
                    {description}
                </div>
                <div className="feature-footer">
                    <label className="feature-switch">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                        />
                        <span className="slider" />
                    </label>
                    <a href="#" className="learn-more-link" onClick={(e) => e.preventDefault()}>
                        Learn more <ExternalLink size={12} />
                    </a>
                </div>
            </div>
        </div>
    );
};

export const PowerFeaturesSettings = () => {
    const features = [
        {
            title: "Attachments",
            description: "Attach files (PDF, images, etc...) to your tasks.",
            icon: <Paperclip size={18} />,
            gradientClass: "gradient-1",
            isEnabled: false
        },
        {
            title: "Task Templates",
            description: "Create reusable task templates for common workflows and quickly turn them into tasks.",
            icon: <Copy size={18} />,
            gradientClass: "gradient-2",
            isEnabled: false
        },
        {
            title: "Analytics",
            description: "Visualize where you spend your time and how you're progressing.",
            icon: <BarChart2 size={18} />,
            gradientClass: "gradient-3",
            isEnabled: true
        },
        {
            title: "API Token",
            description: "Enable this to allow third party apps (like Zapier) to connect to Ellie.",
            icon: <Link size={18} />,
            gradientClass: "gradient-4",
            isEnabled: false
        },
        {
            title: "Due dates",
            description: "Add due dates to your tasks (and even reminder notifications).",
            icon: <CalendarClock size={18} />,
            gradientClass: "gradient-5",
            isEnabled: true
        },
        {
            title: "Task Priority",
            description: "Add priority flags directly on your task to easily see what's important.",
            icon: <Flag size={18} />,
            gradientClass: "gradient-6",
            isEnabled: false
        },
        {
            title: "Email forwarding",
            description: "Forward emails directly into Ellie to create tasks.",
            icon: <Mail size={18} />,
            gradientClass: "gradient-7",
            isEnabled: false
        },
        {
            title: "Daily Planning",
            description: "Guided walkthroughs to help you plan & reflect on your day.",
            icon: <Sun size={18} />,
            gradientClass: "gradient-8",
            isEnabled: true
        }
    ];

    return (
        <div className="power-features-container">
            <div className="power-features-header">
                <h2>Power Features</h2>
                <p>Turn on the features you need to supercharge your productivity.</p>
            </div>

            <div className="power-features-grid">
                {features.map((feature, index) => (
                    <FeatureCard
                        key={index}
                        {...feature}
                    />
                ))}
            </div>
        </div>
    );
};
