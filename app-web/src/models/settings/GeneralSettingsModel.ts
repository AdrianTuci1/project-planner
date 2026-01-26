import { makeAutoObservable, runInAction } from "mobx";
import { api } from "../../services/api";

export class GeneralSettingsModel {
    // Standard General Settings
    generalSettings = {
        // After Task Completion
        moveTasksBottom: true,
        markCompleteSubtasks: true,
        autoSetActualTime: false,

        // Decoration
        deepLinkDetection: true,

        // Calendar / Kanban Settings
        startWeekOn: 'Sunday',
        showWeekends: true,

        // Workload
        workdayThreshold: true,
        workloadThreshold: '8 hours',

        showDeclinedEvents: true,
        startDayAt: '12:00 AM',
        calendarIncrements: '15 minute',
        calendarViewDays: 7,
        timeFormat: '12 hour',

        // Appearance
        darkMode: 'Dark mode',

        // Timer Settings
        autoStartNextTask: false,

        // Braindump & Lists
        sidebarLayout: 'Show one list',

        // New Task / Update Task
        addNewTasksTo: 'Top of list',
        detectLabel: true,
        defaultEstimatedTime: '0 mins',

        // Task Rollover
        rolloverNextDay: true,
        rolloverRecurring: false,
        rolloverTo: 'Bottom of list',
    };

    // Power Features (formerly scattered)
    featuresSettings = {
        // Feature Toggles
        dueDatesEnabled: false,
        templatesEnabled: false,
        taskPriorityEnabled: false,
        attachmentsEnabled: false,
        apiTokenEnabled: false,
    };

    constructor() {
        makeAutoObservable(this, {}, { deep: true });
    }

    // Generic setter for boolean toggles in general settings
    toggleSetting(key: keyof typeof this.generalSettings) {
        if (typeof this.generalSettings[key] === 'boolean') {
            (this.generalSettings[key] as boolean) = !this.generalSettings[key];
        }
    }

    // Generic setter for values in general settings
    setSetting(key: keyof typeof this.generalSettings, value: any) {
        // @ts-ignore
        this.generalSettings[key] = value;
    }

    // Feature toggles
    toggleFeature(key: keyof typeof this.featuresSettings) {
        console.log('[GeneralSettingsModel] toggleFeature called with key:', key);
        console.log('[GeneralSettingsModel] Current value:', this.featuresSettings[key]);

        // Initialize to false if undefined
        if (this.featuresSettings[key] === undefined) {
            console.log('[GeneralSettingsModel] Value is undefined, initializing to false');
            // @ts-ignore
            this.featuresSettings[key] = false;
        }

        if (typeof this.featuresSettings[key] === 'boolean') {
            (this.featuresSettings[key] as boolean) = !this.featuresSettings[key];
            console.log('[GeneralSettingsModel] New value:', this.featuresSettings[key]);
        } else {
            console.log('[GeneralSettingsModel] Value is not boolean, type:', typeof this.featuresSettings[key]);
        }
    }

    setFeature(key: keyof typeof this.featuresSettings, value: any) {
        // @ts-ignore
        this.featuresSettings[key] = value;
    }

    async loadSettings() {
        try {
            const settings = await api.getGeneralSettings();

            if (settings) {
                console.log('[GeneralSettingsModel] Loading settings from backend:', settings);

                runInAction(() => {
                    // Handle generalSettings
                    if (settings.generalSettings) {
                        Object.keys(settings.generalSettings).forEach(key => {
                            if (key in this.generalSettings) {
                                // @ts-ignore
                                this.generalSettings[key] = settings.generalSettings[key];
                            }
                        });
                    } else {
                        // Fallback: Map flat properties to generalSettings
                        Object.keys(this.generalSettings).forEach(k => {
                            // @ts-ignore
                            if (settings[k] !== undefined) this.generalSettings[k] = settings[k];
                        });
                    }

                    // Handle featuresSettings - ensure all properties are initialized
                    if (settings.featuresSettings) {
                        Object.keys(settings.featuresSettings).forEach(key => {
                            if (key in this.featuresSettings) {
                                // @ts-ignore
                                this.featuresSettings[key] = settings.featuresSettings[key];
                            }
                        });
                    } else {
                        // Fallback for features - check flat properties
                        Object.keys(this.featuresSettings).forEach(k => {
                            // @ts-ignore
                            if (settings[k] !== undefined) this.featuresSettings[k] = settings[k];
                        });
                    }
                });

                console.log('[GeneralSettingsModel] After loading, featuresSettings:', {
                    dueDatesEnabled: this.featuresSettings.dueDatesEnabled,
                    templatesEnabled: this.featuresSettings.templatesEnabled,
                    taskPriorityEnabled: this.featuresSettings.taskPriorityEnabled,
                    attachmentsEnabled: this.featuresSettings.attachmentsEnabled,
                    apiTokenEnabled: this.featuresSettings.apiTokenEnabled
                });
            }
        } catch (error) {
            console.error("Failed to load general settings", error);
        }
    }

    async saveSettings() {
        // Handled by SyncStrategy mostly, but if manual save needed:
        try {
            await api.updateGeneralSettings({
                generalSettings: this.generalSettings,
                featuresSettings: this.featuresSettings
            });
        } catch (error) {
            console.error("Failed to save general settings", error);
        }
    }
}
