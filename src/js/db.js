class WorkoutDB {
    constructor() {
        this.dbName = 'workoutTrackerDB';
        this.dbVersion = 1;
        this.db = null;
        this.init();
    }

    async init() {
        try {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => {
                    const error = new Error(`Failed to open database: ${request.error}`);
                    console.error(error);
                    reject(error);
                };

                request.onblocked = () => {
                    const error = new Error('Database blocked - close other tabs and retry');
                    console.error(error);
                    reject(error);
                };

                request.onsuccess = () => {
                    this.db = request.result;
                    resolve();
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    
                    if (!db.objectStoreNames.contains('workouts')) {
                        const store = db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
                        store.createIndex('date', 'date', { unique: false });
                        store.createIndex('phase', 'phase', { unique: false });
                    }
                };
            });
        } catch (error) {
            console.error('Database initialization failed:', error);
            throw error;
        }
    }

    async saveWorkout(workout) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readwrite');
            const store = transaction.objectStore('workouts');
            const request = store.add(workout);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error("Error saving workout:", request.error);
                reject(request.error);
            };
        });
    }

    async getWorkouts() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['workouts'], 'readonly');
            const store = transaction.objectStore('workouts');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => {
                console.error("Error fetching workouts:", request.error);
                reject(request.error);
            };
        });
    }
}

export const db = new WorkoutDB();