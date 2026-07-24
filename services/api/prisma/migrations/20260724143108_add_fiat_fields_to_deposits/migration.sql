-- AlterTable: add fiat fields to deposits
ALTER TABLE "deposits" ADD COLUMN "fiatCurrency" TEXT;
ALTER TABLE "deposits" ADD COLUMN "bankName" TEXT;
