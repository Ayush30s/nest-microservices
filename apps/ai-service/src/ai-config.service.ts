import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import {
  Recommendations,
  Report,
  ReportType,
  WorkoutEntry,
} from 'libs/common/workflow.types';

@Injectable()
export class AiConfigService implements OnModuleInit {
  private readonly llm: ChatOpenAI;
  private readonly logger = new Logger(AiConfigService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

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
    await this.callAI();
  }

  async callAI() {
    const stream = await this.llm.invoke([
      {
        role: 'assistant',
        content: 'Say hello and generate an art of characters and symbols',
      },
    ]);
    this.logger.log(stream.content);

    const result = await this.generateUserReport('1', 'weekly');
    this.logger.verbose(
      'Report pipeline complete — final output returned to caller:',
    );
    this.logger.verbose(JSON.stringify(result, null, 2));
  }

  private parseJsonFromLLM(content: unknown) {
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

  ReportStateAnnotation = Annotation.Root({
    userId: Annotation<string>(),
    reportType: Annotation<ReportType>(),
    workoutData: Annotation<WorkoutEntry[]>(),
    analysis: Annotation<string>(),
    report: Annotation<Report>(),
    recommendations: Annotation<Recommendations>(),
  });

  async getWorkoutDataFromDatabase(
    userId: string,
    reportType: ReportType,
  ): Promise<WorkoutEntry[]> {
    this.logger.debug(
      `Querying workout data — userId: ${userId}, reportType: ${reportType}`,
    );

    return [
      {
        date: new Date('2026-04-26'),
        exercise: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 50,
        duration: 35,
      },
      {
        date: new Date('2026-04-27'),
        exercise: 'Squat',
        sets: 4,
        reps: 8,
        weight: 80,
        duration: 45,
      },
      {
        date: new Date('2026-04-28'),
        exercise: 'Deadlift',
        sets: 3,
        reps: 6,
        weight: 100,
        duration: 40,
      },
      {
        date: new Date('2026-04-30'),
        exercise: 'Shoulder Press',
        sets: 3,
        reps: 12,
        weight: 35,
        duration: 30,
      },
      {
        date: new Date('2026-05-01'),
        exercise: 'Pull Ups',
        sets: 4,
        reps: 8,
        weight: 0,
        duration: 25,
      },
    ];
  }

  async fetchWorkoutDataNode(state: typeof this.ReportStateAnnotation.State) {
    this.logger.debug(
      `[Node: fetchWorkoutData] Fetching workout entries for userId: ${state.userId}`,
    );

    const workoutData = await this.getWorkoutDataFromDatabase(
      state.userId,
      state.reportType,
    );

    this.logger.verbose(
      `[Node: fetchWorkoutData] ${workoutData.length} workout entries retrieved:`,
    );
    this.logger.verbose(JSON.stringify(workoutData, null, 2));

    return { workoutData };
  }

  async analyzeWorkoutNode(state: typeof this.ReportStateAnnotation.State) {
    this.logger.debug(
      `[Node: analyzeWorkout] Sending ${state.workoutData.length} entries to LLM for fitness analysis`,
    );

    const workoutJson = JSON.stringify(state.workoutData, null, 2);

    const totalSessions = state.workoutData.length;
    const totalVolume = state.workoutData.reduce(
      (sum, w) => sum + w.sets * w.reps * w.weight,
      0,
    );
    const totalDuration = state.workoutData.reduce(
      (sum, w) => sum + w.duration,
      0,
    );
    const uniqueExercises = [
      ...new Set(state.workoutData.map((w) => w.exercise)),
    ];
    const exerciseBreakdown = uniqueExercises
      .map((ex) => {
        const entries = state.workoutData.filter((w) => w.exercise === ex);
        const vol = entries.reduce((s, e) => s + e.sets * e.reps * e.weight, 0);
        return `  - ${ex}: ${entries.length} session(s), volume = ${vol} kg`;
      })
      .join('\n');

    const response = await this.llm.invoke([
      {
        role: 'system',
        content: `You are an expert certified fitness analyst and sports scientist with 15+ years of experience in strength training, hypertrophy, and athletic performance assessment. Your task is to produce a thorough, evidence-based, and numerically accurate analysis of a user's workout data.

CRITICAL RULES — follow every rule without exception:
1. Base EVERY claim exclusively on the provided workout data. Do NOT invent sessions, exercises, or metrics not present in the data.
2. Compute all numerical values (volume, averages, totals) precisely from the raw data supplied. Never estimate or approximate numbers that can be calculated exactly.
3. Identify genuine patterns (frequency, muscle group balance, intensity trends, rest days) rather than generic commentary.
4. Highlight both strengths and clear gaps (e.g. missing muscle groups, insufficient rest, volume drops).
5. Use standard fitness terminology correctly: volume (sets × reps × weight), intensity (%1RM or absolute weight), frequency (sessions per week per muscle group), progressive overload.
6. Your analysis will be fed directly into a report-generation step — be precise, structured, and complete so the report can be generated without any additional assumptions.`,
      },
      {
        role: 'user',
        content: `Perform a comprehensive ${state.reportType} fitness analysis for user ${state.userId}.

=== PRE-COMPUTED SUMMARY (verify and use these numbers) ===
- Total training sessions: ${totalSessions}
- Total training volume: ${totalVolume} kg (sum of sets × reps × weight across all sessions)
- Total training time: ${totalDuration} minutes
- Exercises covered: ${uniqueExercises.join(', ')}

Per-exercise volume breakdown:
${exerciseBreakdown}

=== RAW WORKOUT DATA ===
${workoutJson}

=== ANALYSIS REQUIREMENTS ===
Produce a structured analysis covering ALL of the following sections. Use the exact section headers listed below:

**1. VOLUME & INTENSITY OVERVIEW**
- Total volume, per-session volume average, heaviest lift, lightest lift
- Volume distribution across muscle groups (chest, legs, back, shoulders, bodyweight)

**2. TRAINING FREQUENCY & CONSISTENCY**
- Sessions per week, rest day pattern, any missed days or gaps in the ${state.reportType} window
- Comment on whether frequency is optimal for the exercises performed

**3. PROGRESSIVE OVERLOAD ASSESSMENT**
- Are weights, reps, or sets increasing, flat, or decreasing across sessions?
- Identify which exercises show positive, neutral, or negative trends

**4. MUSCLE GROUP BALANCE**
- Which primary muscle groups are trained (push/pull/legs breakdown)?
- Are there any muscle groups that appear undertrained or entirely absent?

**5. RECOVERY & FATIGUE INDICATORS**
- Back-to-back training days, high-volume session clustering, rest adequacy

**6. PERFORMANCE HIGHLIGHTS**
- Best-performing session or lift (highest volume, highest weight)
- Any notable achievements in this ${state.reportType} period

**7. IDENTIFIED GAPS & RISKS**
- Specific missing muscle groups, volume deficits, overtraining risks, or imbalances

Be factual, specific, and numerical throughout. Avoid vague statements like "good job" or "keep it up".`,
      },
    ]);

    const analysis = String(response.content);

    this.logger.verbose(
      `[Node: analyzeWorkout] LLM analysis complete (${analysis.length} chars):`,
    );
    this.logger.verbose(analysis);

    return { analysis };
  }

  async generateReportNode(state: typeof this.ReportStateAnnotation.State) {
    this.logger.debug(
      `[Node: generateReport] Building structured JSON report from LLM analysis`,
    );

    const totalWorkouts = state.workoutData.length;
    const totalVolume = state.workoutData.reduce(
      (sum, w) => sum + w.sets * w.reps * w.weight,
      0,
    );

    const response = await this.llm.invoke([
      {
        role: 'system',
        content: `You are a precision fitness report generator. Your ONLY job is to output a single valid JSON object — no prose, no markdown, no code fences, no explanations, no trailing text.

STRICT OUTPUT CONTRACT:
- Output MUST start with { and end with }
- All string values must be meaningful, specific, and derived from the analysis provided
- "totalWorkouts" MUST equal ${totalWorkouts} (this is a hard fact from the raw data)
- "totalVolume" MUST equal ${totalVolume} (this is the exact computed value: sum of sets × reps × weight)
- "progressTrend" must be one of exactly: "improving", "maintaining", "declining", or "insufficient_data"
- "highlights" must contain 3 to 5 specific, data-backed bullet points — no generic filler
- Every field in the JSON shape must be present; no field may be null, undefined, or an empty string/array`,
      },
      {
        role: 'user',
        content: `Generate a structured fitness report JSON from the analysis below.

=== ANALYSIS ===
${state.analysis}

=== HARD CONSTRAINTS (do not override) ===
- totalWorkouts: ${totalWorkouts}
- totalVolume: ${totalVolume}

=== REQUIRED JSON SHAPE (output ONLY this object) ===
{
  "summary": "<2–3 sentence executive summary of the user's ${state.reportType} performance, citing specific numbers>",
  "totalWorkouts": <integer, must be ${totalWorkouts}>,
  "totalVolume": <number, must be ${totalVolume}>,
  "progressTrend": "<one of: improving | maintaining | declining | insufficient_data>",
  "highlights": [
    "<specific highlight 1 with numbers>",
    "<specific highlight 2 with numbers>",
    "<specific highlight 3 with numbers>"
  ]
}`,
      },
    ]);

    const report = this.parseJsonFromLLM(String(response.content));

    // Enforce hard facts that must never be hallucinated
    report.totalWorkouts = totalWorkouts;
    report.totalVolume = totalVolume;

    this.logger.verbose(
      `[Node: generateReport] Report JSON parsed and hard constraints enforced:`,
    );
    this.logger.verbose(JSON.stringify(report, null, 2));

    return { report };
  }

  async generateRecommendationsNode(
    state: typeof this.ReportStateAnnotation.State,
  ) {
    this.logger.debug(
      `[Node: generateRecommendations] Generating 3-tier recommendations for userId: ${state.userId}`,
    );

    const uniqueExercises = [
      ...new Set(state.workoutData.map((w) => w.exercise)),
    ];

    const response = await this.llm.invoke([
      {
        role: 'system',
        content: `You are an elite strength and conditioning coach. Your task is to produce an actionable, personalised recommendation plan based on a user's actual workout data and expert analysis report.

CRITICAL RULES:
1. Every recommendation must be directly traceable to a specific finding in the analysis or report provided. No generic advice.
2. Recommendations must be concrete and actionable — include specific exercises, rep ranges, frequency targets, or volume changes where relevant.
3. Do NOT recommend exercises or changes not supported by the data context.
4. Output ONLY a single valid JSON object. No prose, no markdown, no code fences, no preamble, no trailing text.
5. All three arrays ("immediate", "shortTerm", "longTerm") must be present and each must contain exactly 3 items.
6. Each recommendation string must be a complete, standalone action item (40–120 characters).`,
      },
      {
        role: 'user',
        content: `Generate a personalised 3-tier recommendation plan based on the fitness analysis and report below.

=== EXERCISES PERFORMED THIS PERIOD ===
${uniqueExercises.join(', ')}

=== EXPERT ANALYSIS ===
${state.analysis}

=== STRUCTURED REPORT ===
${JSON.stringify(state.report, null, 2)}

=== RECOMMENDATION GUIDELINES ===
- "immediate" → Actions the user should take in their very NEXT session or within 24–48 hours (e.g. correct a form issue, add a missing muscle group, adjust rest periods)
- "shortTerm" → Changes to implement over the next 1–4 weeks (e.g. progressive overload targets, frequency adjustments, new exercises to introduce)
- "longTerm" → Strategic goals and structural programme changes for the next 1–3 months (e.g. periodisation strategy, strength benchmarks to hit, muscle balance goals)

=== REQUIRED JSON SHAPE (output ONLY this object) ===
{
  "immediate": [
    "<specific immediate action 1>",
    "<specific immediate action 2>",
    "<specific immediate action 3>"
  ],
  "shortTerm": [
    "<specific short-term action 1>",
    "<specific short-term action 2>",
    "<specific short-term action 3>"
  ],
  "longTerm": [
    "<specific long-term action 1>",
    "<specific long-term action 2>",
    "<specific long-term action 3>"
  ]
}`,
      },
    ]);

    const recommendations = this.parseJsonFromLLM(String(response.content));

    this.logger.verbose(
      `[Node: generateRecommendations] Recommendations JSON parsed successfully:`,
    );
    this.logger.verbose(JSON.stringify(recommendations, null, 2));

    return { recommendations };
  }

  createReportGraph() {
    this.logger.debug(
      'Compiling LangGraph workflow — nodes: fetchWorkoutData → analyzeWorkout → generateReport → generateRecommendations',
    );

    const workflow = new StateGraph(this.ReportStateAnnotation)
      .addNode('fetchWorkoutData', this.fetchWorkoutDataNode.bind(this))
      .addNode('analyzeWorkout', this.analyzeWorkoutNode.bind(this))
      .addNode('generateReport', this.generateReportNode.bind(this))
      .addNode(
        'generateRecommendations',
        this.generateRecommendationsNode.bind(this),
      )
      .addEdge(START, 'fetchWorkoutData')
      .addEdge('fetchWorkoutData', 'analyzeWorkout')
      .addEdge('analyzeWorkout', 'generateReport')
      .addEdge('generateReport', 'generateRecommendations')
      .addEdge('generateRecommendations', END);

    return workflow.compile();
  }

  async generateUserReport(userId: string, reportType: ReportType) {
    this.logger.debug(
      `generateUserReport called — userId: ${userId}, reportType: ${reportType}`,
    );

    const graph = this.createReportGraph();
    const result = await graph.invoke({ userId, reportType });

    this.logger.debug(
      `generateUserReport complete — report and recommendations ready for userId: ${userId}`,
    );

    return {
      report: result.report,
      recommendations: result.recommendations,
    };
  }
}
