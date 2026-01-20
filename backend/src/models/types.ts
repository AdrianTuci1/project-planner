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





export interface Label {
    id: string;
    name: string;
    color: string;
    [key: string]: any;
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
    guestUpdateStrategy?: 'all' | 'none'; // 'all' = send update, 'none' = update but don't send
    subCalendars?: SubCalendar[];
    refreshToken?: string;
    tokenExpiry?: number;
}

export interface Workspace {
    id: string;
    name: string;
    type: 'personal' | 'team';
    ownerId: string;
    members: string[]; // User IDs
    createdAt: number;
}

export interface Subscription {
    userId: string;
    plan: 'free' | 'pro';
    frequency?: 'monthly' | 'yearly';
    status: 'active' | 'canceled' | 'expired';
    startDate: number;
    expirationDate: number;
    autoRenew: boolean;
}

export interface Group {
    id: string;
    title: string;
    type: string;
    workspaceId?: string; // Link to workspace
    [key: string]: any;
}

export interface Task {
    id: string;
    title: string;
    workspaceId?: string; // Link to workspace
    assigneeId?: string; // For team tasks
    [key: string]: any;
}

export interface CalendarData {
    accounts: CalendarAccount[];
}
