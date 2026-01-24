import { makeAutoObservable } from "mobx";
import { sidebarUI } from "../SidebarUIModel";

export class PowerFeaturesSettingsModel {
    dueDatesEnabled: boolean = false;
    templatesEnabled: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    toggleDueDates() {
        this.dueDatesEnabled = !this.dueDatesEnabled;
        // If disabled, switch view back to main if currently on due
        if (!this.dueDatesEnabled && sidebarUI.sidebarView === 'due') {
            sidebarUI.setSidebarView('main');
        }
    }

    toggleTemplates() {
        this.templatesEnabled = !this.templatesEnabled;
        // If disabled, switch view back to main if currently on templates
        if (!this.templatesEnabled && sidebarUI.sidebarView === 'templates') {
            sidebarUI.setSidebarView('main');
        }
    }

    apiTokenEnabled: boolean = false;

    toggleApiToken() {
        this.apiTokenEnabled = !this.apiTokenEnabled;
    }

    taskPriorityEnabled: boolean = false;

    toggleTaskPriority() {
        this.taskPriorityEnabled = !this.taskPriorityEnabled;
    }

    attachmentsEnabled: boolean = false;

    toggleAttachments() {
        this.attachmentsEnabled = !this.attachmentsEnabled;
    }
}
