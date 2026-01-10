import React from 'react';
import { Plus } from 'lucide-react';
import './TaskCard.css';

interface GhostTaskCardProps {
    onAddClick?: () => void;
}

export const GhostTaskCard: React.FC<GhostTaskCardProps> = ({ onAddClick }) => {
    return (
        <div className="add-task-ghost" onClick={onAddClick}>
            <Plus size={16} />
            <span>Add a task</span>
        </div>
    );
};
