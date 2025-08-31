/*
  Warnings:

  - Added the required column `customer_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Made the column `ip` on table `transactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `transactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "customer_id" TEXT NOT NULL,
ALTER COLUMN "ip" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;
