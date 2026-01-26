import { reaction, observe, IReactionDisposer } from "mobx";
import { api } from "../../services/api";
import { LabelStore } from "../stores/LabelStore";

type DebouncedFunction = ((...args: any[]) => void) & { cancel: () => void };

function debounce(func: (...args: any[]) => void, wait: number): DebouncedFunction {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = function (...args: any[]) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
        }, wait);
    };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
        }
    };

    return debounced as DebouncedFunction;
}

export class LabelSyncStrategy {
    private disposers = new Map<string, IReactionDisposer[]>();
    private pendingUpdates = new Map<string, DebouncedFunction>();
    private isMonitoring = new Set<string>();

    // We keep a reference to current list observer to dispose if array changes
    private arrayObserverDisposer: (() => void) | null = null;

    monitorStore(store: LabelStore) {
        // Watch for array reference changes (e.g. initial load or full reload)
        reaction(
            () => store.availableLabels,
            (newLabels) => {
                // Determine if this is initial load?
                // Actually, if we just assigned new array, we should assume these are 'synced' with backend (loaded from there).
                // So we just want to monitor them for UPDATES.

                // Clear old item monitors
                this.stopAllMonitoring();

                // Dispose old array observer if any
                if (this.arrayObserverDisposer) {
                    this.arrayObserverDisposer();
                    this.arrayObserverDisposer = null;
                }

                // Monitor existing items for updates
                newLabels.forEach(l => this.monitor(l));

                // Listen for additions/removals
                this.arrayObserverDisposer = observe(newLabels, (change) => this.handleArrayChange(change));
            },
            { fireImmediately: true }
        );
    }

    private handleArrayChange(change: any) {
        if (change.type === 'splice') {
            // Arrays items added
            if (change.added && change.added.length > 0) {
                change.added.forEach((item: any) => {
                    this.monitor(item);
                    // Sync CREATE to backend
                    api.createLabel(item).catch(err => {
                        console.error("Failed to create label", err);
                    });
                });
            }

            // Array items removed
            if (change.removed && change.removed.length > 0) {
                change.removed.forEach((item: any) => {
                    this.stopMonitoring(item.id);
                    // Sync DELETE to backend
                    api.deleteLabel(item.id).catch(err => {
                        console.error("Failed to delete label", err);
                    });
                });
            }
        }
    }

    private stopAllMonitoring() {
        this.isMonitoring.forEach(id => this.stopMonitoring(id));
        this.isMonitoring.clear();
        this.disposers.clear();
        this.pendingUpdates.clear();
    }

    monitor(label: { id: string, name: string, color: string, workspaceId?: string }) {
        if (this.isMonitoring.has(label.id)) return;
        this.isMonitoring.add(label.id);

        const disposers: IReactionDisposer[] = [];

        disposers.push(reaction(
            () => ({
                name: label.name,
                color: label.color
            }),
            (data) => {
                this.scheduleUpdate(label.id, data);
            }
        ));

        this.disposers.set(label.id, disposers);
    }

    stopMonitoring(labelId: string) {
        const disposers = this.disposers.get(labelId);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(labelId);
        }

        const pending = this.pendingUpdates.get(labelId);
        if (pending) {
            pending.cancel();
            this.pendingUpdates.delete(labelId);
        }

        this.isMonitoring.delete(labelId);
    }

    private isReceivingRemoteUpdate = false;

    runWithoutSync(action: () => void) {
        this.isReceivingRemoteUpdate = true;
        try {
            action();
        } finally {
            this.isReceivingRemoteUpdate = false;
        }
    }

    private scheduleUpdate(labelId: string, data: any, delay: number = 1000) {
        if (this.isReceivingRemoteUpdate) return;

        let debounced = this.pendingUpdates.get(labelId);

        if (!debounced) {
            debounced = debounce(async () => {
                console.log(`[LabelSyncStrategy] Syncing label ${labelId}...`);
                try {
                    await api.updateLabel(labelId, data);
                } catch (err) {
                    console.error(`[LabelSyncStrategy] Failed to sync label ${labelId}`, err);
                } finally {
                    this.pendingUpdates.delete(labelId);
                }
            }, delay);
            this.pendingUpdates.set(labelId, debounced);
        }

        debounced();
    }
}

export const labelSyncStrategy = new LabelSyncStrategy();
