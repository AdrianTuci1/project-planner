import { reaction, IReactionDisposer } from "mobx";
import { api } from "../../services/api";
import { Group } from "../core";

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

export class GroupSyncStrategy {
    private disposers = new Map<string, IReactionDisposer[]>();
    private pendingUpdates = new Map<string, DebouncedFunction>();
    private isMonitoring = new Set<string>();

    monitor(group: Group) {
        if (this.isMonitoring.has(group.id)) return;
        this.isMonitoring.add(group.id);

        const disposers: IReactionDisposer[] = [];

        disposers.push(reaction(
            () => ({
                name: group.name,
                icon: group.icon,
                defaultLabelId: group.defaultLabelId,
                autoAddLabelEnabled: group.autoAddLabelEnabled
            }),
            (data) => {
                this.scheduleUpdate(group.id, group);
            }
        ));

        this.disposers.set(group.id, disposers);
    }

    stopMonitoring(groupId: string) {
        const disposers = this.disposers.get(groupId);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(groupId);
        }

        const pending = this.pendingUpdates.get(groupId);
        if (pending) {
            pending.cancel();
            this.pendingUpdates.delete(groupId);
        }

        this.isMonitoring.delete(groupId);
    }

    private scheduleUpdate(groupId: string, group: Group, delay: number = 1000) {
        let debounced = this.pendingUpdates.get(groupId);

        if (!debounced) {
            debounced = debounce(async () => {
                console.log(`[GroupSyncStrategy] Syncing group ${groupId}...`);
                try {
                    await api.updateGroup(groupId, group);
                } catch (err) {
                    console.error(`[GroupSyncStrategy] Failed to sync group ${groupId}`, err);
                } finally {
                    this.pendingUpdates.delete(groupId);
                }
            }, delay);
            this.pendingUpdates.set(groupId, debounced);
        }

        debounced();
    }
}

export const groupSyncStrategy = new GroupSyncStrategy();
