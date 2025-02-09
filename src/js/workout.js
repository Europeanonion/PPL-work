import { workoutProgram } from '../data/program.json' assert { type: 'json' };

export class WorkoutManager {
    constructor() {
        this.phases = [];
        this.currentPhase = null;
        this.currentWeek = null;
        this.init();
    }

    async init() {
        try {
            const response = await fetch('data/phases.json');
            const data = await response.json();
            this.phases = data.phases;
            this.loadAllPhases();
            this.attachEventListeners();
        } catch (error) {
            console.error('Failed to load workout phases:', error);
            this.showError('Failed to load workout data');
        }
    }

    loadAllPhases() {
        const select = document.getElementById('workoutPhase');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Workout Phase --</option>';
        this.phases.forEach(phase => {
            const option = document.createElement('option');
            option.value = phase.id;
            option.textContent = `${phase.name} - ${phase.description}`;
            select.appendChild(option);
        });
    }

    attachEventListeners() {
        const select = document.getElementById('workoutPhase');
        if (!select) return;

        select.addEventListener('change', (e) => this.handlePhaseSelection(e));
    }

    async handlePhaseSelection(event) {
        const phaseId = event.target.value;
        if (!phaseId) {
            this.clearWorkoutDisplay();
            return;
        }

        this.showLoading();
        try {
            const response = await fetch(`data/${phaseId}.json`);
            const phaseData = await response.json();
            this.renderWorkoutPhase(phaseData);
        } catch (error) {
            console.error('Failed to load phase data:', error);
            this.showError('Failed to load workout phase');
        } finally {
            this.hideLoading();
        }
    }

    renderWorkoutPhase(phaseData) {
        const container = document.getElementById('exerciseList');
        if (!container) return;

        container.innerHTML = `
            <div class="phase-header">
                <h2>${phaseData.name}</h2>
                <p class="phase-description">${phaseData.description}</p>
            </div>
            ${this.renderWeeks(phaseData.weeks)}
        `;
    }

    renderWeeks(weeks) {
        return weeks.map(week => `
            <div class="week-card">
                <h3>Week ${week.weekNumber}</h3>
                ${week.days.map(day => this.renderDay(day)).join('')}
            </div>
        `).join('');
    }

    renderDay(day) {
        return `
            <div class="day-card">
                <h4>${day.name}</h4>
                ${day.exercises.map(exercise => this.renderExercise(exercise)).join('')}
            </div>
        `;
    }

    renderExercise(exercise) {
        return `
            <div class="exercise-item">
                <h5>${exercise.name}</h5>
                <p>Sets: ${exercise.workingSets} × ${exercise.reps} @ ${exercise.load}</p>
                <p>RPE: ${exercise.rpe} | Rest: ${exercise.rest}</p>
                ${exercise.notes ? `<p class="notes">${exercise.notes}</p>` : ''}
            </div>
        `;
    }

    showLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) loader.classList.remove('hidden');
    }

    hideLoading() {
        const loader = document.getElementById('loadingIndicator');
        if (loader) loader.classList.add('hidden');
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.classList.remove('hidden');
        }
    }

    clearWorkoutDisplay() {
        const container = document.getElementById('exerciseList');
        if (container) container.innerHTML = '';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    const workoutManager = new WorkoutManager();
});