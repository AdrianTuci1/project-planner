import { makeAutoObservable, runInAction } from "mobx";
import { Task, GroupType } from "./core";
import { TaskStore } from "./stores/TaskStore";
import { UIStore } from "./stores/UIStore";
import { RecurrenceStore } from "./stores/RecurrenceStore";
import { NotificationStore } from "./stores/NotificationStore";
import { AuthStore } from "./stores/AuthStore";

export class ProjectStore {
    taskStore: TaskStore;
    uiStore: UIStore;
    recurrenceStore: RecurrenceStore;
    notificationStore: NotificationStore;
    authStore: AuthStore;

    constructor() {
        // Initialize sub-stores
        this.taskStore = new TaskStore(this);
        this.uiStore = new UIStore(this);
        this.recurrenceStore = new RecurrenceStore(this);
        this.notificationStore = new NotificationStore(this);
        this.authStore = new AuthStore(this);

        makeAutoObservable(this);

        this.initializeData();
    }

    // --- Delegation to TaskStore ---
    get workspaces() { return this.taskStore.workspaces; }
    get activeWorkspace() { return this.taskStore.activeWorkspace; }
    get groups() { return this.taskStore.groups; } // Now delegates to activeWorkspace via TaskStore getter
    get dumpAreaTasks() { return this.taskStore.dumpAreaTasks; }
    get templates() { return this.taskStore.templates; }
    get currentUser() { return this.taskStore.currentUser; }
    get isLoading() { return this.taskStore.isLoading; }
    get error() { return this.taskStore.error; }
    get lastFetchRange() { return this.taskStore.lastFetchRange; }
    get availableLabels() { return this.taskStore.availableLabels; }
    get allTasks() { return this.taskStore.allTasks; }

    initializeData() {
        // Delegate initialization
        this.taskStore.initializeData().then(() => {
            this.checkAndGenerateRecurringTasks();
        });
    }

    createGroup(name: string, icon?: string, type: GroupType = 'personal', defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        return this.taskStore.createGroup(name, icon, type, defaultLabelId, autoAddLabelEnabled);
    }
    deleteGroup(groupId: string) { this.taskStore.deleteGroup(groupId); }
    updateGroup(groupId: string, name: string, icon?: string, type?: GroupType, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        this.taskStore.updateGroup(groupId, name, icon, type, defaultLabelId, autoAddLabelEnabled);
    }
    getLabel(labelId: string) { return this.taskStore.getLabel(labelId); }
    getLabelColor(labelId: string) { return this.taskStore.getLabelColor(labelId); }
    addLabel(name: string, color: string) { return this.taskStore.addLabel(name, color); }
    updateLabel(id: string, name: string, color: string) { this.taskStore.updateLabel(id, name, color); }
    deleteLabel(id: string) { this.taskStore.deleteLabel(id); }
    addTaskToDump(title: string) { this.taskStore.addTaskToDump(title); }
    moveTaskToGroup(taskId: string, groupId: string) { this.taskStore.moveTaskToGroup(taskId, groupId); }
    deleteTask(taskId: string) { this.taskStore.deleteTask(taskId); }
    duplicateTask(task: Task) { return this.taskStore.duplicateTask(task); }
    getTaskById(taskId: string) { return this.taskStore.getTaskById(taskId); }

    // --- Delegation to UIStore ---
    get activeGroupId() { return this.uiStore.activeGroupId; }
    set activeGroupId(val) { this.uiStore.activeGroupId = val; } // Setters needed for writable properties
    get isSidebarOpen() { return this.uiStore.isSidebarOpen; }
    set isSidebarOpen(val) { this.uiStore.isSidebarOpen = val; }
    get isRightSidebarOpen() { return this.uiStore.isRightSidebarOpen; }
    set isRightSidebarOpen(val) { this.uiStore.isRightSidebarOpen = val; }
    get isFocusMode() { return this.uiStore.isFocusMode; }
    set isFocusMode(val) { this.uiStore.isFocusMode = val; }
    get viewMode() { return this.uiStore.viewMode; }
    set viewMode(val) { this.uiStore.viewMode = val; }
    get calendarViewType() { return this.uiStore.calendarViewType; }
    set calendarViewType(val) { this.uiStore.calendarViewType = val; }
    get viewDate() { return this.uiStore.viewDate; }
    set viewDate(val) { this.uiStore.viewDate = val; }
    get timeboxDate() { return this.uiStore.timeboxDate; }
    set timeboxDate(val) { this.uiStore.timeboxDate = val; }

    // Filter State
    get filterLabelIds() { return this.uiStore.filterLabelIds; }
    set filterLabelIds(val) { this.uiStore.filterLabelIds = val; }
    get showCompletedTasks() { return this.uiStore.showCompletedTasks; }
    set showCompletedTasks(val) { this.uiStore.showCompletedTasks = val; }
    get showTimeboxedTasks() { return this.uiStore.showTimeboxedTasks; }
    set showTimeboxedTasks(val) { this.uiStore.showTimeboxedTasks = val; }
    get daysToShow() { return this.uiStore.daysToShow; }
    set daysToShow(val) { this.uiStore.daysToShow = val; }
    get showDeclinedEvents() { return this.uiStore.showDeclinedEvents; }
    set showDeclinedEvents(val) { this.uiStore.showDeclinedEvents = val; }

    // Analytics
    get isAnalyticsOpen() { return this.uiStore.isAnalyticsOpen; }
    set isAnalyticsOpen(val) { this.uiStore.isAnalyticsOpen = val; }

    // Modals
    get isUpgradeModalOpen() { return this.uiStore.isUpgradeModalOpen; }
    set isUpgradeModalOpen(val) { this.uiStore.isUpgradeModalOpen = val; }
    get isDailyShutdownOpen() { return this.uiStore.isDailyShutdownOpen; }
    set isDailyShutdownOpen(val) { this.uiStore.isDailyShutdownOpen = val; }
    get isSettingsOpen() { return this.uiStore.isSettingsOpen; }
    set isSettingsOpen(val) { this.uiStore.isSettingsOpen = val; }

    get settings() { return this.uiStore.settings; }
    get isTemplateCreationMode() { return this.uiStore.isTemplateCreationMode; }
    get activeTask() { return this.uiStore.activeTask; }
    get activeGroup() { return this.uiStore.activeGroup; }
    get filteredTasks() { return this.uiStore.filteredTasks; }

    // Timer state delegation
    get activeTimerTaskId() { return this.uiStore.activeTimerTaskId; }
    get timerStatus() { return this.uiStore.timerStatus; }
    get timerStartTime() { return this.uiStore.timerStartTime; }
    get timerAccumulatedTime() { return this.uiStore.timerAccumulatedTime; }

    // Drag & Drop State
    draggingTaskId: string | null = null;
    dragOverLocation: { date: Date, hour: number, minute: number } | null = null;

    setDraggingTaskId(id: string | null) { this.draggingTaskId = id; }
    setDragOverLocation(loc: { date: Date, hour: number, minute: number } | null) { this.dragOverLocation = loc; }

    setActiveWorkspace(id: string) {
        runInAction(() => {
            this.taskStore.activeWorkspaceId = id;
            // Maybe reset activeGroupId when switching workspace?
            if (this.taskStore.groups.length > 0) {
                this.activeGroupId = this.taskStore.groups[0].id;
            } else {
                this.activeGroupId = null;
            }
        });
    }

    applyGlobalFilters(tasks: Task[]) { return this.uiStore.applyGlobalFilters(tasks); }
    setDate(date: Date) { this.uiStore.setDate(date); }
    setTimeboxDate(date: Date) { this.uiStore.setTimeboxDate(date); }
    toggleRightSidebar() { this.uiStore.toggleRightSidebar(); }
    toggleFocusMode() { this.uiStore.toggleFocusMode(); }
    setViewMode(mode: 'calendar' | 'tasks') { this.uiStore.setViewMode(mode); }
    setCalendarViewType(type: 'day' | 'week' | 'month') { this.uiStore.setCalendarViewType(type); }
    toggleFilterLabel(labelId: string) { this.uiStore.toggleFilterLabel(labelId); }
    toggleShowCompleted(show: boolean) { this.uiStore.toggleShowCompleted(show); }
    toggleShowTimeboxed(show: boolean) { this.uiStore.toggleShowTimeboxed(show); }
    toggleShowDeclinedEvents() { this.uiStore.toggleShowDeclinedEvents(); }
    setDaysToShow(days: number) { this.uiStore.setDaysToShow(days); }
    toggleAnalytics() { this.uiStore.toggleAnalytics(); }
    openUpgradeModal() { this.uiStore.openUpgradeModal(); }
    closeUpgradeModal() { this.uiStore.closeUpgradeModal(); }
    toggleDailyShutdown() { this.uiStore.toggleDailyShutdown(); }
    openSettings(tab?: string) { this.uiStore.openSettings(tab); }
    closeSettings() { this.uiStore.closeSettings(); }
    openTaskModal(task: Task, isCreationMode: boolean = false) { this.uiStore.openTaskModal(task, isCreationMode); }
    closeTaskModal() { this.uiStore.closeTaskModal(); }
    startTimer(taskId: string) { this.uiStore.startTimer(taskId); }
    pauseTimer() { this.uiStore.pauseTimer(); }
    resumeTimer() { this.uiStore.resumeTimer(); }
    stopTimer() { this.uiStore.stopTimer(); }
    cancelTimer() { this.uiStore.cancelTimer(); }

    // --- Delegation to RecurrenceStore ---
    checkAndGenerateRecurringTasks() { this.recurrenceStore.checkAndGenerateRecurringTasks(); }
    deleteRecurringSeries(task: Task) { this.recurrenceStore.deleteRecurringSeries(task); }
    updateRecurringSeries(task: Task) { this.recurrenceStore.updateRecurringSeries(task); }
    stopRecurrence(task: Task) { this.recurrenceStore.stopRecurrence(task); }
}

export const store = new ProjectStore();
