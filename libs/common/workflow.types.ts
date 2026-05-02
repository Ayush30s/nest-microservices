export type ReportType = 'daily' | 'weekly' | 'monthly';

export type WorkoutEntry = {
  date: Date;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
};

export type Report = {
  summary: string;
  totalWorkouts: number;
  totalVolume: number;
  progressTrend: string;
  highlights: string[];
};

export type Recommendations = {
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
};
