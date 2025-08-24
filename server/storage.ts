import {
  users,
  partners,
  announcements,
  investmentPlans,
  userInvestments,
  transactions,
  adminSettings,
  withdrawalRequests,
  type User,
  type InsertUser,
  type Partner,
  type Announcement,
  type InvestmentPlan,
  type UserInvestment,
  type Transaction,
  type AdminSetting,
  type WithdrawalRequest,
  type InsertPartner,
  type InsertAnnouncement,
  type InsertInvestmentPlan,
  type InsertUserInvestment,
  type InsertTransaction,
  type InsertWithdrawalRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByWhatsApp(whatsappNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalances(userId: string, depositBalance?: string, withdrawalBalance?: string): Promise<User>;

  // Partners operations
  getActivePartners(): Promise<Partner[]>;
  createPartner(partner: InsertPartner): Promise<Partner>;

  // Announcements operations
  getActiveAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;

  // Investment plans operations
  getActivePlans(): Promise<InvestmentPlan[]>;
  getPlanById(id: string): Promise<InvestmentPlan | undefined>;

  // User investments operations
  getUserInvestments(userId: string): Promise<UserInvestment[]>;
  createUserInvestment(investment: InsertUserInvestment): Promise<UserInvestment>;
  updateInvestmentProgress(id: string, daysCompleted: number, totalReturn: string): Promise<UserInvestment>;

  // Transactions operations
  getUserTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string): Promise<Transaction>;

  // Withdrawal requests operations
  createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest>;
  getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;

  // Admin settings operations
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(key: string, value: string): Promise<AdminSetting>;

  // Admin operations
  getAllTransactions(): Promise<Transaction[]>;
  getAllWithdrawalRequests(): Promise<WithdrawalRequest[]>;
  approveWithdrawalRequest(id: string): Promise<WithdrawalRequest>;
  rejectWithdrawalRequest(id: string): Promise<WithdrawalRequest>;
  approveDeposit(transactionId: string, amount: string): Promise<Transaction>;
  createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan>;
  updateInvestmentPlan(id: string, plan: InsertInvestmentPlan): Promise<InvestmentPlan>;
  deleteInvestmentPlan(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByWhatsApp(whatsappNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.whatsappNumber, whatsappNumber));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUserBalances(userId: string, depositBalance?: string, withdrawalBalance?: string): Promise<User> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (depositBalance !== undefined) {
      updateData.depositBalance = depositBalance;
    }
    if (withdrawalBalance !== undefined) {
      updateData.withdrawalBalance = withdrawalBalance;
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Partners operations
  async getActivePartners(): Promise<Partner[]> {
    return await db.select().from(partners).where(eq(partners.isActive, true));
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [newPartner] = await db.insert(partners).values(partner).returning();
    return newPartner;
  }

  // Announcements operations
  async getActiveAnnouncements(): Promise<Announcement[]> {
    return await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnnouncement] = await db.insert(announcements).values(announcement).returning();
    return newAnnouncement;
  }

  // Investment plans operations
  async getActivePlans(): Promise<InvestmentPlan[]> {
    return await db
      .select()
      .from(investmentPlans)
      .where(eq(investmentPlans.isActive, true))
      .orderBy(desc(investmentPlans.isPopular));
  }

  async getPlanById(id: string): Promise<InvestmentPlan | undefined> {
    const [plan] = await db.select().from(investmentPlans).where(eq(investmentPlans.id, id));
    return plan;
  }

  // User investments operations
  async getUserInvestments(userId: string): Promise<UserInvestment[]> {
    return await db
      .select()
      .from(userInvestments)
      .where(eq(userInvestments.userId, userId))
      .orderBy(desc(userInvestments.purchaseDate));
  }

  async createUserInvestment(investment: InsertUserInvestment): Promise<UserInvestment> {
    const [newInvestment] = await db.insert(userInvestments).values(investment).returning();
    return newInvestment;
  }

  async updateInvestmentProgress(id: string, daysCompleted: number, totalReturn: string): Promise<UserInvestment> {
    const updateData: any = {
      daysCompleted,
      totalReturn,
    };

    // If investment is completed, mark it as such
    const [investment] = await db.select().from(userInvestments).where(eq(userInvestments.id, id));
    if (investment) {
      const plan = await this.getPlanById(investment.planId);
      if (plan && daysCompleted >= plan.durationDays) {
        updateData.status = "completed";
        updateData.completionDate = new Date();
      }
    }

    const [updatedInvestment] = await db
      .update(userInvestments)
      .set(updateData)
      .where(eq(userInvestments.id, id))
      .returning();
    return updatedInvestment;
  }

  // Transactions operations
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(10);
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async updateTransactionStatus(id: string, status: string): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set({ status })
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  // Withdrawal requests operations
  async createWithdrawalRequest(request: InsertWithdrawalRequest): Promise<WithdrawalRequest> {
    const [newRequest] = await db.insert(withdrawalRequests).values(request).returning();
    return newRequest;
  }

  async getUserWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  // Admin settings operations
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    const [setting] = await db.select().from(adminSettings).where(eq(adminSettings.key, key));
    return setting;
  }

  async setAdminSetting(key: string, value: string): Promise<AdminSetting> {
    const [setting] = await db
      .insert(adminSettings)
      .values({ key, value })
      .onConflictDoUpdate({
        target: adminSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return setting;
  }

  // Admin operations
  async getAllTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt));
  }

  async getAllWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async approveWithdrawalRequest(id: string): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .update(withdrawalRequests)
      .set({ status: "approved", processedAt: new Date() })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return withdrawal;
  }

  async rejectWithdrawalRequest(id: string): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .update(withdrawalRequests)
      .set({ status: "rejected", processedAt: new Date() })
      .where(eq(withdrawalRequests.id, id))
      .returning();
    return withdrawal;
  }

  async approveDeposit(transactionId: string, amount: string): Promise<Transaction> {
    // Update transaction status
    const [transaction] = await db
      .update(transactions)
      .set({ status: "completed" })
      .where(eq(transactions.id, transactionId))
      .returning();

    if (transaction) {
      // Update user's deposit balance
      const user = await this.getUser(transaction.userId);
      if (user) {
        const currentBalance = parseFloat(user.depositBalance || "0");
        const newBalance = (currentBalance + parseFloat(amount)).toFixed(2);
        await this.updateUserBalances(transaction.userId, newBalance);
      }
    }

    return transaction;
  }

  async createInvestmentPlan(plan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const [newPlan] = await db.insert(investmentPlans).values(plan).returning();
    return newPlan;
  }

  async updateInvestmentPlan(id: string, plan: InsertInvestmentPlan): Promise<InvestmentPlan> {
    const [updatedPlan] = await db
      .update(investmentPlans)
      .set(plan)
      .where(eq(investmentPlans.id, id))
      .returning();
    return updatedPlan;
  }

  async deleteInvestmentPlan(id: string): Promise<void> {
    await db.delete(investmentPlans).where(eq(investmentPlans.id, id));
  }
}

export const storage = new DatabaseStorage();
