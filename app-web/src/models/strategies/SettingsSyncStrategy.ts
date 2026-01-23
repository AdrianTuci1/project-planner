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

        const disposers: IReactionDisposer[] = [];

        const safeGet = (obj: any, path: string) => obj ? obj[path] : undefined;

        // Monitor General Settings
        disposers.push(reaction(
            () => ({
                moveTasksBottom: settings.general.moveTasksBottom,
                darkMode: settings.general.darkMode,
                sidebarLayout: settings.general.sidebarLayout,
                startWeekOn: settings.general.startWeekOn,
                showWeekends: settings.general.showWeekends,
                timeFormat: settings.general.timeFormat,
                markCompleteSubtasks: settings.general.markCompleteSubtasks,
                autoSetActualTime: settings.general.autoSetActualTime,
                deepLinkDetection: settings.general.deepLinkDetection,
                workdayThreshold: settings.general.workdayThreshold,
                workloadThreshold: settings.general.workloadThreshold,
                showDeclinedEvents: settings.general.showDeclinedEvents,
                startDayAt: settings.general.startDayAt,
                calendarIncrements: settings.general.calendarIncrements,
                autoStartNextTask: settings.general.autoStartNextTask,
                addNewTasksTo: settings.general.addNewTasksTo,
                detectLabel: settings.general.detectLabel,
                defaultEstimatedTime: settings.general.defaultEstimatedTime,
                rolloverNextDay: settings.general.rolloverNextDay,
                rolloverRecurring: settings.general.rolloverRecurring,
                rolloverTo: settings.general.rolloverTo,
                calendarViewDays: settings.general.calendarViewDays
            }),
            (data) => {
                this.scheduleUpdate('general', data);
            }
        ));

        // Monitor Power Features
        disposers.push(reaction(
            () => ({
                dueDatesEnabled: settings.powerFeatures.dueDatesEnabled,
                templatesEnabled: settings.powerFeatures.templatesEnabled,
                taskPriorityEnabled: settings.powerFeatures.taskPriorityEnabled,
                attachmentsEnabled: settings.powerFeatures.attachmentsEnabled
            }),
            (data) => {
                this.scheduleUpdate('power', data);
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

        // Monitor Account Settings (Display Name)
        disposers.push(reaction(
            () => ({
                displayName: settings.account.displayName
            }),
            (data) => {
                this.scheduleUpdate('account', data);
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

        const keysToClear = [key, 'power', 'dueDates', 'account'];
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
