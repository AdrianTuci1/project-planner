import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MenuItem, MenuSearch, MenuSectionLabel } from './ContextMenu';
import { store } from '../../models/store';

interface LabelPickerMenuProps {
    onSelect: (labelId: string) => void;
    onClose: () => void;
    selectedLabelIds?: string[];
}

const PRESET_COLORS = [
    '#FF2D55', '#FF9500', '#FFD60A', '#32D74B', '#64D2FF',
    '#0A84FF', '#BF5AF2', '#FF375F', '#AC8E68', '#8E8E93',
];

export const LabelPickerContent = observer(({ onSelect, onClose, selectedLabelIds = [] }: LabelPickerMenuProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
    const [creationView, setCreationView] = useState<'main' | 'colors'>('main');

    const labels = store.availableLabels;
    const recentLabels = labels.slice(0, 3);
    const filteredLabels = labels.filter((label) =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        if (newLabelName.trim()) {
            const newLabel = store.addLabel(newLabelName.trim(), selectedColor);
            onSelect(newLabel.id);
            setNewLabelName('');
            setIsCreating(false);
            setCreationView('main');
        }
    };

    const handleCancelCreate = () => {
        setIsCreating(false);
        setNewLabelName('');
        setCreationView('main');
    };

    if (isCreating) {
        return creationView === 'main' ? (
            <div style={{ padding: 'var(--space-2)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <button
                        className="color-trigger-btn"
                        style={{
                            width: '32px', height: '32px', borderRadius: '6px',
                            backgroundColor: selectedColor, border: '1px solid var(--border-subtle)',
                            cursor: 'pointer', flexShrink: 0
                        }}
                        onClick={() => setCreationView('colors')}
                        title="Select color"
                    />
                    <input
                        type="text"
                        className="context-menu-input"
                        placeholder="Label name"
                        style={{ margin: 0, flex: 1 }}
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                            if (e.key === 'Escape') handleCancelCreate();
                        }}
                        autoFocus
                    />
                </div>
                <div className="context-menu-button-group" style={{ marginTop: 'var(--space-2)' }}>
                    <button className="context-menu-button" onClick={handleCancelCreate}>Cancel</button>
                    <button className="context-menu-button primary" onClick={handleCreate} disabled={!newLabelName.trim()}>Create</button>
                </div>
            </div>
        ) : (
            <>
                <div className="menu-header">
                    <button
                        className="icon-btn-sm"
                        onClick={() => setCreationView('main')}
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
                                    setCreationView('main');
                                }}
                            />
                        ))}
                    </div>
                </div>
            </>
        );
    }

    return (
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
                            onClick={() => onSelect(label.id)}
                            checkmark={selectedLabelIds.includes(label.id)}
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
                    onClick={() => onSelect(label.id)}
                    checkmark={selectedLabelIds.includes(label.id)}
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
        </>
    );
});
