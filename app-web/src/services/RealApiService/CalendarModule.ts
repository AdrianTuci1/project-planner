import { BaseApiService } from './BaseApiService';
import { CalendarData, CalendarAccount } from '../types';
import { syncService } from '../SyncService';

export class CalendarModule extends BaseApiService {
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
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
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
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
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
                method: 'DELETE',
                headers: { ...this.getAuthHeader() }
            });
            if (!res.ok) throw new Error(`Delete calendar failed: ${res.statusText}`);
            return await res.json();
        } else {
            await syncService.addToQueue(`${this.baseUrl}/calendars/${id}`, 'DELETE', {});
            return { accounts: [] };
        }
    }

    async getGoogleAuthUrl(): Promise<{ url: string }> {
        const res = await fetch(`${this.baseUrl}/calendars/auth/google`, {
            headers: { ...this.getAuthHeader() }
        });
        if (!res.ok) throw new Error(`Failed to get auth url: ${res.statusText}`);
        return await res.json();
    }
}
