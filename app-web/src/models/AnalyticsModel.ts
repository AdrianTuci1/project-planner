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
        const filterLabelIds = store.filterLabelIds;

        return this.allTasks.filter(task => {
            // 1. Time range filtering
            let inPeriod = false;
            if (task.scheduledDate) {
                inPeriod = isWithinInterval(task.scheduledDate, { start, end });
            }
            if (!inPeriod) return false;

            // 2. Label filtering
            if (filterLabelIds.length > 0) {
                if (!task.labelId || !filterLabelIds.includes(task.labelId)) {
                    return false;
                }
            }

            return true;
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

            // Group by label ID to preserve colors correctly
            const labelGroupData = new Map<string, { label: string, color: string, duration: number }>();

            tasks.forEach(t => {
                let labelId = 'unlabeled';
                let labelName = 'Unlabeled';
                let labelColor = '#E4D0AA';

                if (t.labelId) {
                    const l = store.getLabel(t.labelId);
                    if (l) {
                        labelId = l.id;
                        labelName = l.name;
                        labelColor = l.color;
                    }
                }

                // Use actualDuration or fallback to estimated duration
                const duration = t.actualDuration || t.duration || 0;
                if (duration > 0) {
                    if (!labelGroupData.has(labelId)) {
                        labelGroupData.set(labelId, { label: labelName, color: labelColor, duration: 0 });
                    }
                    labelGroupData.get(labelId)!.duration += duration;
                }
            });

            const segments: { label: string, color: string, value: number }[] = [];
            labelGroupData.forEach((data) => {
                segments.push({
                    label: data.label,
                    color: data.color,
                    value: data.duration / 60 // convert to hours for chart consistency
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

            // Find dominant label by duration
            const labelDurations = new Map<string, { color: string, duration: number }>();
            tasks.forEach(t => {
                let labelId = 'unlabeled';
                let labelColor = '#E4D0AA';

                if (t.labelId) {
                    const l = store.getLabel(t.labelId);
                    if (l) {
                        labelId = l.id;
                        labelColor = l.color;
                    }
                }
                const duration = t.actualDuration || t.duration || 0;
                if (!labelDurations.has(labelId)) {
                    labelDurations.set(labelId, { color: labelColor, duration: 0 });
                }
                labelDurations.get(labelId)!.duration += duration;
            });

            let dominantColor = '#E4D0AA';
            let maxDuration = -1;
            labelDurations.forEach((data) => {
                if (data.duration > maxDuration) {
                    maxDuration = data.duration;
                    dominantColor = data.color;
                }
            });

            days.push({ date: current, estimated, actual, dominantColor });
            current = new Date(current.getTime() + 24 * 60 * 60 * 1000);
        }
        return days;
    }

    get tasksByLabel() {
        const labelStats = new Map<string, { label: string, color: string, count: number, completed: number, estimated: number, actual: number }>();

        this.tasksInPeriod.forEach(t => {
            let labelId = 'unlabeled';
            let labelName = 'Unlabeled';
            let labelColor = '#E4D0AA';

            if (t.labelId) {
                const l = store.getLabel(t.labelId);
                if (l) {
                    labelId = l.id;
                    labelName = l.name;
                    labelColor = l.color;
                }
            }

            if (!labelStats.has(labelId)) {
                labelStats.set(labelId, { label: labelName, color: labelColor, count: 0, completed: 0, estimated: 0, actual: 0 });
            }
            const stat = labelStats.get(labelId)!;
            stat.count++;
            if (t.status === 'done') stat.completed++;
            stat.estimated += t.duration || 0;
            stat.actual += t.actualDuration || 0;
        });

        const totalTasks = this.tasksInPeriod.length;

        return Array.from(labelStats.values()).map(stat => ({
            label: stat.label,
            color: stat.color,
            percentage: totalTasks > 0 ? (stat.count / totalTasks) * 100 : 0,
            completedCount: stat.completed,
            estimatedTime: stat.estimated,
            actualTime: stat.actual
        }));
    }
}

export const analyticsModel = new AnalyticsModel();
