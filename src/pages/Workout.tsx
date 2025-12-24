import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Check, ThumbsUp, ThumbsDown, SkipForward, Loader2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DAYS_OF_WEEK } from '@/lib/exercises';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  current_weight: number;
  sets: number;
  weight_increment: number;
  workout_type: string;
  duration_seconds: number;
  rest_seconds: number;
}

interface RoutineDay {
  id: string;
  day_of_week: number;
  exercise_order: number;
  exercise_id: string;
  exercise: Exercise;
}

interface Routine {
  id: string;
  name: string;
  user_id: string;
}

// Bell sound using Web Audio API
function playBellSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
  
  gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

export default function Workout() {
  const [loading, setLoading] = useState(true);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [todaysExercises, setTodaysExercises] = useState<RoutineDay[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
  const [workoutComplete, setWorkoutComplete] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const currentExercise = todaysExercises[currentExerciseIndex]?.exercise;
  const today = new Date().getDay();

  const fetchActiveRoutine = useCallback(async () => {
    if (!user) return;

    const { data: routine } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (routine) {
      setActiveRoutine(routine);

      // Fetch today's exercises
      const { data: days } = await supabase
        .from('routine_days')
        .select('*, exercises(*)')
        .eq('routine_id', routine.id)
        .eq('day_of_week', today)
        .order('exercise_order');

      if (days && days.length > 0) {
        setTodaysExercises(days.map((d: any) => ({ ...d, exercise: d.exercises })));
      } else {
        setTodaysExercises([]);
      }
    } else {
      // No active routine, show selector
      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .or(`user_id.eq.${user.id},is_shared.eq.true`);

      setAvailableRoutines(routines || []);
      setShowRoutineSelector(true);
    }

    setLoading(false);
  }, [user, today]);

  useEffect(() => {
    fetchActiveRoutine();
  }, [fetchActiveRoutine]);

  useEffect(() => {
    if (isWorkoutActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            playBellSound();
            if (isResting) {
              setIsResting(false);
              return 0;
            } else {
              handleSetComplete();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkoutActive, timeRemaining, isResting]);

  const selectRoutine = async (routine: Routine) => {
    if (!user) return;

    // Deactivate all, activate selected
    await supabase.from('routines').update({ is_active: false }).eq('user_id', user.id);
    await supabase.from('routines').update({ is_active: true }).eq('id', routine.id);

    setShowRoutineSelector(false);
    fetchActiveRoutine();
  };

  const startWorkout = () => {
    if (!currentExercise) return;

    setIsWorkoutActive(true);
    if (currentExercise.workout_type === 'timed') {
      setTimeRemaining(currentExercise.duration_seconds);
    }
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSetComplete = async (feedback?: 'too_hard' | 'too_easy' | 'neutral') => {
    if (!currentExercise || !user) return;

    // Log the set to database
    const { error } = await supabase.from('workout_logs').insert({
      user_id: user.id,
      exercise_id: currentExercise.id,
      exercise_name: currentExercise.name,
      set_number: currentSet,
      weight_used: currentExercise.current_weight,
      workout_type: currentExercise.workout_type,
      difficulty_feedback: feedback || 'neutral',
    });

    if (error) {
      console.error('Failed to log workout:', error);
      toast({ title: 'Error', description: 'Failed to save workout data', variant: 'destructive' });
    }

    // Adjust weight based on feedback
    if (feedback === 'too_easy') {
      await supabase
        .from('exercises')
        .update({ current_weight: currentExercise.current_weight + currentExercise.weight_increment })
        .eq('id', currentExercise.id);
      toast({ title: 'Weight Increased', description: `Next time: ${currentExercise.current_weight + currentExercise.weight_increment}kg` });
    } else if (feedback === 'too_hard') {
      const newWeight = Math.max(0, currentExercise.current_weight - currentExercise.weight_increment);
      await supabase
        .from('exercises')
        .update({ current_weight: newWeight })
        .eq('id', currentExercise.id);
      toast({ title: 'Weight Decreased', description: `Next time: ${newWeight}kg` });
    }

    playBellSound();

    // Move to next set or exercise
    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      setIsResting(true);
      setTimeRemaining(currentExercise.rest_seconds);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < todaysExercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setIsWorkoutActive(false);
        toast({ title: 'Next Exercise', description: todaysExercises[currentExerciseIndex + 1].exercise.name });
      } else {
        // Workout complete!
        setIsWorkoutActive(false);
        setWorkoutComplete(true);
        toast({ title: 'Workout Complete!', description: 'Great job crushing it today!' });
      }
    }
  };

  const skipRest = () => {
    setIsResting(false);
    setTimeRemaining(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // Routine Selector Modal
  if (showRoutineSelector) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 py-6 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <Calendar className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-display text-foreground mb-2">Select a Routine</h2>
            <p className="text-muted-foreground">Choose a workout routine to get started</p>
          </motion.div>

          <div className="space-y-3">
            {availableRoutines.map((routine) => (
              <motion.button
                key={routine.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => selectRoutine(routine)}
                className="w-full card-intense p-4 text-left hover:ring-2 hover:ring-primary transition-all"
              >
                <h3 className="font-display text-lg text-foreground">{routine.name}</h3>
              </motion.button>
            ))}
            {availableRoutines.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No routines yet.</p>
                <Button variant="fire" onClick={() => navigate('/routines')}>
                  Create Your First Routine
                </Button>
              </div>
            )}
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Workout Complete Screen
  if (workoutComplete) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 py-12 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-fire flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Check className="w-12 h-12 text-primary-foreground" />
            </div>
            <h2 className="text-4xl font-display text-gradient-fire mb-4">Workout Complete!</h2>
            <p className="text-xl text-muted-foreground mb-8">You crushed it today</p>
            <Button variant="fire" size="lg" onClick={() => navigate('/analytics')}>
              View Progress
            </Button>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // No exercises today
  if (todaysExercises.length === 0) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 py-12 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display text-foreground mb-2">Rest Day</h2>
            <p className="text-muted-foreground mb-6">
              No exercises scheduled for {DAYS_OF_WEEK[today]}.
            </p>
            <Button variant="outline" onClick={() => navigate('/routines')}>
              Edit Routine
            </Button>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            Exercise {currentExerciseIndex + 1} of {todaysExercises.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {DAYS_OF_WEEK[today]}
          </span>
        </div>

        <div className="h-1 bg-secondary rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-fire"
            initial={{ width: 0 }}
            animate={{ width: `${((currentExerciseIndex + (currentSet - 1) / (currentExercise?.sets || 1)) / todaysExercises.length) * 100}%` }}
          />
        </div>

        {/* Current Exercise Display */}
        <motion.div
          key={currentExercise?.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-intense p-6 text-center mb-6"
        >
          <AnimatePresence mode="wait">
            {isResting ? (
              <motion.div
                key="rest"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-2xl font-display text-foreground mb-2">Rest</h2>
                <div className="text-7xl font-display text-primary workout-timer mb-4">
                  {formatTime(timeRemaining)}
                </div>
                <Button variant="outline" onClick={skipRest}>
                  <SkipForward className="w-5 h-5 mr-2" />
                  Skip Rest
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="exercise"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <h2 className="text-3xl font-display text-gradient-fire mb-2">
                  {currentExercise?.name}
                </h2>

                {/* Exercise Animation */}
                {currentExercise && (
                  <ExerciseAnimation 
                    exerciseName={currentExercise.name} 
                    className="my-4"
                  />
                )}

                <div className="flex items-center justify-center gap-3 text-xl text-muted-foreground mb-4">
                  <span className="font-bold text-primary">{currentExercise?.current_weight}kg</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleSetComplete('too_hard')}
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 border-success text-success hover:bg-success hover:text-success-foreground"
                    onClick={() => handleSetComplete('too_easy')}
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <span>•</span>
                  <span>Set {currentSet} of {currentExercise?.sets}</span>
                </div>

                {currentExercise?.workout_type === 'timed' && isWorkoutActive && (
                  <div className="text-7xl font-display text-primary workout-timer mb-6">
                    {formatTime(timeRemaining)}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Controls */}
        {!isResting && (
          <div className="space-y-4">
            {/* Main Action Button */}
            {currentExercise?.workout_type === 'timed' ? (
              <Button
                variant="fire"
                size="xl"
                className={cn('w-full', isWorkoutActive && 'animate-pulse-glow')}
                onClick={isWorkoutActive ? pauseWorkout : startWorkout}
              >
                {isWorkoutActive ? (
                  <>
                    <Pause className="w-6 h-6" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    Start Set
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="fire"
                size="xl"
                className="w-full"
                onClick={() => handleSetComplete('neutral')}
              >
                <Check className="w-6 h-6" />
                Complete Set
              </Button>
            )}

          </div>
        )}

        {/* Upcoming Exercises */}
        {todaysExercises.length > 1 && currentExerciseIndex < todaysExercises.length - 1 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">COMING UP</h3>
            <div className="space-y-2">
              {todaysExercises.slice(currentExerciseIndex + 1, currentExerciseIndex + 3).map((day, idx) => (
                <div key={day.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <span className="text-muted-foreground text-sm">{currentExerciseIndex + 2 + idx}</span>
                  <span className="font-medium">{day.exercise.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {day.exercise.current_weight}kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
