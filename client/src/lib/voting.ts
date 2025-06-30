import type { Vote } from "@shared/schema";

export interface RankedResult {
  option: string;
  votes: number;
  percentage: number;
  eliminated: boolean;
  round: number;
}

export interface InstantRunoffResult {
  winner: string;
  rounds: RankedResult[][];
  totalVotes: number;
}

export function calculateInstantRunoff(votes: Vote[], options: string[]): InstantRunoffResult {
  if (votes.length === 0) {
    return {
      winner: options[0] || "",
      rounds: [],
      totalVotes: 0
    };
  }

  let remainingOptions = [...options];
  const rounds: RankedResult[][] = [];
  let currentVotes = votes.map(vote => vote.rankings);

  while (remainingOptions.length > 1) {
    // Count first preferences for remaining options
    const firstPreferenceCounts = new Map<string, number>();
    remainingOptions.forEach(option => firstPreferenceCounts.set(option, 0));

    currentVotes.forEach(ranking => {
      // Find the highest ranked option that's still in the race
      const sortedRanking = ranking.sort((a, b) => a.rank - b.rank);
      for (const { option } of sortedRanking) {
        if (remainingOptions.includes(option)) {
          firstPreferenceCounts.set(option, (firstPreferenceCounts.get(option) || 0) + 1);
          break;
        }
      }
    });

    // Create round results
    const roundResults: RankedResult[] = remainingOptions.map(option => ({
      option,
      votes: firstPreferenceCounts.get(option) || 0,
      percentage: ((firstPreferenceCounts.get(option) || 0) / votes.length) * 100,
      eliminated: false,
      round: rounds.length + 1
    }));

    // Check if we have a winner (>50% of votes)
    const maxVotes = Math.max(...roundResults.map(r => r.votes));
    const winner = roundResults.find(r => r.votes === maxVotes);
    
    if (winner && winner.votes > votes.length / 2) {
      rounds.push(roundResults);
      return {
        winner: winner.option,
        rounds,
        totalVotes: votes.length
      };
    }

    // Find option(s) with minimum votes to eliminate
    const minVotes = Math.min(...roundResults.map(r => r.votes));
    const toEliminate = roundResults.filter(r => r.votes === minVotes);
    
    // Mark eliminated options
    toEliminate.forEach(result => {
      result.eliminated = true;
      remainingOptions = remainingOptions.filter(opt => opt !== result.option);
    });

    rounds.push(roundResults);

    // If only one option remains, they win
    if (remainingOptions.length === 1) {
      return {
        winner: remainingOptions[0],
        rounds,
        totalVotes: votes.length
      };
    }
  }

  return {
    winner: remainingOptions[0] || "",
    rounds,
    totalVotes: votes.length
  };
}
