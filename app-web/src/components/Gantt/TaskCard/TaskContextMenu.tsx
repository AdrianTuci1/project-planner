import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { ContextMenu, MenuItem, MenuSeparator } from '../../ContextMenu/ContextMenu';
import { Task } from '../../../models/core';

interface TaskContextMenuProps {
    isOpen: boolean;
    onClose: () => void;
    position: { x: number; y: number };
    task: Task;
    onMarkAsComplete: () => void;
    onDuplicate: () => void;
    onRemoveFromTimebox: () => void;
    onRemoveFromList?: () => void;
    onDelete: () => void;
}

export const TaskContextMenu: React.FC<TaskContextMenuProps> = ({
    isOpen,
    onClose,
    position,
    task,
    onMarkAsComplete,
    onDuplicate,
    onRemoveFromTimebox,
    onRemoveFromList,
    onDelete,
}) => {
    if (!isOpen) return null;

    return createPortal(
        <ContextMenu
            isOpen={isOpen}
            onClose={onClose}
            position={position}
        >
            <MenuItem
                icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                }
                label={task.status === 'done' ? "Mark as incomplete" : "Mark as complete"}
                onClick={() => {
                    onMarkAsComplete();
                    onClose();
                }}
            />

            <MenuItem
                icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                }
                label="Duplicate task"
                onClick={() => {
                    onDuplicate();
                    onClose();
                }}
            />

            {task.scheduledTime && (
                <MenuItem
                    icon={
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                            <line x1="9" y1="14" x2="15" y2="20" />
                            <line x1="15" y1="14" x2="9" y2="20" />
                        </svg>
                    }
                    label="Remove from timebox"
                    onClick={() => {
                        onRemoveFromTimebox();
                        onClose();
                    }}
                />
            )}

            {task.groupId && (
                <MenuItem
                    icon={
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    }
                    label="Remove from list"
                    onClick={() => {
                        onRemoveFromList?.();
                        onClose();
                    }}
                />
            )}

            <MenuSeparator />

            <MenuItem
                icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                }
                label="Delete task"
                onClick={() => {
                    onDelete();
                    onClose();
                }}
            />

        </ContextMenu>,
        document.body
    );
};
