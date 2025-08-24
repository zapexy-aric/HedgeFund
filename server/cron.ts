import cron from "node-cron";
import { storage } from "./storage";
import { eq } from "drizzle-orm";
import { userInvestments, users } from "@shared/schema";
import { db } from "./db";

async function calculateReferralEarnings() {
  console.log("Calculating referral earnings...");

  try {
    const activeInvestments = await db
      .select()
      .from(userInvestments)
      .where(eq(userInvestments.status, "active"));

    for (const investment of activeInvestments) {
      const referredUser = await storage.getUser(investment.userId);

      if (referredUser && referredUser.referredBy) {
        const referrer = await storage.getUser(referredUser.referredBy);

        if (referrer) {
          const dailyReturn = parseFloat(investment.dailyReturn);
          const earningAmount = dailyReturn * 0.01; // 1% of daily return

          await storage.createReferralEarning({
            referrerId: referrer.id,
            referredUserId: referredUser.id,
            userInvestmentId: investment.id,
            amount: earningAmount.toFixed(2),
          });
        }
      }
    }

    console.log("Referral earnings calculation complete.");
  } catch (error) {
    console.error("Error calculating referral earnings:", error);
  }
}

export function startCronJobs() {
  // Schedule to run every day at midnight
  cron.schedule("0 0 * * *", calculateReferralEarnings);

  console.log("Cron jobs started.");
}
