import { dbService } from './db';
import { api } from './api';

const processQueue = async () => {
    if (!navigator.onLine) return;

    const queueItems = await dbService.getAll('offlineQueue');
    if (queueItems.length === 0) return;

    // Sort by timestamp
    queueItems.sort((a, b) => a.timestamp - b.timestamp);

    for (const item of queueItems) {
        try {
            // Re-construct the request
            const options: RequestInit = {
                method: item.method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (item.body) {
                options.body = JSON.stringify(item.body);
            }

            const res = await fetch(item.url, options);

            if (res.ok) {
                // Success, remove from queue
                // @ts-ignore
                if (item.id) await dbService.delete('offlineQueue', item.id);
            } else {
                // If 4xx error, maybe remove? If 5xx, keep?
                // For now, simple retry logic: keep it if it failed server-side, maybe remove if 400?
                if (res.status >= 400 && res.status < 500) {
                    // @ts-ignore
                    if (item.id) await dbService.delete('offlineQueue', item.id);
                }
                // If 500, we leave it to retry later? Or increment retry count.
            }
        } catch (err) {
            console.error("Sync failed for item", item, err);
            // Network error likely, stop processing queue
            return;
        }
    }
};

export class SyncService {
    constructor() {
        window.addEventListener('online', () => {
            console.log('App is online. Processing queue...');
            processQueue();
        });
    }

    async addToQueue(url: string, method: string, body?: any) {
        await dbService.put('offlineQueue', {
            url,
            method,
            body,
            timestamp: Date.now(),
            retryCount: 0
        });

        // Try to process immediately if online
        if (navigator.onLine) {
            processQueue();
        }
    }

    init() {
        // Check queue on startup
        if (navigator.onLine) {
            processQueue();
        }
    }
}

export const syncService = new SyncService();
