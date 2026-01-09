import React, { useState } from 'react';
import { ContextMenu, MenuHeader } from './ContextMenu';

interface CreateLabelContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    onCreateLabel?: (name: string, color: string) => void;
}

const PRESET_COLORS = [
    '#FF2D55', // Pink
    '#FF9500', // Orange
    '#FFD60A', // Yellow
    '#32D74B', // Green
    '#64D2FF', // Light Blue
    '#0A84FF', // Blue
    '#BF5AF2', // Purple
    '#FF375F', // Red
    '#AC8E68', // Brown
    '#8E8E93', // Gray
];

export const CreateLabelContext: React.FC<CreateLabelContextProps> = ({
    isOpen,
    onClose,
    position,
    onCreateLabel,
}) => {
    const [labelName, setLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

    const handleCreate = () => {
        if (labelName.trim()) {
            onCreateLabel?.(labelName.trim(), selectedColor);
            setLabelName('');
            setSelectedColor(PRESET_COLORS[0]);
            onClose();
        }
    };

    const handleCancel = () => {
        setLabelName('');
        setSelectedColor(PRESET_COLORS[0]);
        onClose();
    };

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            <MenuHeader title="Create label" onClose={handleCancel} />

            <div style={{ padding: 'var(--space-2)' }}>
                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-2)',
                            fontWeight: 600,
                        }}
                    >
                        Color
                    </label>
                    <div className="color-picker-grid">
                        {PRESET_COLORS.map((color) => (
                            <div
                                key={color}
                                className={`color-picker-item ${selectedColor === color ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => setSelectedColor(color)}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                    <label
                        style={{
                            display: 'block',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--space-2)',
                            fontWeight: 600,
                        }}
                    >
                        Label name
                    </label>
                    <input
                        type="text"
                        className="context-menu-input"
                        placeholder="Enter label name..."
                        value={labelName}
                        onChange={(e) => setLabelName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreate();
                            } else if (e.key === 'Escape') {
                                handleCancel();
                            }
                        }}
                        autoFocus
                    />
                </div>

                <div className="context-menu-button-group">
                    <button className="context-menu-button" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button
                        className="context-menu-button primary"
                        onClick={handleCreate}
                        disabled={!labelName.trim()}
                    >
                        Create
                    </button>
                </div>
            </div>
        </ContextMenu>
    );
};
