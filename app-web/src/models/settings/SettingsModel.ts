import { makeAutoObservable } from "mobx";
import { api } from "../../services/api";
import { settingsSyncStrategy } from "../strategies/SettingsSyncStrategy";

export type SettingsTab = 'account' | 'team' | 'general' | 'labels' | 'power' | 'calendar' | 'due_dates' | 'subscription';
export type AccountView = 'main' | 'email' | 'password';
import { GeneralSettingsModel } from "./GeneralSettingsModel";
import { AccountSettingsModel } from "./AccountSettingsModel";
import { CalendarSettingsModel } from "./CalendarSettingsModel";
import { PowerFeaturesSettingsModel } from "./PowerFeaturesSettingsModel";
import { DueDatesSettingsModel } from "./DueDatesSettingsModel";

export class SettingsModel {
    activeTab: SettingsTab = 'account';
    accountView: AccountView = 'main';
    emailToInvite: string = '';
    account = new AccountSettingsModel();
    calendar = new CalendarSettingsModel();
    general = new GeneralSettingsModel();
    powerFeatures = new PowerFeaturesSettingsModel();
    dueDates = new DueDatesSettingsModel();

    // UI state for invite success message could also live here if needed, 
    // but often alerts are transient. We'll handle logic here.

    constructor() {
        makeAutoObservable(this);
        // Defer monitoring slightly or do it immediately
        settingsSyncStrategy.monitor(this);
    }

    setActiveTab(tab: string) {
        // Cast string to specific type if valid, else default or keep as string (flexible)
        this.activeTab = tab as SettingsTab;
        // Reset account view when switching tabs, if desired, or keep state.
        // Usually good UX to reset sub-views when navigating top-level.
        if (tab !== 'account') {
            this.accountView = 'main';
        }
    }

    setAccountView(view: AccountView) {
        this.accountView = view;
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
