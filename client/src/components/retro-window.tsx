import { useState, useEffect, ReactNode } from "react";

interface RetroWindowProps {
  title?: string;
  children: ReactNode;
}

export default function RetroWindow({ title = "RankedChoiceTravel - TripPoll 95", children }: RetroWindowProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="retro-window">
      <div className="retro-window-header">
        <div>{title}</div>
        <div className="retro-window-controls">
          <div className="retro-window-control">_</div>
          <div className="retro-window-control">□</div>
          <div className="retro-window-control">×</div>
        </div>
      </div>
      
      {children}

      <div className="retro-status-bar">
        <div>TripPoll 95 - Ready</div>
        <div>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    </div>
  );
}
