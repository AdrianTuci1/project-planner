import { IApiService, InitialDataResponse, GeneralSettings, CalendarData, CalendarAccount } from './types';

export class RealApiService implements IApiService {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async getInitialData(startDate: Date, endDate: Date): Promise<InitialDataResponse> {
        try {
            const startStr = startDate.toISOString();
            const endStr = endDate.toISOString();

            const [groupsRes, dumpRes, labelsRes] = await Promise.all([
                fetch(`${this.baseUrl}/groups?startDate=${startStr}&endDate=${endStr}`),
                fetch(`${this.baseUrl}/tasks/dump?startDate=${startStr}&endDate=${endStr}`),
                fetch(`${this.baseUrl}/labels`)
            ]);

            if (!groupsRes.ok) throw new Error(`Groups fetch failed: ${groupsRes.statusText}`);
            if (!dumpRes.ok) throw new Error(`Dump tasks fetch failed: ${dumpRes.statusText}`);
            if (!labelsRes.ok) throw new Error(`Labels fetch failed: ${labelsRes.statusText}`);

            const groups = await groupsRes.json();
            const dumpTasks = await dumpRes.json();
            const availableLabels = await labelsRes.json();

            return { groups, dumpTasks, availableLabels, templates: [] };

        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async getGeneralSettings(): Promise<GeneralSettings> {
        try {
            const res = await fetch(`${this.baseUrl}/settings/general`);
            if (!res.ok) throw new Error(`Fetch settings failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void> {
        try {
            const res = await fetch(`${this.baseUrl}/settings/general`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error(`Update settings failed: ${res.statusText}`);
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async getCalendars(): Promise<CalendarData> {
        try {
            const res = await fetch(`${this.baseUrl}/calendars`);
            if (!res.ok) throw new Error(`Fetch calendars failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async addCalendar(account: CalendarAccount): Promise<CalendarData> {
        try {
            const res = await fetch(`${this.baseUrl}/calendars`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(account)
            });
            if (!res.ok) throw new Error(`Add calendar failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async updateCalendar(id: string, data: Partial<CalendarAccount>): Promise<CalendarData> {
        try {
            const res = await fetch(`${this.baseUrl}/calendars/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error(`Update calendar failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }

    async deleteCalendar(id: string): Promise<CalendarData> {
        try {
            const res = await fetch(`${this.baseUrl}/calendars/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error(`Delete calendar failed: ${res.statusText}`);
            return await res.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }
}
