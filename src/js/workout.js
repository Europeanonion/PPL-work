

class WorkoutManager {
    constructor() {
        this.currentWorkout = null;
        this.workoutData = null;
        this.loadWorkoutData();
    }

    async loadWorkoutData() {
        try {
            const response = await fetch('/workout-phase.json');
            this.workoutData = await response.json();
            this.initializeWorkout();
        } catch (error) {
            console.error('Error loading workout data:', error);
        }
    }

    initializeWorkout() {
        if (!this.workoutData) return;
        
        const phase = this.workoutData.phases[0];
        const currentWeek = phase.weeks[0];
        const currentDay = currentWeek.days[0];

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
}