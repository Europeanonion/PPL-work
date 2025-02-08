/**
 * Utility functions for the workout tracker application
 */

/**
 * Format a date to a readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

/**
 * Format weight and reps to a readable string
 * @param {number} weight - Weight in kg
 * @param {number} reps - Number of repetitions
 * @returns {string} Formatted weight and reps string
 */
export function formatSet(weight, reps) {
    return `${weight}kg × ${reps}`;
}

/**
 * Safely get an element by ID with type checking
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} The found element or null
 */
export function getElement(id) {
    return document.getElementById(id);
}

/**
 * Toggle element visibility
 * @param {HTMLElement} element - Element to toggle
 * @param {boolean} show - Whether to show or hide
 */
export function toggleVisibility(element, show) {
    element.classList.toggle('hidden', !show);
}

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
export function showError(message) {
    const errorContainer = getElement('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        toggleVisibility(errorContainer, true);
    }
}

/**
 * Validate workout data structure
 * @param {Object} data - Workout data to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function validateWorkoutData(data) {
    return data?.phases?.length > 0 
        && data.phases[0]?.weeks?.length > 0 
        && data.phases[0].weeks[0]?.days?.length > 0
        && data.phases[0].weeks[0].days[0]?.exercises?.length > 0;
}

/**
 * Fetch workout data from a JSON file
 * @param {string} filename - Name of the JSON file (without extension)
 * @returns {Promise<Object|null>} The fetched workout data or null if an error occurred
 */
export async function fetchWorkoutData(filename) {
    try {
        console.log(`Fetching: src/data/${filename}.json`);
        const response = await fetch(`src/data/${filename}.json`);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);

        const data = await response.json();
        console.log(`Fetched data:`, data);

        if (!validateWorkoutData(data)) {
            throw new Error(`${filename} contains invalid structure.`);
        }

        return data;
    } catch (error) {
        console.error("Error fetching workout data:", error);
        showError(`Error fetching workout data: ${error.message}`);
        return null;
    }
}

/**
 * Verify the existence of required JSON files
 * @returns {Promise<void>}
 */
export async function verifyJsonFiles() {
    const requiredFiles = ['program.json', 'push1.json', 'push2.json', 'push3.json'];
    const baseUrl = 'src/data/';
    
    const results = await Promise.all(
        requiredFiles.map(async file => {
            try {
                const response = await fetch(`${baseUrl}${file}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return { file, exists: true };
            } catch (error) {
                console.error(`Failed to load ${file}:`, error);
                return { file, exists: false };
            }
        })
    );

    const missingFiles = results.filter(r => !r.exists).map(r => r.file);
    if (missingFiles.length > 0) {
        throw new Error(`Missing required JSON files: ${missingFiles.join(', ')}`);
    }
}