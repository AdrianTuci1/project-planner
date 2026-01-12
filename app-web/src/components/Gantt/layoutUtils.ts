import { Task } from '../../models/core';

export interface LayoutData {
    left: number;  // Percentage
    width: number; // Percentage
    zIndex: number;
}

/**
 * Calculates the layout (left, width, zIndex) for a set of overlapping tasks.
 * The logic assumes a geometric division of space:
 * - 1st column: Left 0, Width 50% (if overlapped)
 * - 2nd column: Left 50%, Width 25% (if overlapped)
 * - ...
 * - Last column takes the remaining width.
 */
export const calculateOverlappingLayout = (tasks: Task[]): Map<string, LayoutData> => {
    // 1. Sort tasks by start minute, then duration, then ID
    const sortedTasks = [...tasks].sort((a, b) => {
        const [hA, mA] = a.scheduledTime!.split(':').map(Number);
        const [hB, mB] = b.scheduledTime!.split(':').map(Number);
        if (hA !== hB) return hA - hB;
        if (mA !== mB) return mA - mB;
        return (b.duration || 15) - (a.duration || 15);
    });

    const layoutMap = new Map<string, LayoutData>();
    const columns: Task[][] = [];

    // 2. Assign tasks to columns greedily
    for (const task of sortedTasks) {
        let placed = false;

        // Try to place in an existing column
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const lastTaskInCol = col[col.length - 1];

            // Check for overlap with the last task in this column
            // We only care about vertical overlap within this specific render context (e.g. hour cell)
            // But realistically, this function receives tasks that are ALREADY in the same hour context.
            // AND we need to check if they actually overlap in time range.

            const [h1, m1] = lastTaskInCol.scheduledTime!.split(':').map(Number);
            const start1 = h1 * 60 + m1;
            const end1 = start1 + (lastTaskInCol.duration || 15);

            const [h2, m2] = task.scheduledTime!.split(':').map(Number);
            const start2 = h2 * 60 + m2;
            // End is not strictly needed for collision check with *start* of next task, 
            // but effectively: if task starts after the previous ends, no collision in this column.

            if (start2 >= end1) {
                col.push(task);
                placed = true;
                break;
            }
        }

        if (!placed) {
            columns.push([task]);
        }
    }

    // 3. Calculate geometry based on columns
    // However, the rule "next card takes half the WIDTH" implies visual overlapping relation.
    // Actually, usually "overlapping" means "occupies same vertical time space".
    // If they strictly stack in columns (like Google Calendar), width is shared.
    // The user requirement: "se imparte spatiul disponibil (urmatorul card va ocupa jumatate din latime, urmatorul un sfert)"
    // This sounds like:
    // Col 0: 0% -> 50%
    // Col 1: 50% -> 75%
    // Col 2: 75% -> 87.5%
    // ...
    // But this logic depends on how many columns are active *at a specific point in time*.
    // Simple approach: Column index determines position strictly.

    // We need to know the max column index for each task *group*? 
    // Or just global columns for this set? 
    // User example suggests a fixed recursive split.
    // Let's stick to the column index assigned above.

    // Iterate columns and assign layout
    columns.forEach((colTasks, colIndex) => {
        colTasks.forEach(task => {
            // Calculate base geometry
            // Left = sum(100/2^i) for i=0 to colIndex-1 ? 
            // 0: 0
            // 1: 50
            // 2: 75
            // 3: 87.5
            // Formula: left = 100 * (1 - 1/2^colIndex)

            // Left = sum(100/2^i) for i=0 to colIndex-1
            // Formula: left = 100 * (1 - 1/2^colIndex)

            const left = 100 * (1 - Math.pow(0.5, colIndex));

            // Width: The user wants them to "overlap".
            // To achieve true overlap where the card extends behind the next one,
            // we should simply let it take the remaining space.
            // Z-index ensures the next column sits on top.

            const width = 100 - left;

            layoutMap.set(task.id, {
                left: left,
                width: width,
                zIndex: 10 + colIndex
            });
        });
    });

    return layoutMap;
};
