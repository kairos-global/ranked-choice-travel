import { polls, votes, type Poll, type Vote, type InsertPoll, type InsertVote } from "@shared/schema";

export interface IStorage {
  // Poll operations
  createPoll(poll: InsertPoll): Promise<{ poll: Poll; adminKey: string }>;
  getPoll(id: string): Promise<Poll | undefined>;
  updatePoll(id: string, updates: Partial<InsertPoll>): Promise<Poll | undefined>;
  closePoll(id: string, adminKey: string): Promise<boolean>;
  listPolls(): Promise<Poll[]>;
  deletePoll(id: string, adminKey: string): Promise<boolean>;
  
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

  async listPolls(): Promise<Poll[]> {
    return Array.from(this.polls.values());
  }

  async deletePoll(id: string, adminKey: string): Promise<boolean> {
    const poll = this.polls.get(id);
    if (!poll || poll.adminKey !== adminKey) {
      return false;
    }

    // Delete poll and related data
    this.polls.delete(id);
    this.adminKeys.delete(id);
    this.voterIps.delete(id);
    
    // Delete all votes for this poll
    const votesToDelete = [];
    for (const [voteId, vote] of this.votes) {
      if (vote.pollId === id) {
        votesToDelete.push(voteId);
      }
    }
    votesToDelete.forEach(voteId => this.votes.delete(voteId));
    
    return true;
  }

  private generatePollId(): string {
    return "TRP95-" + Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  private generateAdminKey(): string {
    return Math.random().toString(36).substr(2, 12);
  }
}

// Use PostgreSQL storage if DATABASE_URL is available, otherwise fallback to memory
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  try {
    if (process.env.DATABASE_URL) {
      const { DbStorage } = await import("./db-storage");
      return new DbStorage();
    } else {
      return new MemStorage();
    }
  } catch (error) {
    console.warn("Failed to initialize database storage, falling back to memory storage:", error);
    return new MemStorage();
  }
}

// Initialize storage - this will be called when the module is imported
const storagePromise = initializeStorage();
storage = new MemStorage(); // Temporary fallback

// Replace with actual storage once initialized
storagePromise.then(s => {
  storage = s;
  console.log(`Storage initialized: ${process.env.DATABASE_URL ? 'Database' : 'Memory'}`);
}).catch(error => {
  console.error("Storage initialization failed:", error);
});

export { storage };
