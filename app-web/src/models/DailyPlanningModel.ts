import { makeAutoObservable } from 'mobx';
import { Task } from './core';
import { store } from './store';
import { subDays, isSameDay } from 'date-fns';

class DailyPlanningModel {
    sourceGroupId: string | null = 'default';

    constructor() {
        makeAutoObservable(this);
    }

    setSourceGroupId(id: string | null) {
        this.sourceGroupId = id;
    }

    get yesterday() {
        return subDays(new Date(), 1);
    }

    get today() {
        return new Date();
    }

    get yesterdayTasks() {
        return store.allTasks.filter(t =>
            t.scheduledDate && isSameDay(t.scheduledDate, this.yesterday)
        );
    }

    get completedYesterday() {
        return this.yesterdayTasks.filter(t => t.status === 'done');
    }

    get missedYesterday() {
        return this.yesterdayTasks.filter(t => t.status !== 'done');
    }

    get sourceTasks() {
        if (this.sourceGroupId === 'default') {
            return store.dumpAreaTasks.filter(t => !t.scheduledDate);
        }
        const group = store.groups.find(g => g.id === this.sourceGroupId);
        if (group) {
            return group.tasks.filter(t => !t.scheduledDate);
        }
        return [];
    }

    get todayTasks() {
        return store.allTasks.filter(t =>
            t.scheduledDate && isSameDay(t.scheduledDate, this.today)
        );
    }
}

export const dailyPlanningModel = new DailyPlanningModel();
