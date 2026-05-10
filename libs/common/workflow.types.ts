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

export enum WorkoutIntent {
  CREATE_PLAN = 'CREATE_PLAN',
  MODIFY_PLAN = 'MODIFY_PLAN',
  ASK_FITNESS_QUESTION = 'ASK_FITNESS_QUESTION',
  TRACK_PROGRESS = 'TRACK_PROGRESS',
  GENERATE_DIET_PLAN = 'GENERATE_DIET_PLAN',
  CHECK_INJURY_SAFE = 'CHECK_INJURY_SAFE',
  UNKNOWN = 'UNKNOWN',
}

export interface UserProfile {
  userId: string;
  name?: string;
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  fitnessGoal?: string; // e.g. muscle_gain, fat_loss, endurance
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  injuries?: string[];
  availableDays?: number;
  equipment?: string;
  dietaryRestrictions?: string[];
}

export interface WorkoutPlan {
  days: WorkoutDay[];
  weeklyVolume: string;
  progressionStrategy: string;
  notes: string;
}

export interface WorkoutDay {
  day: string;
  focus: string;
  exercises: Exercise[];
  warmup: string;
  cooldown: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface NutritionPlan {
  dailyCalories: number;
  macros: { protein: number; carbs: number; fat: number };
  mealTiming: string;
  preworkoutMeal: string;
  postworkoutMeal: string;
  hydration: string;
  supplements?: string[];
}

export interface SafetyReport {
  isSafe: boolean;
  warnings: string[];
  modifications: string[];
  unsafeExercises: string[];
}

export interface PreWorkoutAgentInput {
  userMessage: string;
  userProfile: UserProfile;
  existingPlan?: WorkoutPlan;
  sessionId?: string;
}

export interface PreWorkoutAgentOutput {
  intent: WorkoutIntent;
  workoutPlan?: WorkoutPlan;
  nutritionPlan?: NutritionPlan;
  safetyReport?: SafetyReport;
  answer?: string;
  progressSummary?: string;
  followUpQuestions?: string[];
  savedToDb: boolean;
  error?: string;
}


