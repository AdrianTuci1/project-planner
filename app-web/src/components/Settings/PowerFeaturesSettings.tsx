import React from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    Paperclip,
    Copy,
    BarChart2,
    CalendarClock,
    Flag,
    Mail,
    Sun,
    ExternalLink,
    Cable
} from 'lucide-react';
import './PowerFeaturesSettings.css';

// Import images
// Images are now loaded from public/power-features

interface FeatureCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradientClass: string;
    isEnabled?: boolean;
    onToggle?: () => void;
    image?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = observer(({ title, description, icon, gradientClass, isEnabled = false, onToggle, image }) => {
    return (
        <div className="power-feature-card">
            <div className={`feature-preview ${gradientClass}`}>
                <div className="feature-mock-ui">
                    {image ? (
                        <img src={image} alt={`${title} preview`} className="feature-image" />
                    ) : (
                        <div>
                            <div className="mock-line" style={{ width: '40%', marginBottom: 4 }} />
                            <div className="mock-line" />
                            <div className="mock-line" />
                            <div className="mock-line short" />
                        </div>
                    )}
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
                            checked={isEnabled}
                            onChange={() => onToggle && onToggle()}
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
});

export const PowerFeaturesSettings = observer(() => {
    const { settings } = store;

    const features = [
        {
            title: "Attachments",
            description: "Attach files (PDF, images, etc...) to your tasks.",
            icon: <Paperclip size={18} />,
            gradientClass: "gradient-1",
            isEnabled: settings.general.featuresSettings.attachmentsEnabled,
            onToggle: () => settings.general.toggleFeature('attachmentsEnabled'),
            image: '/power-features/attachments.png'
        },
        {
            title: "Task Templates",
            description: "Create reusable task templates for common workflows and quickly turn them into tasks.",
            icon: <Copy size={18} />,
            gradientClass: "gradient-2",
            isEnabled: settings.general.featuresSettings.templatesEnabled,
            onToggle: () => settings.general.toggleFeature('templatesEnabled'),
            image: '/power-features/template.png'
        },
        {
            title: "Analytics",
            description: "Visualize where you spend your time and how you're progressing.",
            icon: <BarChart2 size={18} />,
            gradientClass: "gradient-3",
            isEnabled: true,
            image: '/power-features/analytics.png'
        },
        {
            title: "API Token",
            description: "Enable this to allow third party apps (like Zapier) to connect to Simplu.",
            icon: <Cable size={18} />,
            gradientClass: "gradient-4",
            isEnabled: settings.general.featuresSettings.apiTokenEnabled,
            onToggle: () => settings.general.toggleFeature('apiTokenEnabled'),
            image: '/power-features/api-token.png'
        },
        {
            title: "Due dates",
            description: "Add due dates to your tasks (and even reminder notifications).",
            icon: <CalendarClock size={18} />,
            gradientClass: "gradient-5",
            isEnabled: settings.general.featuresSettings.dueDatesEnabled,
            onToggle: () => settings.general.toggleFeature('dueDatesEnabled'),
            image: '/power-features/duedate.png'
        },
        {
            title: "Task Priority",
            description: "Add priority flags directly on your task to easily see what's important.",
            icon: <Flag size={18} />,
            gradientClass: "gradient-6",
            isEnabled: settings.general.featuresSettings.taskPriorityEnabled,
            onToggle: () => settings.general.toggleFeature('taskPriorityEnabled'),
            image: '/power-features/priority.png'
        },
        {
            title: "Email forwarding",
            description: "Forward emails directly into Simplu to create tasks.",
            icon: <Mail size={18} />,
            gradientClass: "gradient-7",
            isEnabled: false
        },
        {
            title: "Daily Planning",
            description: "Guided walkthroughs to help you plan & reflect on your day.",
            icon: <Sun size={18} />,
            gradientClass: "gradient-8",
            isEnabled: true,
            image: '/power-features/daily-planning.png'
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
});
