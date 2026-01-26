import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    ArrowRight,
    ArrowLeft,
    FileOutput, // for Export
    AlertTriangle, // for Delete
    CheckCircle2, // for Export Tasks
    List, // for Export Lists
    Tag, // for Export Labels
    LayoutTemplate,
} from 'lucide-react';
import './AccountDataSettings.css';

import { api } from '../../services/api';

export const AccountDataSettings = observer(() => {
    const { settings } = store;
    const [confirmationText, setConfirmationText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDeleteAccount = async () => {
        if (confirmationText !== 'permanently delete') return;

        setIsDeleting(true);
        setError(null);

        try {
            await api.deleteAccount(confirmationText);
            // Logout after successful deletion
            await store.authStore.logout();
        } catch (err: any) {
            console.error("Account deletion failed", err);
            setError(err.message || "Failed to delete account. Please try again.");
            setIsDeleting(false);
        }
    };

    // --- Main View ---
    if (settings.accountDataView === 'main') {
        return (
            <div className="account-data-container">
                <div className="account-data-cards">
                    {/* Import Data */}
                    <div className="account-data-card clickable" onClick={() => settings.setAccountDataView('import')}>
                        <div className="data-card-content">
                            <div className="data-card-icon">
                                <LayoutTemplate size={24} />
                            </div>
                            <div className="data-card-info">
                                <h3>Import Data</h3>
                                <p>Import data from other apps into Simplu</p>
                            </div>
                        </div>
                        <div className="data-card-action">
                            Import data <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* Export Data */}
                    <div className="account-data-card clickable" onClick={() => settings.setAccountDataView('export')}>
                        <div className="data-card-content">
                            <div className="data-card-icon">
                                <FileOutput size={24} />
                            </div>
                            <div className="data-card-info">
                                <h3>Export Data</h3>
                                <p>Export your data from Simplu</p>
                            </div>
                        </div>
                        <div className="data-card-action">
                            Export data <ArrowRight size={16} />
                        </div>
                    </div>

                    {/* Delete Account */}
                    <div className="account-data-card clickable" onClick={() => settings.setAccountDataView('delete')}>
                        <div className="data-card-content">
                            <div className="data-card-icon">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="data-card-info">
                                <h3>Delete Account</h3>
                                <p>Delete your account and all your data</p>
                            </div>
                        </div>
                        <div className="data-card-action" style={{ color: 'var(--accent-purple)' }}>
                            Delete account <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Export View ---
    if (settings.accountDataView === 'export') {
        return (
            <div className="account-data-container">
                <button className="settings-back-btn" onClick={() => settings.setAccountDataView('main')}>
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="account-data-cards">
                    {/* Export Tasks */}
                    <div className="account-data-card">
                        <div className="data-card-content">
                            <div className="data-card-icon">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="data-card-info">
                                <h3>Export Tasks</h3>
                                <p>Export all your tasks as a CSV file</p>
                            </div>
                        </div>
                        <button className="download-btn">
                            Download
                        </button>
                    </div>

                    {/* Export Lists */}
                    <div className="account-data-card">
                        <div className="data-card-content">
                            <div className="data-card-icon">
                                <List size={24} />
                            </div>
                            <div className="data-card-info">
                                <h3>Export Lists</h3>
                                <p>Export all your lists as a CSV file</p>
                            </div>
                        </div>
                        <button className="download-btn">
                            Download
                        </button>
                    </div>

                    {/* Export Labels */}
                    <div className="account-data-card">
                        <div className="data-card-content">
                            <div className="data-card-icon">
                                <Tag size={24} />
                            </div>
                            <div className="data-card-info">
                                <h3>Export labels</h3>
                                <p>Export all your labels as a CSV file</p>
                            </div>
                        </div>
                        <button className="download-btn">
                            Download
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Delete View ---
    if (settings.accountDataView === 'delete') {
        return (
            <div className="account-data-container">
                <button className="settings-back-btn" onClick={() => settings.setAccountDataView('main')}>
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="account-data-header">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 24 }}>🧨</span> Delete entire account
                    </h2>
                </div>

                <p className="delete-account-warning">
                    Simplu will delete all of your data and you will no longer be able to access it.
                    We recommend exporting your data before deleting your account.
                </p>

                <div className="delete-warning-box">
                    Warning: This action cannot be undone.
                </div>

                <div className="delete-account-form">
                    {error && (
                        <div className="error-message" style={{ color: 'var(--red-500)', marginBottom: 16 }}>
                            {error}
                        </div>
                    )}

                    <label className="delete-account-label">Type <strong>permanently delete</strong> to confirm</label>
                    <input
                        type="text"
                        className="delete-account-input"
                        placeholder="permanently delete"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        disabled={isDeleting}
                    />

                    <button
                        className="delete-account-btn"
                        onClick={handleDeleteAccount}
                        disabled={confirmationText !== 'permanently delete' || isDeleting}
                        style={{
                            opacity: (confirmationText === 'permanently delete' && !isDeleting) ? 1 : 0.5,
                            cursor: (confirmationText === 'permanently delete' && !isDeleting) ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                </div>
            </div>
        );
    }

    // --- Import View (Placeholder) ---
    if (settings.accountDataView === 'import') {
        return (
            <div className="account-data-container">
                <button className="settings-back-btn" onClick={() => settings.setAccountDataView('main')}>
                    <ArrowLeft size={16} /> Back
                </button>
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    <LayoutTemplate size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <h3>Import Data</h3>
                    <p>Coming soon...</p>
                </div>
            </div>
        )
    }

    return null;
});
