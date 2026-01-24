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
        const meta = await dbService.get('meta', 'settings_general');
        const current = meta?.value || await this.getGeneralSettings();
        const updated = { ...current, ...settings };
        const originalEtag = meta?.etag;

        console.log('[SettingsModule] Optimistic Update:', updated, 'Preserving ETag:', originalEtag);

        await dbService.put('meta', {
            key: 'settings_general',
            value: updated,
            etag: originalEtag, // Preserving ETag is crucial to prevent overwrite by stale 200 OK from server
            lastUpdated: Date.now()
        });

        if (navigator.onLine) {
            console.log("[SettingsModule] Sending update:", settings);
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
