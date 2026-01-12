import { makeAutoObservable } from "mobx";
import { store } from "./store";
import { Task } from "./core";
import { startOfWeek, endOfWeek, subWeeks, isWithinInterval, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";

export type TimeRange = 'current-week' | 'last-week' | 'last-2-weeks' | 'last-month' | 'last-3-months';

export class AnalyticsModel {
    selectedRange: TimeRange = 'current-week';

    constructor() {
        makeAutoObservable(this);
    }

    setRange(range: TimeRange) {
        this.selectedRange = range;
    }

    get dateRange(): { start: Date, end: Date } {
        const now = new Date();
        const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 });
        const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });

        switch (this.selectedRange) {
            case 'current-week':
                return { start: startOfCurrentWeek, end: endOfCurrentWeek };
            case 'last-week':
                return {
                    start: subWeeks(startOfCurrentWeek, 1),
                    end: subWeeks(endOfCurrentWeek, 1)
                };
            case 'last-2-weeks':
                return {
                    start: subWeeks(startOfCurrentWeek, 2),
                    end: endOfCurrentWeek
                };
            case 'last-month':
                return {
                    start: startOfMonth(subMonths(now, 1)),
                    end: endOfMonth(subMonths(now, 1))
                };
            case 'last-3-months':
                return {
                    start: startOfMonth(subMonths(now, 3)),
                    end: now
                };
            default:
                return { start: startOfCurrentWeek, end: endOfCurrentWeek };
        }
    }

    get allTasks(): Task[] {
        // Gather from all groups and dump area
        const groupTasks = store.groups.flatMap((g: any) => g.tasks);
        return [...groupTasks, ...store.dumpAreaTasks];
    }

    get tasksInPeriod(): Task[] {
        const { start, end } = this.dateRange;
        return this.allTasks.filter(task => {
            // If task is done, use completion date if available (we might need to add completedAt to Task)
            // For now, let's assume we filter by scheduledDate if present, or createdAt if not?
            // "Tasks completed" usually implies we check if they were completed IN this period.
            // Since we don't have completedAt, we might need to rely on scheduledDate or add completedAt.
            // Let's assume scheduledDate for now as per "Tasks by Label" chart which seems time-based.
            if (task.scheduledDate) {
                return isWithinInterval(task.scheduledDate, { start, end });
            }
            return false;
        });
    }

    get completedTasksInPeriod(): Task[] {
        return this.tasksInPeriod.filter(t => t.status === 'done');
    }

    get completionStats() {
        const completed = this.completedTasksInPeriod.length;
        // Last week comparison would require fetching data for previous period
        // For simplified MVP, we'll return the current count and formatting
        return {
            count: completed,
            totalDuration: this.completedTasksInPeriod.reduce((acc: number, t: Task) => acc + (t.actualDuration || 0), 0)
        };
    }

    get completedTasksTotalStats() {
        const tasks = this.completedTasksInPeriod;
        return {
            totalEstimated: tasks.reduce((acc, t) => acc + (t.duration || 0), 0),
            totalActual: tasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0)
        };
    }

    get actualVsEstimated() {
        // Calculate average deviation
        const tasksWithEstimates = this.completedTasksInPeriod.filter(t => t.duration > 0 && t.actualDuration > 0);
        if (tasksWithEstimates.length === 0) return { percentage: 0, message: "No data" };

        let totalDiffPercentage = 0;
        tasksWithEstimates.forEach(t => {
            const diff = (t.duration - t.actualDuration) / t.duration;
            totalDiffPercentage += diff;
        });

        const avgDiff = (totalDiffPercentage / tasksWithEstimates.length) * 100;
        return {
            percentage: Math.round(avgDiff), // positive means took less time (good), negative means took more time
            message: avgDiff > 0 ? "less time than expected" : "more time than expected"
        };
    }

    get brainDumpAge() {
        const dumpTasks = store.dumpAreaTasks;
        if (dumpTasks.length === 0) return 0;

        const now = new Date();
        const totalAgeDays = dumpTasks.reduce((acc, t) => {
            const ageInfo = (now.getTime() - t.createdAt.getTime()) / (1000 * 3600 * 24);
            return acc + ageInfo;
        }, 0);

        return Math.round(totalAgeDays / dumpTasks.length);
    }

    get tasksByDay() {
        const { start, end } = this.dateRange;
        const days: { date: Date, count: number }[] = [];

        let current = start;
        while (current <= end) {
            const dayStart = startOfDay(current);
            const dayEnd = endOfDay(current);

            const count = this.tasksInPeriod.filter(t =>
                t.scheduledDate && isWithinInterval(t.scheduledDate, { start: dayStart, end: dayEnd })
            ).length;

            days.push({ date: current, count });
            current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        }
        return days;
    }

    get timeSpentByDayByLabel() {
        const { start, end } = this.dateRange;
        const days: { date: Date, segments: { label: string, color: string, value: number }[] }[] = [];

        let current = start;
        while (current <= end) {
            const dayStart = startOfDay(current);
            const dayEnd = endOfDay(current);

            const tasks = this.tasksInPeriod.filter(t =>
                t.scheduledDate && isWithinInterval(t.scheduledDate, { start: dayStart, end: dayEnd })
            );

            const labelDurations = new Map<string, number>();
            tasks.forEach(t => {
                // If a task has multiple labels, we currently only visualize the first one in lists
                const label = t.labels[0] || 'Unlabeled';
                // Fallback to estimated duration if actual is 0, so the chart isn't empty for non-timer users
                const duration = t.actualDuration || t.duration || 0;
                if (duration > 0) {
                    labelDurations.set(label, (labelDurations.get(label) || 0) + duration);
                }
            });

            const segments: { label: string, color: string, value: number }[] = [];
            labelDurations.forEach((duration, label) => {
                segments.push({
                    label,
                    color: label === 'Unlabeled' ? '#E4D0AA' : store.getLabelColor(label),
                    value: duration / 60 // convert to hours for consistency with other charts? Or maybe keep minutes?
                    // The other chart uses hours. Let's use hours.
                });
            });

            days.push({ date: current, segments });
            current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        }
        return days;
    }

    get timeSpentByDay() {
        const { start, end } = this.dateRange;
        const days: { date: Date, estimated: number, actual: number, dominantColor: string }[] = [];

        let current = start;
        while (current <= end) {
            const dayStart = startOfDay(current);
            const dayEnd = endOfDay(current);

            const tasks = this.tasksInPeriod.filter(t =>
                t.scheduledDate && isWithinInterval(t.scheduledDate, { start: dayStart, end: dayEnd })
            );

            const estimated = tasks.reduce((acc, t) => acc + (t.duration || 0), 0) / 60; // hours
            const actual = tasks.reduce((acc, t) => acc + (t.actualDuration || 0), 0) / 60; // hours

            // Find dominant label
            const labelCounts = new Map<string, number>();
            tasks.forEach(t => {
                const label = t.labels[0] || 'Unlabeled';
                labelCounts.set(label, (labelCounts.get(label) || 0) + (t.actualDuration || t.duration || 0));
            });

            let dominantLabel = 'Unlabeled';
            let maxDuration = -1;
            labelCounts.forEach((duration, label) => {
                if (duration > maxDuration) {
                    maxDuration = duration;
                    dominantLabel = label;
                }
            });

            const dominantColor = dominantLabel === 'Unlabeled' ? '#E4D0AA' : store.getLabelColor(dominantLabel);

            days.push({ date: current, estimated, actual, dominantColor });
            current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        }
        return days;
    }

    get tasksByLabel() {
        const labelStats = new Map<string, { count: number, completed: number, estimated: number, actual: number }>();

        this.tasksInPeriod.forEach(t => {
            const labels = t.labels.length > 0 ? t.labels : ['Unlabeled'];
            labels.forEach((label: string) => {
                if (!labelStats.has(label)) {
                    labelStats.set(label, { count: 0, completed: 0, estimated: 0, actual: 0 });
                }
                const stat = labelStats.get(label)!;
                stat.count++;
                if (t.status === 'done') stat.completed++;
                stat.estimated += t.duration || 0;
                stat.actual += t.actualDuration || 0;
            });
        });

        const totalTasks = this.tasksInPeriod.length;

        return Array.from(labelStats.entries()).map(([label, stats]) => ({
            label,
            percentage: totalTasks > 0 ? (stats.count / totalTasks) * 100 : 0,
            completedCount: stats.completed,
            estimatedTime: stats.estimated,
            actualTime: stats.actual
        }));
    }
}

export const analyticsModel = new AnalyticsModel();
