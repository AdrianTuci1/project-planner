import React, { useState } from 'react';
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

export const LabelsSettings = observer(() => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [editingLabelId, setEditingLabelId] = useState<string | null>(null);

    // Form state for create/edit
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[12]); // Default Violet
    const [showColorPicker, setShowColorPicker] = useState(false);

    const filteredLabels = store.availableLabels.filter(label =>
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateStart = () => {
        setIsCreating(true);
        setEditingLabelId(null);
        setName('');
        setColor(PRESET_COLORS[12]); // Default Violet
    };

    const handleEditStart = (label: { id: string, name: string, color: string }) => {
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
                        <div className="color-picker-trigger" onClick={() => setShowColorPicker(!showColorPicker)}>
                            <div className="color-dot-large" style={{ backgroundColor: color }} />
                            {showColorPicker && (
                                <div className="color-palette" onClick={e => e.stopPropagation()}>
                                    {PRESET_COLORS.map(c => (
                                        <div
                                            key={c}
                                            className={`color-option ${color === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => { setColor(c); setShowColorPicker(false); }}
                                        />
                                    ))}
                                </div>
                            )}
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
                                <div className="color-picker-trigger" onClick={() => setShowColorPicker(!showColorPicker)}>
                                    <div className="color-dot-large" style={{ backgroundColor: color }} />
                                    {showColorPicker && (
                                        <div className="color-palette" onClick={e => e.stopPropagation()}>
                                            {PRESET_COLORS.map(c => (
                                                <div
                                                    key={c}
                                                    className={`color-option ${color === c ? 'selected' : ''}`}
                                                    style={{ backgroundColor: c }}
                                                    onClick={() => { setColor(c); setShowColorPicker(false); }}
                                                />
                                            ))}
                                        </div>
                                    )}
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
        </div>
    );
});
