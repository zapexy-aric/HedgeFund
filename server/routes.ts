import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import {
  insertTransactionSchema,
  insertWithdrawalRequestSchema,
  insertUserInvestmentSchema,
  insertInvestmentPlanSchema,
  insertAnnouncementSchema,
  insertPartnerSchema,
  users,
} from "@shared/schema";
import { db } from "./db";
import { desc } from "drizzle-orm";
import { z } from "zod";


const purchasePlanSchema = z.object({
  planId: z.string(),
  amount: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in auth.ts

  // Public routes
  app.get('/api/partners', async (req, res) => {
    try {
      const partners = await storage.getActivePartners();
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.get('/api/deposit-upi', async (req, res) => {
    try {
      const upiIdSetting = await storage.getAdminSetting("deposit_upi_id");
      res.json({ upiId: upiIdSetting?.value || "" });
    } catch (error) {
      console.error("Error fetching UPI ID:", error);
      res.status(500).json({ message: "Failed to fetch UPI ID" });
    }
  });

  app.get('/api/announcements', async (req, res) => {
    try {
      const announcements = await storage.getActiveAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.get('/api/plans', async (req, res) => {
    try {
      const plans = await storage.getActivePlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching plans:", error);
      res.status(500).json({ message: "Failed to fetch investment plans" });
    }
  });

  // Protected routes
  app.get('/api/user/investments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const investments = await storage.getUserInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching user investments:", error);
      res.status(500).json({ message: "Failed to fetch user investments" });
    }
  });

  app.get('/api/user/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  app.post('/api/user/purchase-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { planId, amount } = purchasePlanSchema.parse(req.body);

      // Get plan details
      const plan = await storage.getPlanById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Investment plan not found" });
      }

      // Calculate daily return
      const investmentAmount = parseFloat(amount);
      const dailyReturnAmount = (investmentAmount * parseFloat(plan.dailyPercentage)) / 100;

      // Create investment
      const investment = await storage.createUserInvestment({
        userId,
        planId,
        amount,
        dailyReturn: dailyReturnAmount.toFixed(2),
      });

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: "investment",
        amount: `-${amount}`,
        status: "completed",
      });

      // Update user deposit balance (subtract investment amount)
      const user = await storage.getUser(userId);
      if (user) {
        const currentBalance = parseFloat(user.depositBalance || "0");
        const newBalance = (currentBalance - investmentAmount).toFixed(2);
        await storage.updateUserBalances(userId, newBalance);

        // Handle referral bonus
        if (user.referredBy) {
          const referrer = await storage.getUser(user.referredBy);
          if (referrer) {
            const bonusAmount = dailyReturnAmount * 0.01;
            const referrerBalance = parseFloat(referrer.withdrawalBalance || "0");
            const newReferrerBalance = (referrerBalance + bonusAmount).toFixed(2);
            await storage.updateUserBalances(referrer.id, undefined, newReferrerBalance);

            // Create a transaction for the bonus
            await storage.createTransaction({
              userId: referrer.id,
              type: "referral_bonus",
              amount: bonusAmount.toFixed(2),
              status: "completed",
            });
          }
        }
      }

      res.json(investment);
    } catch (error) {
      console.error("Error purchasing plan:", error);
      res.status(500).json({ message: "Failed to purchase investment plan" });
    }
  });

  app.post('/api/user/deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { amount, utrNumber } = insertTransactionSchema
        .pick({ amount: true, utrNumber: true })
        .parse(req.body);

      const transaction = await storage.createTransaction({
        userId,
        type: "deposit",
        amount,
        utrNumber,
        status: "pending",
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating deposit:", error);
      res.status(500).json({ message: "Failed to create deposit request" });
    }
  });

  app.post('/api/user/withdraw', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const withdrawalInputSchema = insertWithdrawalRequestSchema.pick({
        amount: true,
        upiId: true,
        fullName: true,
      });
      const withdrawalData = withdrawalInputSchema.parse(req.body);

      // Check if user has sufficient balance
      const user = await storage.getUser(userId);
      if (!user || parseFloat(user.withdrawalBalance) < parseFloat(withdrawalData.amount)) {
        return res.status(400).json({ message: "Insufficient withdrawal balance." });
      }

      // Deduct amount from balance immediately
      const newBalance = (parseFloat(user.withdrawalBalance) - parseFloat(withdrawalData.amount)).toFixed(2);
      await storage.updateUserBalances(userId, undefined, newBalance);

      // Create the withdrawal request
      const request = await storage.createWithdrawalRequest({
        ...withdrawalData,
        userId,
        status: 'pending',
      });

      res.json(request);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
    }
  });

  app.get('/api/user/referral-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const count = await storage.getReferredUserCount(userId);
      res.json({ totalReferred: count });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Admin settings
  app.get('/api/admin/qr-code', async (req, res) => {
    try {
      const qrCodeSetting = await storage.getAdminSetting("deposit_qr_code_url");
      res.json({ qrCodeUrl: qrCodeSetting?.value || "" });
    } catch (error) {
      console.error("Error fetching QR code:", error);
      res.status(500).json({ message: "Failed to fetch QR code" });
    }
  });

  app.get('/api/admin/telegram-support', async (req, res) => {
    try {
      const telegramSetting = await storage.getAdminSetting("telegram_support_url");
      res.json({ telegramUrl: telegramSetting?.value || "https://t.me/hedgefund_support" });
    } catch (error) {
      console.error("Error fetching Telegram support:", error);
      res.status(500).json({ message: "Failed to fetch Telegram support" });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req, res) => {
    try {
      const allUsers = await db.select({
        id: users.id,
        whatsappNumber: users.whatsappNumber,
        firstName: users.firstName,
        lastName: users.lastName,
        depositBalance: users.depositBalance,
        withdrawalBalance: users.withdrawalBalance,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt
      }).from(users).orderBy(desc(users.createdAt));
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/transactions', isAdmin, async (req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      res.json(allTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get('/api/admin/withdrawal-requests', isAdmin, async (req, res) => {
    try {
      const withdrawalRequests = await storage.getAllWithdrawalRequests();
      res.json(withdrawalRequests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      res.status(500).json({ message: "Failed to fetch withdrawal requests" });
    }
  });

  app.post('/api/admin/approve-withdrawal/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const withdrawal = await storage.approveWithdrawalRequest(id);
      res.json(withdrawal);
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      res.status(500).json({ message: "Failed to approve withdrawal" });
    }
  });

  app.post('/api/admin/reject-withdrawal/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const withdrawal = await storage.rejectWithdrawalRequest(id);
      res.json(withdrawal);
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      res.status(500).json({ message: "Failed to reject withdrawal" });
    }
  });

  app.post('/api/admin/approve-deposit/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      const transaction = await storage.approveDeposit(id, amount);
      res.json(transaction);
    } catch (error) {
      console.error("Error approving deposit:", error);
      res.status(500).json({ message: "Failed to approve deposit" });
    }
  });

  app.post('/api/admin/create-plan', isAdmin, async (req, res) => {
    try {
      const planData = insertInvestmentPlanSchema.parse(req.body);
      const plan = await storage.createInvestmentPlan(planData);
      res.json(plan);
    } catch (error) {
      console.error("Error creating plan:", error);
      res.status(500).json({ message: "Failed to create investment plan" });
    }
  });

  app.put('/api/admin/update-plan/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const planData = insertInvestmentPlanSchema.parse(req.body);
      const plan = await storage.updateInvestmentPlan(id, planData);
      res.json(plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      res.status(500).json({ message: "Failed to update investment plan" });
    }
  });

  app.delete('/api/admin/delete-plan/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvestmentPlan(id);
      res.json({ message: "Plan deleted successfully" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      res.status(500).json({ message: "Failed to delete investment plan" });
    }
  });

  app.post('/api/admin/create-announcement', isAdmin, async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.get('/api/admin/announcements', isAdmin, async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.put('/api/admin/announcements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const announcementData = insertAnnouncementSchema.partial().parse(req.body);
      const announcement = await storage.updateAnnouncement(id, announcementData);
      res.json(announcement);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete('/api/admin/announcements/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  app.post('/api/admin/create-partner', isAdmin, async (req, res) => {
    try {
      const partnerData = insertPartnerSchema.parse(req.body);
      const partner = await storage.createPartner(partnerData);
      res.json(partner);
    } catch (error) {
      console.error("Error creating partner:", error);
      res.status(500).json({ message: "Failed to create partner" });
    }
  });

  app.get('/api/admin/partners', isAdmin, async (req, res) => {
    try {
      const allPartners = await storage.getAllPartners();
      res.json(allPartners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ message: "Failed to fetch partners" });
    }
  });

  app.delete('/api/admin/partners/:id', isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePartner(id);
      res.json({ message: "Partner deleted successfully" });
    } catch (error) {
      console.error("Error deleting partner:", error);
      res.status(500).json({ message: "Failed to delete partner" });
    }
  });

  app.put('/api/admin/settings/:key', isAdmin, async (req, res) => {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await storage.setAdminSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
