export interface Substitution {
  name: string;
  videoUrl?: string;
}

export interface Exercise {
  name: string;
  videoUrl?: string;
  warmupSets: number;
  workingSets: number;
  reps: string;
  load: string;
  rpe: string;
  rest: string;
  substitutions?: {
    option1?: Substitution;
    option2?: Substitution;
  };
  notes: string;
}

export interface Day {
  name: string;
  exercises: Exercise[];
}

export interface Week {
  weekNumber: number;
  days: Day[];
}

export interface Phase {
  name: string;
  description: string;
  weeks: Week[];
}

export interface WorkoutProgram {
  phases: Phase[];
}
