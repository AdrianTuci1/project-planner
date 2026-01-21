import { BaseApiService } from './BaseApiService';
import { syncService } from '../SyncService';

export class LabelModule extends BaseApiService {

    async getLabels(workspaceId?: string): Promise<any[]> {
        const workspaceParam = workspaceId ? `?workspaceId=${workspaceId}` : '';
        const url = `${this.baseUrl}/labels${workspaceParam}`;

        // Similar fetch pattern with caching as getInitialData could be used, 
        // but for simplicity/directness let's just fetch or use cache.
        return this.fetchOrCached<any[]>(url, `labels_req_${workspaceId || 'global'}`, []);
    }

    async createLabel(label: any): Promise<any> {
        return this.syncAndFetch(`${this.baseUrl}/labels`, 'POST', label, 'createLabel');
    }

    async updateLabel(id: string, label: any): Promise<any> {
        return this.syncAndFetch(`${this.baseUrl}/labels/${id}`, 'PUT', label, 'updateLabel');
    }

    async deleteLabel(id: string): Promise<any> {
        return this.syncAndFetch(`${this.baseUrl}/labels/${id}`, 'DELETE', {}, 'deleteLabel');
    }

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
