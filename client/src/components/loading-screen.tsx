import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const loadingSteps = [
    { text: 'Initializing voting system...', progress: 20 },
    { text: 'Loading retro interface...', progress: 40 },
    { text: 'Connecting to database...', progress: 60 },
    { text: 'Preparing poll creation tools...', progress: 80 },
    { text: 'TripPoll 95 ready!', progress: 100 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setCurrentStep(currentStep + 1);
        
        if (currentStep === loadingSteps.length - 1) {
          setTimeout(onComplete, 1000);
        }
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [currentStep, loadingSteps, onComplete]);

  return (
    <div className="retro-loading-screen">
      <div className="retro-loading-window">
        <div className="retro-loading-title">TripPoll 95</div>
        <div style={{ margin: '20px 0' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'black' }}>
            Booting RankedChoiceTravel...
          </div>
          <div className="retro-progress-bar">
            <div 
              className="retro-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div style={{ fontSize: '10px', marginTop: '4px', color: 'black' }}>
            {loadingSteps[Math.max(0, currentStep - 1)]?.text || 'Starting...'}
          </div>
        </div>
      </div>
    </div>
  );
}
