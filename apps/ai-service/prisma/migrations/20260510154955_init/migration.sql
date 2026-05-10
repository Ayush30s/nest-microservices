-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "fitness_knowledge_chunks" (
    "id" UUID NOT NULL,
    "content" TEXT,
    "metadata" JSONB,
    "embedding" vector(1536),

    CONSTRAINT "fitness_knowledge_chunks_pkey" PRIMARY KEY ("id")
);
