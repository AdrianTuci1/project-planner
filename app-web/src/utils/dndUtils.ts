import { CollisionDetection, rectIntersection } from '@dnd-kit/core';

/**
 * Custom collision detection that prioritizes the top edge of the dragging item.
 * This is useful for calendars where the start time (top of the card) determines the slot.
 */
export const topCornerCollision: CollisionDetection = (args) => {
    const { collisionRect } = args;

    // Create a modified rect that only represents the top slice of the dragged item
    const topStripRect = {
        ...collisionRect,
        height: 1, // Only check the top pixel line
        bottom: collisionRect.top + 1
    };

    return rectIntersection({
        ...args, // Vital: Pass all other args (active, droppableContainers, etc.) through
        collisionRect: topStripRect
    });
};
