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

    // UI State
    activeGroupId: string | null = null;
    isSidebarOpen: boolean = true;
    isRightSidebarOpen: boolean = true;
    viewMode: 'calendar' | 'tasks' = 'tasks';
    viewDate: Date = new Date();
    timeboxDate: Date = new Date();

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
