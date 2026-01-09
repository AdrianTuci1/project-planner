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
    onCreateLabel?: () => void;
    onEditLabels?: () => void;
    onSelectLabel?: (label: Label) => void;
}

export const LabelContext: React.FC<LabelContextProps> = ({
    isOpen,
    onClose,
    position,
    labels = [
        { id: '1', name: 'Home', color: '#FF2D55' },
        { id: '2', name: 'Lam', color: '#FFD60A' },
        { id: '3', name: 'Work', color: '#FF2D55' },
    ],
    recentLabels = [
        { id: '1', name: 'Home', color: '#FF2D55' },
        { id: '2', name: 'Lam', color: '#FFD60A' },
    ],
    onCreateLabel,
    onEditLabels,
    onSelectLabel,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLabels = labels.filter((label) =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ContextMenu isOpen={isOpen} onClose={onClose} position={position}>
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
                onClick={onCreateLabel}
            />

            <MenuItem
                label="Edit labels"
                arrow
                onClick={onEditLabels}
            />
        </ContextMenu>
    );
};
