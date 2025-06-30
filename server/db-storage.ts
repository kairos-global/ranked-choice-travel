
import { drizzle } from "drizzle-orm/neon-serverless";
import { neon } from "@neondatabase/serverless";
import { polls, votes, type Poll, type Vote, type InsertPoll, type InsertVote } from "@shared/schema";
import { eq } from "drizzle-orm";
import type { IStorage } from "./storage";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export class DbStorage implements IStorage {
  async createPoll(insertPoll: InsertPoll): Promise<{ poll: Poll; adminKey: string }> {
    const id = this.generatePollId();
    const adminKey = this.generateAdminKey();
    
    const [poll] = await db.insert(polls).values({
      ...insertPoll,
      id,
      adminKey,
    }).returning();
    
    return { poll, adminKey };
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll;
  }

  async updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined> {
    const [poll] = await db.update(polls)
      .set(updates)
      .where(eq(polls.id, id))
      .returning();
    return poll;
  }

  async closePoll(id: string, adminKey: string): Promise<boolean> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    
    if (!poll || poll.adminKey !== adminKey) {
      return false;
    }

    await db.update(polls)
      .set({ closed: true })
      .where(eq(polls.id, id));
    
    return true;
  }

  async createVote(insertVote: InsertVote, voterIp?: string): Promise<Vote> {
    const [vote] = await db.insert(votes).values({
      ...insertVote,
      voterIp,
    }).returning();
    
    return vote;
  }

  async getVotesByPollId(pollId: string): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.pollId, pollId));
  }

  async hasVoted(pollId: string, voterIp: string): Promise<boolean> {
    const [vote] = await db.select()
      .from(votes)
      .where(eq(votes.pollId, pollId))
      .where(eq(votes.voterIp, voterIp));
    
    return !!vote;
  }

  private generatePollId(): string {
    return "TRP95-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private generateAdminKey(): string {
    return Math.random().toString(36).substr(2, 12);
  }
}
