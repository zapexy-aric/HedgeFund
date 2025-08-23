import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertTransactionSchema,
  insertWithdrawalRequestSchema,
  insertUserInvestmentSchema,
} from "@shared/schema";
import { z } from "zod";

const updateUserWhatsAppSchema = z.object({
  whatsappNumber: z.string().min(1),
  referralCode: z.string().optional(),
});

const purchasePlanSchema = z.object({
  planId: z.string(),
  amount: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user WhatsApp and referral code
  app.post('/api/auth/update-whatsapp', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { whatsappNumber, referralCode } = updateUserWhatsAppSchema.parse(req.body);
      
      const user = await storage.updateUserWhatsApp(userId, whatsappNumber, referralCode);
      res.json(user);
    } catch (error) {
      console.error("Error updating user WhatsApp:", error);
      res.status(500).json({ message: "Failed to update user information" });
    }
  });

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
      const userId = req.user.claims.sub;
      const investments = await storage.getUserInvestments(userId);
      res.json(investments);
    } catch (error) {
      console.error("Error fetching user investments:", error);
      res.status(500).json({ message: "Failed to fetch user investments" });
    }
  });

  app.get('/api/user/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch user transactions" });
    }
  });

  app.post('/api/user/purchase-plan', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      }

      res.json(investment);
    } catch (error) {
      console.error("Error purchasing plan:", error);
      res.status(500).json({ message: "Failed to purchase investment plan" });
    }
  });

  app.post('/api/user/deposit', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
      const userId = req.user.claims.sub;
      const withdrawalData = insertWithdrawalRequestSchema.parse(req.body);

      const request = await storage.createWithdrawalRequest({
        ...withdrawalData,
        userId,
      });

      res.json(request);
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      res.status(500).json({ message: "Failed to create withdrawal request" });
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

  const httpServer = createServer(app);
  return httpServer;
}
