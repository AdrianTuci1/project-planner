import { DragEndEvent } from '@dnd-kit/core';
import { dragDropManager } from '../models/drag-drop/DragDropManager';

export const useAppDragEnd = () => {
    const handleDragEnd = (event: DragEndEvent) => {
        dragDropManager.handleDragEnd(event);
    };

    const handleDragOver = (event: DragEndEvent) => {
        dragDropManager.handleDragOver(event);
    };

    return { handleDragEnd, handleDragOver };
};
