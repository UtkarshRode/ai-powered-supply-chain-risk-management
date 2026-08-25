CREATE TABLE "RiskAnalysis" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "riskScore" DOUBLE PRECISION NOT NULL,
    "severity" "ExceptionSeverity" NOT NULL,
    "factors" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RiskAnalysis_orderId_idx" ON "RiskAnalysis"("orderId");

CREATE INDEX "RiskAnalysis_createdAt_idx" ON "RiskAnalysis"("createdAt");

ALTER TABLE "RiskAnalysis"
ADD CONSTRAINT "RiskAnalysis_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;