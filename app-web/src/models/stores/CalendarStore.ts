import { makeAutoObservable, runInAction } from "mobx";
import { ProjectStore } from "../store";
import { api } from "../../services/api";
import { calendarSyncStrategy } from "../strategies/CalendarSyncStrategy";

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay: boolean;
    accountId: string;
    calendarId: string;
    color: string;
    isCalendarEvent: boolean;
    rawStart?: any;
    rawEnd?: any;
    scheduledTime?: string;
    [key: string]: any;
}

export class CalendarStore {
    rootStore: ProjectStore;
    events: CalendarEvent[] = [];
    isLoading: boolean = false;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    async fetchEvents(start: Date, end: Date) {
        this.isLoading = true;
        try {
            const rawEvents = await api.getEvents(start.toISOString(), end.toISOString());
            runInAction(() => {
                this.events = rawEvents.map((e: any) => ({
                    ...e,
                    start: new Date(e.scheduledDate || e.start?.dateTime || e.start?.date),
                    end: new Date(e.end?.dateTime || e.end?.date),
                    // Ensure ResizableTaskCard compatibility
                    scheduledDate: new Date(e.scheduledDate || e.start?.dateTime || e.start?.date),
                    isCalendarEvent: true,
                    provider: e.provider,
                    duration: e.duration,
                    htmlLink: e.htmlLink,
                    allDay: e.allDay,
                    rawStart: e.start,
                    rawEnd: e.end,
                    description: e.description,
                    scheduledTime: e.allDay ? undefined :
                        (e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : undefined)
                }));
            });
        } catch (error) {
            console.error("Failed to fetch calendar events", error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    getEventById(id: string): CalendarEvent | undefined {
        return this.events.find(e => e.id === id);
    }

    async updateEvent(event: CalendarEvent, changes: { start?: Date, end?: Date }) {
        try {
            // Optimistic update
            runInAction(() => {
                if (changes.start) {
                    event.start = changes.start;
                    event.scheduledDate = changes.start;
                    // Update scheduledTime for UI
                    event.scheduledTime = changes.start.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
                }
                if (changes.end) {
                    event.end = changes.end;
                    const durationMs = event.end.getTime() - event.start.getTime();
                    event.duration = Math.round(durationMs / 60000);
                }
            });

            // Calculate formatted start/end for API
            const payload: any = {};
            if (changes.start) payload.start = { dateTime: changes.start.toISOString() };
            if (changes.end) payload.end = { dateTime: changes.end.toISOString() };

            await calendarSyncStrategy.updateEvent(event.accountId, event.calendarId, event.id.replace('evt_', ''), payload);
        } catch (error) {
            console.error("Failed to update event", error);
        }
    }

    async deleteEvent(event: CalendarEvent) {
        try {
            // Optimistic update
            runInAction(() => {
                this.events = this.events.filter(e => e.id !== event.id);
            });

            await calendarSyncStrategy.deleteEvent(event.accountId, event.calendarId, event.id.replace('evt_', ''));
        } catch (error) {
            console.error("Failed to delete event", error);
        }
    }
}
