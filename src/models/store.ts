import { makeAutoObservable, reaction } from "mobx"; // Using mobx for transparent reactivity with OOP
import { Group, Task, IParticipant } from "./core";
import { v4 as uuidv4 } from 'uuid';

// Mock Data
const MOCK_USER: IParticipant = {
    id: 'u1',
    name: 'Adrian T.',
    initials: 'AT'
};

class ProjectStore {
    groups: Group[] = [];
    dumpAreaTasks: Task[] = [];
    currentUser: IParticipant = MOCK_USER;

    availableLabels: { id: string; name: string; color: string }[] = [
        { id: 'l1', name: 'Design', color: '#8B5CF6' },
        { id: 'l2', name: 'Important', color: '#EF4444' },
        { id: 'l3', name: 'Home', color: '#FF2D55' },
        { id: 'l4', name: 'Work', color: '#3B82F6' },
        { id: 'l5', name: 'Lam', color: '#FFD60A' },
    ];

    // UI State
    activeGroupId: string | null = null;
    isSidebarOpen: boolean = true;
    isRightSidebarOpen: boolean = true;
    viewMode: 'calendar' | 'tasks' = 'tasks';
    viewDate: Date = new Date();
    timeboxDate: Date = new Date();

    // Filter State
    filterLabelIds: string[] = [];
    showCompletedTasks: boolean = true;
    showTimeboxedTasks: boolean = true;

    // Analytics State
    isAnalyticsOpen: boolean = false;

    // Upgrade Modal State
    isUpgradeModalOpen: boolean = false;

    constructor() {
        makeAutoObservable(this);
        this.seedData();

        // Load persistence
        const savedViewMode = localStorage.getItem('viewMode') as 'calendar' | 'tasks';
        if (savedViewMode) this.viewMode = savedViewMode;

        const savedGroupId = localStorage.getItem('activeGroupId');
        if (savedGroupId) this.activeGroupId = savedGroupId;

        // Setup persistence reactions
        reaction(
            () => this.viewMode,
            (mode) => localStorage.setItem('viewMode', mode)
        );

        reaction(
            () => this.activeGroupId,
            (id) => {
                if (id) localStorage.setItem('activeGroupId', id);
                else localStorage.removeItem('activeGroupId');
            }
        );
    }

    setDate(date: Date) {
        this.viewDate = date;
    }

    setTimeboxDate(date: Date) {
        this.timeboxDate = date;
    }

    toggleRightSidebar() {
        this.isRightSidebarOpen = !this.isRightSidebarOpen;
    }

    get activeGroup() {
        return this.groups.find(g => g.id === this.activeGroupId);
    }

    createGroup(name: string) {
        const group = new Group(name);
        this.groups.push(group);
        return group;
    }

    deleteGroup(groupId: string) {
        const index = this.groups.findIndex(g => g.id === groupId);
        if (index > -1) {
            this.groups.splice(index, 1);
            if (this.activeGroupId === groupId) {
                this.activeGroupId = null;
            }
        }
    }

    updateGroup(groupId: string, name: string) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.name = name;
        }
    }

    setViewMode(mode: 'calendar' | 'tasks') {
        this.viewMode = mode;
    }

    toggleFilterLabel(labelId: string) {
        if (this.filterLabelIds.includes(labelId)) {
            this.filterLabelIds = this.filterLabelIds.filter(id => id !== labelId);
        } else {
            this.filterLabelIds.push(labelId);
        }
    }

    toggleShowCompleted(show: boolean) {
        this.showCompletedTasks = show;
    }

    toggleShowTimeboxed(show: boolean) {
        this.showTimeboxedTasks = show;
    }

    toggleAnalytics() {
        this.isAnalyticsOpen = !this.isAnalyticsOpen;
    }

    openUpgradeModal() {
        this.isUpgradeModalOpen = true;
    }

    closeUpgradeModal() {
        this.isUpgradeModalOpen = false;
    }

    getLabelColor(labelName: string): string {
        const label = this.availableLabels.find(l => l.name === labelName);
        return label ? label.color : '#60A5FA'; // Default blue if not found
    }

    addLabel(name: string, color: string) {
        const newLabel = {
            id: uuidv4(),
            name,
            color
        };
        this.availableLabels.push(newLabel);
    }

    updateLabel(id: string, name: string, color: string) {
        const label = this.availableLabels.find(l => l.id === id);
        if (label) {
            label.name = name;
            label.color = color;
        }
    }

    deleteLabel(id: string) {
        this.availableLabels = this.availableLabels.filter(l => l.id !== id);
        // Also remove from filter if present
        this.filterLabelIds = this.filterLabelIds.filter(fid => fid !== id);
    }

    addTaskToDump(title: string) {
        const task = new Task(title);
        this.dumpAreaTasks.push(task);
    }

    moveTaskToGroup(taskId: string, groupId: string) {
        // Logic to move task from dump to group or group to group
        const dumpTaskIndex = this.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpTaskIndex > -1) {
            const task = this.dumpAreaTasks[dumpTaskIndex];
            const group = this.groups.find(g => g.id === groupId);
            if (group) {
                group.addTask(task);
                this.dumpAreaTasks.splice(dumpTaskIndex, 1);
            }
        }
    }

    private seedData() {
        const marketingGroup = this.createGroup("Marketing Campaign");
        // this.activeGroupId = marketingGroup.id;

        // Create tasks with specific times for calendar view
        const today = new Date();

        const task1 = new Task("Design Social Media Assets");
        task1.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 30); // 4:30 PM today
        task1.duration = 90;
        task1.labels = ['Design'];
        marketingGroup.addTask(task1);

        const task2 = new Task("Content Strategy Meeting");
        task2.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0); // 7:00 PM today
        task2.duration = 60;
        marketingGroup.addTask(task2);

        const task3 = new Task("Pampam");
        task3.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 21, 30); // 9:30 PM in 2 days
        task3.duration = 75;
        task3.labels = ['Important'];
        marketingGroup.addTask(task3);

        const task4 = new Task("Review Analytics");
        task4.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 17, 0); // 5:00 PM tomorrow
        task4.duration = 45;
        marketingGroup.addTask(task4);

        const task5 = new Task("Team Standup");
        task5.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0); // 6:00 PM today
        task5.duration = 30;
        marketingGroup.addTask(task5);

        this.dumpAreaTasks.push(new Task("Buy coffee beans"));
        this.dumpAreaTasks.push(new Task("Call electrician"));
    }
}

export const store = new ProjectStore();
