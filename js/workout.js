import { getCachedWorkoutData } from './db.js';

const WorkoutErrors = {
    DATA_NOT_FOUND: 'WorkoutDataNotFound',
    INVALID_PHASE: 'InvalidPhaseError',
    INITIALIZATION_FAILED: 'InitializationFailed'
};

export async function initializeWorkout(phase, retryAttempts = 3) {
    if (!phase) {
        throw new Error(WorkoutErrors.INVALID_PHASE);
    }

    let attempt = 0;
    while (attempt < retryAttempts) {
        try {
            const workoutData = await getCachedWorkoutData(phase);
            
            if (!workoutData) {
                throw new Error(WorkoutErrors.DATA_NOT_FOUND);
            }

            if (workoutData.nextPhase) {
                getCachedWorkoutData(workoutData.nextPhase).catch(console.error);
            }

            performance.mark('workout-initialized');
            return workoutData;

        } catch (error) {
            attempt++;
            if (attempt === retryAttempts) {
                throw new Error(`${WorkoutErrors.INITIALIZATION_FAILED}: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }
}

export function cleanupWorkout() {
    performance.clearMarks('workout-initialized');
}

export function validateWorkoutData(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.exercises)) return false;
    
    return data.exercises.every(exercise => 
        exercise.name &&
        typeof exercise.sets === 'number' &&
        typeof exercise.reps === 'number'
    );
}
