import { BaseApiService } from './BaseApiService';
import { GeneralSettings } from '../types';
import { dbService } from '../db';
import { syncService } from '../SyncService';

export class SettingsModule extends BaseApiService {
    async getGeneralSettings(): Promise<GeneralSettings> {
        return this.fetchOrCached<GeneralSettings>(
            `${this.baseUrl}/settings/general`,
            'settings_general',
            {} as GeneralSettings
        );
    }

    async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<void> {
        // Optimistic update
        const current = await this.getGeneralSettings();
        const updated = { ...current, ...settings };

        await dbService.put('meta', {
            key: 'settings_general',
            value: updated,
            lastUpdated: Date.now()
        });

        if (navigator.onLine) {
            const res = await fetch(`${this.baseUrl}/settings/general`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...this.getAuthHeader()
                },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error(`Update settings failed: ${res.statusText}`);
        } else {
            await syncService.addToQueue(`${this.baseUrl}/settings/general`, 'PUT', settings);
        }
    }
}
