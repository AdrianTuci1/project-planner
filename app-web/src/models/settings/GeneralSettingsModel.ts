import { makeAutoObservable } from "mobx";

export class GeneralSettingsModel {
    // After Task Completion
    moveTasksBottom: boolean = true;
    markCompleteSubtasks: boolean = true;
    autoSetActualTime: boolean = false;

    // Decoration
    deepLinkDetection: boolean = true;

    // Calendar / Kanban Settings
    startWeekOn: string = 'Sunday';
    showWeekends: boolean = true;

    // Workload
    workdayThreshold: boolean = true;
    workloadThreshold: string = '8 hours';

    showDeclinedEvents: boolean = true;
    startDayAt: string = '12:00 AM';
    calendarIncrements: string = '15 minute';
    calendarViewDays: number = 7;
    timeFormat: string = '12 hour';

    // Appearance
    darkMode: string = 'Dark mode';

    // Timer Settings
    autoStartNextTask: boolean = false;

    // Braindump & Lists
    sidebarLayout: string = 'Show one list';

    // New Task / Update Task
    addNewTasksTo: string = 'Top of list';
    detectLabel: boolean = true;
    defaultEstimatedTime: string = '0 mins';

    // Task Rollover
    rolloverNextDay: boolean = true;
    rolloverRecurring: boolean = false;
    rolloverTo: string = 'Bottom of list';

    constructor() {
        makeAutoObservable(this);
    }

    // Generic setter for boolean toggles
    toggleSetting(key: keyof GeneralSettingsModel) {
        if (typeof this[key] === 'boolean') {
            (this[key] as boolean) = !this[key];
        }
    }

    // Generic setter for values
    setSetting(key: keyof GeneralSettingsModel, value: any) {
        // @ts-ignore
        this[key] = value;
        // Strategy handles auto-save
    }

    async loadSettings() {
        try {
            // We would need to import 'api' here, but to avoid circular deps with store -> api -> store, we usually import api directly.
            // However, store uses api, settings is part of store.
            // Ideally, we pass simple data or use the singleton api.
            // Let's assume we can import the singleton `api` instance from services/api
            const settings = await (await import("../../services/api")).api.getGeneralSettings();
            Object.assign(this, settings);
        } catch (error) {
            console.error("Failed to load general settings", error);
        }
    }

    async saveSettings() {
        try {
            const { api } = await import("../../services/api");
            const snapshot = { ...this } as any;
            // distinct observable/action properties if necessary
            await api.updateGeneralSettings(snapshot);
        } catch (error) {
            console.error("Failed to save general settings", error);
        }
    }
}
