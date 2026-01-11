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

    // Daily Shutdown State
    isDailyShutdownOpen: boolean = false;

    // Timer State
    activeTimerTaskId: string | null = null;
    timerStatus: 'idle' | 'running' | 'paused' = 'idle';
    timerStartTime: number | null = null;
    timerAccumulatedTime: number = 0; // in seconds

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
        // Migration: Separate Time from Date
        const allTasks = this.allTasks;
        allTasks.forEach(task => {
            if (task.scheduledDate && !task.scheduledTime) {
                const h = task.scheduledDate.getHours();
                const m = task.scheduledDate.getMinutes();

                // If time is not 00:00, extract it
                if (h !== 0 || m !== 0) {
                    task.scheduledTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                    // Reset date to midnight
                    const d = new Date(task.scheduledDate);
                    d.setHours(0, 0, 0, 0);
                    task.scheduledDate = d;
                }
            }
        });
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

    get allTasks() {
        const groupTasks = this.groups.flatMap(g => g.tasks);
        return [...this.dumpAreaTasks, ...groupTasks];
    }

    get filteredTasks() {
        return this.applyGlobalFilters(this.allTasks);
    }

    applyGlobalFilters(tasks: Task[]) {
        let filtered = tasks;

        // 1. Filter by Labels
        if (this.filterLabelIds.length > 0) {
            filtered = filtered.filter(t =>
                t.labels.some(labelId => this.filterLabelIds.includes(labelId))
            );
        }

        // 2. Filter Completed
        if (!this.showCompletedTasks) {
            filtered = filtered.filter(t => t.status !== 'done');
        }

        // 3. Filter Timeboxed (Scheduled)
        if (!this.showTimeboxedTasks) {
            filtered = filtered.filter(t => !t.scheduledDate);
        }

        return filtered;
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

    toggleDailyShutdown() {
        this.isDailyShutdownOpen = !this.isDailyShutdownOpen;
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

    deleteTask(taskId: string) {
        // Try to remove from dump area first
        const dumpIndex = this.dumpAreaTasks.findIndex(t => t.id === taskId);
        if (dumpIndex > -1) {
            this.dumpAreaTasks.splice(dumpIndex, 1);
            return;
        }

        // Try to remove from groups
        for (const group of this.groups) {
            const taskIndex = group.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                group.removeTask(taskId);
                return;
            }
        }
    }

    duplicateTask(task: Task) {
        // Check dump area
        const dumpIndex = this.dumpAreaTasks.findIndex(t => t.id === task.id);
        if (dumpIndex > -1) {
            const clone = task.clone();
            this.dumpAreaTasks.splice(dumpIndex + 1, 0, clone);
            return clone;
        }

        // Check groups
        for (const group of this.groups) {
            const groupTask = group.tasks.find(t => t.id === task.id);
            if (groupTask) {
                return group.duplicateTask(task.id);
            }
        }
    }

    // Timer Actions
    startTimer(taskId: string) {
        // If another timer is running, stop it first (or pause it? For now, let's just switch)
        if (this.activeTimerTaskId && this.activeTimerTaskId !== taskId) {
            this.stopTimer();
        }

        this.activeTimerTaskId = taskId;
        this.timerStatus = 'running';
        this.timerStartTime = Date.now();
    }

    pauseTimer() {
        if (this.timerStatus === 'running' && this.timerStartTime) {
            const now = Date.now();
            const elapsed = Math.floor((now - this.timerStartTime) / 1000);
            this.timerAccumulatedTime += elapsed;
            this.timerStartTime = null;
            this.timerStatus = 'paused';
        }
    }

    resumeTimer() {
        if (this.timerStatus === 'paused') {
            this.timerStartTime = Date.now();
            this.timerStatus = 'running';
        }
    }

    stopTimer() {
        if (this.activeTimerTaskId) {
            if (this.timerStatus === 'running' && this.timerStartTime) {
                const now = Date.now();
                const elapsed = Math.floor((now - this.timerStartTime) / 1000);
                this.timerAccumulatedTime += elapsed;
            }

            // Find the task and update its actual duration
            // Search in active group, dump area, or all tasks
            let task = this.getTaskById(this.activeTimerTaskId);

            if (task) {
                // Update actual duration (convert seconds to minutes)
                const addedMinutes = Math.floor(this.timerAccumulatedTime / 60);
                // If accumulated time is less than a minute but > 0, maybe round up or ignore? 
                // Let's just add at least 1 minute if it was running for at least 30 seconds
                // Or just standard floor. Let's stick to minutes.

                // Better approach: Floating point or just minutes. 
                // Existing actualDuration is likely in minutes based on `formatTime` in TaskCardBase (minutes / 60).
                // Let's add the minutes.
                const totalMinutes = Math.round(this.timerAccumulatedTime / 60);
                if (totalMinutes > 0) {
                    task.actualDuration = (task.actualDuration || 0) + totalMinutes;
                }
            }

            this.resetTimer();
        }
    }

    cancelTimer() {
        this.resetTimer();
    }

    private resetTimer() {
        this.activeTimerTaskId = null;
        this.timerStatus = 'idle';
        this.timerStartTime = null;
        this.timerAccumulatedTime = 0;
    }

    getTaskById(taskId: string): Task | undefined {
        // Search all groups
        for (const group of this.groups) {
            const task = group.tasks.find(t => t.id === taskId);
            if (task) return task;
        }
        // Search dump area
        const dumpTask = this.dumpAreaTasks.find(t => t.id === taskId);
        return dumpTask;
    }

    private seedData() {
        const marketingGroup = this.createGroup("Marketing Campaign");
        // this.activeGroupId = marketingGroup.id;

        // Create tasks with specific times for calendar view
        const today = new Date();

        const task1 = new Task("Design Social Media Assets");
        task1.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0); // Date part
        task1.scheduledTime = "16:30";
        task1.duration = 90;
        task1.labels = ['l1']; // Design
        marketingGroup.addTask(task1);

        const task2 = new Task("Content Strategy Meeting");
        task2.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0);
        task2.scheduledTime = "19:00";
        task2.duration = 60;
        marketingGroup.addTask(task2);

        const task3 = new Task("Pampam");
        task3.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 0, 0);
        task3.scheduledTime = "21:30";
        task3.duration = 75;
        task3.labels = ['l2']; // Important
        marketingGroup.addTask(task3);

        const task4 = new Task("Review Analytics");
        task4.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0);
        task4.scheduledTime = "17:00";
        task4.duration = 45;
        marketingGroup.addTask(task4);

        const task5 = new Task("Team Standup");
        task5.scheduledDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0);
        task5.scheduledTime = "18:00";
        task5.duration = 30;
        marketingGroup.addTask(task5);

        this.dumpAreaTasks.push(new Task("Buy coffee beans"));
        this.dumpAreaTasks.push(new Task("Call electrician"));
    }
}

export const store = new ProjectStore();
