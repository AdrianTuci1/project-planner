import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from 'uuid';
import { ProjectStore } from "../store";
import { labelSyncStrategy } from "../strategies/LabelSyncStrategy";

export class LabelStore {
    rootStore: ProjectStore;
    availableLabels: { id: string; name: string; color: string; workspaceId?: string }[] = [];

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
        labelSyncStrategy.monitorStore(this);
    }

    handleRealtimeUpdate(type: string, data: any) {
        switch (type) {
            case 'label.created':
                if (!this.availableLabels.find(l => l.id === data.id)) {
                    this.availableLabels.push(data);
                }
                break;
            case 'label.updated':
                const label = this.availableLabels.find(l => l.id === data.id);
                if (label) {
                    label.name = data.name;
                    label.color = data.color;
                    label.workspaceId = data.workspaceId;
                }
                break;
            case 'label.deleted':
                const idx = this.availableLabels.findIndex(l => l.id === data.id);
                if (idx > -1) {
                    this.availableLabels.splice(idx, 1);
                    this.rootStore.taskStore.removeLabelFromTasks(data.id);
                }
                break;
        }
    }

    setAvailableLabels(labels: { id: string; name: string; color: string; workspaceId?: string }[]) {
        this.availableLabels = labels;
        // Strategy listens to observable array changes now
    }

    getLabel(labelId: string) {
        return this.availableLabels.find(l => l.id === labelId);
    }

    getLabelColor(labelId: string): string {
        const label = this.getLabel(labelId);
        return label ? label.color : '#60A5FA';
    }

    addLabel(name: string, color: string, workspaceId?: string) {
        const targetWorkspaceId = workspaceId || this.rootStore.workspaceStore.activeWorkspaceId;
        const newLabel = {
            id: uuidv4(),
            name,
            color,
            workspaceId: targetWorkspaceId || undefined
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
        const index = this.availableLabels.findIndex(l => l.id === id);
        if (index > -1) {
            this.availableLabels.splice(index, 1);
            // Cleanup from tasks
            this.rootStore.taskStore.removeLabelFromTasks(id);
        }
    }
}
