import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, generateShareableUrl } from "@/lib/utils";
import RetroWindow from "@/components/retro-window";
import type { InsertPoll } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('create');
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [allowEdits, setAllowEdits] = useState(true);
  const [showResults, setShowResults] = useState(true);
  
  // Poll creation result
  const [createdPoll, setCreatedPoll] = useState<{ poll: any; adminKey: string } | null>(null);

  const createPollMutation = useMutation({
    mutationFn: async (pollData: InsertPoll) => {
      const response = await apiRequest("POST", "/api/polls", pollData);
      return response.json();
    },
    onSuccess: (data) => {
      setCreatedPoll(data);
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
                  placeholder="Where should we go for vacation?"
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
                  placeholder="Help us choose our next travel destination!"
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
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="retro-window-content">
            <div className="retro-logo">About TripPoll 95</div>
            
            <div className="retro-fieldset">
              <legend>What is RankedChoiceTravel?</legend>
              <div style={{ color: 'black', lineHeight: '1.4', marginBottom: '12px' }}>
                RankedChoiceTravel is a retro-themed web application for creating and sharing ranked-choice voting polls specifically designed for travel destinations.
              </div>
              <div style={{ color: 'black', lineHeight: '1.4' }}>
                Using instant-runoff voting (IRV), it ensures that the winning destination truly represents the group's preferences, not just the plurality choice.
              </div>
            </div>

            <div className="retro-fieldset">
              <legend>How It Works</legend>
              <div style={{ color: 'black', lineHeight: '1.4' }}>
                <strong>1. Create a Poll:</strong> Add 3-6 travel destinations and customize your poll settings.<br/>
                <strong>2. Share the Link:</strong> Send the voting link to your travel companions.<br/>
                <strong>3. Vote by Ranking:</strong> Voters drag destinations to rank them by preference.<br/>
                <strong>4. View Results:</strong> See instant-runoff results with detailed round-by-round breakdowns.
              </div>
            </div>

            <div className="retro-fieldset">
              <legend>Features</legend>
              <div style={{ color: 'black', lineHeight: '1.4' }}>
                • Authentic Windows 95-style interface<br/>
                • Drag-and-drop ranking system<br/>
                • Instant-runoff voting algorithm<br/>
                • No registration required<br/>
                • Mobile-friendly design<br/>
                • Real-time results<br/>
                • Shareable poll links
              </div>
            </div>
          </div>
        )}
      </RetroWindow>
    </div>
  );
}
