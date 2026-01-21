import { BaseApiService } from './BaseApiService';
import { syncService } from '../SyncService';

export class GroupModule extends BaseApiService {

    async getGroups(workspaceId?: string): Promise<any[]> {
        const workspaceParam = workspaceId ? `?workspaceId=${workspaceId}` : '';
        const url = `${this.baseUrl}/groups${workspaceParam}`;
        return this.fetchOrCached<any[]>(url, `groups_req_${workspaceId || 'global'}`, []);
    }

    async createGroup(group: any): Promise<any> {
        // Optimistic persistence ok? We usually need ID from backend or we generate UUID locally.
        // Assuming Store generates UUID.
        return this.syncAndFetch(`${this.baseUrl}/groups`, 'POST', group, 'createGroup');
    }

    async updateGroup(id: string, group: any): Promise<any> {
        return this.syncAndFetch(`${this.baseUrl}/groups/${id}`, 'PUT', group, 'updateGroup');
    }

    async deleteGroup(id: string): Promise<any> {
        // Can optionally delete tasks in group locally if needed, but Store handles that.
        // Just send delete request.
        return this.syncAndFetch(`${this.baseUrl}/groups/${id}`, 'DELETE', {}, 'deleteGroup');
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
