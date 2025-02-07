import { WorkoutProgram } from './workoutPhases';
import phase1Data from './push1.json';
import phase2Data from './push2.json';
import phase3Data from './push3.json';

export const workoutProgram: WorkoutProgram = {
  phases: [
    {
      name: "Phase 1 - Base Hypertrophy",
      description: "Moderate Volume, Moderate Intensity",
      weeks: phase1Data.weeks
    },
    {
      name: "Phase 2 - Maximum Effort",
      description: "Low Volume, High Intensity",
      weeks: phase2Data.weeks
    },
    {
      name: "Phase 3 - Supercompensation",
      description: "High volume, moderate intensity",
      weeks: phase3Data.weeks
    }
  ]
};
