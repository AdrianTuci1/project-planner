import React, { useState, useEffect } from 'react';
import { ContextMenu, MenuHeader } from './ContextMenu';

interface TimeInputContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    title?: string;
    initialDuration?: number; // in minutes
    onSave?: (duration: number) => void;
}

export const TimeInputContext: React.FC<TimeInputContextProps> = ({
    isOpen,
    onClose,
    position,
    title = 'Set time',
    initialDuration = 0,
    onSave,
}) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setHours(Math.floor(initialDuration / 60));
            setMinutes(initialDuration % 60);
        }
    }, [isOpen, initialDuration]);

    const handleSave = () => {
        const totalMinutes = hours * 60 + minutes;
        onSave?.(totalMinutes);
        onClose();
    };

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuHeader title={title} onClose={onClose} />
            <div style={{ padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            marginBottom: '4px'
                        }}>Hours</label>
                        <input
                            type="number"
                            min="0"
                            className="context-menu-input"
                            value={hours}
                            onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600,
                            marginBottom: '4px'
                        }}>Minutes</label>
                        <input
                            type="number"
                            min="0"
                            max="59"
                            className="context-menu-input"
                            value={minutes}
                            onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        />
                    </div>
                </div>
                <div className="context-menu-button-group">
                    <button className="context-menu-button" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="context-menu-button primary" onClick={handleSave}>
                        Save
                    </button>
                </div>
            </div>
        </ContextMenu>
    );
};
