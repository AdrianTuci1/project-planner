import { IApiService, InitialDataResponse, GeneralSettings, CalendarData, CalendarAccount } from './types';
import { dbService } from './db';
import { syncService } from './SyncService';

export class RealApiService implements IApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        syncService.init();
    }

    /**
     * Generic fetcher that handles ETag caching and Offline fallback.
     * @param url The API endpoint
     * @param storeKey The unique key for ETag/Meta storage
     * @param idbStore Optional: If specific IDB store should be used for data retrieval/storage (e.g. 'groups'). 
     *                 If not provided, data is looked up/stored vaguely or returns null on 304 if no specific store logic is bound.
     *                 Actually, to keep it clean, we will just return the data. 
     *                 If 304, we must know WHERE to get the data from.
     *                 So we will rely on a 'meta' cache for simple responses (settings, etc) 
     *                 and explicit logic for complex ones.
     */
    private async fetchOrCached<T>(url: string, storeKey: string, fallbackValue: T): Promise<T> {
        // 1. Get Metadata (ETag)
        const meta = await dbService.get('meta', storeKey);
        const headers: HeadersInit = {};
        if (meta?.etag) headers['If-None-Match'] = meta.etag;

        try {
            // 2. Check Online Status
            if (!navigator.onLine) {
                // FALLBACK: Return cached value if available in 'meta' (for simple objects)
                // or let the caller decide (but we want this function to be self-sufficient for simple cases)
                if (meta?.value) return meta.value as T;
                return fallbackValue;
            }

            // 3. Network Request
            const res = await fetch(url, { headers });

            // 4. Handle 304 Not Modified
            if (res.status === 304) {
                if (meta?.value) return meta.value as T;
                return fallbackValue;
            }

            // 5. Handle 200 OK
            if (res.ok) {
                const data = await res.json();
                const newEtag = res.headers.get('ETag');

                // Update Cache
                await dbService.put('meta', {
                    key: storeKey,
                    value: data,
                    etag: newEtag || undefined,
                    lastUpdated: Date.now()
                });

                return data;
            }

            // 6. Handle Errors (4xx, 5xx)
            throw new Error(`Fetch failed: ${res.statusText}`);

        } catch (error) {
            console.warn(`[RealApiService] Fetch failed for ${storeKey}, using fallback.`, error);
            // In error case (e.g. network timeout despite navigator.onLine), try cache
            if (meta?.value) return meta.value as T;
            return fallbackValue;
        }
    }

    async getInitialData(startDate: Date, endDate: Date): Promise<InitialDataResponse> {
        const startStr = startDate.toISOString();
        const endStr = endDate.toISOString();

        // Used for parallel fetching
        const fetchItem = async <T>(url: string, key: string, storeName: 'groups' | 'tasks' | null = null): Promise<T[]> => {
            // For heavy lists (groups, tasks), we might want to use their dedicated stores + meta for ETag.
            // But to keep it "Clean" and consistent as requested, 
            // let's use the optimized logic: Check ETag -> 304 -> Load from 専用Store or Meta.
            // Since we previously implemented dedicated stores for 'groups' and 'tasks', we should leverage them.

            const meta = await dbService.get('meta', key);
            const headers: HeadersInit = {};
            if (meta?.etag) headers['If-None-Match'] = meta.etag;

            try {
                if (!navigator.onLine) {
                    if (storeName) return await dbService.getAll(storeName) as unknown as T[];
                    return [];
                }

                const res = await fetch(url, { headers });

                if (res.status === 304) {
                    if (storeName) return await dbService.getAll(storeName) as unknown as T[];
                    return [];
                }

                if (res.ok) {
                    const data = await res.json();
                    const etag = res.headers.get('ETag');

                    // Update Meta
                    await dbService.put('meta', { key, etag: etag || undefined, lastUpdated: Date.now(), value: null }); // Value null because we store in dedicated store

                    // Update Dedicated Store
                    if (storeName) {
                        await dbService.clear(storeName);
                        for (const item of data) {
                            await dbService.put(storeName, item);
                        }
                    }
                    return data;
                }
            } catch (err) {
                if (storeName) return await dbService.getAll(storeName) as unknown as T[];
            }
            return [];
        };

        const [groups, dumpTasks, availableLabels] = await Promise.all([
            fetchItem<any>(`${this.baseUrl}/groups?startDate=${startStr}&endDate=${endStr}`, 'groups_req', 'groups'),
            fetchItem<any>(`${this.baseUrl}/tasks/dump?startDate=${startStr}&endDate=${endStr}`, 'dump_req', 'tasks'),
            this.fetchOrCached<any[]>(`${this.baseUrl}/labels`, 'labels_req', [])
        ]);

        return { groups, dumpTasks, availableLabels, templates: [] };
    }

    async getGeneralSettings(): Promise<GeneralSettings> {
        return this.fetchOrCached<GeneralSettings>(
            `${this.baseUrl}/settings/general`,
            'settings_general',
            {} as GeneralSettings
        );
    }

    async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void> {
        // Optimistic update
        const current = await this.getGeneralSettings();
        await dbService.put('meta', {
            key: 'settings_general',
            value: { ...current, ...settings },
            lastUpdated: Date.now()
        });

        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/settings/general`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error(`Update settings failed: ${res.statusText}`);
        } else {
            await syncService.addToQueue(`${this.baseUrl}/settings/general`, 'PUT', settings);
        }
    }

    async getCalendars(): Promise<CalendarData> {
        return this.fetchOrCached<CalendarData>(
            `${this.baseUrl}/calendars`,
            'calendars_data',
            { accounts: [] }
        );
    }

    async addCalendar(account: CalendarAccount): Promise<CalendarData> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(account)
            });
            if (!res.ok) throw new Error(`Add calendar failed: ${res.statusText}`);
            return await res.json();
        } else {
            await syncService.addToQueue(`${this.baseUrl}/calendars`, 'POST', account);
            return { accounts: [] };
        }
    }

    async updateCalendar(id: string, data: Partial<CalendarAccount>): Promise<CalendarData> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`Update calendar failed: ${res.statusText}`);
            return await res.json();
        } else {
            await syncService.addToQueue(`${this.baseUrl}/calendars/${id}`, 'PUT', data);
            return { accounts: [] };
        }
    }

    async deleteCalendar(id: string): Promise<CalendarData> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`Delete calendar failed: ${res.statusText}`);
            return await res.json();
        } else {
            await syncService.addToQueue(`${this.baseUrl}/calendars/${id}`, 'DELETE', {});
            return { accounts: [] };
        }
    }
}
