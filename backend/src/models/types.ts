export interface InitialDataResponse {
    groups: any[];
    dumpTasks: any[];
    availableLabels: any[];
}

export interface GeneralSettings {
    moveTasksBottom: boolean;
    markCompleteSubtasks: boolean;
    autoSetActualTime: boolean;
    deepLinkDetection: boolean;
    startWeekOn: string;
    showWeekends: boolean;
    workdayThreshold: boolean;
    workloadThreshold: string;
    showDeclinedEvents: boolean;
    startDayAt: string;
    calendarIncrements: string;
    timeFormat: string;
    darkMode: string;
    autoStartNextTask: boolean;
    sidebarLayout: string;
    addNewTasksTo: string;
    detectLabel: boolean;
    defaultEstimatedTime: string;
    rolloverNextDay: boolean;
    rolloverRecurring: boolean;
    rolloverTo: string;
}

export interface Group {
    id: string;
    title: string;
    type: string;
    [key: string]: any;
}

export interface Task {
    id: string;
    title: string;
    [key: string]: any;
}

export interface Label {
    id: string;
    name: string;
    color: string;
    [key: string]: any;
}
