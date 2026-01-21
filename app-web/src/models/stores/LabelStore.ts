import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from 'uuid';
import { ProjectStore } from "../store";
import { labelSyncStrategy } from "../strategies/LabelSyncStrategy";

export class LabelStore {
    rootStore: ProjectStore;
    availableLabels: { id: string; name: string; color: string }[] = [];

    constructor(rootStore: ProjectStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this);
    }

    setAvailableLabels(labels: { id: string; name: string; color: string }[]) {
        this.availableLabels = labels;
        // Monitor loaded labels
        labels.forEach(l => labelSyncStrategy.monitor(l));
    }

    getLabel(labelId: string) {
        return this.availableLabels.find(l => l.id === labelId);
    }

    getLabelColor(labelId: string): string {
        const label = this.getLabel(labelId);
        return label ? label.color : '#60A5FA';
    }

    addLabel(name: string, color: string) {
        const newLabel = {
            id: uuidv4(),
            name,
            color
        };
        this.availableLabels.push(newLabel);
        labelSyncStrategy.monitor(newLabel);
        return newLabel;
    }

    updateLabel(id: string, name: string, color: string) {
        const label = this.availableLabels.find(l => l.id === id);
        if (label) {
            label.name = name;
            label.color = color;
            // Strategy handles monitoring
        }
    }

    deleteLabel(id: string) {
        this.availableLabels = this.availableLabels.filter(l => l.id !== id);
        labelSyncStrategy.stopMonitoring(id);
    }
}
