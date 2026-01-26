import { reaction, IReactionDisposer } from "mobx";
import { api } from "../../services/api";
import { AccountSettingsModel } from "../settings/AccountSettingsModel";

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

export class ProfileSyncStrategy {
    private disposer: IReactionDisposer | null = null;
    private pendingUpdate: DebouncedFunction | null = null;

    monitor(account: AccountSettingsModel) {
        if (this.disposer) return;

        this.disposer = reaction(
            () => ({
                name: account.displayName,
                avatarUrl: account.avatarUrl
            }),
            (data) => {
                this.scheduleUpdate(data);
            }
        );
    }

    stop() {
        if (this.disposer) {
            this.disposer();
            this.disposer = null;
        }
        if (this.pendingUpdate) {
            this.pendingUpdate.cancel();
            this.pendingUpdate = null;
        }
    }

    private scheduleUpdate(data: any) {
        if (!this.pendingUpdate) {
            this.pendingUpdate = debounce(async (data: any) => {
                console.log("[ProfileSyncStrategy] Syncing profile...", data);
                try {
                    await api.updateUser(data);
                } catch (err) {
                    console.error("[ProfileSyncStrategy] Failed to sync profile", err);
                } finally {
                    this.pendingUpdate = null;
                }
            }, 1000);
        }

        this.pendingUpdate(data);
    }
}

export const profileSyncStrategy = new ProfileSyncStrategy();
