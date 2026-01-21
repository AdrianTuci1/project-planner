import { BaseApiService } from './BaseApiService';

export class NotificationModule extends BaseApiService {
    async inviteUser(email: string, workspaceId: string): Promise<void> {
        // Assume online for now
        if (!navigator.onLine) throw new Error("Must be online to invite");

        const res = await fetch(`${this.baseUrl}/invitations`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({ email, workspaceId })
        });
        if (!res.ok) throw new Error(`Invite failed: ${res.statusText}`);
    }

    async getNotifications(): Promise<any[]> {
        return this.fetchOrCached<any[]>(
            `${this.baseUrl}/notifications`,
            'notifications_list',
            []
        );
    }

    async markNotificationRead(id: string): Promise<void> {
        await fetch(`${this.baseUrl}/notifications/${id}/read`, {
            method: 'PUT',
            headers: { ...this.getAuthHeader() }
        });
    }

    async respondToInvite(id: string, accept: boolean): Promise<void> {
        const action = accept ? 'accept' : 'decline';
        const res = await fetch(`${this.baseUrl}/invitations/${id}/${action}`, {
            method: 'POST',
            headers: { ...this.getAuthHeader() }
        });
        if (!res.ok) throw new Error(`Respond invite failed: ${res.statusText}`);
    }
}
