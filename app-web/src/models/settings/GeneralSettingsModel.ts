import { makeAutoObservable } from "mobx";
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
    };

    constructor() {
        makeAutoObservable(this);
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
        if (typeof this.featuresSettings[key] === 'boolean') {
            (this.featuresSettings[key] as boolean) = !this.featuresSettings[key];
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
                // Map flat or nested structure from backend to our nested structure
                // Assuming backend might return nested 'generalSettings' and 'featuresSettings' 
                // OR a flat list we need to migrate. For now, let's support both if possible or just assume flat -> nested transition.

                // If backend returns the new nested structure:
                if (settings.generalSettings) {
                    Object.assign(this.generalSettings, settings.generalSettings);
                } else {
                    // Fallback/Migration: Map flat properties to generalSettings
                    // (This part depends on if we migrate backend data or just frontend mapping)
                    // Let's iterate keys and assign if they exist in our defaults
                    Object.keys(this.generalSettings).forEach(k => {
                        // @ts-ignore
                        if (settings[k] !== undefined) this.generalSettings[k] = settings[k];
                    });
                }

                if (settings.featuresSettings) {
                    Object.assign(this.featuresSettings, settings.featuresSettings);
                } else {
                    // Fallback for features
                    Object.keys(this.featuresSettings).forEach(k => {
                        // @ts-ignore
                        if (settings[k] !== undefined) this.featuresSettings[k] = settings[k];
                    });
                }
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
