import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDroppable } from '@dnd-kit/core';

export const CalendarSlot = observer(({ date, hour, minute }: { date: Date, hour: number, minute: number }) => {
    const cellId = `calendar-slot-${date.toISOString()}-${hour}-${minute}`;
    const { isOver, setNodeRef } = useDroppable({
        id: cellId,
        data: {
            type: 'calendar-cell',
            date: date,
            hour: hour,
            minute: minute // Granular target!
        }
    });

    return (
        <div
            ref={setNodeRef}
            className={`calendar-slot ${isOver ? 'is-over' : ''}`}
            style={{
                height: '25%', // 15 mins
                width: '100%',
                borderBottom: minute !== 45 ? '1px dashed rgba(0,0,0,0.05)' : 'none', // Subtle guide lines
                backgroundColor: isOver ? 'rgba(139, 92, 246, 0.1)' : 'transparent', // Highlight color
                transition: 'background-color 0.1s'
            }}
        />
    );
});
