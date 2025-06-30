import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, generateShareableUrl } from "@/lib/utils";
import RetroWindow from "@/components/retro-window";
import type { InsertPoll, Poll } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('create');
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [allowEdits, setAllowEdits] = useState(true);
  const [showResults, setShowResults] = useState(true);
  
  // Poll creation result
  const [createdPoll, setCreatedPoll] = useState<{ poll: any; adminKey: string } | null>(null);
  
  // Store admin keys for created polls in localStorage
  const [adminKeys, setAdminKeys] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('tripPollAdminKeys') || '{}');
    } catch {
      return {};
    }
  });

  // Query to fetch all polls
  const { data: polls = [], isLoading: pollsLoading } = useQuery({
    queryKey: ['/api/polls'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/polls");
      return response.json() as Promise<Poll[]>;
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (pollData: InsertPoll) => {
      const response = await apiRequest("POST", "/api/polls", pollData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedPoll(data);
      // Save admin key to localStorage
      const newAdminKeys = { ...adminKeys, [data.poll.id]: data.adminKey };
      setAdminKeys(newAdminKeys);
      localStorage.setItem('tripPollAdminKeys', JSON.stringify(newAdminKeys));
      
      // Invalidate polls query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
      
      toast({
        title: "Poll Created!",
        description: "Your poll has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async ({ id, adminKey }: { id: string; adminKey: string }) => {
      const response = await apiRequest("DELETE", `/api/polls/${id}`, { adminKey });
      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Remove admin key from localStorage
      const newAdminKeys = { ...adminKeys };
      delete newAdminKeys[id];
      setAdminKeys(newAdminKeys);
      localStorage.setItem('tripPollAdminKeys', JSON.stringify(newAdminKeys));
      
      // Invalidate polls query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/polls'] });
      
      toast({
        title: "Poll Deleted",
        description: "Poll has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete poll. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  };

  const removeOption = () => {
    if (options.length > 3) {
      setOptions(options.slice(0, -1));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    const filledOptions = options.filter(opt => opt.trim() !== "");
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poll title.",
        variant: "destructive",
      });
      return;
    }
    
    if (filledOptions.length < 3) {
      toast({
        title: "Error",
        description: "Please provide at least 3 destination options.",
        variant: "destructive",
      });
      return;
    }

    createPollMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      options: filledOptions,
      allowEdits,
      showResults,
    });
  };

  const handleCopyLink = async (type: 'vote' | 'results') => {
    if (!createdPoll) return;
    
    const url = generateShareableUrl(
      createdPoll.poll.id, 
      type, 
      type === 'results' ? createdPoll.adminKey : undefined
    );
    
    try {
      await copyToClipboard(url);
      toast({
        title: "Copied!",
        description: `${type === 'vote' ? 'Voting' : 'Results'} link copied to clipboard.`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="retro-desktop">
      <RetroWindow>
        <div className="retro-nav-tabs">
          <div 
            className={`retro-nav-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Poll
          </div>
          <div 
            className={`retro-nav-tab ${activeTab === 'polls' ? 'active' : ''}`}
            onClick={() => setActiveTab('polls')}
          >
            Our Polls
          </div>
          <div 
            className={`retro-nav-tab ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </div>
        </div>

        {activeTab === 'create' && (
          <div className="retro-window-content">
            <div className="retro-logo">RankedChoiceTravel</div>
            
            <div className="retro-fieldset">
              <legend>Poll Information</legend>
              <div className="retro-form-row">
                <label htmlFor="pollTitle">Poll Title:</label>
                <input 
                  type="text" 
                  id="pollTitle" 
                  className="retro-input" 
                  placeholder="Where should we go next?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="retro-form-row">
                <label htmlFor="pollDescription">Description:</label>
                <input 
                  type="text" 
                  id="pollDescription" 
                  className="retro-input" 
                  placeholder="whats the vibe?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="retro-fieldset">
              <legend>Travel Destinations (3-6 options)</legend>
              <div>
                {options.map((option, index) => (
                  <div key={index} className="retro-form-row">
                    <label>Option {index + 1}:</label>
                    <input 
                      type="text" 
                      className="retro-input" 
                      placeholder={`Enter destination ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '8px' }}>
                <button className="retro-button" onClick={addOption} disabled={options.length >= 6}>
                  Add Destination
                </button>
                <button className="retro-button" onClick={removeOption} disabled={options.length <= 3}>
                  Remove Last
                </button>
              </div>
            </div>

            <div className="retro-fieldset">
              <legend>Poll Settings</legend>
              <div className="retro-form-row">
                <input 
                  type="checkbox" 
                  id="allowEdits" 
                  checked={allowEdits}
                  onChange={(e) => setAllowEdits(e.target.checked)}
                />
                <label htmlFor="allowEdits">Allow edits before votes are cast</label>
              </div>
              <div className="retro-form-row">
                <input 
                  type="checkbox" 
                  id="showResults" 
                  checked={showResults}
                  onChange={(e) => setShowResults(e.target.checked)}
                />
                <label htmlFor="showResults">Show results to voters after voting</label>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button 
                className="retro-button primary" 
                onClick={handleCreatePoll}
                disabled={createPollMutation.isPending}
                style={{ minWidth: '120px' }}
              >
                {createPollMutation.isPending ? 'Creating...' : 'Create Poll'}
              </button>
            </div>

            {createdPoll && (
              <div className="retro-fieldset" style={{ marginTop: '16px' }}>
                <legend>Poll Created Successfully!</legend>
                <div className="retro-form-row">
                  <label>Poll ID:</label>
                  <input 
                    type="text" 
                    className="retro-input" 
                    readOnly 
                    value={createdPoll.poll.id}
                  />
                </div>
                <div className="retro-form-row">
                  <label>Voting Link:</label>
                  <input 
                    type="text" 
                    className="retro-input" 
                    readOnly 
                    value={generateShareableUrl(createdPoll.poll.id, 'vote')}
                  />
                  <button className="retro-button" onClick={() => handleCopyLink('vote')}>
                    Copy
                  </button>
                  <button 
                    className="retro-button" 
                    onClick={() => window.open(generateShareableUrl(createdPoll.poll.id, 'vote'), '_blank')}
                  >
                    Visit
                  </button>
                </div>
                <div className="retro-form-row">
                  <label>Results Link:</label>
                  <input 
                    type="text" 
                    className="retro-input" 
                    readOnly 
                    value={generateShareableUrl(createdPoll.poll.id, 'results', createdPoll.adminKey)}
                  />
                  <button className="retro-button" onClick={() => handleCopyLink('results')}>
                    Copy
                  </button>
                  <button 
                    className="retro-button" 
                    onClick={() => window.open(generateShareableUrl(createdPoll.poll.id, 'results', createdPoll.adminKey), '_blank')}
                  >
                    Visit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="retro-window-content">
            <div className="retro-logo">Our Polls</div>
            
            {pollsLoading ? (
              <div className="retro-fieldset">
                <legend>Loading...</legend>
                <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '20px' }}>
                  Loading polls...
                </div>
              </div>
            ) : polls.length === 0 ? (
              <div className="retro-fieldset">
                <legend>No Polls Found</legend>
                <div style={{ color: 'var(--text-primary)', textAlign: 'center', padding: '20px' }}>There is no polls yet.
                Create a poll in the "Create Poll" tab!</div>
              </div>
            ) : (
              <div className="retro-fieldset">
                <legend>All Polls ({polls.length})</legend>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {polls.map((poll) => {
                    const isOwnPoll = adminKeys[poll.id];
                    return (
                      <div key={poll.id} className="retro-form-row" style={{ 
                        padding: '12px', 
                        border: '1px solid var(--border-color)', 
                        marginBottom: '8px',
                        backgroundColor: isOwnPoll ? 'rgba(0, 100, 200, 0.1)' : 'transparent'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
                              {poll.title} {isOwnPoll && <span style={{ color: 'blue', fontSize: '12px' }}>(You created this)</span>}
                            </div>
                            {poll.description && (
                              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '4px' }}>
                                {poll.description}
                              </div>
                            )}
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                              {poll.options.length} options • Created {new Date(poll.createdAt).toLocaleDateString()}
                              {poll.closed && <span style={{ color: 'red' }}> • CLOSED</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                            <button 
                              className="retro-button"
                              onClick={() => setLocation(`/poll/${poll.id}`)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Vote
                            </button>
                            <button 
                              className="retro-button"
                              onClick={() => setLocation(`/results/${poll.id}`)}
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Results
                            </button>
                            {isOwnPoll && (
                              <button 
                                className="retro-button"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this poll? This action cannot be undone.')) {
                                    deletePollMutation.mutate({ id: poll.id, adminKey: adminKeys[poll.id] });
                                  }
                                }}
                                disabled={deletePollMutation.isPending}
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 8px', 
                                  backgroundColor: '#c42', 
                                  color: 'white',
                                  opacity: deletePollMutation.isPending ? 0.5 : 1
                                }}
                              >
                                {deletePollMutation.isPending ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="retro-window-content">
            <div className="retro-logo">About TripPoll 95</div>
            
            <div className="retro-fieldset">
              <legend>What is TripPoll 95?</legend>
              <div style={{ color: 'var(--text-primary)', lineHeight: '1.6', marginBottom: '16px' }}>A retro-style poll app for figuring out your next trip with friends</div>
              <div style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>Just drop in your options, send the link, and let everyone rank their picks.</div>
            </div>

            <div className="retro-fieldset">
              <legend>How It Works</legend>
              <div style={{ color: 'var(--text-primary)', lineHeight: '1.6' }}>
                <strong>1. Create a Poll:</strong> List 3-6 places you're considering<br/>
                <strong>2. Share with Friends:</strong> Send them the voting link<br/>
                <strong>3. Everyone Votes:</strong> Drag and drop to rank preferences<br/>
                <strong>4. See Results:</strong> Find out where you're going!
              </div>
            </div>


          </div>
        )}
      </RetroWindow>
    </div>
  );
}
