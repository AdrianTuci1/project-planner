import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../../services/api";
import { CalendarAccount } from "../../services/types";
import { calendarSyncStrategy } from "../strategies/CalendarSyncStrategy";

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

            // Monitor all loaded accounts
            this.calendars.forEach(cal => calendarSyncStrategy.monitor(cal));

        } catch (error) {
            console.error("Failed to fetch calendars", error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async connectCalendar(provider: 'google' | 'outlook' | 'apple' | 'other' = 'google') {
        if (provider !== 'google') {
            alert("Only Google Calendar is currently supported.");
            return;
        }

        this.isLoading = true;
        try {
            const data = await api.getGoogleAuthUrl();

            if (data && data.url) {
                window.location.href = data.url;
            }

        } catch (error) {
            console.error("Failed to initiate Google Auth", error);
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    async handleGoogleCode(code: string) {
        this.isLoading = true;
        try {
            const account = await api.exchangeGoogleCode(code);
            runInAction(() => {
                // Remove existing if present to avoid duplication in array (backend handles logic but we need to update local state)
                this.calendars = this.calendars.filter(c => c.id !== account.id);
                this.calendars.push(account);
            });

            // Start monitoring the new account
            calendarSyncStrategy.monitor(account);

            // Also fetch real sub-calendars immediately
            this.fetchSubCalendars(account.id);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error("Failed to exchange google code", error);
            alert("Failed to connect Google Calendar.");
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

        // Strategy monitors change and syncs automatically
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

        // Strategy monitors change and syncs automatically
    }

    async setGuestUpdateStrategy(accountId: string, strategy: 'all' | 'none') {
        const account = this.calendars.find(c => c.id === accountId);
        if (!account) return;

        runInAction(() => {
            account.guestUpdateStrategy = strategy;
        });

        // Strategy monitors change and syncs automatically
    }

    // Call after connection or periodically
    async fetchSubCalendars(accountId: string) {
        this.isLoading = true;
        try {
            // Call the real sync endpoint we just created
            // Call the real sync endpoint we just created
            const data = await api.syncSubCalendars(accountId);
            const updatedAccount = data.accounts.find((a: CalendarAccount) => a.id === accountId);

            if (!updatedAccount) {
                console.error("Updated account not found in sync response");
                return;
            }

            // Stop monitoring the OLD object before we replace it
            calendarSyncStrategy.stopMonitoring(accountId);

            runInAction(() => {
                // Update local model
                this.calendars = this.calendars.map(c => c.id === accountId ? updatedAccount : c);
            });

            // Start monitoring the NEW object
            calendarSyncStrategy.monitor(updatedAccount);

            // Re-attach monitor to ensure we catch changes on new objects if reference changed
            // simpler: just update the existing object properties if we want to keep reference, 
            // but mapping is safer for React.
            // We should ensure strategy monitors the *new* object.
            // The fetchCalendars loop handles initial monitoring. We should probably handle it here too.
            // But usually fetchCalendars happens on load.
        } catch (error) {
            console.error("Failed to sync sub-calendars", error);
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
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
