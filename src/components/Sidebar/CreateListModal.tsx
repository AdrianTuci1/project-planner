import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import './CreateListModal.css';

interface CreateListModalProps {
    onClose: () => void;
    groupId?: string | null;
}

export const CreateListModal = observer(({ onClose, groupId }: CreateListModalProps) => {
    const existingGroup = groupId ? store.groups.find(g => g.id === groupId) : null;
    const [name, setName] = useState(existingGroup?.name || '');
    const [icon, setIcon] = useState('🐙'); // Mock default

    const handleSave = () => {
        if (name.trim()) {
            if (groupId && existingGroup) {
                store.updateGroup(groupId, name);
            } else {
                store.createGroup(name);
            }
            onClose();
        }
    };

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="create-list-content" onClick={e => e.stopPropagation()}>
                <div className="cl-header">{groupId ? 'Edit list' : 'Create list'}</div>

                <div className="cl-input-row">
                    <button className="cl-icon-picker">{icon}</button>
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
                    <span className="cl-label">Auto add label</span>
                    <span className="cl-select-placeholder">Select a label</span>
                </div>

                <div className="cl-footer">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-create" onClick={handleSave}>{groupId ? 'Save' : 'Create'}</button>
                </div>
            </div>
        </div>
    );
});
