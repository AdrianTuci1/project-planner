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

    async syncSubCalendars(id: string): Promise<CalendarData> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars/${id}/sync`, {
                method: 'POST',
                headers: { ...this.getAuthHeader() }
            });
            if (!res.ok) throw new Error(`Sync calendars failed: ${res.statusText}`);
            return await res.json();
        } else {
            console.warn("Cannot sync calendars while offline");
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
    async exchangeGoogleCode(code: string): Promise<CalendarAccount> {
        return this.post<CalendarAccount>('/calendars/auth/google/callback', { code });
    }

    async getEvents(start: string, end: string): Promise<any[]> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`, {
                method: 'GET',
                headers: { ...this.getAuthHeader() }
            });
            if (!res.ok) throw new Error(`Fetch events failed: ${res.statusText}`);
            return await res.json();
        } else {
            console.warn("Offline: Cannot fetch remote events.");
            return [];
        }
    }

    async updateEvent(accountId: string, calendarId: string, eventId: string, event: any): Promise<boolean> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars/${accountId}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
                method: 'PATCH', // Using PATCH for partial updates
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(event)
            });
            if (!res.ok) throw new Error(`Update event failed: ${res.statusText}`);
            return true;
        } else {
            console.warn("Offline: Cannot update remote event.");
            return false;
        }
    }

    async deleteEvent(accountId: string, calendarId: string, eventId: string): Promise<boolean> {
        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/calendars/${accountId}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
                method: 'DELETE',
                headers: { ...this.getAuthHeader() }
            });
            if (!res.ok) throw new Error(`Delete event failed: ${res.statusText}`);
            return true;
        } else {
            console.warn("Offline: Cannot delete remote event.");
            return false;
        }
    }
}
