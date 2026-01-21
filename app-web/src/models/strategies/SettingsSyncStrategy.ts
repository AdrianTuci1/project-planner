import { reaction, IReactionDisposer } from "mobx";
import { api } from "../../services/api";
import { SettingsModel } from "../settings/SettingsModel";

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

export class SettingsSyncStrategy {
    private disposers = new Map<string, IReactionDisposer[]>();
    private pendingUpdates = new Map<string, DebouncedFunction>();
    private isMonitoring = new Set<string>();

    monitor(settings: SettingsModel) {
        if (this.isMonitoring.has('general')) return;
        this.isMonitoring.add('general');

        const disposers: IReactionDisposer[] = [];

        // Monitor General Settings
        disposers.push(reaction(
            () => ({
                // Monitor key fields
                moveTasksBottom: settings.general.moveTasksBottom,
                darkMode: settings.general.darkMode,
                sidebarLayout: settings.general.sidebarLayout,
                startWeekOn: settings.general.startWeekOn,
                showWeekends: settings.general.showWeekends,
                timeFormat: settings.general.timeFormat
            }),
            (data) => {
                this.scheduleUpdate('general', data);
            }
        ));

        // Add monitoring for other settings sub-models here...

        this.disposers.set('general', disposers);
    }

    stopMonitoring(key: string = 'general') {
        const disposers = this.disposers.get(key);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(key);
        }

        const pending = this.pendingUpdates.get(key);
        if (pending) {
            pending.cancel();
            this.pendingUpdates.delete(key);
        }

        this.isMonitoring.delete(key);
    }

    private scheduleUpdate(key: string, data: any, delay: number = 1000) {
        let debounced = this.pendingUpdates.get(key);

        if (!debounced) {
            debounced = debounce(async () => {
                console.log(`[SettingsSyncStrategy] Syncing ${key}...`);
                try {
                    await api.updateGeneralSettings(data);
                } catch (err) {
                    console.error(`[SettingsSyncStrategy] Failed to sync ${key}`, err);
                } finally {
                    this.pendingUpdates.delete(key);
                }
            }, delay);
            this.pendingUpdates.set(key, debounced);
        }

        debounced();
    }
}

export const settingsSyncStrategy = new SettingsSyncStrategy();
