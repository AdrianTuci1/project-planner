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

        // If exact hours and less than or equal to 9 hours, return just "h" format if requested, but "h:mm" is safer.
        // User said: "sau doar h daca nu e mai mult de 9 ore" (or just h if not more than 9 hours).
        // Let's interpret "doar h" as "1h", "2h" etc. if mins is 0?
        // Or maybe "h" suffix?
        // Let's go with "h:mm" generally, or "h" if m=0 and h<=9?
        // Let's try:
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
