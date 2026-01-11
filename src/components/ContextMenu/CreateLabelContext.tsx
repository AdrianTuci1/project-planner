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
    const [view, setView] = useState<'main' | 'colors'>('main');

    const handleCreate = () => {
        if (labelName.trim()) {
            onCreateLabel?.(labelName.trim(), selectedColor);
            setLabelName('');
            setSelectedColor(PRESET_COLORS[0]);
            setView('main');
            onClose();
        }
    };

    const handleCancel = () => {
        setLabelName('');
        setSelectedColor(PRESET_COLORS[0]);
        setView('main');
        onClose();
    };

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            {view === 'main' ? (
                <>
                    <MenuHeader title="Create label" onClose={handleCancel} />
                    <div style={{ padding: 'var(--space-2)' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <button
                                className="color-trigger-btn"
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    backgroundColor: selectedColor,
                                    border: '1px solid var(--border-subtle)',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                                onClick={() => setView('colors')}
                                title="Select color"
                            />
                            <input
                                type="text"
                                className="context-menu-input"
                                placeholder="Label name"
                                style={{ margin: 0, flex: 1 }}
                                value={labelName}
                                onChange={(e) => setLabelName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') handleCancel();
                                }}
                                autoFocus
                            />
                        </div>
                        {/* Use a hidden submit button or just rely on Enter? 
                            User said "inputurile in meniu trebuie reglate" and "patratel colorat".
                            Let's add a small create button for clarity if needed, or keep it minimal.
                            Minimal is better. User can press Enter. 
                        */}
                    </div>
                </>
            ) : (
                <>
                    <div className="menu-header">
                        <button
                            className="icon-btn-sm"
                            onClick={() => setView('main')}
                            style={{ marginRight: 'var(--space-2)' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <span className="menu-title">Select Color</span>
                    </div>

                    <div style={{ padding: 'var(--space-2)' }}>
                        <div className="color-picker-grid">
                            {PRESET_COLORS.map((color) => (
                                <div
                                    key={color}
                                    className={`color-picker-item ${selectedColor === color ? 'selected' : ''}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        setSelectedColor(color);
                                        setView('main');
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </ContextMenu>
    );
};
