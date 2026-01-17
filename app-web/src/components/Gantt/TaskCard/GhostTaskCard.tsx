import React from 'react';
import { Plus } from 'lucide-react';
import './TaskCard.css';

interface GhostTaskCardProps {
    onAddClick?: () => void;
    actualTime?: number; // minutes
    estimatedTime?: number; // minutes
}

export const GhostTaskCard: React.FC<GhostTaskCardProps> = ({ onAddClick, actualTime = 0, estimatedTime = 0 }) => {
    const format = (mins: number) => {
        if (mins === 0) return '0h';
        const h = Math.floor(mins / 60);
        const m = mins % 60;

        if (h <= 9 && m === 0) return `${h}h`;
        if (h <= 9) return `${h}:${m.toString().padStart(2, '0')}`;

        return `${h}:${m.toString().padStart(2, '0')}`;
    };

    const hasTime = actualTime > 0 || estimatedTime > 0;

    return (
        <div className="add-task-ghost" onClick={onAddClick} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} />
                <span>Add a task</span>
            </div>
            {hasTime && (
                <div className="ghost-time-chip">
                    {format(actualTime)} / {format(estimatedTime)}
                </div>
            )}
        </div>
    );
};
