import { BaseApiService } from './BaseApiService';

export class StorageModule extends BaseApiService {
    async getUploadUrl(contentType: string, fileName: string): Promise<{ url: string, key: string, publicUrl: string }> {
        const res = await fetch(`${this.baseUrl}/storage/presigned-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader()
            },
            body: JSON.stringify({ contentType, fileName })
        });
        if (!res.ok) throw new Error(`Failed to get upload URL: ${res.statusText}`);
        return await res.json();
    }

    async deleteFile(key: string): Promise<void> {
        const res = await fetch(`${this.baseUrl}/storage/files/${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: { ...this.getAuthHeader() }
        });
        if (!res.ok) throw new Error(`Failed to delete file: ${res.statusText}`);
    }
}
