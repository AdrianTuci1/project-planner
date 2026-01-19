import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
    tasks: {
        key: string;
        value: any;
    };
    groups: {
        key: string;
        value: any;
    };
    offlineQueue: {
        key: number;
        value: {
            id?: number;
            url: string;
            method: string;
            body?: any;
            timestamp: number;
            retryCount: number;
        };
        indexes: { 'by-timestamp': number };
    };
    meta: {
        key: string;
        value: any;
    };
}

const DB_NAME = 'pm-app-db';
const DB_VERSION = 1;

export class IndexedDBService {
    private dbPromise: Promise<IDBPDatabase<AppDB>>;

    constructor() {
        this.dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('tasks')) {
                    db.createObjectStore('tasks', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('groups')) {
                    db.createObjectStore('groups', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('offlineQueue')) {
                    const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true });
                    queueStore.createIndex('by-timestamp', 'timestamp');
                }
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta', { keyPath: 'key' });
                }
            },
        });
    }

    async get<StoreName extends keyof AppDB>(
        storeName: StoreName,
        key: AppDB[StoreName]['key']
    ): Promise<AppDB[StoreName]['value'] | undefined> {
        const db = await this.dbPromise;
        return db.get(storeName as any, key);
    }

    async getAll<StoreName extends keyof AppDB>(
        storeName: StoreName
    ): Promise<AppDB[StoreName]['value'][]> {
        const db = await this.dbPromise;
        return db.getAll(storeName as any);
    }

    async put<StoreName extends keyof AppDB>(
        storeName: StoreName,
        value: AppDB[StoreName]['value']
    ): Promise<AppDB[StoreName]['key']> {
        const db = await this.dbPromise;
        return db.put(storeName as any, value);
    }

    async delete<StoreName extends keyof AppDB>(
        storeName: StoreName,
        key: AppDB[StoreName]['key']
    ): Promise<void> {
        const db = await this.dbPromise;
        return db.delete(storeName as any, key);
    }

    async clear<StoreName extends keyof AppDB>(storeName: StoreName): Promise<void> {
        const db = await this.dbPromise;
        return db.clear(storeName as any);
    }
}

export const dbService = new IndexedDBService();
