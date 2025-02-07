export async function loadWorkoutData(phase) {
    try {
        const response = await fetch(`data/${phase}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading workout data:', error);
        return null;
    }
}

// Add caching mechanism
const workoutCache = new Map();

export async function getCachedWorkoutData(phase) {
    if (workoutCache.has(phase)) {
        return workoutCache.get(phase);
    }
    
    const data = await loadWorkoutData(phase);
    if (data) {
        workoutCache.set(phase, data);
    }
    return data;
}