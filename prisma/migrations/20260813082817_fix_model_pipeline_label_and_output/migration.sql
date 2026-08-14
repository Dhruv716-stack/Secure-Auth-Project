-- AlterTable
ALTER TABLE "modelInput" ALTER COLUMN "label" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "session_id" TEXT;

-- CreateTable
CREATE TABLE "modelOutput" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "anomalyScore" DOUBLE PRECISION NOT NULL,
    "riskCategory" TEXT NOT NULL,
    "riskReasons" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modelOutput_pkey" PRIMARY KEY ("id")
);
