import { BaseApiService } from './BaseApiService';
import { InitialDataResponse } from '../types';
import { dbService } from '../db';
import { syncService } from '../SyncService';
import { GroupModule } from './GroupModule';
import { LabelModule } from './LabelModule';
import { toJS } from 'mobx';

export class TaskModule extends BaseApiService {
    private groupModule: GroupModule;
    private labelModule: LabelModule;

    constructor(baseUrl: string) {
        super(baseUrl);
        // We create local instances or could receive them. 
        // For simplicity, create them as they are stateless (just API helpers)
        this.groupModule = new GroupModule(baseUrl);
        this.labelModule = new LabelModule(baseUrl);
    }

    async getInitialData(startDate: Date, endDate: Date, workspaceId?: string): Promise<InitialDataResponse> {
        const startStr = startDate.toISOString();
        const endStr = endDate.toISOString();

        // Used for parallel fetching
        const fetchItem = async <T>(url: string, key: string, storeName: 'groups' | 'tasks' | null = null): Promise<T[]> => {
            console.log(`[FetchItem] Starting for ${key}. Store: ${storeName}`);
            const meta = await dbService.get('meta', key);
            const headers: HeadersInit = { ...this.getAuthHeader() };

            // Check if we have cached data before sending ETag
            let hasCachedData = false;
            if (storeName) {
                const cached = await dbService.getAll(storeName as any);
                hasCachedData = !!(cached && cached.length > 0);
            }
            console.log(`[FetchItem] ${key} - Has Cached Data: ${hasCachedData}, ETag Available: ${!!meta?.etag}`);

            // Only send ETag if we have data (for stores) or if we don't use a store (fallback logic)
            if (meta?.etag && (!storeName || hasCachedData)) {
                console.log(`[FetchItem] ${key} - Sending If-None-Match: ${meta.etag}`);
                (headers as any)['If-None-Match'] = meta.etag;
            }

            try {
                if (!navigator.onLine) {
                    console.log(`[FetchItem] ${key} - Offline. Returning cached.`);
                    if (storeName) return await dbService.getAll(storeName) as unknown as T[];
                    return [];
                }

                const res = await fetch(url, { headers });
                console.log(`[FetchItem] ${key} - Response Status: ${res.status}`);

                if (res.status === 304) {
                    console.log(`[FetchItem] ${key} - 304 Not Modified. Reading from DB.`);
                    if (storeName) {
                        const data = await dbService.getAll(storeName) as unknown as T[];
                        console.log(`[FetchItem] ${key} - DB returned ${data?.length} items.`);
                        return data;
                    }
                    return [];
                }

                if (res.ok) {
                    const data = await res.json();
                    const etag = res.headers.get('ETag');
                    console.log(`[FetchItem] ${key} - 200 OK. Data Length: ${data?.length || 0}. New ETag: ${etag}`);

                    await dbService.put('meta', { key, etag: etag || undefined, lastUpdated: Date.now(), value: null });

                    if (storeName) {
                        await dbService.clear(storeName);
                        for (const item of data) {
                            await dbService.put(storeName, item);
                        }
                    }
                    return data;
                }
            } catch (err) {
                console.error(`[FetchItem] ${key} - Error:`, err);
                if (storeName) return await dbService.getAll(storeName) as unknown as T[];
            }
            return [];
        };

        const workspaceParam = workspaceId ? `&workspaceId=${workspaceId}` : '';

        const [allTasks, availableLabels, fetchedGroups] = await Promise.all([
            fetchItem<any>(`${this.baseUrl}/tasks?startDate=${startStr}&endDate=${endStr}${workspaceParam}`, 'tasks_req', 'tasks'),
            this.labelModule.getLabels(workspaceId),
            this.groupModule.getGroups(workspaceId)
        ]);

        // Distribute tasks
        const groups = fetchedGroups.map(g => ({ ...g, tasks: [] }));
        const dumpTasks: any[] = [];

        const templates: any[] = [];

        if (allTasks && Array.isArray(allTasks)) {
            allTasks.forEach(task => {
                if (task.isTemplate) {
                    templates.push(task);
                } else if (task.groupId) {
                    const group = groups.find(g => g.id === task.groupId);
                    if (group) {
                        group.tasks.push(task);
                    } else {
                        // Group not found? Fallback to dump
                        dumpTasks.push(task);
                    }
                } else {
                    dumpTasks.push(task);
                }
            });
        }

        return { groups, dumpTasks, availableLabels, templates };
    }

    async createTask(taskData: any): Promise<any> {
        // Fix DataCloneError: Sanitize MobX proxy
        const task = toJS(taskData);

        await dbService.put('tasks', task);

        if (navigator.onLine) {
            try {
                const res = await fetch(`${this.baseUrl}/tasks`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeader()
                    },
                    body: JSON.stringify(task)
                });
                if (!res.ok) throw new Error(`Create task failed: ${res.statusText}`);
                return await res.json();
            } catch (err) {
                console.warn("Network request failed, adding to queue", err);
                await syncService.addToQueue(`${this.baseUrl}/tasks`, 'POST', task);
                return task;
            }
        } else {
            await syncService.addToQueue(`${this.baseUrl}/tasks`, 'POST', task);
            return task;
        }
    }

    async updateTask(id: string, taskData: any): Promise<any> {
        const task = toJS(taskData);
        await dbService.put('tasks', task);

        if (navigator.onLine) {
            try {
                const res = await fetch(`${this.baseUrl}/tasks/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeader()
                    },
                    body: JSON.stringify(task)
                });
                if (!res.ok) throw new Error(`Update task failed: ${res.statusText}`);
                return await res.json();
            } catch (err) {
                console.warn("Network request failed, adding to queue", err);
                await syncService.addToQueue(`${this.baseUrl}/tasks/${id}`, 'PUT', task);
                return task;
            }
        } else {
            await syncService.addToQueue(`${this.baseUrl}/tasks/${id}`, 'PUT', task);
            return task;
        }
    }

    async deleteTask(id: string): Promise<any> {
        await dbService.delete('tasks', id);
        return this.syncAndFetch(`${this.baseUrl}/tasks/${id}`, 'DELETE', {}, 'deleteTask');
    }

    // Helper for common sync pattern
    private async syncAndFetch(url: string, method: string, body: any, context: string, fallbackValue: any = undefined) {
        if (navigator.onLine) {
            try {
                const res = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.getAuthHeader()
                    },
                    body: body ? JSON.stringify(body) : undefined
                });
                if (!res.ok) throw new Error(`${context} failed: ${res.statusText}`);
                if (res.status === 204) return fallbackValue !== undefined ? fallbackValue : {};
                return await res.json().catch(() => ({}));
            } catch (err) {
                console.warn(`Network request failed [${context}]`, err);
                if (method !== 'GET') {
                    console.log(`[Sync] Queueing ${method} ${url}`);
                    await syncService.addToQueue(url, method, body);
                }
                return fallbackValue !== undefined ? fallbackValue : body;
            }
        } else {
            if (method !== 'GET') {
                await syncService.addToQueue(url, method, body);
            }
            return fallbackValue !== undefined ? fallbackValue : body;
        }
    }
}
