const CACHE_CONFIG = {
    maxSize: 10,
    expirationTime: 1000 * 60 * 60 // 1 hour
};

const workoutCache = new Map();

export async function loadWorkoutData(phase, timeout = 5000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(`data/${phase}.json`, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Request timeout for phase: ${phase}`);
        }
        console.error('Error loading workout data:', error);
        throw error;
    }
}

export async function getCachedWorkoutData(phase) {
    const now = Date.now();
    const cached = workoutCache.get(phase);

    if (cached && (now - cached.timestamp) < CACHE_CONFIG.expirationTime) {
        return cached.data;
    }

    try {
        const data = await loadWorkoutData(phase);
        
        if (workoutCache.size >= CACHE_CONFIG.maxSize) {
            const oldestKey = Array.from(workoutCache.keys())[0];
            workoutCache.delete(oldestKey);
        }

        workoutCache.set(phase, {
            data,
            timestamp: now
        });

        return data;
    } catch (error) {
        if (cached) {
            console.warn('Serving stale data due to error:', error);
            return cached.data;
        }
        throw error;
    }
}

export const cacheUtils = {
    clearCache: () => workoutCache.clear(),
    removeCacheItem: (phase) => workoutCache.delete(phase),
    getCacheSize: () => workoutCache.size,
    isCached: (phase) => workoutCache.has(phase)
};

export async function preloadWorkoutData(phases) {
    return Promise.allSettled(
        phases.map(phase => getCachedWorkoutData(phase))
    );
}