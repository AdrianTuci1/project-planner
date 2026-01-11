import { IApiService, InitialDataResponse } from './types';

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

            return { groups, dumpTasks, availableLabels };

        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }
}
