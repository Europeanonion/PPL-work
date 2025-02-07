import { Exercise, Week, Phase, WorkoutProgram } from '../data/workoutPhases';

interface WorkoutDay {
  name: string;
  exercises: Exercise[];
}

function extractUrlAndName(text: string): { name: string; videoUrl?: string } {
  if (!text) return { name: '' };
  const match = text.match(/^(.*?)\s*\[(https?:\/\/[^\]]+)\]$/);
  if (match) {
    return { name: match[1].trim(), videoUrl: match[2] };
  }
  return { name: text.trim() };
}

function parseExercise(row: string[]): Exercise | null {
  if (!row[1]) return null;
  
  const { name, videoUrl } = extractUrlAndName(row[1]);
  const sub1 = extractUrlAndName(row[8]);
  const sub2 = extractUrlAndName(row[9]);

  return {
    name,
    videoUrl,
    warmupSets: parseInt(row[2]) || 0,
    workingSets: parseInt(row[3]) || 0,
    reps: row[4],
    load: row[5],
    rpe: row[6],
    rest: row[7],
    substitutions: {
      option1: {
        name: sub1.name,
        videoUrl: sub1.videoUrl
      },
      option2: {
        name: sub2.name,
        videoUrl: sub2.videoUrl
      }
    },
    notes: row[10]
  };
}

function parseWeek(weekRows: string[][], weekNumber: number): Week {
  const days: WorkoutDay[] = [];
  let currentDay: WorkoutDay | null = null;

  weekRows.forEach(row => {
    if (row[0] && (row[0].includes('#') || !row[0].startsWith('Week'))) {
      if (currentDay) {
        days.push(currentDay);
      }
      currentDay = {
        name: row[0],
        exercises: []
      };
    }

    const exercise = parseExercise(row);
    if (exercise && currentDay) {
      currentDay.exercises.push(exercise);
    }
  });

  if (currentDay) {
    days.push(currentDay);
  }

  return {
    weekNumber,
    days
  };
}

export function convertCsvToJson(csvData: string[][]): WorkoutProgram {
  const phaseInfo = csvData[0][0].split('-');
  const phase: Phase = {
    name: phaseInfo[0].trim(),
    description: phaseInfo[1]?.trim() || '',
    weeks: []
  };

  let currentWeekRows: string[][] = [];
  let currentWeekNumber = 1;

  csvData.slice(2).forEach(row => {
    if (row[0]?.startsWith('Week')) {
      if (currentWeekRows.length > 0) {
        phase.weeks.push(parseWeek(currentWeekRows, currentWeekNumber));
      }
      currentWeekNumber = parseInt(row[0].split(' ')[1]) || currentWeekNumber + 1;
      currentWeekRows = [];
    }
    currentWeekRows.push(row);
  });

  if (currentWeekRows.length > 0) {
    phase.weeks.push(parseWeek(currentWeekRows, currentWeekNumber));
  }

  return {
    phases: [phase]
  };
}

export function parseWorkoutCsv(csvData: string): Phase {
  const lines = csvData.split('\n').map(line => line.split('","').map(cell => cell.replace(/^"|"$/g, '')));
  return convertCsvToJson(lines).phases[0];
}
