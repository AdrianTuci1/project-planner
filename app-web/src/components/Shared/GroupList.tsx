import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { store } from '../../models/store';
import {
    Plus,
    ChevronDown,
    MoreVertical,
    Edit2,
    Trash2,
    Inbox
} from 'lucide-react';
import { ContextMenu, MenuItem, MenuSeparator } from '../ContextMenu/ContextMenu';
import { CreateListModal } from '../Sidebar/CreateListModal';


interface GroupListProps {
    activeGroupId: string | null;
    onSelectGroup?: (groupId: string | null) => void;
    className?: string;
}

export const GroupList = observer(({ activeGroupId, onSelectGroup, className }: GroupListProps) => {
    // Local state for menus to ensure independence
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    const [isActionsMenuOpen, setActionsMenuOpen] = useState(false);
    const [actionsMenuPosition, setActionsMenuPosition] = useState({ x: 0, y: 0 });

    const [showCreateList, setShowCreateList] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

    const activeGroup = store.groups.find(g => g.id === activeGroupId);

    const handleListClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
        setMenuOpen(true);
    };

    const handleActionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setActionsMenuPosition({ x: rect.left + 20, y: rect.bottom + 4 });
        setActionsMenuOpen(true);
    };

    const handleSelect = (groupId: string | null) => {
        if (onSelectGroup) {
            onSelectGroup(groupId);
        } else {
            store.activeGroupId = groupId;
        }
        setMenuOpen(false);
    };

    return (
        <div className={`active-list-container ${className || ''}`} onClick={(e) => e.stopPropagation()}>
            <div
                className="active-list-selector"
                onClick={handleListClick}
            >
                <div className="active-list-icon">
                    {activeGroupId === 'default' ? <span>📪</span> : activeGroup?.icon}
                </div>
                <div className="active-list-info">
                    <span className="active-list-name">
                        {activeGroupId === 'default' ? 'Inbox' : activeGroup?.name || 'Unknown List'}
                    </span>
                </div>
                <ChevronDown size={16} className="active-list-chevron" />
            </div>

            {activeGroupId !== 'default' && (
                <div
                    className="active-list-actions-trigger"
                    onClick={handleActionsClick}
                >
                    <MoreVertical size={18} />
                </div>
            )}
            {/* List Selection Menu */}
            <ContextMenu
                isOpen={isMenuOpen}
                onClose={() => setMenuOpen(false)}
                position={menuPosition}
                className="sidebar-list-context-menu"
            >
                <MenuItem
                    label="Inbox"
                    icon={<span>📪</span>}
                    selected={activeGroupId === 'default'}
                    checkmark={activeGroupId === 'default'}
                    onClick={() => handleSelect('default')}
                />
                <MenuSeparator />
                {store.groups.map(group => (
                    <MenuItem
                        key={group.id}
                        label={group.name}
                        icon={<span>{group.icon}</span>}
                        selected={activeGroupId === group.id}
                        checkmark={activeGroupId === group.id}
                        onClick={() => handleSelect(group.id)}
                    />
                ))}
                <MenuSeparator />
                <MenuItem
                    label="New List"
                    icon={<Plus size={14} />}
                    onClick={() => {
                        setMenuOpen(false);
                        setEditingGroupId(null);
                        setShowCreateList(true);
                    }}
                />
            </ContextMenu>

            {/* List Actions Menu */}
            <ContextMenu
                isOpen={isActionsMenuOpen}
                onClose={() => setActionsMenuOpen(false)}
                position={actionsMenuPosition}
            >
                <MenuItem
                    label="Edit List"
                    icon={<Edit2 size={14} />}
                    onClick={() => {
                        setActionsMenuOpen(false);
                        setEditingGroupId(activeGroupId);
                        setShowCreateList(true);
                    }}
                />
                <MenuItem
                    label="Delete List"
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                        if (activeGroupId) {
                            store.deleteGroup(activeGroupId);
                        }
                        setActionsMenuOpen(false);
                    }}
                />
            </ContextMenu>

            {showCreateList && (
                <CreateListModal
                    groupId={editingGroupId || undefined}
                    onClose={() => {
                        setShowCreateList(false);
                        setEditingGroupId(null);
                    }}
                />
            )}
        </div>
    );
});
