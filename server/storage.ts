import { polls, votes, type Poll, type Vote, type InsertPoll, type InsertVote } from "@shared/schema";

export interface IStorage {
  // Poll operations
  createPoll(poll: InsertPoll): Promise<{ poll: Poll; adminKey: string }>;
  getPoll(id: string): Promise<Poll | undefined>;
  updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined>;
  closePoll(id: string, adminKey: string): Promise<boolean>;
  
  // Vote operations
  createVote(vote: InsertVote, voterIp?: string): Promise<Vote>;
  getVotesByPollId(pollId: string): Promise<Vote[]>;
  hasVoted(pollId: string, voterIp: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private polls: Map<string, Poll>;
  private votes: Map<number, Vote>;
  private adminKeys: Map<string, string>; // pollId -> adminKey
  private voterIps: Map<string, Set<string>>; // pollId -> Set of IPs
  private currentVoteId: number;

  constructor() {
    this.polls = new Map();
    this.votes = new Map();
    this.adminKeys = new Map();
    this.voterIps = new Map();
    this.currentVoteId = 1;
  }

  async createPoll(insertPoll: InsertPoll): Promise<{ poll: Poll; adminKey: string }> {
    const id = this.generatePollId();
    const adminKey = this.generateAdminKey();
    const poll: Poll = {
      ...insertPoll,
      id,
      adminKey,
      createdAt: new Date(),
      closed: false,
    };
    
    this.polls.set(id, poll);
    this.adminKeys.set(id, adminKey);
    this.voterIps.set(id, new Set());
    
    return { poll, adminKey };
  }

  async getPoll(id: string): Promise<Poll | undefined> {
    return this.polls.get(id);
  }

  async updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined> {
    const existingPoll = this.polls.get(id);
    if (!existingPoll) return undefined;

    const updatedPoll: Poll = { ...existingPoll, ...updates };
    this.polls.set(id, updatedPoll);
    return updatedPoll;
  }

  async closePoll(id: string, adminKey: string): Promise<boolean> {
    const poll = this.polls.get(id);
    const storedAdminKey = this.adminKeys.get(id);
    
    if (!poll || storedAdminKey !== adminKey) return false;

    const updatedPoll: Poll = { ...poll, closed: true };
    this.polls.set(id, updatedPoll);
    return true;
  }

  async createVote(insertVote: InsertVote, voterIp?: string): Promise<Vote> {
    const id = this.currentVoteId++;
    const vote: Vote = {
      ...insertVote,
      id,
      voterIp,
      createdAt: new Date(),
    };
    
    this.votes.set(id, vote);
    
    if (voterIp) {
      const pollVoters = this.voterIps.get(insertVote.pollId) || new Set();
      pollVoters.add(voterIp);
      this.voterIps.set(insertVote.pollId, pollVoters);
    }
    
    return vote;
  }

  async getVotesByPollId(pollId: string): Promise<Vote[]> {
    return Array.from(this.votes.values()).filter(vote => vote.pollId === pollId);
  }

  async hasVoted(pollId: string, voterIp: string): Promise<boolean> {
    const pollVoters = this.voterIps.get(pollId);
    return pollVoters?.has(voterIp) || false;
  }

  private generatePollId(): string {
    return "TRP95-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private generateAdminKey(): string {
    return Math.random().toString(36).substr(2, 12);
  }
}

export const storage = new MemStorage();
