import { fetchWorkoutData, validateWorkoutData } from './utils.js';

export class WorkoutManager {
    constructor() {
        this.currentWorkout = null;
        this.workoutData = null;
        this.loadWorkoutData();
    }

    async loadWorkoutData() {
        const data = await fetchWorkoutData('program');
        if (data) {
            this.workoutData = data;
            this.initializeWorkout();
        } else {
            this.handleDataLoadError(new Error('Failed to load workout data'));
        }
    }

    isValidWorkoutData(data) {
        return validateWorkoutData(data);
    }

    handleDataLoadError(error) {
        const container = document.getElementById('exerciseList');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <h3>Failed to load workout data</h3>
                    <p>Please check if the program.json file exists and is properly formatted.</p>
                </div>`;
        }
    }

    validateWorkoutStructure(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid workout data format');
        }

        if (!Array.isArray(data.phases) || data.phases.length === 0) {
            throw new Error('No workout phases found');
        }

        data.phases.forEach((phase, phaseIndex) => {
            if (!phase.name || !Array.isArray(phase.weeks)) {
                throw new Error(`Invalid phase structure at index ${phaseIndex}`);
            }

            phase.weeks.forEach((week, weekIndex) => {
                if (!week.weekNumber || !Array.isArray(week.days)) {
                    throw new Error(
                        `Invalid week structure in phase ${phase.name}, week ${weekIndex + 1}`
                    );
                }

                week.days.forEach((day, dayIndex) => {
                    if (!day.name || !Array.isArray(day.exercises)) {
                        throw new Error(
                            `Invalid day structure in phase ${phase.name}, week ${weekIndex + 1}, day ${dayIndex + 1}`
                        );
                    }
                });
            });
        });

        return true;
    }

    async initializeWorkout() {
        try {
            await verifyJsonFiles();
            const data = await this.loadWorkoutData();
            
            if (this.validateWorkoutStructure(data)) {
                if (!this.isValidWorkoutData(this.workoutData)) {
                    console.error("Invalid or missing workout data");
                    return;
                }

                const phase = this.workoutData.phases[0] || null;
                const currentWeek = phase?.weeks?.[0] || null;
                const currentDay = currentWeek?.days?.[0] || null;

                if (!currentDay) {
                    console.error("Error: No days found in the first workout phase.");
                    return;
                }

                this.currentWorkout = {
                    date: new Date(),
                    phase: phase.name,
                    week: currentWeek.weekNumber,
                    day: currentDay.name,
                    exercises: currentDay.exercises.map(ex => ({
                        ...ex,
                        sets: Array(ex.workingSets).fill().map(() => ({
                            weight: '',
                            reps: '',
                            completed: false
                        }))
                    }))
                };

                this.renderWorkout();
            }
        } catch (error) {
            console.error('Workout initialization failed:', error);
            const errorContainer = document.getElementById('errorContainer');
            if (errorContainer) {
                errorContainer.textContent = error.message;
                errorContainer.classList.remove('hidden');
            }
        }
    }

    renderWorkout() {
        const container = document.getElementById('exerciseList');
        if (!this.currentWorkout) return;

        container.innerHTML = this.currentWorkout.exercises.map((exercise, idx) => `
            <div class="exercise-card">
                <h3>${exercise.name}</h3>
                <p>Target: ${exercise.reps} reps @ RPE ${exercise.rpe}</p>
                <div class="sets">
                    ${exercise.sets.map((set, setIdx) => `
                        <div class="set">
                            <input type="number" placeholder="Weight" 
                                data-exercise="${idx}" data-set="${setIdx}" data-type="weight"
                                value="${set.weight}">
                            <input type="number" placeholder="Reps"
                                data-exercise="${idx}" data-set="${setIdx}" data-type="reps"
                                value="${set.reps}">
                            <input type="checkbox" 
                                data-exercise="${idx}" data-set="${setIdx}" data-type="completed"
                                ${set.completed ? 'checked' : ''}>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        this.attachEventListeners();
    }

    attachEventListeners() {
        document.querySelectorAll('.set input').forEach(input => {
            input.addEventListener('change', (e) => {
                const { exercise, set, type } = e.target.dataset;
                if (type === 'completed') {
                    this.currentWorkout.exercises[exercise].sets[set][type] = e.target.checked;
                } else {
                    this.currentWorkout.exercises[exercise].sets[set][type] = e.target.value;
                }
            });
        });
    }

    async completeWorkout() {
        if (!this.currentWorkout) return;
        
        try {
            await db.saveWorkout(this.currentWorkout);
            this.currentWorkout = null;
            this.initializeWorkout();
            return true;
        } catch (error) {
            console.error('Error saving workout:', error);
            return false;
        }
    }

    async loadAllPhases() {
        const phases = ['push1', 'push2', 'push3']; // Ensure filenames match actual JSON files
        const phaseData = [];

        try {
            console.log("Loading workout phases...");
            const loadingIndicator = document.getElementById('loadingIndicator');
            loadingIndicator.classList.remove('hidden');

            for (const phase of phases) {
                const data = await fetchWorkoutData(phase);
                if (data) {
                    phaseData.push({
                        id: phase,
                        name: data.name,
                        description: data.description,
                        weeks: data.weeks
                    });
                } else {
                    console.warn(`Warning: Failed to load ${phase}.json`);
                }
            }

            if (phaseData.length > 0) {
                populatePhaseDropdown(phaseData);
            } else {
                console.error("No workout phases found.");
            }
        } catch (error) {
            console.error("Error loading phases:", error);
            showError("Failed to load workout phases");
        } finally {
            document.getElementById('loadingIndicator').classList.add('hidden');
        }
    }
}

function populatePhaseDropdown(phases) {
    const select = document.getElementById('workoutPhase');
    if (!select) {
        console.error("Dropdown element #workoutPhase not found.");
        return;
    }
    
    select.innerHTML = '<option value="">-- Select a Phase --</option>';

    phases.forEach(phase => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${phase.name} - ${phase.description}`;

        phase.weeks.forEach((week, index) => {
            const option = document.createElement('option');
            option.value = `${phase.id}_${index}`;
            option.textContent = `Week ${week.weekNumber}`;
            optgroup.appendChild(option);
        });

        select.appendChild(optgroup);
    });

    select.addEventListener('change', (event) => {
        const selectedValue = event.target.value;
        if (!selectedValue) return;

        const [phaseId, weekIndex] = selectedValue.split('_');
        const selectedPhase = phases.find(phase => phase.id === phaseId);
        if (selectedPhase) {
            displayWorkouts(selectedPhase.weeks[weekIndex]);
        }
    });

    console.log("Dropdown populated successfully.");
}

// Ensure loadAllPhases() runs when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const workoutManager = new WorkoutManager();
    workoutManager.loadAllPhases();
});