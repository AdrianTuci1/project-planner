import { BaseApiService } from './BaseApiService';

export class UserModule extends BaseApiService {
    async getApiToken(): Promise<{ token: string | null }> {
        // Calls GET /users/api-token
        return this.fetchOrCached<{ data: { token: string | null } }>(
            `${this.baseUrl}/users/api-token`,
            'api_token',
            { data: { token: null } }
        ).then(res => res.data);
    }

    async generateApiToken(): Promise<{ token: string }> {
        // Calls POST /users/api-token
        return this.post<{ data: { token: string } }>('/users/api-token', {}).then(res => res.data);
    }

    async revokeApiToken(): Promise<void> {
        // Calls DELETE /users/api-token
        const res = await fetch(`${this.baseUrl}/users/api-token`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            }
        });

        if (!res.ok) {
            throw new Error(`revokeApiToken failed: ${res.statusText}`);
        }
    }

    async getUsers(ids: string[]): Promise<any[]> {
        return this.post<{ data: any[] }>('/users/batch', { ids }).then(res => res.data);
    }
}
