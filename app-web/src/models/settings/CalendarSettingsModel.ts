import { makeAutoObservable } from "mobx";

export class CalendarSettingsModel {
    isConnected: boolean = false;
    connectedEmail: string = 'adrian.tucicovenco@gmail.com'; // Mock email
    createTasksFromEvents: boolean = false;
    addTasksToCalendar: boolean = false;
    showManageView: boolean = false;

    constructor() {
        makeAutoObservable(this);
    }

    connectGoogle() {
        this.isConnected = true;
    }

    disconnect() {
        this.isConnected = false;
        this.showManageView = false;
        // Reset settings if desired
        this.createTasksFromEvents = false;
        this.addTasksToCalendar = false;
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
