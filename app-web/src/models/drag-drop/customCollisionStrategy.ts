import { CollisionDetection, pointerWithin, rectIntersection } from '@dnd-kit/core';

/**
 * Custom collision detection strategy that prioritizes Sidebar targets.
 * 
 * Problem: When Sidebar overlaps with Kanban (e.g. z-index or visual overlap) or when dragging
 * from Kanban which is "large", the default strategy might pick the background Kanban column
 * instead of the Sidebar list.
 * 
 * Solution: If the pointer is within a sidebar-related container, ignore any background
 * kanban/calendar containers effectively "masking" them.
 */
export const customCollisionStrategy: CollisionDetection = (args) => {
    // First, find all intersecting containers using pointerWithin (usually best for mouse)
    const pointerCollisions = pointerWithin(args);

    // If no pointer collisions, fallback to rectIntersection (better for large items?) or just return
    if (pointerCollisions.length === 0) {
        return rectIntersection(args);
    }

    // Check if we are hovering over the Sidebar
    const sidebarCollision = pointerCollisions.find(c =>
        c.id.toString().includes('sidebar') || c.id.toString().includes('group-list')
    );

    if (sidebarCollision) {
        // If we are over the sidebar, we should ONLY return sidebar-related collisions.
        // Filter out kanban columns, calendar cells, etc. that might be behind it.
        return pointerCollisions.filter(c =>
            c.id.toString().includes('sidebar') ||
            c.id.toString().includes('group-list') ||
            // Also allow tasks that are IN the sidebar (though their IDs are just UUIDs usually)
            // But usually the container collision is what matters for the "droppable" container.
            // If we are over a task, dnd-kit handles that.
            // We just want to filter OUT the "background" boards.
            !c.id.toString().includes('kanban-column') &&
            !c.id.toString().includes('calendar-cell') &&
            !c.id.toString().includes('timebox-slot') &&
            !c.id.toString().includes('month-cell')
        );
    }

    // Default behavior
    return pointerCollisions;
};
