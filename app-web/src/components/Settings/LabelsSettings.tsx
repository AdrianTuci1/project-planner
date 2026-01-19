import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import { Search, Edit2, Trash2, Plus } from 'lucide-react';
import './LabelsSettings.css';

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#F43F5E', // Rose
    '#78716C', // Stone
];

interface ColorPickerContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number } | null;
    colors: string[];
    selectedColor: string;
    onSelect: (color: string) => void;
}

const ColorPickerContextMenu = ({ isOpen, onClose, position, colors, selectedColor, onSelect }: ColorPickerContextMenuProps) => {
    if (!isOpen || !position) return null;

    return ReactDOM.createPortal(
        <>
            <div className="color-picker-backdrop" onClick={onClose} />
            <div
                className="color-picker-context"
                style={{
                    left: position.x,
                    top: position.y
                }}
            >
                {colors.map(c => (
                    <div
                        key={c}
                        className={`color-option ${selectedColor === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => onSelect(c)}
                    />
                ))}
            </div>
        </>,
        document.body
    );
};

export const LabelsSettings = observer(() => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

    // Form state for create/edit
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[12]); // Default Violet
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [colorPickerPos, setColorPickerPos] = useState<{ x: number, y: number } | null>(null);

    const filteredLabels = store.availableLabels.filter(label =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateStart = () => {
        setIsCreating(true);
        setEditingLabelId(null);
        setName('');
        setColor(PRESET_COLORS[12]); // Default Violet
        setShowColorPicker(false);
    };

    const handleEditStart = (label: { id: string; name: string; color: string }) => {
        setEditingLabelId(label.id);
        setIsCreating(false);
        setName(label.name);
        setColor(label.color);
        setShowColorPicker(false);
    };

    const handleSave = () => {
        if (!name.trim()) return;

        if (isCreating) {
            store.addLabel(name, color);
            setIsCreating(false);
        } else if (editingLabelId) {
            store.updateLabel(editingLabelId, name, color);
            setEditingLabelId(null);
        }

        // Reset form
        setName('');
        setColor(PRESET_COLORS[12]);
        setShowColorPicker(false);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingLabelId(null);
        setName('');
        setShowColorPicker(false);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        store.deleteLabel(id);
    };

    const handleColorClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setColorPickerPos({
            x: rect.left,
            y: rect.bottom + 4 // Small gap
        });
        setShowColorPicker(!showColorPicker);
    };

    return (
        <div className="labels-settings-container">
            {/* Header: Search and Create Button */}
            <div className="labels-header">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="search-labels-input"
                        placeholder="Search labels"
                        style={{ paddingLeft: 36 }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {!isCreating && (
                    <button className="btn-create-label" onClick={handleCreateStart}>
                        Create Label
                    </button>
                )}
            </div>

            {/* List of Labels */}
            <div className="labels-list">
                {/* Creation Mode Form - Inside List */}
                {isCreating && (
                    <div className="edit-label-inline">
                        <div className="color-picker-trigger" onClick={handleColorClick}>
                            <div className="color-dot-large" style={{ backgroundColor: color }} />
                        </div>
                        <input
                            className="label-name-input"
                            placeholder="Label Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                        />
                        <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                        <button className="btn-primary-sm" onClick={handleSave}>Create</button>
                    </div>
                )}

                {filteredLabels.map(label => (
                    <React.Fragment key={label.id}>
                        {editingLabelId === label.id ? (
                            <div className="edit-label-inline">
                                <div className="color-picker-trigger" onClick={handleColorClick}>
                                    <div className="color-dot-large" style={{ backgroundColor: color }} />
                                </div>
                                <input
                                    className="label-name-input"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSave();
                                        if (e.key === 'Escape') handleCancel();
                                    }}
                                />
                                <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                                <button className="btn-primary-sm" onClick={handleSave}>Save</button>
                            </div>
                        ) : (
                            <div className="label-item">
                                <div className="label-info">
                                    <div className="label-color-dot" style={{ backgroundColor: label.color }} />
                                    <span className="label-name">{label.name}</span>
                                </div>
                                <div className="label-actions">
                                    <button className="icon-btn-sm" onClick={() => handleEditStart(label)}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button className="icon-btn-sm" onClick={(e) => handleDelete(label.id, e)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <ColorPickerContextMenu
                isOpen={showColorPicker}
                onClose={() => setShowColorPicker(false)}
                position={colorPickerPos}
                colors={PRESET_COLORS}
                selectedColor={color}
                onSelect={(c) => {
                    setColor(c);
                    setShowColorPicker(false);
                }}
            />
        </div>
    );
});
