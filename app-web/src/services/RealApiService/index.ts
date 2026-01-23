import { IApiService, CalendarData, CalendarAccount, GeneralSettings, InitialDataResponse } from '../types';
import { syncService } from '../SyncService';
import { TaskModule } from './TaskModule';
import { SettingsModule } from './SettingsModule';
import { CalendarModule } from './CalendarModule';
import { NotificationModule } from './NotificationModule';
import { StorageModule } from './StorageModule';
import { GroupModule } from './GroupModule';
import { WorkspaceModule } from './WorkspaceModule';
import { LabelModule } from './LabelModule';
import { SubscriptionModule } from './SubscriptionModule';

export class RealApiService implements IApiService {
    private taskModule: TaskModule;
    private groupModule: GroupModule;
    private workspaceModule: WorkspaceModule;
    private labelModule: LabelModule;
    private settingsModule: SettingsModule;
    private calendarModule: CalendarModule;
    private notificationModule: NotificationModule;
    private storageModule: StorageModule;
    private subscriptionModule: SubscriptionModule;

    constructor(baseUrl: string) {
        syncService.init();
        this.taskModule = new TaskModule(baseUrl);
        this.groupModule = new GroupModule(baseUrl);
        this.workspaceModule = new WorkspaceModule(baseUrl);
        this.labelModule = new LabelModule(baseUrl);
        this.settingsModule = new SettingsModule(baseUrl);
        this.calendarModule = new CalendarModule(baseUrl);
        this.notificationModule = new NotificationModule(baseUrl);
        this.storageModule = new StorageModule(baseUrl);
        this.subscriptionModule = new SubscriptionModule(baseUrl);
    }

    // Tasks delegates
    getInitialData(startDate: Date, endDate: Date, workspaceId?: string): Promise<InitialDataResponse> {
        return this.taskModule.getInitialData(startDate, endDate, workspaceId);
    }
    createTask(task: any): Promise<any> { return this.taskModule.createTask(task); }
    updateTask(id: string, task: any): Promise<any> { return this.taskModule.updateTask(id, task); }
    deleteTask(id: string): Promise<any> { return this.taskModule.deleteTask(id); }

    // Groups delegates
    createGroup(group: any): Promise<any> { return this.groupModule.createGroup(group); }
    updateGroup(id: string, group: any): Promise<any> { return this.groupModule.updateGroup(id, group); }
    deleteGroup(id: string): Promise<any> { return this.groupModule.deleteGroup(id); }

    // Workspaces delegates
    createWorkspace(name: string, type: string, ownerId: string): Promise<any> { return this.workspaceModule.createWorkspace(name, type, ownerId); }
    getWorkspaces(): Promise<any[]> { return this.workspaceModule.getWorkspaces(); }
    updateWorkspace(id: string, data: any): Promise<any> { return this.workspaceModule.updateWorkspace(id, data); }

    // Labels delegates
    getLabels(workspaceId?: string): Promise<any[]> { return this.labelModule.getLabels(workspaceId); }
    createLabel(label: any): Promise<any> { return this.labelModule.createLabel(label); }
    updateLabel(id: string, label: any): Promise<any> { return this.labelModule.updateLabel(id, label); }
    deleteLabel(id: string): Promise<any> { return this.labelModule.deleteLabel(id); }

    // Settings delegates
    getGeneralSettings(): Promise<GeneralSettings> { return this.settingsModule.getGeneralSettings(); }
    updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void> { return this.settingsModule.updateGeneralSettings(settings); }

    // Calendar delegates
    getCalendars(): Promise<CalendarData> { return this.calendarModule.getCalendars(); }
    addCalendar(account: CalendarAccount): Promise<CalendarData> { return this.calendarModule.addCalendar(account); }
    updateCalendar(id: string, data: Partial<CalendarAccount>): Promise<CalendarData> { return this.calendarModule.updateCalendar(id, data); }
    syncSubCalendars(id: string): Promise<CalendarData> { return this.calendarModule.syncSubCalendars(id); }
    deleteCalendar(id: string): Promise<CalendarData> { return this.calendarModule.deleteCalendar(id); }
    getGoogleAuthUrl(): Promise<{ url: string }> { return this.calendarModule.getGoogleAuthUrl(); }
    exchangeGoogleCode(code: string): Promise<CalendarAccount> { return this.calendarModule.exchangeGoogleCode(code); }

    // Notification delegates
    inviteUser(email: string, workspaceId: string): Promise<void> { return this.notificationModule.inviteUser(email, workspaceId); }
    getNotifications(): Promise<any[]> { return this.notificationModule.getNotifications(); }
    markNotificationRead(id: string): Promise<void> { return this.notificationModule.markNotificationRead(id); }
    respondToInvite(id: string, accept: boolean): Promise<void> { return this.notificationModule.respondToInvite(id, accept); }

    // Storage delegates
    getUploadUrl(contentType: string, fileName: string): Promise<{ url: string, key: string, publicUrl: string }> { return this.storageModule.getUploadUrl(contentType, fileName); }

    deleteFile(key: string): Promise<void> { return this.storageModule.deleteFile(key); }
    getFileUrl(key: string): string { return this.storageModule.getFileUrl(key); }

    // Subscription delegates
    createCheckoutSession(priceId: string): Promise<{ url: string }> { return this.subscriptionModule.createCheckoutSession(priceId); }
    createCustomerPortalSession(): Promise<{ url: string }> { return this.subscriptionModule.createCustomerPortalSession(); }
}
