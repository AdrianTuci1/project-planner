import { makeAutoObservable } from 'mobx';
import { Task, TaskStatus } from './core';
import { store } from './store';

class DailyShutdownModel {
    constructor() {
        makeAutoObservable(this);
    }

    get completedTasks() {
        return store.allTasks.filter(t =>
            t.scheduledDate &&
            t.scheduledDate.toDateString() === new Date().toDateString() &&
            t.status === 'done'
        );
    }

    get totalDuration() {
        return this.completedTasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0);
    }

    get statsByLabel() {
        const stats: Record<string, { minutes: number, color: string }> = {};

        this.completedTasks.forEach(task => {
            if (task.labels.length > 0) {
                // Determine primary label (first one)
                const labelName = task.labels[0];
                const color = store.getLabelColor(labelName);

                if (!stats[labelName]) {
                    stats[labelName] = { minutes: 0, color };
                }
                stats[labelName].minutes += (task.actualDuration || 0);
            } else {
                // Unlabeled
                if (!stats['Unlabeled']) {
                    stats['Unlabeled'] = { minutes: 0, color: '#e5e7eb' }; // Gray
                }
                stats['Unlabeled'].minutes += (task.actualDuration || 0);
            }
        });

        // Convert to array and sort by duration
        return Object.entries(stats)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.minutes - a.minutes);
    }

    toggleTaskStatus(task: Task) {
        if (task.status === 'done') {
            // Revert to todo
            task.status = 'todo';
            task.actualDuration = 0; // Reset actual duration
        } else {
            // Mark as done
            task.status = 'done';

            // Logic: If actual time < 1 min, use estimated. 
            if ((task.actualDuration || 0) < 1) {
                // If estimated exists, use it. If not, maybe default to something or keep 0?
                // Request says: "if actual time is less than a minute then we use estimated"
                if (task.duration && task.duration > 0) {
                    task.actualDuration = task.duration;
                }
            }
        }
    }

    formatTime(minutes: number) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h > 0 ? `${h}h ` : ''}${m}m`;
    }
}

export const dailyShutdownModel = new DailyShutdownModel();
