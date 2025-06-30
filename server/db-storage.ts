
import { polls, votes, type Poll, type Vote, type InsertPoll, type InsertVote } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import type { IStorage } from "./storage";
import { db } from "./db";

export class DbStorage implements IStorage {
  async createPoll(insertPoll: InsertPoll): Promise<{ poll: Poll; adminKey: string }> {
    const id = this.generatePollId();
    const adminKey = this.generateAdminKey();
    
    const [poll] = await db.insert(polls).values({
      id,
      title: insertPoll.title,
      description: insertPoll.description,
      options: insertPoll.options,
      allowEdits: insertPoll.allowEdits,
      showResults: insertPoll.showResults,
      adminKey,
    }).returning();
    
    return { poll, adminKey };
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    return poll || undefined;
  }

  async updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined> {
    const [poll] = await db.update(polls)
      .set(updates)
      .where(eq(polls.id, id))
      .returning();
    return poll || undefined;
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
    const voteData: any = {
      pollId: insertVote.pollId,
      rankings: insertVote.rankings,
    };
    
    if (voterIp) {
      voteData.voterIp = voterIp;
    }
    
    const [vote] = await db.insert(votes).values(voteData).returning();
    
    return vote;
  }

  async getVotesByPollId(pollId: string): Promise<Vote[]> {
    return await db.select().from(votes).where(eq(votes.pollId, pollId));
  }

  async hasVoted(pollId: string, voterIp: string): Promise<boolean> {
    const voteList = await db.select()
      .from(votes)
      .where(and(eq(votes.pollId, pollId), eq(votes.voterIp, voterIp)));
    
    return voteList.length > 0;
  }

  async listPolls(): Promise<Poll[]> {
    return await db.select().from(polls);
  }

  async deletePoll(id: string, adminKey: string): Promise<boolean> {
    const [poll] = await db.select().from(polls).where(eq(polls.id, id));
    
    if (!poll || poll.adminKey !== adminKey) {
      return false;
    }

    // Delete all votes for this poll first (foreign key constraint)
    await db.delete(votes).where(eq(votes.pollId, id));
    
    // Delete the poll
    await db.delete(polls).where(eq(polls.id, id));
    
    return true;
  }

  private generatePollId(): string {
    return "TRP95-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private generateAdminKey(): string {
    return Math.random().toString(36).substr(2, 12);
  }
}
