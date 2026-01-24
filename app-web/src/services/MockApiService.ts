import { v4 as uuidv4 } from 'uuid';
import { IApiService, InitialDataResponse, GeneralSettings } from './types';

const MOCK_DELAY = 600; // ms

// Helper to create seed data
const createSeedData = () => {
    const groups: any[] = [];
    const dumpTasks: any[] = [];
    const templates: any[] = []; // Templates

    // Marketing Group
    const marketingGroup = {
        id: uuidv4(),
        name: "Marketing Campaign",
        tasks: [] as any[],
        participants: []
    };
    groups.push(marketingGroup);

    const today = new Date();

    const task1 = {
        id: uuidv4(),
        title: "Design Social Media Assets",
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0),
        scheduledTime: "16:30",
        duration: 90,
        labels: ['l1'], // Design
        status: 'todo',
        participants: [],
        subtasks: []
    };
    marketingGroup.tasks.push(task1);

    const task2 = {
        id: uuidv4(),
        title: "Content Strategy Meeting",
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0),
        scheduledTime: "19:00",
        duration: 60,
        labels: [],
        status: 'todo',
        participants: [],
        subtasks: []
    };
    marketingGroup.tasks.push(task2);

    const task3 = {
        id: uuidv4(),
        title: "Pampam",
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 0, 0),
        scheduledTime: "21:30",
        duration: 75,
        labels: ['l2'], // Important
        status: 'todo',
        participants: [],
        subtasks: []
    };
    marketingGroup.tasks.push(task3);

    const task4 = {
        id: uuidv4(),
        title: "Review Analytics",
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0),
        scheduledTime: "17:00",
        duration: 45,
        labels: [],
        status: 'todo',
        participants: [],
        subtasks: []
    };
    marketingGroup.tasks.push(task4);

    const task5 = {
        id: uuidv4(),
        title: "Team Standup",
        scheduledDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0),
        scheduledTime: "18:00",
        duration: 30,
        labels: [],
        status: 'todo',
        participants: [],
        subtasks: []
    };
    marketingGroup.tasks.push(task5);

    // Dump Tasks
    dumpTasks.push({
        id: uuidv4(),
        title: "Buy coffee beans",
        labels: [],
        status: 'todo',
        participants: [],
        subtasks: []
    });
    dumpTasks.push({
        id: uuidv4(),
        title: "Call electrician",
        labels: [],
        status: 'todo',
        participants: [],
        subtasks: []
    });

    // Templates
    templates.push({
        id: uuidv4(),
        title: "Weekly Review Template",
        labels: [],
        status: 'todo',
        participants: [],
        subtasks: [
            { id: uuidv4(), title: 'Review last week goals', isCompleted: false },
            { id: uuidv4(), title: 'Plan next week goals', isCompleted: false },
        ]
    });

    // Labels
    const availableLabels = [
        { id: 'l1', name: 'Design', color: '#8B5CF6' },
        { id: 'l2', name: 'Important', color: '#EF4444' },
        { id: 'l3', name: 'Home', color: '#FF2D55' },
        { id: 'l4', name: 'Work', color: '#3B82F6' },
        { id: 'l5', name: 'Lam', color: '#FFD60A' },
    ];

    return { groups, dumpTasks, templates, availableLabels };
};



export class MockApiService implements IApiService {
    private db: ReturnType<typeof createSeedData>;

    constructor() {
        this.db = createSeedData();
    }

    async getInitialData(startDate: Date, endDate: Date): Promise<InitialDataResponse> {
        return new Promise<InitialDataResponse>((resolve) => {
            setTimeout(() => {
                // Filter tasks in groups
                const groupsResponse = this.db.groups.map(g => ({
                    ...g,
                    tasks: g.tasks.filter((t: any) => {
                        if (!t.scheduledDate) return true;
                        const d = new Date(t.scheduledDate);
                        return d >= startDate && d <= endDate;
                    })
                }));

                // Filter dump tasks
                const dumpResponse = this.db.dumpTasks.filter((t: any) => {
                    if (!t.scheduledDate) return true;
                    const d = new Date(t.scheduledDate);
                    return d >= startDate && d <= endDate;
                });

                resolve({
                    groups: groupsResponse,
                    dumpTasks: dumpResponse,
                    templates: this.db.templates,
                    availableLabels: this.db.availableLabels
                });
            }, MOCK_DELAY);
        });
    }

    async getGeneralSettings(): Promise<GeneralSettings> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    generalSettings: {
                        moveTasksBottom: true,
                        markCompleteSubtasks: true,
                        autoSetActualTime: false,
                        deepLinkDetection: true,
                        startWeekOn: 'Sunday',
                        showWeekends: true,
                        workdayThreshold: true,
                        workloadThreshold: '8 hours',
                        showDeclinedEvents: true,
                        startDayAt: '12:00 AM',
                        calendarIncrements: '15 minute',
                        calendarViewDays: 7,
                        timeFormat: '12 hour',
                        darkMode: 'Dark mode',
                        autoStartNextTask: false,
                        sidebarLayout: 'Show one list',
                        addNewTasksTo: 'Top of list',
                        detectLabel: true,
                        defaultEstimatedTime: '0 mins',
                        rolloverNextDay: true,
                        rolloverRecurring: false,
                        rolloverTo: 'Bottom of list'
                    },
                    featuresSettings: {
                        dueDatesEnabled: true,
                        templatesEnabled: true,
                        taskPriorityEnabled: true,
                        attachmentsEnabled: true
                    },
                    displayName: 'Mock User',
                    avatarUrl: ''
                });
            }, MOCK_DELAY);
        });
    }

    async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Mock API: Updated general settings', settings);
                resolve();
            }, MOCK_DELAY);
        });
    }

    async getCalendars(): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ accounts: [] });
            }, MOCK_DELAY);
        });
    }

    async addCalendar(account: any): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Mock API: Added calendar', account);
                resolve({ accounts: [] });
            }, MOCK_DELAY);
        });
    }

    async updateCalendar(id: string, data: any): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Mock API: Updated calendar', id, data);
                resolve({ accounts: [] });
            }, MOCK_DELAY);
        });
    }

    async deleteCalendar(id: string): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Mock API: Deleted calendar', id);
                resolve({ accounts: [] });
            }, MOCK_DELAY);
        });
    }

    async inviteUser(email: string, workspaceId: string): Promise<void> { console.log("Mock Invite", email); }
    async getNotifications(): Promise<any[]> { return []; }
    async markNotificationRead(id: string): Promise<void> { }
    async respondToInvite(id: string, accept: boolean): Promise<void> { }
    async getGoogleAuthUrl(): Promise<{ url: string }> { return { url: '' }; }

    async getUploadUrl(contentType: string, fileName: string): Promise<{ url: string, key: string, publicUrl: string }> {
        // Return a fake object URL for testing local upload flow logic if possible,
        // but since we need a PUT url, we can't really mock the S3 PUT easily without a real server or nock.
        // For now, we return a dummy URL. The frontend might fail to PUT to it if it expects a real S3 signed URL.
        // We will just log it.
        console.log("Mock getUploadUrl", contentType, fileName);
        return { url: "", key: "", publicUrl: "" };
    }

    async uploadFile(file: File): Promise<string> {
        console.log("Mock uploadFile", file.name);
        return URL.createObjectURL(file); // Return local blob URL for immediate preview
    }

    async deleteFile(key: string): Promise<void> {
        console.log("Mock deleteFile", key);
    }
    getFileUrl(key: string): string {
        return `https://via.placeholder.com/150?text=${key}`;
    }

    // Calendar Extra
    async exchangeGoogleCode(code: string): Promise<any> { return { accounts: [] }; }
    async syncSubCalendars(id: string): Promise<any> { return { accounts: [] }; }
    async getEvents(start: string, end: string): Promise<any[]> { return []; }
    async updateEvent(accountId: string, calendarId: string, eventId: string, event: any): Promise<boolean> { return true; }
    async deleteEvent(accountId: string, calendarId: string, eventId: string): Promise<boolean> { return true; }


    // Subscription
    async createCheckoutSession(priceId: string): Promise<{ url: string }> { return { url: '' }; }
    async createCustomerPortalSession(): Promise<{ url: string }> { return { url: '' }; }

    async createTask(task: any): Promise<any> {
        console.log("Mock createTask", task);
        return task;
    }

    async updateTask(id: string, task: any): Promise<any> {
        console.log("Mock updateTask", id, task);
        return task;
    }

    async deleteTask(id: string): Promise<any> {
        console.log("Mock deleteTask", id);
        return { id };
    }

    async getLabels(workspaceId?: string): Promise<any[]> {
        return new Promise((resolve) => {
            setTimeout(() => {
                // In a real app we'd filter by workspaceId. 
                // For mock, we just return the global mock labels or filter if we had workspace info on them.
                resolve(this.db.availableLabels);
            }, MOCK_DELAY);
        });
    }

    async createGroup(group: any): Promise<any> { return group; }
    async updateGroup(id: string, group: any): Promise<any> { return group; }
    async deleteGroup(id: string): Promise<any> { return { id }; }

    async getWorkspaces(): Promise<any[]> {
        return [];
    }

    async createWorkspace(name: string, type: string, ownerId: string): Promise<any> { return { id: `team-${ownerId}`, name, type, ownerId }; }
    async updateWorkspace(id: string, data: any): Promise<any> { return { id, ...data }; }
    async deleteWorkspace(id: string): Promise<void> { console.log("Mock delete workspace", id); }

    async createLabel(label: any): Promise<any> { return label; }
    async updateLabel(id: string, label: any): Promise<any> { return label; }
    async deleteLabel(id: string): Promise<any> { return { id }; }
}
