import { reaction, IReactionDisposer } from "mobx";
import { api } from "../../services/api";

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

    monitor(label: { id: string, name: string, color: string }) {
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

    private scheduleUpdate(labelId: string, data: any, delay: number = 1000) {
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
