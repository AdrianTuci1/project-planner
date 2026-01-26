import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { api } from '../../services/api';
import { ExternalLink, Eye, EyeOff, Copy } from 'lucide-react';
import './ApiTokenSettings.css';

export const ApiTokenSettings = observer(() => {
    const [apiToken, setApiToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerateToken = async () => {
        try {
            const { token } = await api.generateApiToken();
            setApiToken(token);
            setShowToken(true); // Show it immediately so they can copy
            setCopied(false);
        } catch (error) {
            console.error("Failed to generate token", error);
            alert("Failed to generate token");
        }
    };

    const handleCopyToken = async () => {
        if (apiToken) {
            await navigator.clipboard.writeText(apiToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleGenerateNewToken = async () => {
        if (confirm('Generating a new token will invalidate the current one. Continue?')) {
            await handleGenerateToken();
        }
    };

    return (
        <div className="api-token-container">
            <div className="api-token-header">
                <h2>Simplu API Token</h2>
            </div>

            {/* Info Section */}
            <div className="api-token-info-card">
                <p className="api-token-info-text">
                    Build your own application  or connect to tools like{' '}
                    <span className="zapier-badge">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect width="16" height="16" rx="3" fill="#FF4A00" />
                            <path d="M8 3L10.5 8L8 13L5.5 8L8 3Z" fill="white" />
                        </svg>
                        Zapier
                    </span>
                </p>
                <a href="#" className="api-docs-link" onClick={(e) => e.preventDefault()}>
                    <span>View API documentation</span>
                    <ExternalLink size={14} />
                </a>
            </div>

            {/* Token Display/Generation Section */}
            {apiToken ? (
                <div className="api-token-display-card">
                    <div className="token-input-group">
                        <input
                            type={showToken ? 'text' : 'password'}
                            value={apiToken}
                            readOnly
                            className="token-input"
                        />
                        <button
                            className="token-action-btn"
                            onClick={() => setShowToken(!showToken)}
                            title={showToken ? 'Hide Token' : 'Show Token'}
                        >
                            {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="token-actions">
                        <button
                            className="btn-primary"
                            onClick={handleCopyToken}
                        >
                            <Copy size={16} />
                            {copied ? 'Copied!' : 'Copy API Token'}
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={handleGenerateNewToken}
                        >
                            Generate new API Token
                        </button>
                    </div>

                    <p className="token-warning">
                        Your API token allows access to your Simplu data and should be kept secret.
                    </p>
                </div>
            ) : (
                <div className="api-token-empty">
                    <button
                        className="btn-generate"
                        onClick={handleGenerateToken}
                    >
                        Generate API Token
                    </button>
                </div>
            )}
        </div>
    );
});
