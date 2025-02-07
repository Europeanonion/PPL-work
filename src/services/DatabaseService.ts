export class DatabaseService {
    private db: IDBDatabase | null = null;
    private readonly DB_NAME = 'WorkoutDB';
    private readonly DB_VERSION = 1;

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('workoutPhases')) {
                    db.createObjectStore('workoutPhases', { keyPath: 'id' });
                }
            };
        });
    }

    async getPhase(phaseId: string): Promise<any> {
        if (!this.db) throw new Error('Database not initialized');
        
        const cached = await this.getFromStore('workoutPhases', phaseId);
        if (cached) return cached;

        const response = await fetch(`data/${phaseId}.json`);
        const data = await response.json();
        await this.saveToStore('workoutPhases', data);
        return data;
    }

    private getFromStore(store: string, key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('Database not initialized');
            
            const transaction = this.db.transaction(store, 'readonly');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private saveToStore(store: string, data: any): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.db) return reject('Database not initialized');

            const transaction = this.db.transaction(store, 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}
