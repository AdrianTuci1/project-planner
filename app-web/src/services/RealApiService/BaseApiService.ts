import { dbService } from '../db';
import { syncService } from '../SyncService';

export abstract class BaseApiService {
    protected baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    protected getAuthHeader(): HeadersInit {
        const token = localStorage.getItem('accessToken');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    /**
     * Generic fetcher that handles ETag caching and Offline fallback.
     */
    protected async fetchOrCached<T>(url: string, storeKey: string, fallbackValue: T): Promise<T> {
        // 1. Get Metadata (ETag)
        const meta = await dbService.get('meta', storeKey);
        const headers: HeadersInit = { ...this.getAuthHeader() };
        // Only send If-None-Match if we have the data to fall back on!
        if (meta?.etag && meta?.value) {
            (headers as any)['If-None-Match'] = meta.etag;
        }

        try {
            // 2. Check Online Status
            if (!navigator.onLine) {
                // console.log(`[BaseApi] ${storeKey} - Offline. Returning ${meta?.value ? 'cached' : 'fallback'}`);
                if (meta?.value) return meta.value as T;
                return fallbackValue;
            }

            // 3. Network Request
            const res = await fetch(url, { headers });
            // console.log(`[BaseApi] ${storeKey} - Status: ${res.status}`);

            // 4. Handle 304 Not Modified
            if (res.status === 304) {
                // console.log(`[BaseApi] ${storeKey} - 304. Returning cached.`);
                if (meta?.value) return meta.value as T;
                return fallbackValue;
            }

            // 5. Handle 200 OK
            if (res.ok) {
                const data = await res.json();
                const newEtag = res.headers.get('ETag');
                // console.log(`[BaseApi] ${storeKey} - 200 OK. New ETag: ${newEtag}`);

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
            if (meta?.value) return meta.value as T;
            return fallbackValue;
        }
    }
    protected async post<T>(endpoint: string, body: any): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...this.getAuthHeader()
        };

        const res = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            throw new Error(`POST ${endpoint} failed: ${res.statusText}`);
        }

        return res.json();
    }
}
