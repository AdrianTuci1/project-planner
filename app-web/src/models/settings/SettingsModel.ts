import { makeAutoObservable } from "mobx";
import { api } from "../../services/api";
import { settingsSyncStrategy } from "../strategies/SettingsSyncStrategy";

export type SettingsTab = 'account' | 'team' | 'general' | 'labels' | 'power' | 'calendar' | 'due_dates' | 'subscription' | 'api_token' | 'account_data';
export type AccountView = 'main' | 'email' | 'password';
import { GeneralSettingsModel } from "./GeneralSettingsModel";
import { AccountSettingsModel } from "./AccountSettingsModel";
import { CalendarSettingsModel } from "./CalendarSettingsModel";
import { PowerFeaturesSettingsModel } from "./PowerFeaturesSettingsModel";
import { DueDatesSettingsModel } from "./DueDatesSettingsModel";

export class SettingsModel {
    activeTab: SettingsTab = 'account';
    accountView: AccountView = 'main';
    accountDataView: 'main' | 'import' | 'export' | 'delete' = 'main';
    teamView: 'summary' | 'manage' = 'summary';
    emailToInvite: string = '';
    account = new AccountSettingsModel();
    calendar = new CalendarSettingsModel();
    general = new GeneralSettingsModel();
    dueDates = new DueDatesSettingsModel();
    powerFeatures = new PowerFeaturesSettingsModel();

    // UI state for invite success message could also live here if needed, 
    // but often alerts are transient. We'll handle logic here.

    constructor() {
        makeAutoObservable(this);
    }

    async initialize() {
        // Load settings immediately
        await this.loadSettings();
        // Defer monitoring slightly or do it immediately
        settingsSyncStrategy.monitor(this);

        // Import strategy lazily or use exported instance
        const { profileSyncStrategy } = await import("../strategies/ProfileSyncStrategy");
        profileSyncStrategy.monitor(this.account);
    }

    async loadSettings() {
        try {
            const { api } = await import("../../services/api");
            const settings = await api.getGeneralSettings();

            // Populate General (includes featuresSettings)
            Object.assign(this.general, settings); // This works because we mapped it in Model or assumed structure matches. 

            // Populate Due Dates
            if (settings.thresholdDays !== undefined) this.dueDates.thresholdDays = settings.thresholdDays;

            // Populate Account - Now handled via AuthStore user sync
        } catch (error) {

            console.error("Failed to load global settings", error);
        }
    }


    updateFromRealtime(data: any) {
        // Assume data contains { key: value } or nested structure identifying which setting to update
        // Or flat structure similar to API response

        // Update General
        // this.general.generalSettings.update(data); // Removed due to lint error, using manual mapping below
        // Since GeneralSettingsModel structure might be nested, checking keys is safer or delegating

        // Simpler approach: Map known top-level keys if flat, or check sub-objects
        if (data.generalSettings) {
            Object.assign(this.general.generalSettings, data.generalSettings);
        } else {
            // Try to match fields
            if (data.thresholdDays !== undefined) this.dueDates.thresholdDays = data.thresholdDays;

            // Delegation for general properties
            // If we receive events for toggles
            if (data.moveTasksBottom !== undefined) this.general.generalSettings.moveTasksBottom = data.moveTasksBottom;
            if (data.autoSetActualTime !== undefined) this.general.generalSettings.autoSetActualTime = data.autoSetActualTime;
            if (data.markCompleteSubtasks !== undefined) this.general.generalSettings.markCompleteSubtasks = data.markCompleteSubtasks;
            if (data.calendarViewDays !== undefined) this.general.generalSettings.calendarViewDays = data.calendarViewDays;
            if (data.apiTokenEnabled !== undefined) this.powerFeatures.apiTokenEnabled = data.apiTokenEnabled;
        }
    }

    setActiveTab(tab: string) {
        // Cast string to specific type if valid, else default or keep as string (flexible)
        this.activeTab = tab as SettingsTab;
        // Reset account view when switching tabs, if desired, or keep state.
        // Usually good UX to reset sub-views when navigating top-level.
        if (tab !== 'account') {
            this.accountView = 'main';
        }
        if (tab !== 'account_data') {
            this.accountDataView = 'main';
        }
        if (tab !== 'team') {
            this.teamView = 'summary';
        }
    }

    setAccountDataView(view: 'main' | 'import' | 'export' | 'delete') {
        this.accountDataView = view;
    }

    setAccountView(view: AccountView) {
        this.accountView = view;
    }

    setTeamView(view: 'summary' | 'manage') {
        this.teamView = view;
    }

    setEmailToInvite(email: string) {
        this.emailToInvite = email;
    }

    async inviteUser(workspaceId?: string) {
        if (!this.emailToInvite) return;
        if (!workspaceId) {
            alert("No active workspace to invite to.");
            return;
        }

        try {
            await api.inviteUser(this.emailToInvite, workspaceId);
            alert(`Invited ${this.emailToInvite} successfully!`);
            this.emailToInvite = '';
        } catch (err) {
            console.error("Failed to invite user", err);
            alert("Failed to send invitation.");
        }
    }
}
