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
}
