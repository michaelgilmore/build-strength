import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface WorkoutMusicContextType {
  musicEnabled: boolean;
  setMusicEnabled: (enabled: boolean) => void;
  toggleMusic: () => void;
}

const WorkoutMusicContext = createContext<WorkoutMusicContextType | undefined>(undefined);

const STORAGE_KEY = 'workout-music-enabled';

export function WorkoutMusicProvider({ children }: { children: ReactNode }) {
  const [musicEnabled, setMusicEnabledState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const setMusicEnabled = (enabled: boolean) => {
    setMusicEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  };

  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
  };

  return (
    <WorkoutMusicContext.Provider value={{ musicEnabled, setMusicEnabled, toggleMusic }}>
      {children}
    </WorkoutMusicContext.Provider>
  );
}

export function useWorkoutMusic() {
  const context = useContext(WorkoutMusicContext);
  if (!context) {
    throw new Error('useWorkoutMusic must be used within a WorkoutMusicProvider');
  }
  return context;
}
