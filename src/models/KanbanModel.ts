import { makeAutoObservable } from "mobx";
import {
    startOfDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    addDays,
    subDays,
    isSameDay
} from "date-fns";
import { store } from "./store";

export class KanbanModel {
    dates: Date[] = [];
    isScrollingProgrammatically: boolean = false;
    lastScrollWidth: number = 0;
    lastScrollSyncTime: number = 0;
    skipNextSync: boolean = false;
    pendingScrollToDate: Date | null = null;
    pendingScrollAdjustment: boolean = false;

    constructor() {
        makeAutoObservable(this);
        this.initializeDates();
    }

    private initializeDates() {
        const today = new Date();
        this.dates = eachDayOfInterval({
            start: startOfMonth(today),
            end: endOfMonth(today)
        });
    }

    syncWithStore() {
        if (this.skipNextSync) {
            this.skipNextSync = false;
            return;
        }

        const targetDate = startOfDay(store.viewDate);
        const index = this.dates.findIndex(d => isSameDay(d, targetDate));

        if (index === -1) {
            // Regeneration needed (e.g. clicked Arrows/Today to a distant date)
            this.dates = eachDayOfInterval({
                start: startOfMonth(targetDate),
                end: endOfMonth(targetDate)
            });
            this.pendingScrollToDate = targetDate;
        } else if (!this.isScrollingProgrammatically) {
            // Only set pending scroll if it's an external change (e.g. navigation buttons)
            this.pendingScrollToDate = targetDate;
        }
    }

    handleScroll(scrollLeft: number, scrollWidth: number, clientWidth: number) {
        const threshold = 300;

        if (scrollLeft < threshold) {
            this.prependDays(14, scrollWidth);
        } else if (scrollWidth - (scrollLeft + clientWidth) < threshold) {
            this.appendDays(14);
        }

        // Sync back to store if not programmatic
        const now = Date.now();
        if (!this.isScrollingProgrammatically && now - this.lastScrollSyncTime > 300) {
            const columnWidth = scrollWidth / this.dates.length;
            const leftIndex = Math.round(scrollLeft / columnWidth);
            const visibleDate = this.dates[leftIndex];

            if (visibleDate && !isSameDay(visibleDate, store.viewDate)) {
                this.skipNextSync = true;
                store.setDate(visibleDate);
                this.lastScrollSyncTime = now;
            }
        }
    }

    private prependDays(count: number, currentScrollWidth: number) {
        const firstDate = this.dates[0];
        const newDates = eachDayOfInterval({
            start: subDays(firstDate, count),
            end: subDays(firstDate, 1)
        });
        this.dates = [...newDates, ...this.dates];
        this.lastScrollWidth = currentScrollWidth;
        this.pendingScrollAdjustment = true;
    }

    private appendDays(count: number) {
        const lastDate = this.dates[this.dates.length - 1];
        const newDates = eachDayOfInterval({
            start: addDays(lastDate, 1),
            end: addDays(lastDate, count)
        });
        this.dates = [...this.dates, ...newDates];
    }

    setScrollingProgrammatically(value: boolean) {
        this.isScrollingProgrammatically = value;
    }

    clearPendingScrollToDate() {
        this.pendingScrollToDate = null;
    }

    clearPendingScrollAdjustment() {
        this.pendingScrollAdjustment = false;
    }
}

export const kanbanModel = new KanbanModel();
