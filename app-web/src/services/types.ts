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
    syncSubCalendars(id: string): Promise<CalendarData>;
    deleteCalendar(id: string): Promise<CalendarData>;

    // Tasks (Offline + Sync)
    createTask(task: any): Promise<any>;
    updateTask(id: string, task: any): Promise<any>;
    deleteTask(id: string): Promise<any>;

    // Groups
    createGroup(group: any): Promise<any>;
    updateGroup(id: string, group: any): Promise<any>;
    deleteGroup(id: string): Promise<any>;

    // Workspaces
    createWorkspace(name: string, type: string, ownerId: string): Promise<any>;
    getWorkspaces(): Promise<any[]>;

    // Labels
    getLabels(workspaceId?: string): Promise<any[]>;
    createLabel(label: any): Promise<any>;
    updateLabel(id: string, label: any): Promise<any>;
    deleteLabel(id: string): Promise<any>;

    // Invitations & Notifications
    inviteUser(email: string, workspaceId: string): Promise<void>;
    getNotifications(): Promise<any[]>;
    markNotificationRead(id: string): Promise<void>;
    respondToInvite(id: string, accept: boolean): Promise<void>;

    // Auth
    getGoogleAuthUrl(): Promise<{ url: string }>;
    exchangeGoogleCode(code: string): Promise<CalendarAccount>;

    // Storage
    getUploadUrl(contentType: string, fileName: string): Promise<{ url: string, key: string, publicUrl: string }>;
    deleteFile(key: string): Promise<void>;
    // Subscription
    createCheckoutSession(priceId: string): Promise<{ url: string }>;
    createCustomerPortalSession(): Promise<{ url: string }>;
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
