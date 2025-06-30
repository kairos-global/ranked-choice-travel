import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RetroWindow from "@/components/retro-window";
import DragDropList from "@/components/drag-drop-list";
import type { Poll } from "@shared/schema";

export default function PollPage() {
  const [, params] = useRoute("/poll/:id");
  const pollId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [hasVoted, setHasVoted] = useState(false);
  const [rankings, setRankings] = useState<{id: string, text: string, rank: number}[]>([]);

  const { data: poll, isLoading, error } = useQuery<Poll>({
    queryKey: ["/api/polls/" + pollId],
    enabled: !!pollId,
  });

  const submitVoteMutation = useMutation({
    mutationFn: async (voteData: { pollId: string; rankings: {option: string, rank: number}[] }) => {
      const response = await apiRequest("POST", "/api/votes", voteData);
      return response.json();
    },
    onSuccess: () => {
      setHasVoted(true);
      toast({
        title: "Vote Submitted!",
        description: "Thank you for participating in this poll!",
      });
      // Invalidate results query to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/polls/" + pollId + "/results"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (poll) {
      const initialRankings = poll.options.map((option, index) => ({
        id: option,
        text: option,
        rank: index + 1
      }));
      setRankings(initialRankings);
    }
  }, [poll]);

  const handleSubmitVote = () => {
    if (!poll || !pollId) return;

    const voteRankings = rankings.map(item => ({
      option: item.id,
      rank: item.rank
    }));

    submitVoteMutation.mutate({
      pollId: pollId,
      rankings: voteRankings
    });
  };

  const handleViewResults = () => {
    if (poll?.showResults) {
      window.location.href = `/results/${pollId}`;
    }
  };

  if (isLoading) {
    return (
      <div className="retro-desktop">
        <RetroWindow>
          <div className="retro-window-content">
            <div className="retro-logo">Loading Poll...</div>
            <div className="retro-progress-bar">
              <div className="retro-progress-fill" style={{ width: '60%' }} />
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="retro-desktop">
        <RetroWindow>
          <div className="retro-window-content">
            <div className="retro-logo">Poll Not Found</div>
            <div className="retro-fieldset">
              <legend>Error</legend>
              <div style={{ color: 'black' }}>
                The poll you're looking for could not be found or has been removed.
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

  if (poll.closed) {
    return (
      <div className="retro-desktop">
        <RetroWindow>
          <div className="retro-window-content">
            <div className="retro-logo">Poll Closed</div>
            <div className="retro-fieldset">
              <legend>This poll is no longer accepting votes</legend>
              <div style={{ color: 'black' }}>
                <strong>{poll.title}</strong>
              </div>
              <div style={{ marginTop: '16px' }}>
                {poll.showResults && (
                  <button 
                    className="retro-button primary" 
                    onClick={handleViewResults}
                  >
                    View Results
                  </button>
                )}
                <button 
                  className="retro-button" 
                  onClick={() => window.location.href = '/'}
                >
                  Create New Poll
                </button>
              </div>
            </div>
          </div>
        </RetroWindow>
      </div>
    );
  }

  return (
    <div className="retro-desktop">
      <RetroWindow>
        <div className="retro-window-content">
          <div className="retro-logo">Cast Your Vote</div>
          
          <div className="retro-fieldset">
            <legend>Poll: {poll.title}</legend>
            <div style={{ fontSize: '10px', marginBottom: '8px', color: 'black' }}>
              Poll ID: {poll.id} | Created: {new Date(poll.createdAt).toLocaleDateString()}
            </div>
            {poll.description && (
              <div style={{ marginBottom: '12px', color: 'black' }}>
                {poll.description}
              </div>
            )}
          </div>

          {!hasVoted ? (
            <>
              <div className="retro-fieldset">
                <legend>Rank Your Preferences (Drag to Reorder)</legend>
                <DragDropList 
                  items={rankings}
                  onChange={setRankings}
                />
              </div>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button 
                  className="retro-button primary" 
                  onClick={handleSubmitVote}
                  disabled={submitVoteMutation.isPending}
                  style={{ minWidth: '120px' }}
                >
                  {submitVoteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                </button>
              </div>
            </>
          ) : (
            <div className="retro-fieldset">
              <legend>Vote Submitted Successfully!</legend>
              <div style={{ textAlign: 'center', color: 'black' }}>
                <p>Thank you for participating in this poll!</p>
                <div style={{ marginTop: '16px' }}>
                  {poll.showResults && (
                    <button 
                      className="retro-button primary" 
                      onClick={handleViewResults}
                    >
                      View Results
                    </button>
                  )}
                  <button 
                    className="retro-button" 
                    onClick={() => window.location.href = '/'}
                  >
                    Create New Poll
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </RetroWindow>
    </div>
  );
}
