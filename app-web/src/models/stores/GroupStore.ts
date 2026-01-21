import { makeAutoObservable } from "mobx";
import { GroupType } from "../core";
import { ProjectStore } from "../store";

export class GroupStore {
    rootStore: ProjectStore;

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    createGroup(name: string, icon?: string, type: GroupType = 'personal', defaultLabelId?: string, autoAddLabelEnabled: boolean = false) {
        // Groups created in a workspace should match that workspace.
        return this.rootStore.workspaceStore.activeWorkspace?.createGroup(name, icon, defaultLabelId, autoAddLabelEnabled);
    }

    deleteGroup(groupId: string) {
        // Search across all workspaces to be safe, or just active?
        // Old implementation searched all workspaces.
        const workspaces = this.rootStore.workspaceStore.workspaces;
        const workspace = workspaces.find(w => w.groups.some(g => g.id === groupId));
        if (workspace) {
            const index = workspace.groups.findIndex(g => g.id === groupId);
            if (index > -1) workspace.groups.splice(index, 1);
        }
    }

    updateGroup(groupId: string, name: string, icon?: string, type?: GroupType, defaultLabelId?: string, autoAddLabelEnabled?: boolean) {
        const workspaces = this.rootStore.workspaceStore.workspaces;
        for (const w of workspaces) {
            const group = w.groups.find(g => g.id === groupId);
            if (group) {
                group.name = name;
                if (icon) group.icon = icon;
                if (type) group.type = type;
                if (defaultLabelId !== undefined) group.defaultLabelId = defaultLabelId;
                if (autoAddLabelEnabled !== undefined) group.autoAddLabelEnabled = autoAddLabelEnabled;
                return;
            }
        }
    }
}
