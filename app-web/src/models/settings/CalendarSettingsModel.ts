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

    async toggleSubCalendarVisibility(accountId: string, subCalendarId: string) {
        const account = this.calendars.find(c => c.id === accountId);
        if (!account || !account.subCalendars) return;

        const sub = account.subCalendars.find(s => s.id === subCalendarId);
        if (!sub) return;

        const newVis = !sub.isVisible;
        runInAction(() => {
            sub.isVisible = newVis;
        });

        // Persist
        try {
            const updatedSubs = account.subCalendars.map(s => s.id === subCalendarId ? { ...s, isVisible: newVis } : s);
            await api.updateCalendar(accountId, { subCalendars: updatedSubs });
        } catch (e) {
            console.error("Failed to update subcalendar", e);
            runInAction(() => {
                sub.isVisible = !newVis; // revert
            });
        }
    }

    async setGuestUpdateStrategy(accountId: string, strategy: 'all' | 'none') {
        const account = this.calendars.find(c => c.id === accountId);
        if (!account) return;

        runInAction(() => {
            account.guestUpdateStrategy = strategy;
        });

        await api.updateCalendar(accountId, { guestUpdateStrategy: strategy });
    }

    // Call after connection or periodically
    async fetchSubCalendars(accountId: string) {
        // Mock API call to backend service we just added
        // In real app: await api.refreshSubCalendars(accountId);

        // Simulating the backend response since we don't have the full API wire-up
        const account = this.calendars.find(c => c.id === accountId);
        if (!account) return;

        const mockSubCalendars = [
            { id: 'primary', name: 'Primary', color: account.color, isVisible: true, canEdit: true },
            { id: 'work', name: 'Work', color: '#ff5722', isVisible: true, canEdit: true },
            { id: 'family', name: 'Family', isVisible: false, color: '#9c27b0', canEdit: true }
        ];

        runInAction(() => {
            if (!account.subCalendars || account.subCalendars.length === 0) {
                account.subCalendars = mockSubCalendars;
            }
        });

        // Sync with backend
        await api.updateCalendar(accountId, { subCalendars: mockSubCalendars });
    }

    async connectGoogle() {
        await this.connectCalendar('google');
    }

    async disconnect() {
        const googleCal = this.calendars.find(c => c.provider === 'google');
        if (googleCal) {
            await this.disconnectCalendar(googleCal.id);
        }
    }

    get isConnected() {
        return this.calendars.some(c => c.provider === 'google');
    }

    get connectedEmail() {
        const googleCal = this.calendars.find(c => c.provider === 'google');
        return googleCal ? googleCal.email : '';
    }

    setShowManageView(show: boolean) {
        this.showManageView = show;
        if (show && this.isConnected) {
            const googleCal = this.calendars.find(c => c.provider === 'google');
            if (googleCal) {
                this.fetchSubCalendars(googleCal.id);
            }
        }
    }

    toggleCreateTasksFromEvents(value: boolean) {
        this.createTasksFromEvents = value;
    }

    toggleAddTasksToCalendar(value: boolean) {
        this.addTasksToCalendar = value;
    }
}
