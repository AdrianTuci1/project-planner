import React, { useState, useEffect } from 'react';
import { ContextMenu, MenuHeader } from './ContextMenu';

interface TimeEntryContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    title: string;
    initialValue?: number; // in minutes
    onSave: (minutes: number) => void;
}

export const TimeEntryContext: React.FC<TimeEntryContextProps> = ({
    isOpen,
    onClose,
    position,
    title,
    initialValue = 0,
    onSave,
}) => {
    const [hours, setHours] = useState(Math.floor(initialValue / 60));
    const [minutes, setMinutes] = useState(initialValue % 60);

    useEffect(() => {
        if (isOpen) {
            setHours(Math.floor(initialValue / 60));
            setMinutes(initialValue % 60);
        }
    }, [isOpen, initialValue]);

    const handleSave = () => {
        onSave(hours * 60 + minutes);
        onClose();
    };

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuHeader title={title} onClose={onClose} />
            <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Hours</div>
                        <input
                            type="number"
                            min="0"
                            className="context-menu-input"
                            value={hours}
                            onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>Minutes</div>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            className="context-menu-input"
                            value={minutes}
                            onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                        />
                    </div>
                </div>
                <button
                    className="context-menu-button primary"
                    onClick={handleSave}
                    style={{ marginTop: 'var(--space-1)' }}
                >
                    Save Time
                </button>
            </div>
        </ContextMenu>
    );
};
