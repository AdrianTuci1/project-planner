import { BaseApiService } from './BaseApiService';
import { syncService } from '../SyncService';

export class WorkspaceModule extends BaseApiService {

    async getWorkspaces(): Promise<any[]> {
        return this.syncAndFetch(`${this.baseUrl}/workspaces`, 'GET', null, 'getWorkspaces', []);
    }

    async createWorkspace(name: string, type: string, ownerId: string): Promise<any> {
        return this.syncAndFetch(`${this.baseUrl}/workspaces`, 'POST', { name, type, ownerId }, 'createWorkspace');
    }

    async updateWorkspace(id: string, data: any): Promise<any> {
        return this.syncAndFetch(`${this.baseUrl}/workspaces/${id}`, 'PUT', data, 'updateWorkspace');
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
