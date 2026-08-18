-- AlterTable
ALTER TABLE "modelInput" ADD COLUMN     "scored_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "modelInput_customer_id_scored_at_idx" ON "modelInput"("customer_id", "scored_at");

-- CreateIndex
CREATE INDEX "modelInput_scored_at_idx" ON "modelInput"("scored_at");
