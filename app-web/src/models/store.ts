import { makeAutoObservable, reaction } from "mobx";
import { Task, GroupType } from "./core";
import { TaskStore } from "./stores/TaskStore";
import { UIStore } from "./stores/UIStore";
import { RecurrenceStore } from "./stores/RecurrenceStore";
import { NotificationStore } from "./stores/NotificationStore";
import { AuthStore } from "./stores/AuthStore";
import { LabelStore } from "./stores/LabelStore";
import { WorkspaceStore } from "./stores/WorkspaceStore";
import { GroupStore } from "./stores/GroupStore";

export class ProjectStore {
    taskStore: TaskStore;
    uiStore: UIStore;
    recurrenceStore: RecurrenceStore;
    notificationStore: NotificationStore;
    authStore: AuthStore;
    labelStore: LabelStore;
    workspaceStore: WorkspaceStore;
    groupStore: GroupStore;

    constructor() {
        // Initialize sub-stores
        this.labelStore = new LabelStore(this);
        this.workspaceStore = new WorkspaceStore(this);
        this.groupStore = new GroupStore(this);
        this.taskStore = new TaskStore(this);
        this.uiStore = new UIStore(this);
        this.recurrenceStore = new RecurrenceStore(this);
        this.notificationStore = new NotificationStore(this);
        this.authStore = new AuthStore(this);

        makeAutoObservable(this);

        // Only initialize data when authenticated
        reaction(
            () => this.authStore.isAuthenticated,
            (isAuthenticated) => {
                if (isAuthenticated) {
                    console.log("[ProjectStore] Authenticated! Initializing data...");
                    this.initializeData();
                } else {
                    console.log("[ProjectStore] Not authenticated yet.");
                }
            }
        );
    }

    // --- Delegation to Sub-Stores ---

    // WorkspaceStore Delegations
    get workspaces() { return this.workspaceStore.workspaces; }
    get activeWorkspace() { return this.workspaceStore.activeWorkspace; }
    get isLoading() { return this.workspaceStore.isLoading; }
    get error() { return this.workspaceStore.error; }
    get lastFetchRange() { return this.workspaceStore.lastFetchRange; }

    setActiveWorkspace(id: string) {
        this.workspaceStore.setActiveWorkspace(id);
    }

    initializeData() {
        console.log("[ProjectStore] initializeData called");
        // Delegate initialization
        this.workspaceStore.initializeData().then(() => {
            this.checkAndGenerateRecurringTasks();
        });
    }

    // LabelStore Delegations
    get availableLabels() { return this.labelStore.availableLabels; }
    getLabel(labelId: string) { return this.labelStore.getLabel(labelId); }
    getLabelColor(labelId: string) { return this.labelStore.getLabelColor(labelId); }
    addLabel(name: string, color: string) { return this.labelStore.addLabel(name, color); }
    updateLabel(id: string, name: string, color: string) { this.labelStore.updateLabel(id, name, color); }
    deleteLabel(id: string) { this.labelStore.deleteLabel(id); }

    // GroupStore Delegations
    createGroup(name: string, icon?: string, type: GroupType = 'personal', defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        return this.groupStore.createGroup(name, icon, type, defaultLabelId, autoAddLabelEnabled);
    }
    deleteGroup(groupId: string) { this.groupStore.deleteGroup(groupId); }
    updateGroup(groupId: string, name: string, icon?: string, type?: GroupType, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        this.groupStore.updateGroup(groupId, name, icon, type, defaultLabelId, autoAddLabelEnabled);
    }

    // TaskStore Delegations (and accessors via activeWorkspace)
    get groups() { return this.workspaceStore.activeWorkspace?.groups || []; }
    get dumpAreaTasks() { return this.workspaceStore.activeWorkspace?.dumpAreaTasks || []; }
    get templates() { return this.taskStore.templates; }
    get currentUser() { return this.taskStore.currentUser; }
    get allTasks() { return this.taskStore.allTasks; }

    createTaskInGroup(title: string, group: any) { return this.taskStore.createTaskInGroup(title, group); }
    saveNewTask(task: Task) { return this.taskStore.saveNewTask(task); }
    addTaskToDump(title: string) { this.taskStore.addTaskToDump(title); }
    moveTaskToGroup(taskId: string, groupId: string) { this.taskStore.moveTaskToGroup(taskId, groupId); }
    deleteTask(taskId: string) { this.taskStore.deleteTask(taskId); }
    duplicateTask(task: Task) { return this.taskStore.duplicateTask(task); }
    getTaskById(taskId: string) { return this.taskStore.getTaskById(taskId); }

    // --- Delegation to UIStore ---
    get activeGroupId() { return this.uiStore.activeGroupId; }
    set activeGroupId(val) { this.uiStore.activeGroupId = val; }
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
