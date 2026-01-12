import React, { useState } from 'react';
import { ContextMenu, MenuItem, MenuSearch, ToggleSwitch } from './ContextMenu';

interface Label {
    id: string;
    name: string;
    color: string;
}

interface FilterContextProps {
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    labels?: Label[];
    selectedLabels?: string[];
    showComplete?: boolean;
    showTimeboxed?: boolean;
    onToggleLabel?: (labelId: string) => void;
    onSelectAll?: () => void;
    onClearAll?: () => void;
    onToggleComplete?: (value: boolean) => void;
    onToggleTimeboxed?: (value: boolean) => void;
    onEditLabels?: () => void;
}

export const FilterContext: React.FC<FilterContextProps> = ({
    isOpen,
    onClose,
    position,
    labels = [],
    selectedLabels = [],
    showComplete = true,
    showTimeboxed = true,
    onToggleLabel,
    onSelectAll,
    onClearAll,
    onToggleComplete,
    onToggleTimeboxed,
    onEditLabels,
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

            <div className="context-menu-content">
                {filteredLabels.map((label) => (
                    <MenuItem
                        key={label.id}
                        colorDot={label.color}
                        label={label.name}
                        checkmark={selectedLabels.includes(label.id)}
                        onClick={() => onToggleLabel?.(label.id)}
                    />
                ))}

                {filteredLabels.length === 0 && searchQuery && (
                    <div style={{ padding: 'var(--space-3)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                        No labels found
                    </div>
                )}
            </div>

            <MenuItem
                label="Edit Labels"
                arrow
                onClick={onEditLabels}
            />

            <div className="context-menu-button-group" style={{ marginTop: 'var(--space-2)' }}>
                <button className="context-menu-button" onClick={onSelectAll}>
                    Select all
                </button>
                <button className="context-menu-button" onClick={onClearAll}>
                    Clear
                </button>
            </div>

            <ToggleSwitch
                label="Show Complete"
                checked={showComplete}
                onChange={onToggleComplete || (() => { })}
            />

            <ToggleSwitch
                label="Show Timeboxed"
                checked={showTimeboxed}
                onChange={onToggleTimeboxed || (() => { })}
            />
        </ContextMenu>
    );
};
