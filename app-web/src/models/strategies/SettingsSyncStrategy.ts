import { reaction, IReactionDisposer, toJS } from "mobx";
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

        const disposers: IReactionDisposer[] = [];

        const safeGet = (obj: any, path: string) => obj ? obj[path] : undefined;

        // Monitor General Settings
        disposers.push(reaction(
            () => ({
                ...settings.general.generalSettings, // Monitor all properties in generalSettings
                calendarViewDays: settings.general.generalSettings.calendarViewDays
            }),
            (data) => {
                this.scheduleUpdate('general', { generalSettings: toJS(settings.general.generalSettings) });
            }
        ));

        // Monitor Power Features
        // Monitor Power Features
        disposers.push(reaction(
            () => ({
                ...settings.general.featuresSettings
            }),
            (data) => {
                this.scheduleUpdate('power', { featuresSettings: toJS(settings.general.featuresSettings) });
            }
        ));

        // Monitor Due Dates Settings
        disposers.push(reaction(
            () => ({
                thresholdDays: settings.dueDates.thresholdDays
            }),
            (data) => {
                this.scheduleUpdate('dueDates', data);
            }
        ));

        this.disposers.set('general', disposers);
        this.isMonitoring.add('general');
    }

    stopMonitoring(key: string = 'general') {
        const disposers = this.disposers.get(key);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(key);
        }

        const keysToClear = [key, 'power', 'dueDates'];
        keysToClear.forEach(k => {
            const pending = this.pendingUpdates.get(k);
            if (pending) {
                pending.cancel();
                this.pendingUpdates.delete(k);
            }
        });

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
