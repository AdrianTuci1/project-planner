import React from 'react';
import { ContextMenu, MenuHeader } from './ContextMenu';

interface ColorPickerContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    onSelectColor: (color: string) => void;
    selectedColor?: string;
}

export const PRESET_COLORS = [
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

export const ColorPickerContext: React.FC<ColorPickerContextProps> = ({
    isOpen,
    onClose,
    position,
    onSelectColor,
    selectedColor,
}) => {
    return (
        <ContextMenu
            isOpen={isOpen}
            onClose={onClose}
            position={position}
            className="color-picker-context"
        >
            <MenuHeader title="Select Color" onClose={onClose} />
            <div style={{ padding: 'var(--space-2)' }}>
                <div className="color-picker-grid">
                    {PRESET_COLORS.map((color) => (
                        <div
                            key={color}
                            className={`color-picker-item ${selectedColor === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                                onSelectColor(color);
                                onClose();
                            }}
                        />
                    ))}
                </div>
            </div>
        </ContextMenu>
    );
};
