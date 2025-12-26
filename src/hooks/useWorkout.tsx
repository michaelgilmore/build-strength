import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  name: string;
  current_weight: number;
  sets: number;
  weight_increment: number;
  workout_type: string;
  duration_seconds: number;
  rest_seconds: number;
  reps: number;
}

interface RoutineDay {
  id: string;
  day_of_week: number;
  exercise_order: number;
  exercise_id: string;
  exercise: Exercise;
  audio_url?: string | null;
}

interface WorkoutState {
  isActive: boolean;
  workoutStarted: boolean;
  currentExerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  isWorkoutActive: boolean;
  timeRemaining: number;
  restEndTime: number | null; // timestamp when rest should end
  workoutComplete: boolean;
  todaysExercises: RoutineDay[];
  currentReps: number;
  todaysAudioUrl: string | null;
}

interface WorkoutContextType {
  state: WorkoutState;
  setWorkoutStarted: (started: boolean) => void;
  setCurrentExerciseIndex: (index: number) => void;
  setCurrentSet: (set: number) => void;
  setIsResting: (resting: boolean, restSeconds?: number) => void;
  setIsWorkoutActive: (active: boolean) => void;
  setTimeRemaining: (time: number) => void;
  setWorkoutComplete: (complete: boolean) => void;
  setTodaysExercises: (exercises: RoutineDay[]) => void;
  setCurrentReps: (reps: number) => void;
  setTodaysAudioUrl: (url: string | null) => void;
  skipRest: () => void;
  resetWorkout: () => void;
  activateWorkout: () => void;
}

const initialState: WorkoutState = {
  isActive: false,
  workoutStarted: false,
  currentExerciseIndex: 0,
  currentSet: 1,
  isResting: false,
  isWorkoutActive: false,
  timeRemaining: 0,
  restEndTime: null,
  workoutComplete: false,
  todaysExercises: [],
  currentReps: 10,
  todaysAudioUrl: null,
};

// Boxing bell sound using Web Audio API
function playBellSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const frequencies = [800, 1200, 1600];
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, audioContext.currentTime + 0.8);
      
      const volume = 0.3 / (index + 1);
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    });
    
    setTimeout(() => {
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, audioContext.currentTime + 0.8);
        
        const volume = 0.3 / (index + 1);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.8);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.8);
      });
    }, 150);
  } catch (err) {
    console.log('Failed to play bell sound:', err);
  }
}

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkoutState>(initialState);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Global timer that runs regardless of which page the user is on
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (state.isResting && state.restEndTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.restEndTime! - now) / 1000));
        
        setState(prev => ({ ...prev, timeRemaining: remaining }));
        
        if (remaining <= 0) {
          playBellSound();
          toast({
            title: 'Rest Complete!',
            description: 'Time to start your next set.',
          });
          setState(prev => ({
            ...prev,
            isResting: false,
            timeRemaining: 0,
            restEndTime: null,
          }));
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      }, 100);
    } else if (state.isWorkoutActive && state.timeRemaining > 0) {
      // Handle timed exercise timer
      timerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 1) {
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [state.isResting, state.restEndTime, state.isWorkoutActive, toast]);

  const setWorkoutStarted = useCallback((started: boolean) => {
    setState(prev => ({ ...prev, workoutStarted: started }));
  }, []);

  const setCurrentExerciseIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentExerciseIndex: index }));
  }, []);

  const setCurrentSet = useCallback((set: number) => {
    setState(prev => ({ ...prev, currentSet: set }));
  }, []);

  const setIsResting = useCallback((resting: boolean, restSeconds?: number) => {
    if (resting && restSeconds) {
      const endTime = Date.now() + restSeconds * 1000;
      setState(prev => ({
        ...prev,
        isResting: true,
        timeRemaining: restSeconds,
        restEndTime: endTime,
      }));
    } else {
      setState(prev => ({
        ...prev,
        isResting: resting,
        restEndTime: resting ? prev.restEndTime : null,
      }));
    }
  }, []);

  const setIsWorkoutActive = useCallback((active: boolean) => {
    setState(prev => ({ ...prev, isWorkoutActive: active }));
  }, []);

  const setTimeRemaining = useCallback((time: number) => {
    setState(prev => ({ ...prev, timeRemaining: time }));
  }, []);

  const setWorkoutComplete = useCallback((complete: boolean) => {
    setState(prev => ({ ...prev, workoutComplete: complete }));
  }, []);

  const setTodaysExercises = useCallback((exercises: RoutineDay[]) => {
    setState(prev => ({ ...prev, todaysExercises: exercises }));
  }, []);

  const setCurrentReps = useCallback((reps: number) => {
    setState(prev => ({ ...prev, currentReps: reps }));
  }, []);

  const setTodaysAudioUrl = useCallback((url: string | null) => {
    setState(prev => ({ ...prev, todaysAudioUrl: url }));
  }, []);

  const skipRest = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isResting: false,
      timeRemaining: 0,
      restEndTime: null,
    }));
  }, []);

  const resetWorkout = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setState(initialState);
  }, []);

  const activateWorkout = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  return (
    <WorkoutContext.Provider
      value={{
        state,
        setWorkoutStarted,
        setCurrentExerciseIndex,
        setCurrentSet,
        setIsResting,
        setIsWorkoutActive,
        setTimeRemaining,
        setWorkoutComplete,
        setTodaysExercises,
        setCurrentReps,
        setTodaysAudioUrl,
        skipRest,
        resetWorkout,
        activateWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
}
