import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, generateShareableUrl } from "@/lib/utils";
import { calculateInstantRunoff } from "@/lib/voting";
import RetroWindow from "@/components/retro-window";
import type { Poll, Vote } from "@shared/schema";

interface ResultsResponse {
  poll: Poll;
  votes: Vote[];
  totalVotes: number;
}

export default function ResultsPage() {
  const [, params] = useRoute("/results/:id");
  const pollId = params?.id;
  const search = useSearch();
  const adminKey = new URLSearchParams(search).get('key');
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery<ResultsResponse>({
    queryKey: [`/api/polls/${pollId}/results${adminKey ? `?adminKey=${adminKey}` : ''}`],
    enabled: !!pollId,
  });

  const handleCopyResultsLink = async () => {
    if (!pollId) return;
    
    const url = generateShareableUrl(pollId, 'results', adminKey || undefined);
    
    try {
      await copyToClipboard(url);
      toast({
        title: "Copied!",
        description: "Results link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleExportResults = () => {
    if (!data) return;
    
    const results = calculateInstantRunoff(data.votes, data.poll.options);
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Option,Votes,Percentage\n" +
      results.rounds[results.rounds.length - 1]?.map(result => 
        `"${result.option}",${result.votes},${result.percentage.toFixed(1)}%`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `poll-${pollId}-results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Exported!",
      description: "Results exported to CSV file.",
    });
  };

  if (isLoading) {
    return (
      <div className="retro-desktop">
        <RetroWindow>
          <div className="retro-window-content">
            <div className="retro-logo">Loading Results...</div>
            <div className="retro-progress-bar">
              <div className="retro-progress-fill" style={{ width: '80%' }} />
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="retro-desktop">
        <RetroWindow>
          <div className="retro-window-content">
            <div className="retro-logo">Access Denied</div>
            <div className="retro-fieldset">
              <legend>Error</legend>
              <div style={{ color: 'black' }}>
                You don't have permission to view these results, or the poll doesn't exist.
              </div>
              <div style={{ marginTop: '16px' }}>
                <button 
                  className="retro-button primary" 
                  onClick={() => window.location.href = '/'}
                >
                  Return Home
                </button>
              </div>
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  const { poll, votes, totalVotes } = data;
  const results = calculateInstantRunoff(votes, poll.options);
  const isAdmin = poll.adminKey !== undefined;

  if (totalVotes === 0) {
    return (
      <div className="retro-desktop">
        <RetroWindow>
          <div className="retro-window-content">
            <div className="retro-logo">No Votes Yet</div>
            <div className="retro-fieldset">
              <legend>Poll: {poll.title}</legend>
              <div style={{ color: 'black' }}>
                This poll hasn't received any votes yet. Share the voting link to get started!
              </div>
              <div style={{ marginTop: '16px' }}>
                <button 
                  className="retro-button primary"
                  onClick={() => copyToClipboard(generateShareableUrl(poll.id, 'vote'))}
                >
                  Copy Voting Link
                </button>
                <button 
                  className="retro-button" 
                  onClick={() => window.location.href = '/'}
                >
                  Return Home
                </button>
              </div>
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  const finalRoundResults = results.rounds[results.rounds.length - 1] || [];
  const sortedResults = [...finalRoundResults].sort((a, b) => b.votes - a.votes);

  return (
    <div className="retro-desktop">
      <RetroWindow>
        <div className="retro-window-content">
          <div className="retro-logo">Poll Results</div>
          
          <div className="retro-fieldset">
            <legend>Poll: {poll.title}</legend>
            <div style={{ fontSize: '10px', marginBottom: '8px', color: 'black' }}>
              Poll ID: {poll.id} | Total Votes: {totalVotes} | Status: {poll.closed ? 'Closed' : 'Active'}
            </div>
            <div style={{ marginBottom: '12px', color: 'black' }}>
              Results calculated using Instant-Runoff Voting (IRV)
            </div>
          </div>

          <div className="retro-fieldset">
            <legend>Final Results</legend>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', color: 'var(--retro-green)', fontSize: '12px' }}>
                🏆 Winner: {results.winner}
              </div>
              <div style={{ fontSize: '10px', marginTop: '4px', color: 'black' }}>
                Won after {results.rounds.length} round{results.rounds.length !== 1 ? 's' : ''} of voting
              </div>
            </div>
            
            <div style={{ marginBottom: '8px', fontWeight: 'bold', color: 'black' }}>
              Vote Distribution:
            </div>
            
            {sortedResults.map((result, index) => {
              const colors = [
                'var(--retro-green)',
                'var(--retro-blue)', 
                'var(--retro-red)',
                'var(--retro-gray-dark)'
              ];
              const color = colors[index] || 'var(--retro-gray-dark)';
              const bgGradient = `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`;
              
              return (
                <div key={result.option} style={{ margin: '8px 0' }}>
                  <div className="retro-results-label">
                    {index + 1}. {result.option} ({result.votes} votes - {result.percentage.toFixed(1)}%)
                  </div>
                  <div className="retro-results-bar">
                    <div 
                      className="retro-results-fill" 
                      style={{ 
                        width: `${result.percentage}%`,
                        background: bgGradient
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="retro-fieldset">
            <legend>Instant-Runoff Rounds</legend>
            <div style={{ fontSize: '10px', marginBottom: '8px', color: 'black' }}>
              {results.rounds.map((round, index) => {
                const eliminated = round.filter(r => r.eliminated).map(r => r.option);
                return (
                  <div key={index} style={{ marginBottom: '4px' }}>
                    <strong>Round {index + 1}:</strong> {
                      eliminated.length > 0 
                        ? `${eliminated.join(', ')} eliminated`
                        : `${results.winner} wins with ${round.find(r => r.option === results.winner)?.votes || 0} votes`
                    }
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button className="retro-button" onClick={handleExportResults}>
              Export Results
            </button>
            <button className="retro-button" onClick={handleCopyResultsLink}>
              Share Results
            </button>
            {isAdmin && !poll.closed && (
              <button 
                className="retro-button danger" 
                onClick={() => {
                  // TODO: Implement close poll functionality
                  toast({
                    title: "Feature Coming Soon",
                    description: "Poll closing functionality will be added soon.",
                  });
                }}
              >
                Close Poll
              </button>
            )}
          </div>
        </div>
      </RetroWindow>
    </div>
  );
}
