import { WorkoutManager } from './workout.js';
import { db } from './db.js';

class App {
    constructor() {
        this.workoutManager = new WorkoutManager();
        this.currentView = 'workout';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        try {
            const elements = ['currentWorkout', 'history', 'completeWorkout'].map(id => 
                document.getElementById(id) || (() => { throw new Error(`Element ${id} not found`) })());
            
            elements[0].addEventListener('click', () => this.showView('workout'));
            elements[1].addEventListener('click', () => this.showView('history'));
            elements[2].addEventListener('click', () => this.completeWorkout());
        } catch (error) {
            console.error('Failed to initialize event listeners:', error);
        }
    }

    async showView(view) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        try {
            loadingIndicator.classList.remove('hidden');
            this.currentView = view;
            document.querySelectorAll('.view').forEach(el => el.classList.add('hidden'));
            document.getElementById(`${view}View`).classList.remove('hidden');

            if (view === 'history') {
                await this.loadHistory();
            }
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }

    async loadHistory() {
        const historyContainer = document.getElementById('historyContainer');
        try {
            const workouts = await db.getWorkouts();
            historyContainer.innerHTML = workouts.reverse().map(workout => `
                <div class="workout-history-card">
                    <h3>${new Date(workout.date).toLocaleDateString()} - ${workout.day}</h3>
                    <p>Week ${workout.week} of ${workout.phase}</p>
                    <div class="exercise-summary">
                        ${workout.exercises.map(ex => `
                            <div class="exercise-history">
                                <h4>${ex.name}</h4>
                                <div class="sets-summary">
                                    ${ex.sets.map(set => `
                                        <span class="${set.completed ? 'completed' : ''}">
                                            ${set.weight}kg × ${set.reps}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
            historyContainer.innerHTML = '<p>Error loading workout history</p>';
        }
    }

    async completeWorkout() {
        if (await this.workoutManager.completeWorkout()) {
            alert('Workout completed and saved!');
        } else {
            alert('Error saving workout');
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});