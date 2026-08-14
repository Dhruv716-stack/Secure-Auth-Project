-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "anomaly_score" DOUBLE PRECISION,
ADD COLUMN     "risk_level" TEXT,
ADD COLUMN     "risk_reason" TEXT;
