import { BaseApiService } from './BaseApiService';

export class UserModule extends BaseApiService {
    async generateApiToken(): Promise<{ token: string }> {
        // Calls POST /users/api-token
        return this.post<{ token: string }>('/users/api-token', {});
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
}
