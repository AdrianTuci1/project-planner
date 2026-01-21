import { reaction, IReactionDisposer } from "mobx";
import { api } from "../../services/api";
import { CalendarAccount } from "../../services/types";

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

export class CalendarSyncStrategy {
    private disposers = new Map<string, IReactionDisposer[]>();
    private pendingUpdates = new Map<string, DebouncedFunction>();
    private isMonitoring = new Set<string>();

    monitor(account: CalendarAccount) {
        // If we represent the same ID but a different object instance, we should restart monitoring
        // For now, let's just assume the caller handles stopMonitoring() if necessary, 
        // but we make sure we don't double-monitor.
        if (this.isMonitoring.has(account.id)) {
            // Check if we want to warn or just return. 
            // If the caller properly called stopMonitoring, this set check would be false.
            // If it's true, it means we are already monitoring.
            return;
        }
        this.isMonitoring.add(account.id);

        const disposers: IReactionDisposer[] = [];

        // 1. Monitor Account Properties (Guest Update Strategy, Visibility)
        disposers.push(reaction(
            () => ({
                guestUpdateStrategy: account.guestUpdateStrategy,
                isVisible: account.isVisible
            }),
            (data) => {
                this.scheduleUpdate(account.id, {
                    guestUpdateStrategy: data.guestUpdateStrategy,
                    isVisible: data.isVisible
                });
            }
        ));

        // 2. Monitor Sub-Calendars (Visibility Changes)
        // We need a deep reaction or specific mapper for the array
        disposers.push(reaction(
            () => account.subCalendars?.map(sub => ({ id: sub.id, isVisible: sub.isVisible })),
            (subs) => {
                // Determine which sub-calendar changed or just sync the whole list structure (lighter metadata)
                // Since our API expects partial updates, we can send the whole subCalendars array
                // But we need the full objects, so we grab them from the account reference in the schedule
                this.scheduleUpdate(account.id, {
                    subCalendars: account.subCalendars // Pass the current state of subcalendars
                });
            }
        ));

        this.disposers.set(account.id, disposers);
    }

    stopMonitoring(accountId: string) {
        const disposers = this.disposers.get(accountId);
        if (disposers) {
            disposers.forEach(d => d());
            this.disposers.delete(accountId);
        }

        const pending = this.pendingUpdates.get(accountId);
        if (pending) {
            pending.cancel();
            this.pendingUpdates.delete(accountId);
        }

        this.isMonitoring.delete(accountId);
    }

    private scheduleUpdate(accountId: string, data: Partial<CalendarAccount>, delay: number = 500) {
        let debounced = this.pendingUpdates.get(accountId);

        // If we already have a pending update, we might want to merge data? 
        // For simplicity, we create a new closure capturing the latest "data" passed to scheduleUpdate is risky if partials distinct.
        // Better approach: The debounce function calls the API with the *current* state from the store, ensuring eventual consistency.
        // But here we are passing `data`.
        // Let's rely on the fact that we trigger `api.updateCalendar` with the payload. 
        // To be safe with multiple rapid changes affecting different fields, we should merge.

        // Actually, simplest strategy: Just trigger "sync" which reads fresh from store? 
        // No, `updateCalendar` takes data. 
        // Let's make the debounce key specific to the account, and when it fires, we assume the latest call's data is what matters? 
        // No, that overwrites.
        // Given the low frequency of settings changes, we can just fire immediately or debounce slightly without complex merging, 
        // or just use the MobX reaction to trigger the API call directly if we don't care about super-optimizing network (user clicks once/twice).

        // Let's trust the latest object reference for array, but for primitive fields merge?
        // Implementation:

        if (!debounced) {
            debounced = debounce(async (finalData: Partial<CalendarAccount>) => {
                console.log(`[CalendarSync] Syncing account ${accountId}...`);
                try {
                    await api.updateCalendar(accountId, finalData);
                } catch (err) {
                    console.error(`[CalendarSync] Failed to sync account ${accountId}`, err);
                } finally {
                    this.pendingUpdates.delete(accountId);
                }
            }, delay);
            this.pendingUpdates.set(accountId, debounced);
        }

        // Note: This simple debounce implementation with arguments passed to the 'debounced' function 
        // will use the arguments of the *last* call. 
        // So if I change vis, then immediately change strategy, only strategy is sent? 
        // YES. That is a bug in this simple pattern if we pass partials.
        // FIX: The reaction should pass the *accumulated* changes or we just don't debounce different fields together.
        // OR: We read the latest value from the account object inside the execution.

        // Since we have the `account` reference in `monitor`, let's just use that in `scheduleUpdate`? 
        // But `monitor` passes `account`. `scheduleUpdate` is generic.
        // Let's keep it simple: We won't debounce different fields. 
        // The reaction is triggered. We just call API. If user clicks fast, we might send 2 requests. That's fine for settings.

        // Removing debounce for simplicity and correctness on this specific settings use-case.
        this.performUpdate(accountId, data);
    }

    private async performUpdate(accountId: string, data: Partial<CalendarAccount>) {
        try {
            await api.updateCalendar(accountId, data);
        } catch (error) {
            console.error("Failed to sync calendar settings", error);
        }
    }
}

export const calendarSyncStrategy = new CalendarSyncStrategy();
