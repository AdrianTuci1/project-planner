import { makeAutoObservable, reaction } from "mobx";
import { ProjectStore } from "../store";
import { SettingsModel } from "../settings/SettingsModel";
import { Task } from "../core";

export class UIStore {
    rootStore: ProjectStore;

    // UI State
    activeGroupId: string | null = 'default';
    isSidebarOpen: boolean = true;
    isRightSidebarOpen: boolean = true;
    isFocusMode: boolean = false;
    viewMode: 'calendar' | 'tasks' = 'tasks';
    calendarViewType: 'day' | 'week' | 'month' = 'week';


    viewDate: Date = new Date();
    timeboxDate: Date = new Date();

    // Filter State
    filterLabelIds: string[] = [];
    showCompletedTasks: boolean = true;
    showTimeboxedTasks: boolean = true;
    showDeclinedEvents: boolean = false;


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
    activeTask: Task | null = null;
    isTemplateCreationMode: boolean = false;
    isNewTaskInteraction: boolean = false;

    // Guest Update Modal State
    isGuestUpdateModalOpen: boolean = false;
    pendingCalendarUpdate: { taskId: string, newDate: Date, newTime: string } | null = null;

    openGuestUpdateModal(updateData: { taskId: string, newDate: Date, newTime: string }) {
        this.pendingCalendarUpdate = updateData;
        this.isGuestUpdateModalOpen = true;
    }

    closeGuestUpdateModal() {
        this.isGuestUpdateModalOpen = false;
        this.pendingCalendarUpdate = null;
    }


    // Timer State
    activeTimerTaskId: string | null = null;
    timerStatus: 'idle' | 'running' | 'paused' = 'idle';
    timerStartTime: number | null = null;
    timerAccumulatedTime: number = 0; // in seconds

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);

        this.loadPersistence();
        this.setupReactions();
    }

    loadPersistence() {
        const savedViewMode = localStorage.getItem('viewMode') as 'calendar' | 'tasks';
        if (savedViewMode) this.viewMode = savedViewMode;

        const savedGroupId = localStorage.getItem('activeGroupId');
        if (savedGroupId) {
            this.activeGroupId = savedGroupId === 'null' ? 'default' : savedGroupId;
        }

        const savedCalendarView = localStorage.getItem('calendarViewType') as 'day' | 'week' | 'month';
        if (savedCalendarView) this.calendarViewType = savedCalendarView;



        const savedShowDeclined = localStorage.getItem('showDeclinedEvents');
        if (savedShowDeclined) this.showDeclinedEvents = savedShowDeclined === 'true';
    }

    setupReactions() {
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

        reaction(
            () => this.calendarViewType,
            (type) => localStorage.setItem('calendarViewType', type)
        );



        reaction(
            () => this.showDeclinedEvents,
            (show) => localStorage.setItem('showDeclinedEvents', show.toString())
        );

        reaction(
            () => this.viewDate,
            (newDate) => {
                // Check if newDate is outside lastFetchRange
                if (this.rootStore.workspaceStore.lastFetchRange) {
                    // Implementation deferred
                }
            }
        );
    }

    get activeGroup() {
        return this.rootStore.groups.find(g => g.id === this.activeGroupId);
    }

    get filteredTasks() {
        return this.applyGlobalFilters(this.rootStore.taskStore.allTasks);
    }

    applyGlobalFilters(tasks: Task[]) {
        let filtered = tasks;

        // 1. Filter by Labels
        if (this.filterLabelIds.length > 0) {
            filtered = filtered.filter(t =>
                !!(t.labelId && this.filterLabelIds.includes(t.labelId))
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

    setDate(date: Date) {
        this.viewDate = date;
    }

    setTimeboxDate(date: Date) {
        this.timeboxDate = date;
    }

    toggleRightSidebar() {
        this.isRightSidebarOpen = !this.isRightSidebarOpen;
    }

    toggleFocusMode() {
        this.isFocusMode = !this.isFocusMode;
    }


    setViewMode(mode: 'calendar' | 'tasks') {
        this.viewMode = mode;
    }

    setCalendarViewType(type: 'day' | 'week' | 'month') {
        this.calendarViewType = type;
    }

    get daysToShow() {
        return this.settings.general.calendarViewDays;
    }

    set daysToShow(days: number) {
        this.settings.general.setSetting('calendarViewDays', days);
    }

    setDaysToShow(days: number) {
        this.daysToShow = days;
    }

    toggleShowDeclinedEvents() {
        this.showDeclinedEvents = !this.showDeclinedEvents;
    }

    toggleFilterLabel(labelId: string) {
        if (this.filterLabelIds.includes(labelId)) {
            this.filterLabelIds = this.filterLabelIds.filter(id => id !== labelId);
        } else {
            this.filterLabelIds = [...this.filterLabelIds, labelId];
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

    openTaskModal(task: Task, isCreationMode: boolean = false, isNewTask: boolean = false) {
        this.activeTask = task;
        this.isTemplateCreationMode = isCreationMode;
        this.isNewTaskInteraction = isNewTask;
    }

    closeTaskModal() {
        if (this.isNewTaskInteraction && this.activeTask && !this.activeTask.title.trim()) {
            console.log(`[UIStore] Cleaning up empty new task: ${this.activeTask.id}`);
            this.rootStore.taskStore.deleteTask(this.activeTask.id);
        }

        this.activeTask = null;
        this.isTemplateCreationMode = false;
        this.isNewTaskInteraction = false;
    }

    // Timer Actions
    startTimer(taskId: string) {
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

            // Find the task and update its actual duration via TaskStore
            let task = this.rootStore.taskStore.getTaskById(this.activeTimerTaskId);

            if (task) {
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
}
