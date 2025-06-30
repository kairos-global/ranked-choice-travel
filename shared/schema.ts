import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const polls = pgTable("polls", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  options: jsonb("options").notNull().$type<string[]>(),
  allowEdits: boolean("allow_edits").notNull().default(true),
  showResults: boolean("show_results").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closed: boolean("closed").notNull().default(false),
  adminKey: text("admin_key").notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  pollId: text("poll_id").notNull().references(() => polls.id),
  rankings: jsonb("rankings").notNull().$type<{option: string, rank: number}[]>(),
  voterIp: text("voter_ip"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  createdAt: true,
  adminKey: true,
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  createdAt: true,
  voterIp: true,
});

export type Poll = typeof polls.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;

// Remove the users table since we don't need authentication
