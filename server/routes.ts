import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPollSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new poll
  app.post("/api/polls", async (req, res) => {
    try {
      const pollData = insertPollSchema.parse(req.body);
      const { poll, adminKey } = await storage.createPoll(pollData);
      res.json({ poll, adminKey });
    } catch (error) {
      res.status(400).json({ message: "Invalid poll data" });
    }
  });

  // Get poll by ID
  app.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPoll(req.params.id);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Don't return admin key in public poll data
      const { adminKey, ...publicPoll } = poll;
      res.json(publicPoll);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Update poll (only if no votes cast and valid admin key)
  app.patch("/api/polls/:id", async (req, res) => {
    try {
      const { adminKey, ...updates } = req.body;
      const poll = await storage.getPoll(req.params.id);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      if (poll.adminKey !== adminKey) {
        return res.status(403).json({ message: "Invalid admin key" });
      }
      
      const votes = await storage.getVotesByPollId(req.params.id);
      if (votes.length > 0 && !poll.allowEdits) {
        return res.status(403).json({ message: "Cannot edit poll after votes are cast" });
      }

      const validUpdates = insertPollSchema.partial().parse(updates);
      const updatedPoll = await storage.updatePoll(req.params.id, validUpdates);
      
      if (!updatedPoll) {
        return res.status(500).json({ message: "Failed to update poll" });
      }
      
      const { adminKey: _, ...publicPoll } = updatedPoll;
      res.json(publicPoll);
    } catch (error) {
      res.status(400).json({ message: "Invalid update data" });
    }
  });

  // Submit a vote
  app.post("/api/votes", async (req, res) => {
    try {
      const voteData = insertVoteSchema.parse(req.body);
      const voterIp = req.ip || req.connection.remoteAddress || "unknown";
      
      const poll = await storage.getPoll(voteData.pollId);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      if (poll.closed) {
        return res.status(403).json({ message: "Poll is closed" });
      }
      
      const hasVoted = await storage.hasVoted(voteData.pollId, voterIp);
      if (hasVoted) {
        return res.status(403).json({ message: "You have already voted in this poll" });
      }
      
      const vote = await storage.createVote(voteData, voterIp);
      res.json(vote);
    } catch (error) {
      res.status(400).json({ message: "Invalid vote data" });
    }
  });

  // Get poll results
  app.get("/api/polls/:id/results", async (req, res) => {
    try {
      const { adminKey } = req.query;
      const poll = await storage.getPoll(req.params.id);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      // Check access: either admin key provided or poll allows public results
      const isAdmin = adminKey === poll.adminKey;
      if (!isAdmin && !poll.showResults) {
        return res.status(403).json({ message: "Results not public" });
      }
      
      const votes = await storage.getVotesByPollId(req.params.id);
      
      res.json({
        poll: { ...poll, adminKey: isAdmin ? poll.adminKey : undefined },
        votes,
        totalVotes: votes.length
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Close poll (admin only)
  app.post("/api/polls/:id/close", async (req, res) => {
    try {
      const { adminKey } = req.body;
      const success = await storage.closePoll(req.params.id, adminKey);
      
      if (!success) {
        return res.status(403).json({ message: "Invalid admin key or poll not found" });
      }
      
      res.json({ message: "Poll closed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
