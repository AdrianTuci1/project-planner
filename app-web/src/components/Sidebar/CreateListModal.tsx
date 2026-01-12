import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { LabelPickerContent } from '../ContextMenu/LabelPickerContent';
import './CreateListModal.css';

interface CreateListModalProps {
    onClose: () => void;
    groupId?: string;
}

export const CreateListModal = observer(({ onClose, groupId }: CreateListModalProps) => {
    const existingGroup = groupId ? store.groups.find(g => g.id === groupId) : null;

    // Original State
    const [name, setName] = useState(existingGroup?.name || '');
    const [icon, setIcon] = useState(existingGroup?.icon || '📝');
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    // New State for Auto-Add Label
    const [autoAddLabelEnabled, setAutoAddLabelEnabled] = useState(existingGroup?.autoAddLabelEnabled || false);
    const [selectedLabelId, setSelectedLabelId] = useState<string | undefined>(existingGroup?.defaultLabelId);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const labelPickerRef = useRef<HTMLDivElement>(null);

    const activeLabel = selectedLabelId ? store.getLabel(selectedLabelId) : null;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setShowPicker(false);
            }
            if (labelPickerRef.current && !labelPickerRef.current.contains(event.target as Node)) {
                setShowLabelPicker(false);
            }
        };

        if (showPicker || showLabelPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPicker, showLabelPicker]);

    const handleSave = () => {
        if (name.trim()) {
            if (groupId && existingGroup) {
                store.updateGroup(groupId, name, icon, selectedLabelId, autoAddLabelEnabled);
            } else {
                store.createGroup(name, icon, selectedLabelId, autoAddLabelEnabled);
            }
            onClose();
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="create-list-content" onClick={e => e.stopPropagation()}>
                <div className="cl-header">{groupId ? 'Edit list' : 'Create list'}</div>

                <div className="cl-input-row">
                    <div className="cl-icon-picker-container">
                        <button
                            className="cl-icon-picker"
                            onClick={() => setShowPicker(!showPicker)}
                        >
                            {icon}
                        </button>
                        {showPicker && (
                            <div className="cl-emoji-picker-popover" ref={pickerRef}>
                                <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                        setIcon(emojiData.emoji);
                                        setShowPicker(false);
                                    }}
                                    theme={Theme.DARK}
                                    emojiStyle={EmojiStyle.NATIVE}
                                    skinTonesDisabled
                                    searchDisabled={false}
                                    width={300}
                                    height={400}
                                />
                            </div>
                        )}
                    </div>
                    <input
                        className="cl-name-input"
                        placeholder="ex: Work"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>

                <div className="cl-option-row">
                    <button
                        className={`cl-action-btn ${autoAddLabelEnabled ? 'active' : ''}`}
                        onClick={() => setAutoAddLabelEnabled(!autoAddLabelEnabled)}
                    >
                        Auto add label
                    </button>

                    {/* Label Selector */}
                    <div className="cl-label-selector-container">
                        <span
                            className="cl-select-placeholder"
                            onClick={(e) => {
                                if (autoAddLabelEnabled) {
                                    setShowLabelPicker(!showLabelPicker);
                                }
                            }}
                            style={{
                                opacity: autoAddLabelEnabled ? 1 : 0.5,
                                cursor: autoAddLabelEnabled ? 'pointer' : 'default',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {activeLabel ? (
                                <>
                                    <span
                                        className="color-dot"
                                        style={{ backgroundColor: activeLabel.color, width: 8, height: 8, borderRadius: '50%' }}
                                    />
                                    {activeLabel.name}
                                </>
                            ) : (
                                "Select a label"
                            )}
                        </span>

                        {showLabelPicker && autoAddLabelEnabled && (
                            <div className="cl-label-picker-popover" ref={labelPickerRef}>
                                <div className="cl-label-picker-content">
                                    <LabelPickerContent
                                        onSelect={(labelId) => {
                                            setSelectedLabelId(labelId);
                                            setShowLabelPicker(false);
                                        }}
                                        onClose={() => setShowLabelPicker(false)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="cl-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-create" onClick={handleSave}>{groupId ? 'Save' : 'Create'}</button>
                </div>
            </div>
        </div>
    );
});
