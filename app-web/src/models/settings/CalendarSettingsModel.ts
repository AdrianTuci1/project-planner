import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../../services/api";
import { CalendarAccount } from "../../services/types";
import { v4 as uuidv4 } from 'uuid';

export class CalendarSettingsModel {
    calendars: CalendarAccount[] = [];
    isLoading: boolean = false;

    createTasksFromEvents: boolean = false;
    addTasksToCalendar: boolean = false;
    showManageView: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    async fetchCalendars() {
        this.isLoading = true;
        try {
            const data = await api.getCalendars();
            runInAction(() => {
                this.calendars = data.accounts;
            });
        } catch (error) {
            console.error("Failed to fetch calendars", error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async connectCalendar(provider: 'google' | 'outlook' | 'apple' | 'other' = 'google') {
        this.isLoading = true;
        try {
            // Mocking the OAuth flow result for now
            const newAccount: CalendarAccount = {
                id: uuidv4(),
                email: 'new.user@example.com',
                name: 'New Calendar',
                provider: provider,
                color: '#4285F4',
                isVisible: true
            };

            const data = await api.addCalendar(newAccount);
            runInAction(() => {
                this.calendars = data.accounts;
            });
        } catch (error) {
            console.error("Failed to connect calendar", error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async disconnectCalendar(id: string) {
        this.isLoading = true;
        try {
            const data = await api.deleteCalendar(id);
            runInAction(() => {
                this.calendars = data.accounts;
            });
        } catch (error) {
            console.error("Failed to disconnect calendar", error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async toggleCalendarVisibility(id: string) {
        const calendar = this.calendars.find(c => c.id === id);
        if (!calendar) return;

        const newVisibility = !calendar.isVisible;

        runInAction(() => {
            calendar.isVisible = newVisibility;
        });

        try {
            const data = await api.updateCalendar(id, { isVisible: newVisibility });
            runInAction(() => {
                this.calendars = data.accounts;
            });
        } catch (error) {
            console.error("Failed to update calendar visibility", error);
            runInAction(() => {
                calendar.isVisible = !newVisibility;
            });
        }
    }

    setShowManageView(show: boolean) {
        this.showManageView = show;
    }

    toggleCreateTasksFromEvents(value: boolean) {
        this.createTasksFromEvents = value;
    }

    toggleAddTasksToCalendar(value: boolean) {
        this.addTasksToCalendar = value;
    }
}
