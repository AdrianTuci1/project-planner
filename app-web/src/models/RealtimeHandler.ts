import { ProjectStore } from "./store";
import { runInAction } from "mobx";
import { taskSyncStrategy } from "./strategies/TaskSyncStrategy";
import { groupSyncStrategy } from "./strategies/GroupSyncStrategy";
import { labelSyncStrategy } from "./strategies/LabelSyncStrategy";

export class RealtimeHandler {
    rootStore: ProjectStore;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
    }

    handleEvent(type: string, data: any) {
        console.log("[RealtimeHandler] Handling Event:", type, data);
        try {
            switch (type) {
                // Tasks
                case 'task.created':
                case 'task.updated':
                case 'task.deleted':
                    taskSyncStrategy.runWithoutSync(() => {
                        runInAction(() => {
                            this.rootStore.taskStore.handleRealtimeUpdate(type, data);
                        });
                    });
                    break;

                // Groups
                case 'group.created':
                case 'group.updated':
                case 'group.deleted':
                    groupSyncStrategy.runWithoutSync(() => {
                        runInAction(() => {
                            this.rootStore.groupStore.handleRealtimeUpdate(type, data);
                        });
                    });
                    break;

                // Workspaces
                case 'workspace.created':
                case 'workspace.updated':
                case 'workspace.deleted':
                case 'workspace.member_added':
                case 'workspace.member_removed':
                case 'workspace.owner_updated':
                    // WorkspaceSyncStrategy might need similar loop prevention if it has reactions
                    // For now assuming safe or less frequent
                    this.rootStore.workspaceStore.handleRealtimeUpdate(type, data);
                    break;

                // Labels
                case 'label.created':
                case 'label.updated':
                case 'label.deleted':
                    labelSyncStrategy.runWithoutSync(() => {
                        runInAction(() => {
                            this.rootStore.labelStore.handleRealtimeUpdate(type, data);
                        });
                    });
                    break;

                // Notifications
                case 'notification.created':
                case 'notification.updated':
                    this.rootStore.notificationStore.handleRealtimeUpdate(type, data);
                    break;

                // Settings
                case 'settings.updated':
                    if (this.rootStore.uiStore.settings) {
                        // Settings usually don't have immediate reaction sync loops like tasks, 
                        // but if they did, we'd need a strategy wrapper too.
                        this.rootStore.uiStore.settings.updateFromRealtime(data);
                    }
                    break;

                default:
                    console.warn("[RealtimeHandler] Unhandled event:", type);
            }
        } catch (err) {
            console.error("[RealtimeHandler] Error handling event:", type, err);
        }
    }
}
