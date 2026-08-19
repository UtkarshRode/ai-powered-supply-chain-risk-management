import { Worker, Job } from "bullmq";
import IORedis from "ioredis";

import prisma from "../config/database";
import { analyzeOrderRisk } from "../services/risk-analysis.service";

const connection = new IORedis({
  host: process.env.REDIS_HOST || "localhost",
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
});

interface RiskJobData {
  orderId: string;
  event: string;
}

const worker = new Worker<RiskJobData>(
  "risk-analysis",
  async (job: Job<RiskJobData>) => {
    console.log("=================================");
    console.log("Risk analysis job received");
    console.log("Job ID:", job.id);
    console.log("Order ID:", job.data.orderId);
    console.log("Event:", job.data.event);
    console.log("=================================");

    /*
     * Run the composite risk engine
     */
    const result = await analyzeOrderRisk(
      job.data.orderId
    );

    /*
     * Save the risk analysis to PostgreSQL
     */
    const savedAnalysis =
      await prisma.riskAnalysis.create({
        data: {
          orderId: result.orderId,
          event: job.data.event,
          riskScore: result.riskScore,
          severity: result.severity,
          factors: result.factors,
          recommendations:
            result.recommendations,
        },
      });

    /*
     * Display result
     */
    console.log(
      "Risk analysis completed."
    );

    console.log(
      "Risk score:",
      result.riskScore
    );

    console.log(
      "Severity:",
      result.severity
    );

    console.log("Risk factors:");

    if (
      result.factors.length === 0
    ) {
      console.log(
        "- No significant risk factors detected."
      );
    } else {
      for (
        const factor of result.factors
      ) {
        console.log(
          `- ${factor}`
        );
      }
    }

    console.log(
      "Recommendations:"
    );

    if (
      result.recommendations.length === 0
    ) {
      console.log(
        "- No immediate action required."
      );
    } else {
      for (
        const recommendation of
          result.recommendations
      ) {
        console.log(
          `- ${recommendation}`
        );
      }
    }

    console.log(
      "Risk analysis saved:",
      savedAnalysis.id
    );

    console.log(
      "================================="
    );

    return {
      success: true,
      analysisId:
        savedAnalysis.id,
      orderId:
        result.orderId,
      riskScore:
        result.riskScore,
      severity:
        result.severity,
      processedAt:
        new Date().toISOString(),
    };
  },
  {
    connection,
  }
);

worker.on(
  "completed",
  (job) => {
    console.log(
      `Risk job ${job.id} completed`
    );
  }
);

worker.on(
  "failed",
  (job, error) => {
    console.error(
      `Risk job ${job?.id} failed:`,
      error.message
    );
  }
);

console.log(
  "Risk worker is running..."
);