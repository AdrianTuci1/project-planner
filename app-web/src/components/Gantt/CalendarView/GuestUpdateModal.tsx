import React from 'react';
import { observer } from 'mobx-react-lite';
import './GuestUpdateModal.css';

interface GuestUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdateWithoutEmail: () => void;
    onUpdateWithEmail: () => void;
}

export const GuestUpdateModal = observer(({ isOpen, onClose, onUpdateWithoutEmail, onUpdateWithEmail }: GuestUpdateModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="guest-modal-overlay">
            <div className="guest-modal-content">
                <h3 className="guest-modal-title">
                    Would you like to send update emails to existing Google Calendar guests?
                </h3>

                <p className="guest-modal-text">
                    If you choose to send updates, guests will receive an email with the new event details.
                    If you choose not to send updates, the event will be updated but guests will not receive an email.
                </p>

                <div className="guest-modal-actions">
                    <button className="guest-modal-btn cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <div className="guest-modal-actions-right">
                        <button className="guest-modal-btn secondary" onClick={onUpdateWithoutEmail}>
                            Update, but don't send
                        </button>
                        <button className="guest-modal-btn primary" onClick={onUpdateWithEmail}>
                            Send update
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});
