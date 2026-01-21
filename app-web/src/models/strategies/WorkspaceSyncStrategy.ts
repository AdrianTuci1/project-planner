import { reaction, IReactionDisposer } from "mobx";
import { api } from "../../services/api";
import { Workspace } from "../core";
import { groupSyncStrategy } from "./GroupSyncStrategy";

// Currently API might not support updating workspace metadata like name directly exposed,
// but we will implement it assuming updateWorkspace or similar exists or will likely exist.
// If API fails, it will be logged.

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

export class WorkspaceSyncStrategy {
    private disposers = new Map<string, IReactionDisposer[]>();
    private pendingUpdates = new Map<string, DebouncedFunction>();
    private isMonitoring = new Set<string>();

    monitor(workspace: Workspace) {
        if (this.isMonitoring.has(workspace.id)) return;
        this.isMonitoring.add(workspace.id);

        const disposers: IReactionDisposer[] = [];

        disposers.push(reaction(
            () => ({
                name: workspace.name
                // type usually static
            }),
            (data) => {
                this.scheduleUpdate(workspace.id, workspace);
            }
        ));

        // Auto-monitor new groups
        disposers.push(reaction(
            () => workspace.groups.length,
            () => {
                // Monitor all groups (newly added ones included)
                workspace.groups.forEach(g => {
                    groupSyncStrategy.monitor(g);
                });
            }
        ));

        this.disposers.set(workspace.id, disposers);
    }

    stopMonitoring(workspaceId: string) {
        const disposers = this.disposers.get(workspaceId);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(workspaceId);
        }

        const pending = this.pendingUpdates.get(workspaceId);
        if (pending) {
            pending.cancel();
            this.pendingUpdates.delete(workspaceId);
        }

        this.isMonitoring.delete(workspaceId);
    }

    private scheduleUpdate(workspaceId: string, workspace: Workspace, delay: number = 1000) {
        let debounced = this.pendingUpdates.get(workspaceId);

        if (!debounced) {
            debounced = debounce(async () => {
                console.log(`[WorkspaceSyncStrategy] Syncing workspace ${workspaceId}...`);
                try {
                    // Assuming API implementation or skip if not implemented
                    // await api.updateWorkspace(workspaceId, workspace);
                    console.log("[WorkspaceSyncStrategy] Update via API not fully implemented yet in Module.");
                } catch (err) {
                    console.error(`[WorkspaceSyncStrategy] Failed to sync workspace ${workspaceId}`, err);
                } finally {
                    this.pendingUpdates.delete(workspaceId);
                }
            }, delay);
            this.pendingUpdates.set(workspaceId, debounced);
        }

        debounced();
    }
}

export const workspaceSyncStrategy = new WorkspaceSyncStrategy();
