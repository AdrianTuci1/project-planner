export interface InitialDataResponse {
    groups: any[];
    dumpTasks: any[];
    templates: any[];
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

export interface IApiService {
    getInitialData(startDate: Date, endDate: Date): Promise<InitialDataResponse>;
    getGeneralSettings(): Promise<GeneralSettings>;
    updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void>;
}
