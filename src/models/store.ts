import { makeAutoObservable, reaction, runInAction } from "mobx"; // Using mobx for transparent reactivity with OOP
import { Group, Task, IParticipant } from "./core";
import { v4 as uuidv4 } from 'uuid';
import { api } from "../services/api";
import { addMonths, subMonths, startOfDay, endOfDay } from "date-fns";
import { SettingsModel } from "./settings/SettingsModel";

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

    // API State
    isLoading: boolean = false;
    error: string | null = null;
    lastFetchRange: { start: Date, end: Date } | null = null;

    availableLabels: { id: string; name: string; color: string }[] = [];

    // UI State
    activeGroupId: string | null = null;
    isSidebarOpen: boolean = true;
    isRightSidebarOpen: boolean = true;
    viewMode: 'calendar' | 'tasks' = 'tasks';
    calendarViewType: 'day' | 'week' | 'month' = 'week';
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

    // Settings Modal State
    isSettingsOpen: boolean = false;
    settings: SettingsModel = new SettingsModel();

    // Task Modal State
    activeTask: Task | null = null; // Replaces local state in GroupView

    // Timer State
    activeTimerTaskId: string | null = null;
    timerStatus: 'idle' | 'running' | 'paused' = 'idle';
    timerStartTime: number | null = null;
    timerAccumulatedTime: number = 0; // in seconds

    constructor() {
        makeAutoObservable(this);
        // this.seedData(); // Removed local seed data
        this.initializeData();

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

        // Calendar View Type Persistence
        const savedCalendarView = localStorage.getItem('calendarViewType') as 'day' | 'week' | 'month';
        if (savedCalendarView) this.calendarViewType = savedCalendarView;

        reaction(
            () => this.calendarViewType,
            (type) => localStorage.setItem('calendarViewType', type)
        );

        // React to viewDate changes to re-fetch if needed (Optimization for later: check if date is within loaded range)
        // For now, we fetch on init. We could add a reaction here if we wanted "infinite scroll" of time.
        reaction(
            () => this.viewDate,
            (newDate) => {
                // Check if newDate is outside lastFetchRange
                if (this.lastFetchRange) {
                    // Simple check: if view date is outside active range, refetch.
                    // Implementation deferred to keep it simple as requested (+/- 1 month from today on load)
                }
            }
        );
    }

    async initializeData() {
        this.isLoading = true;
        this.error = null;
        try {
            // Determine range: Today +/- 1 Month
            const today = new Date();
            const start = startOfDay(subMonths(today, 1));
            const end = endOfDay(addMonths(today, 1));

            this.lastFetchRange = { start, end };

            const data = await api.getInitialData(start, end);

            runInAction(() => {
                // Hydrate Groups
                this.groups = data.groups.map((g: any) => {
                    const group = new Group(g.name, g.icon, g.defaultLabelId, g.autoAddLabelEnabled);
                    group.id = g.id;
                    group.tasks = g.tasks.map((t: any) => this.hydrateTask(t));
                    return group;
                });

                // Hydrate Dump Tasks
                this.dumpAreaTasks = data.dumpTasks.map((t: any) => this.hydrateTask(t));

                // Hydrate Labels
                this.availableLabels = data.availableLabels;
            });
        } catch (err) {
            runInAction(() => {
                this.error = "Failed to load tasks";
                console.error(err);
            });
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    }

    private hydrateTask(data: any): Task {
        const task = new Task(data.title);
        task.id = data.id;
        task.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : undefined;
        task.scheduledTime = data.scheduledTime;
        task.duration = data.duration;
        task.labels = data.labels || [];
        task.status = data.status || 'todo';
        return task;
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

    createGroup(name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        const group = new Group(name, icon || '📝', defaultLabelId, autoAddLabelEnabled);
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

    updateGroup(groupId: string, name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        const group = this.groups.find(g => g.id === groupId);
        if (group) {
            group.name = name;
            if (icon) group.icon = icon;
            if (defaultLabelId !== undefined) group.defaultLabelId = defaultLabelId;
            if (autoAddLabelEnabled !== undefined) group.autoAddLabelEnabled = autoAddLabelEnabled;
        }
    }

    setViewMode(mode: 'calendar' | 'tasks') {
        this.viewMode = mode;
    }

    setCalendarViewType(type: 'day' | 'week' | 'month') {
        this.calendarViewType = type;
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

    openSettings(tab: string = 'account') {
        this.settings.setActiveTab(tab);
        this.isSettingsOpen = true;
    }

    closeSettings() {
        this.isSettingsOpen = false;
    }

    // setSettingsTab(tab: string) {
    //     this.settingsActiveTab = tab;
    // }

    openTaskModal(task: Task) {
        this.activeTask = task;
    }

    closeTaskModal() {
        this.activeTask = null;
    }

    getLabel(labelId: string) {
        return this.availableLabels.find(l => l.id === labelId);
    }

    getLabelColor(labelId: string): string {
        const label = this.getLabel(labelId);
        return label ? label.color : '#60A5FA'; // Default blue if not found
    }

    addLabel(name: string, color: string) {
        const newLabel = {
            id: uuidv4(),
            name,
            color
        };
        this.availableLabels.push(newLabel);
        return newLabel;
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
}

export const store = new ProjectStore();
