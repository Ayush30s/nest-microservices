import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import {
  PGVectorStore,
  DistanceStrategy,
} from '@langchain/community/vectorstores/pgvector';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { PoolConfig } from 'pg';

type KnowledgeDocument = {
  title: string;
  content: string;
  type: 'text' | 'pdf' | 'json' | 'csv' | 'html';
  category: string;
  source?: string;
  tags?: string[];
  metadata?: Record<string, any>;
};

@Injectable()
export class FitnessRagService implements OnModuleInit, OnModuleDestroy {
  private vectorStore!: PGVectorStore;
  private readonly logger = new Logger();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializePostgresVectorDb();
  }
  async onModuleDestroy() {
    if (this.vectorStore) {
      await this.vectorStore.end();
    }
  }

  async toLangChainDocument(payload: KnowledgeDocument) {
    return new Document({
      pageContent: `
        Title: ${payload.title}
        Category: ${payload.category}
        Type: ${payload.type}
        Tags: ${(payload.tags ?? []).join(', ')}

        Content:
        ${payload.content}
      `.trim(),

      metadata: {
        title: payload.title,
        type: payload.type,
        category: payload.category,
        source: payload.source ?? 'admin_upload',
        tags: payload.tags ?? [],
        ...payload.metadata,
      },
    });
  }

  async savePdfToVectorDb(filePath: string, metadata?: Record<string, any>) {
    if (!this.vectorStore) {
      throw new Error('Vector store is not initialized');
    }

    const loader = new PDFLoader(filePath, {
      splitPages: true,
    });

    const documents = await loader.load();

    const formattedDocuments = documents.map((doc, index) => {
      return formattedDocuments(doc);
    });

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 120,
    });

    const splitDocuments = await splitter.splitDocuments(formattedDocuments);

    const insertedIds = await this.vectorStore.addDocuments(splitDocuments);

    return {
      message: 'PDF stored into vector DB successfully',
      totalPages: documents.length,
      totalChunks: splitDocuments.length,
      insertedIds,
    };
  }

  private async initializePostgresVectorDb() {
    const databaseUrl = this.configService.get<string>('AI_DATABASE_URL');
    const openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!databaseUrl) {
      throw new Error('AI_DATABASE_URL is missing');
    }

    if (!openAiApiKey) {
      throw new Error('OPENAI_API_KEY is missing');
    }

    const embeddings = new OpenAIEmbeddings({
      apiKey: openAiApiKey,
      model: 'text-embedding-3-small',
    });

    const postgresConnectionOptions = {
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    } satisfies PoolConfig;

    this.vectorStore = await PGVectorStore.initialize(embeddings, {
      postgresConnectionOptions,

      tableName: 'fitness_knowledge_chunks',

      columns: {
        idColumnName: 'id',
        contentColumnName: 'content',
        metadataColumnName: 'metadata',
        vectorColumnName: 'embedding',
      },

      distanceStrategy: 'cosine' as DistanceStrategy,
    });
  }

  async saveFitnessDocumentsToVectorDb(payload?: string) {
    this.logger.debug('This is ingest service');

    if (!this.vectorStore) {
      throw new Error('Vector store is not initialized');
    }

    const documents = [
      new Document({
        pageContent: `
        Users with knee pain should avoid high-impact jumping, deep heavy squats,
        and aggressive lunges. Safer alternatives include leg press with controlled
        range of motion, box squats, glute bridges, hamstring curls, and Romanian deadlifts.
        Stop the exercise if pain increases.
                `,
        metadata: {
          source: 'knee_pain_modifications',
          category: 'injury_safety',
          bodyPart: 'legs',
        },
      }),

      new Document({
        pageContent: `
        Users with shoulder pain should avoid heavy overhead pressing, behind-the-neck
        presses, upright rows, and painful deep pressing ranges. Safer alternatives
        include landmine press, neutral-grip dumbbell press, cable chest press,
        face pulls, and rotator cuff warm-up exercises.
                `,
        metadata: {
          source: 'shoulder_pain_modifications',
          category: 'injury_safety',
          bodyPart: 'shoulders',
        },
      }),

      new Document({
        pageContent: `
        For muscle gain, prioritize progressive overload, compound movements,
        sufficient weekly training volume, controlled technique, and recovery.
        Most hypertrophy exercises work well in the 6 to 12 rep range.
        Accessory exercises can use 10 to 15 reps.
                `,
        metadata: {
          source: 'muscle_gain_guidelines',
          category: 'training_goal',
          goal: 'muscle_gain',
        },
      }),

      new Document({
        pageContent: `
        A good upper-body warm-up should include shoulder circles, band pull-aparts,
        scapular push-ups, light pressing sets, and mobility work. Warm-ups should
        increase blood flow without creating fatigue.
                `,
        metadata: {
          source: 'upper_body_warmup',
          category: 'warmup',
          bodyPart: 'upper_body',
        },
      }),

      new Document({
        pageContent: `
        Before training, a light meal containing carbohydrates and protein 60 to 120
        minutes before exercise can support performance. If training soon, a banana,
        toast, yogurt, or a small carb snack may be easier to digest. Hydration should
        be maintained before and during the workout.
        `,
        metadata: {
          source: 'pre_workout_nutrition',
          category: 'nutrition',
        },
      }),
    ];

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 120,
    });

    const splitDocuments = await splitter.splitDocuments(documents);

    const insertedIds = await this.vectorStore.addDocuments(splitDocuments);

    return {
      message: 'Documents saved into PostgreSQL pgvector successfully',
      totalChunks: splitDocuments.length,
      insertedIds,
    };
  }

  async searchFitnessKnowledge(query: string, k = 5) {
    if (!this.vectorStore) {
      throw new Error('Vector store is not initialized');
    }

    const results = await this.vectorStore.similaritySearchWithScore(query, k);

    return results.map(([doc, score]) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      score,
    }));
  }
}
