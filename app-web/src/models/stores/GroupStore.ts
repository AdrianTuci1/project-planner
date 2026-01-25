import { makeAutoObservable } from "mobx";
import { GroupType } from "../core";
import { ProjectStore } from "../store";
import { api } from "../../services/api";
import { groupSyncStrategy } from "../strategies/GroupSyncStrategy";
import { Group } from "../core"; // Ensure Group imported

export class GroupStore {
    rootStore: ProjectStore;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    handleRealtimeUpdate(type: string, data: any) {
        const workspaceStore = this.rootStore.workspaceStore;

        const workspace = data.workspaceId ? workspaceStore.workspaces.find((w: any) => w.id === data.workspaceId) : workspaceStore.activeWorkspace;
        if (!workspace) return;

        switch (type) {
            case 'group.created':
                if (!workspace.groups.find((g: any) => g.id === data.id)) {
                    const newGroup = this.hydrateGroup(data);
                    workspace.addGroup(newGroup);
                }
                break;
            case 'group.updated':
                const group = workspace.groups.find((g: any) => g.id === data.id);
                if (group) {
                    group.name = data.name;
                    group.icon = data.icon;
                    group.defaultLabelId = data.defaultLabelId;
                    // ... other fields
                }
                break;
            case 'group.deleted':
                const idx = workspace.groups.findIndex((g: any) => g.id === data.id);
                if (idx > -1) {
                    workspace.groups.splice(idx, 1);
                }
                break;
        }
    }

    private hydrateGroup(g: any): Group {
        // Simple hydration, Tasks are usually separate or empty initially on group create event
        const group = new Group(g.name, g.icon, g.type || 'personal', g.workspaceId, g.defaultLabelId, g.autoAddLabelEnabled);
        group.id = g.id;
        group.workspaceId = g.workspaceId;
        // Start monitoring
        groupSyncStrategy.monitor(group);
        return group;
    }

    async createGroup(name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        // Groups created in a workspace should match that workspace.
        const group = this.rootStore.workspaceStore.activeWorkspace?.createGroup(name, icon, defaultLabelId, autoAddLabelEnabled);

        if (group) {
            // Start monitoring immediately so subsequent changes are caught
            groupSyncStrategy.monitor(group);

            // Persist to backend
            try {
                await api.createGroup(group);
            } catch (error) {
                console.error("Failed to create group on backend", error);
                // Optionally handle rollback or offline queue (api service handles queue if offline)
            }
        }

        return group;
    }

    deleteGroup(groupId: string) {
        const workspaces = this.rootStore.workspaceStore.workspaces;
        const workspace = workspaces.find(w => w.groups.some(g => g.id === groupId));
        if (workspace) {
            const index = workspace.groups.findIndex(g => g.id === groupId);
            if (index > -1) {
                workspace.groups.splice(index, 1);
            }
        }

        // Persist delete
        api.deleteGroup(groupId).catch(err => {
            console.error("[GroupStore] Failed to delete group", err);
        });
    }

    updateGroup(groupId: string, name: string, icon?: string, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        const workspaces = this.rootStore.workspaceStore.workspaces;
        for (const w of workspaces) {
            const group = w.groups.find(g => g.id === groupId);
            if (group) {
                group.name = name;
                if (icon) group.icon = icon;
                if (defaultLabelId !== undefined) group.defaultLabelId = defaultLabelId;
                if (autoAddLabelEnabled !== undefined) group.autoAddLabelEnabled = autoAddLabelEnabled;
                return;
            }
        }
    }
}
