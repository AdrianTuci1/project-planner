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
    getInitialData(startDate: Date, endDate: Date, workspaceId?: string): Promise<InitialDataResponse>;
    getGeneralSettings(): Promise<GeneralSettings>;
    updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void>;
    getCalendars(): Promise<CalendarData>;
    addCalendar(account: CalendarAccount): Promise<CalendarData>;
    updateCalendar(id: string, data: Partial<CalendarAccount>): Promise<CalendarData>;
    deleteCalendar(id: string): Promise<CalendarData>;

    // Invitations & Notifications
    inviteUser(email: string, workspaceId: string): Promise<void>;
    getNotifications(): Promise<any[]>;
    markNotificationRead(id: string): Promise<void>;
    respondToInvite(id: string, accept: boolean): Promise<void>;
}

export interface SubCalendar {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    canEdit: boolean;
}

export interface CalendarAccount {
    id: string;
    email: string;
    name: string;
    provider: 'google' | 'outlook' | 'apple' | 'other';
    color: string;
    isVisible: boolean;
    guestUpdateStrategy?: 'all' | 'none';
    subCalendars?: SubCalendar[];
}

export interface CalendarData {
    accounts: CalendarAccount[];
}
