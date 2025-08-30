import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  whatsappNumber: varchar("whatsapp_number").notNull().unique(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  referralCode: varchar("referral_code"),
  referredBy: varchar("referred_by"),
  isAdmin: boolean("is_admin").default(false),
  depositBalance: decimal("deposit_balance", { precision: 10, scale: 2 }).default("0.00"),
  withdrawalBalance: decimal("withdrawal_balance", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Partners table for official partner logos
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  logoUrl: text("logo_url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table for admin-managed content
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investment plans table
export const investmentPlans = pgTable("investment_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  dailyPercentage: decimal("daily_percentage", { precision: 5, scale: 2 }).notNull(),
  minInvestment: decimal("min_investment", { precision: 10, scale: 2 }).notNull(),
  maxInvestment: decimal("max_investment", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User investments table
export const userInvestments = pgTable("user_investments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  planId: varchar("plan_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dailyReturn: decimal("daily_return", { precision: 10, scale: 2 }).notNull(),
  totalReturn: decimal("total_return", { precision: 10, scale: 2 }).default("0.00"),
  daysCompleted: integer("days_completed").default(0),
  status: varchar("status").default("active"), // active, completed, cancelled
  purchaseDate: timestamp("purchase_date").defaultNow(),
  completionDate: timestamp("completion_date"),
  lastClaimedAt: timestamp("last_claimed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: varchar("type").notNull(), // deposit, withdrawal, investment_return, investment
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("pending"), // pending, completed, failed
  utrNumber: varchar("utr_number"),
  upiId: varchar("upi_id"),
  fullName: varchar("full_name"),
  remarks: text("remarks"),
  withdrawalRequestId: varchar("withdrawal_request_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin settings table
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Withdrawal requests table
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  upiId: varchar("upi_id").notNull(),
  fullName: varchar("full_name").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Referral earnings table
export const referralEarnings = pgTable("referral_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id")
    .notNull()
    .references(() => users.id),
  referredUserId: varchar("referred_user_id")
    .notNull()
    .references(() => users.id),
  userInvestmentId: varchar("user_investment_id")
    .notNull()
    .references(() => userInvestments.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").default("unclaimed"), // unclaimed, claimed
  createdAt: timestamp("created_at").defaultNow(),
});

// Mines game table
export const minesGames = pgTable("mines_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  betAmount: decimal("bet_amount", { precision: 10, scale: 2 }).notNull(),
  mineCount: integer("mine_count").notNull(),
  mineLocations: jsonb("mine_locations").notNull(), // Array of numbers (tile indexes)
  revealedTiles: jsonb("revealed_tiles").default('[]'), // Array of numbers (tile indexes)
  status: varchar("status").default("active"), // active, busted, cashed_out
  payoutMultiplier: decimal("payout_multiplier", { precision: 10, scale: 4 }).default("1.0000"),
  cashedOutAmount: decimal("cashed_out_amount", { precision: 10, scale: 2 }),
  serverSeed: varchar("server_seed", { length: 64 }),
  serverSeedHash: varchar("server_seed_hash", { length: 64 }).notNull(),
  clientSeed: varchar("client_seed", { length: 64 }).notNull(),
  nonce: integer("nonce").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  whatsappNumber: true,
  password: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
});

export const insertInvestmentPlanSchema = createInsertSchema(investmentPlans).omit({
  id: true,
  createdAt: true,
});

export const insertUserInvestmentSchema = createInsertSchema(userInvestments).omit({
  id: true,
  purchaseDate: true,
  completionDate: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertWithdrawalRequestSchema = createInsertSchema(
  withdrawalRequests,
).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertReferralEarningSchema = createInsertSchema(
  referralEarnings,
).omit({
  id: true,
  createdAt: true,
});

export const insertMinesGameSchema = createInsertSchema(minesGames).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type Partner = typeof partners.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type InvestmentPlan = typeof investmentPlans.$inferSelect;
export type UserInvestment = typeof userInvestments.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;
export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type MinesGame = typeof minesGames.$inferSelect;

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertInvestmentPlan = z.infer<typeof insertInvestmentPlanSchema>;
export type InsertUserInvestment = z.infer<typeof insertUserInvestmentSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertWithdrawalRequest = z.infer<
  typeof insertWithdrawalRequestSchema
>;
export type InsertReferralEarning = z.infer<
  typeof insertReferralEarningSchema
>;
export type InsertMinesGame = z.infer<typeof insertMinesGameSchema>;
