import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiPostWorkoutService } from './ai-post-workout.service';
import { FitnessRagService } from './ai-fitness-rag.service';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

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

const PreworkoutStateAnnotation = Annotation.Root({
  // Input
  userMessage: Annotation<string>(),
  userProfile: Annotation<UserProfile>(),
  existingPlan: Annotation<WorkoutPlan | undefined>(),
  sessionId: Annotation<string | undefined>(),

  // Derived
  intent: Annotation<WorkoutIntent>(),
  profileComplete: Annotation<boolean>(),
  missingProfileFields: Annotation<string[]>(),
  ragContext: Annotation<string>(),

  // Plans and outputs
  workoutPlan: Annotation<WorkoutPlan | undefined>(),
  nutritionPlan: Annotation<NutritionPlan | undefined>(),
  safetyReport: Annotation<SafetyReport | undefined>(),
  answer: Annotation<string | undefined>(),
  progressSummary: Annotation<string | undefined>(),
  followUpQuestions: Annotation<string[]>(),
  savedToDb: Annotation<boolean>(),
  error: Annotation<string | undefined>(),
});

type PreworkoutState = typeof PreworkoutStateAnnotation.State;

@Injectable()
export class AiPreWorkoutService implements OnModuleInit {
  private readonly llm: ChatOpenAI;
  private readonly logger = new Logger(AiPreWorkoutService.name);
  private graph!: ReturnType<typeof this.buildGraph>;
  private checkpointer = new MemorySaver();

  constructor(
    private readonly configService: ConfigService,
    private readonly aiPostWorkoutService: AiPostWorkoutService,
    private readonly fitnessRagService: FitnessRagService,
  ) {
    const apiKey = configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is missing');
    }

    this.llm = new ChatOpenAI({
      apiKey,
      configuration: {
        baseURL: 'https://integrate.api.nvidia.com/v1',
      },
      model: 'openai/gpt-oss-20b',
      temperature: 0.3,
      maxTokens: 4096,
      streaming: true,
    });
  }

  async onModuleInit() {
    this.graph = this.buildGraph();
    this.logger.log('Pre-workout AI agent graph initialized');
  }

  private buildGraph() {
    const graph = new StateGraph(PreworkoutStateAnnotation)
      .addNode('intentClassifier', this.intentClassifierNode.bind(this))
      .addNode(
        'checkProfileCompleteness',
        this.checkProfileCompletenessNode.bind(this),
      )
      .addNode(
        'retrieveFitnessKnowledge',
        this.retrieveFitnessKnowledgeNode.bind(this),
      )
      .addNode('generateWorkoutPlan', this.generateWorkoutPlanNode.bind(this))
      .addNode('safetyCheck', this.safetyCheckNode.bind(this))
      .addNode('adjustPlan', this.adjustPlanNode.bind(this))
      .addNode('recommendNutrition', this.recommendNutritionNode.bind(this))
      .addNode('progressTracker', this.progressTrackerNode.bind(this))
      .addNode(
        'answerFitnessQuestion',
        this.answerFitnessQuestionNode.bind(this),
      )
      .addNode('savePlanToDatabase', this.savePlanToDatabaseNode.bind(this))
      .addNode('returnFinalPlan', this.returnFinalPlanNode.bind(this))

      // Entry
      .addEdge(START, 'intentClassifier')

      // Intent routing
      .addConditionalEdges('intentClassifier', this.routeByIntent.bind(this), {
        profile_check: 'checkProfileCompleteness',
        answer_question: 'answerFitnessQuestion',
        track_progress: 'progressTracker',
      })

      // Profile completeness routing
      .addConditionalEdges(
        'checkProfileCompleteness',
        this.routeAfterProfileCheck.bind(this),
        {
          retrieve_knowledge: 'retrieveFitnessKnowledge',
          missing_profile: 'returnFinalPlan', // asks user for missing data
        },
      )

      // Post-RAG routing
      .addConditionalEdges(
        'retrieveFitnessKnowledge',
        this.routeAfterRAG.bind(this),
        {
          generate_plan: 'generateWorkoutPlan',
          modify_plan: 'adjustPlan',
          injury_check: 'safetyCheck',
          diet_only: 'recommendNutrition',
        },
      )

      // Safety → adjust if issues found
      .addConditionalEdges('safetyCheck', this.routeAfterSafety.bind(this), {
        safe: 'recommendNutrition',
        needs_adjustment: 'adjustPlan',
      })

      .addEdge('generateWorkoutPlan', 'safetyCheck')
      .addEdge('adjustPlan', 'safetyCheck')
      .addEdge('recommendNutrition', 'savePlanToDatabase')
      .addEdge('savePlanToDatabase', 'returnFinalPlan')
      .addEdge('progressTracker', 'returnFinalPlan')
      .addEdge('answerFitnessQuestion', 'returnFinalPlan')
      .addEdge('returnFinalPlan', END);

    return graph.compile({ checkpointer: this.checkpointer });
  }

  private routeByIntent(state: PreworkoutState): string {
    switch (state.intent) {
      case WorkoutIntent.TRACK_PROGRESS:
        return 'track_progress';
      case WorkoutIntent.ASK_FITNESS_QUESTION:
        return 'answer_question';
      default:
        return 'profile_check';
    }
  }

  private routeAfterProfileCheck(state: PreworkoutState): string {
    return state.profileComplete ? 'retrieve_knowledge' : 'missing_profile';
  }

  private routeAfterRAG(state: PreworkoutState): string {
    switch (state.intent) {
      case WorkoutIntent.MODIFY_PLAN:
        return 'modify_plan';
      case WorkoutIntent.CHECK_INJURY_SAFE:
        return 'injury_check';
      case WorkoutIntent.GENERATE_DIET_PLAN:
        return 'diet_only';
      default:
        return 'generate_plan';
    }
  }

  private routeAfterSafety(state: PreworkoutState): string {
    if (
      !state.safetyReport?.isSafe &&
      state.safetyReport?.modifications?.length
    ) {
      return 'needs_adjustment';
    }
    return 'safe';
  }

  private async intentClassifierNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: intentClassifier');

    const systemPrompt = `You are a fitness AI assistant intent classifier.
    Classify the user's message into exactly one of these intents:
    - CREATE_PLAN: User wants a new workout plan generated
    - MODIFY_PLAN: User wants to change or adjust an existing plan
    - ASK_FITNESS_QUESTION: General fitness, form, or exercise question
    - TRACK_PROGRESS: User wants to review workout history or performance
    - GENERATE_DIET_PLAN: User wants a nutrition or diet plan
    - CHECK_INJURY_SAFE: User has an injury and wants safe exercise alternatives

    Respond ONLY with a JSON object: { "intent": "<INTENT>" }`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(state.userMessage),
      ]);

      const parsed: any = this.parseJsonFromLLM(response.content);
      const intent: WorkoutIntent =
        WorkoutIntent[parsed.intent as keyof typeof WorkoutIntent] ??
        WorkoutIntent.UNKNOWN;

      this.logger.debug(`Classified intent: ${intent}`);
      return { intent };
    } catch (err) {
      this.logger.error('Intent classification failed', err);
      return {
        intent: WorkoutIntent.UNKNOWN,
        error: 'Intent classification failed',
      };
    }
  }

  private async checkProfileCompletenessNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: checkProfileCompleteness');

    const required: (keyof UserProfile)[] = [
      'fitnessGoal',
      'experienceLevel',
      'availableDays',
    ];

    const missing = required.filter((field) => !state.userProfile?.[field]);

    if (missing.length === 0) {
      return { profileComplete: true, missingProfileFields: [] };
    }

    const friendlyLabels: Record<string, string> = {
      fitnessGoal: 'fitness goal (e.g. muscle gain, fat loss, endurance)',
      experienceLevel: 'experience level (beginner / intermediate / advanced)',
      availableDays: 'number of days per week available to train',
    };

    const missingLabels = missing.map((f) => friendlyLabels[f] ?? f);

    return {
      profileComplete: false,
      missingProfileFields: missingLabels,
      answer: `To create a personalised plan I still need a few details:\n${missingLabels.map((l) => `• ${l}`).join('\n')}`,
    };
  }

  private async retrieveFitnessKnowledgeNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: retrieveFitnessKnowledge');

    try {
      const queryParts: string[] = [state.userMessage];

      if (state.userProfile?.injuries?.length) {
        queryParts.push(`injuries: ${state.userProfile.injuries.join(', ')}`);
      }
      if (state.userProfile?.fitnessGoal) {
        queryParts.push(`goal: ${state.userProfile.fitnessGoal}`);
      }

      const combinedQuery = queryParts.join(' | ');
      const results = await this.fitnessRagService.searchFitnessKnowledge(
        combinedQuery,
        5,
      );

      const ragContext = results
        .filter((r) => r.score > 0.3)
        .map(
          (r, i) =>
            `[Knowledge ${i + 1}] (score: ${r.score.toFixed(2)})\n${r.content.trim()}`,
        )
        .join('\n\n');

      return { ragContext: ragContext || 'No relevant knowledge found.' };
    } catch (err) {
      this.logger.warn('RAG retrieval failed, continuing without context', err);
      return { ragContext: '' };
    }
  }

  private async generateWorkoutPlanNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: generateWorkoutPlan');

    const { userProfile, ragContext } = state;

    const systemPrompt = `You are an elite personal trainer. Generate a structured, periodised weekly workout plan.

    User Profile:
    - Name: ${userProfile.name ?? 'Unknown'}
    - Age: ${userProfile.age ?? 'Not specified'}
    - Weight: ${userProfile.weight ?? 'Not specified'} kg
    - Height: ${userProfile.height ?? 'Not specified'} cm
    - Goal: ${userProfile.fitnessGoal}
    - Experience: ${userProfile.experienceLevel}
    - Available days/week: ${userProfile.availableDays}
    - Equipment: ${userProfile.equipment ?? 'Full gym'}
    - Injuries: ${userProfile.injuries?.join(', ') || 'None'}

    Relevant fitness knowledge:
    ${ragContext}

    Respond ONLY with valid JSON matching this exact structure:
    {
      "days": [
        {
          "day": "Monday",
          "focus": "Push / Chest & Triceps",
          "warmup": "...",
          "exercises": [
            { "name": "...", "sets": 4, "reps": "6-8", "rest": "90s", "notes": "..." }
          ],
          "cooldown": "..."
        }
      ],
      "weeklyVolume": "...",
      "progressionStrategy": "...",
      "notes": "..."
    }`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(
          `Create a ${userProfile.availableDays}-day per week plan focused on ${userProfile.fitnessGoal}.`,
        ),
      ]);

      const workoutPlan = this.parseJsonFromLLM(
        response.content,
      ) as WorkoutPlan;
      return { workoutPlan };
    } catch (err) {
      this.logger.error('Workout plan generation failed', err);
      return {
        error: `Workout plan generation failed: ${(err as Error).message}`,
      };
    }
  }

  private async safetyCheckNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: safetyCheck');

    const { userProfile, workoutPlan, ragContext } = state;

    if (!userProfile.injuries?.length) {
      return {
        safetyReport: {
          isSafe: true,
          warnings: [],
          modifications: [],
          unsafeExercises: [],
        },
      };
    }

    const exerciseList = workoutPlan?.days
      .flatMap((d) => d.exercises.map((e) => e.name))
      .join(', ');

    const systemPrompt = `You are a sports medicine specialist and certified strength coach.
    Review the following exercise list for a user with the noted injuries.
    Use the reference knowledge provided to flag unsafe exercises and suggest modifications.

    User injuries: ${userProfile.injuries.join(', ')}
    Exercises in plan: ${exerciseList}

    Reference knowledge:
    ${ragContext}

    Respond ONLY with valid JSON:
    {
      "isSafe": true | false,
      "warnings": ["..."],
      "unsafeExercises": ["..."],
      "modifications": ["Replace X with Y because..."]
    }`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage('Review this plan for safety.'),
      ]);

      const safetyReport = this.parseJsonFromLLM(
        response.content,
      ) as SafetyReport;
      return { safetyReport };
    } catch (err) {
      this.logger.error('Safety check failed', err);
      return {
        safetyReport: {
          isSafe: true,
          warnings: [
            'Safety check could not be completed — proceed with caution.',
          ],
          modifications: [],
          unsafeExercises: [],
        },
      };
    }
  }

  private async adjustPlanNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: adjustPlan');

    const { workoutPlan, safetyReport, existingPlan, userMessage, ragContext } =
      state;
    const planToAdjust = workoutPlan ?? existingPlan;

    if (!planToAdjust) {
      return { error: 'No workout plan available to adjust.' };
    }

    const adjustmentReason = safetyReport?.modifications?.length
      ? `Apply these safety modifications: ${safetyReport.modifications.join('; ')}`
      : `User request: ${userMessage}`;

    const systemPrompt = `You are an expert personal trainer. Modify the provided workout plan.
    Reason for modification: ${adjustmentReason}

    Relevant knowledge:
    ${ragContext}

    Return ONLY the updated workout plan as valid JSON with the same structure as the input.`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(JSON.stringify(planToAdjust)),
      ]);

      const updatedPlan = this.parseJsonFromLLM(
        response.content,
      ) as WorkoutPlan;
      return { workoutPlan: updatedPlan };
    } catch (err) {
      this.logger.error('Plan adjustment failed', err);
      return { error: `Plan adjustment failed: ${(err as Error).message}` };
    }
  }

  private async recommendNutritionNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: recommendNutrition');

    const { userProfile, ragContext } = state;

    const systemPrompt = `You are a registered sports dietitian. Create a personalised nutrition plan.

    User Profile:
    - Weight: ${userProfile.weight ?? 'Not specified'} kg
    - Goal: ${userProfile.fitnessGoal}
    - Experience: ${userProfile.experienceLevel}
    - Dietary restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}

    Relevant nutritional knowledge:
    ${ragContext}

    Respond ONLY with valid JSON:
    {
      "dailyCalories": 2800,
      "macros": { "protein": 180, "carbs": 320, "fat": 80 },
      "mealTiming": "...",
      "preworkoutMeal": "...",
      "postworkoutMeal": "...",
      "hydration": "...",
      "supplements": ["..."]
    }`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(`Nutrition plan for ${userProfile.fitnessGoal}`),
      ]);

      const nutritionPlan = this.parseJsonFromLLM(
        response.content,
      ) as NutritionPlan;
      return { nutritionPlan };
    } catch (err) {
      this.logger.error('Nutrition recommendation failed', err);
      return {
        error: `Nutrition recommendation failed: ${(err as Error).message}`,
      };
    }
  }

  private async progressTrackerNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: progressTracker');

    try {
      const postWorkoutSummary =
        await this.aiPostWorkoutService.callPostWorkoutAi();

      return {
        progressSummary:
          typeof postWorkoutSummary === 'string'
            ? postWorkoutSummary
            : JSON.stringify(postWorkoutSummary),
      };
    } catch (err) {
      this.logger.error('Progress tracker failed', err);
      return { error: `Progress tracking failed: ${(err as Error).message}` };
    }
  }

  private async answerFitnessQuestionNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: answerFitnessQuestion');

    const { userMessage, userProfile } = state;

    // Retrieve targeted RAG context for the question
    let ragContext = state.ragContext;
    if (!ragContext) {
      try {
        const results = await this.fitnessRagService.searchFitnessKnowledge(
          userMessage,
          3,
        );
        ragContext = results
          .filter((r) => r.score > 0.3)
          .map((r) => r.content.trim())
          .join('\n\n');
      } catch {
        ragContext = '';
      }
    }

    const systemPrompt = `You are a knowledgeable, friendly fitness coach.
Answer the user's question accurately and concisely.
${ragContext ? `\nUse this knowledge to inform your answer:\n${ragContext}` : ''}
Tailor the answer to the user's experience level: ${userProfile?.experienceLevel ?? 'general audience'}.`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMessage),
      ]);

      return {
        answer:
          typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content),
      };
    } catch (err) {
      this.logger.error('Answer generation failed', err);
      return { error: `Answer generation failed: ${(err as Error).message}` };
    }
  }

  private async savePlanToDatabaseNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: savePlanToDatabase');

    // No plan to save → skip gracefully
    if (!state.workoutPlan && !state.nutritionPlan) {
      return { savedToDb: false };
    }

    try {
      // TODO: Inject your database / repository service here and persist
      // e.g. await this.workoutRepository.upsert({ userId: state.userProfile.userId, plan: state.workoutPlan, nutrition: state.nutritionPlan });

      this.logger.log(
        `Plan saved for user: ${state.userProfile?.userId ?? 'unknown'}`,
      );

      return { savedToDb: true };
    } catch (err) {
      this.logger.error('Failed to save plan to database', err);
      return {
        savedToDb: false,
        error: `DB save failed: ${(err as Error).message}`,
      };
    }
  }

  private async returnFinalPlanNode(
    state: PreworkoutState,
  ): Promise<Partial<PreworkoutState>> {
    this.logger.debug('Node: returnFinalPlan');

    // Generate contextual follow-up suggestions
    const followUpQuestions: string[] = [];

    if (state.workoutPlan) {
      followUpQuestions.push(
        'Would you like me to adjust the intensity or volume?',
      );
      followUpQuestions.push(
        'Do you want a detailed warm-up routine for any session?',
      );
    }

    if (!state.nutritionPlan && state.workoutPlan) {
      followUpQuestions.push(
        'Would you like a nutrition plan to complement this workout?',
      );
    }

    if (state.safetyReport?.warnings?.length) {
      followUpQuestions.push(
        'Would you like more details on the injury-safe modifications?',
      );
    }

    return { followUpQuestions };
  }

  async runAgent(input: PreWorkoutAgentInput): Promise<PreWorkoutAgentOutput> {
    if (!this.graph) {
      throw new Error(
        'Agent graph is not initialized. Ensure onModuleInit has run.',
      );
    }

    const threadId =
      input.sessionId ?? `${input.userProfile.userId}-${Date.now()}`;

    this.logger.log(
      `Running pre-workout agent for user ${input.userProfile.userId} [thread: ${threadId}]`,
    );

    const initialState: Partial<PreworkoutState> = {
      userMessage: input.userMessage,
      userProfile: input.userProfile,
      existingPlan: input.existingPlan,
      sessionId: threadId,
      savedToDb: false,
      followUpQuestions: [],
      ragContext: '',
    };

    try {
      const finalState = await this.graph.invoke(initialState, {
        configurable: { thread_id: threadId },
      });

      return {
        intent: finalState.intent ?? WorkoutIntent.UNKNOWN,
        workoutPlan: finalState.workoutPlan,
        nutritionPlan: finalState.nutritionPlan,
        safetyReport: finalState.safetyReport,
        answer: finalState.answer,
        progressSummary: finalState.progressSummary,
        followUpQuestions: finalState.followUpQuestions ?? [],
        savedToDb: finalState.savedToDb ?? false,
        error: finalState.error,
      };
    } catch (err) {
      const message = (err as Error).message;
      this.logger.error(`Agent run failed: ${message}`, err);
      return {
        intent: WorkoutIntent.UNKNOWN,
        savedToDb: false,
        followUpQuestions: [],
        error: message,
      };
    }
  }

  private parseJsonFromLLM(content: unknown): unknown {
    if (typeof content !== 'string') {
      throw new Error('LLM response content is not a string');
    }

    const cleaned = content
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const openBraces = (cleaned.match(/{/g) || []).length;
    const closeBraces = (cleaned.match(/}/g) || []).length;

    if (openBraces !== closeBraces) {
      throw new Error(
        `LLM response appears truncated — mismatched braces (open: ${openBraces}, close: ${closeBraces}). Increase maxTokens.`,
      );
    }

    return JSON.parse(cleaned);
  }
}
