import React, { useState } from 'react';
import { ContextMenu, MenuItem, MenuSearch, MenuSectionLabel } from './ContextMenu';

interface Label {
    id: string;
    name: string;
    color: string;
}

interface LabelContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    labels?: Label[];
    recentLabels?: Label[];
    onCreateLabel?: (name: string, color: string) => void;
    onEditLabels?: () => void;
    onSelectLabel?: (label: Label) => void;
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

export const LabelContext: React.FC<LabelContextProps> = ({
    isOpen,
    onClose,
    position,
    labels = [],
    recentLabels = [],
    onCreateLabel,
    onEditLabels,
    onSelectLabel,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

    const filteredLabels = labels.filter((label) =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        if (newLabelName.trim()) {
            onCreateLabel?.(newLabelName.trim(), selectedColor);
            setNewLabelName('');
            setSelectedColor(PRESET_COLORS[0]);
            setIsCreating(false);
            // Optionally close context or keep open to select?
            // Usually we want to apply it immediately which the parent callback should do.
        }
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setNewLabelName('');
    }

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
            {isCreating ? (
                <>
                    <div style={{ padding: 'var(--space-2)' }}>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
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
                            <label style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', fontWeight: 600 }}>
                                Label name
                            </label>
                            <input
                                type="text"
                                className="context-menu-input"
                                placeholder="Enter label name..."
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                    if (e.key === 'Escape') handleCancelCreate();
                                }}
                                autoFocus
                            />
                        </div>

                        <div className="context-menu-button-group">
                            <button className="context-menu-button" onClick={handleCancelCreate}>Cancel</button>
                            <button className="context-menu-button primary" onClick={handleCreate} disabled={!newLabelName.trim()}>Create</button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <MenuSearch
                        placeholder="Search labels"
                        value={searchQuery}
                        onChange={setSearchQuery}
                    />

                    {recentLabels.length > 0 && !searchQuery && (
                        <>
                            <MenuSectionLabel>Recently used</MenuSectionLabel>
                            {recentLabels.map((label) => (
                                <MenuItem
                                    key={label.id}
                                    colorDot={label.color}
                                    label={label.name}
                                    onClick={() => onSelectLabel?.(label)}
                                />
                            ))}
                        </>
                    )}

                    <MenuSectionLabel>All labels</MenuSectionLabel>
                    {filteredLabels.map((label) => (
                        <MenuItem
                            key={label.id}
                            colorDot={label.color}
                            label={label.name}
                            onClick={() => onSelectLabel?.(label)}
                        />
                    ))}

                    {filteredLabels.length === 0 && searchQuery && (
                        <div style={{ padding: 'var(--space-3)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                            No labels found
                        </div>
                    )}

                    <MenuItem
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v8m-4-4h8" />
                            </svg>
                        }
                        label="Create label"
                        onClick={() => setIsCreating(true)}
                    />

                    <MenuItem
                        label="Edit labels"
                        arrow
                        onClick={onEditLabels}
                    />
                </>
            )}
        </ContextMenu>
    );
};
