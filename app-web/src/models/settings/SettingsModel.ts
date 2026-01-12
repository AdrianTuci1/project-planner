import { makeAutoObservable } from "mobx";

export type SettingsTab = 'account' | 'team' | 'general' | 'labels' | 'power' | 'calendar';
export type AccountView = 'main' | 'email' | 'password';
import { GeneralSettingsModel } from "./GeneralSettingsModel";
import { AccountSettingsModel } from "./AccountSettingsModel";
import { CalendarSettingsModel } from "./CalendarSettingsModel";

export class SettingsModel {
    activeTab: SettingsTab = 'account';
    accountView: AccountView = 'main';
    emailToInvite: string = '';
    account = new AccountSettingsModel();
    calendar = new CalendarSettingsModel();
    general = new GeneralSettingsModel();

    // UI state for invite success message could also live here if needed, 
    // but often alerts are transient. We'll handle logic here.

    constructor() {
        makeAutoObservable(this);
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

    inviteUser() {
        if (this.emailToInvite) {
            alert(`Invited ${this.emailToInvite} to the team!`);
            this.emailToInvite = '';
        }
    }
}
