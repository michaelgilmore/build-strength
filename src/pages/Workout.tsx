import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Check, ThumbsUp, ThumbsDown, SkipForward, Loader2, Calendar, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ExerciseAnimation from '@/components/ExerciseAnimation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { useWorkout } from '@/hooks/useWorkout';
import { supabase } from '@/integrations/supabase/client';
import { DAYS_OF_WEEK } from '@/lib/exercises';
import { cn } from '@/lib/utils';

interface Routine {
  id: string;
  name: string;
  user_id: string;
}

export default function Workout() {
  const [loading, setLoading] = useState(true);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [availableRoutines, setAvailableRoutines] = useState<Routine[]>([]);
  const [alreadyCompletedToday, setAlreadyCompletedToday] = useState(false);
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [editedWeight, setEditedWeight] = useState('');
  const [isEditingReps, setIsEditingReps] = useState(false);
  const [editedReps, setEditedReps] = useState('');

  const weightInputRef = useRef<HTMLInputElement | null>(null);
  const repsInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatWeight, convertWeight, convertToLbs } = useWeightUnit();
  const navigate = useNavigate();
  
  const {
    state: workoutState,
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
    activateWorkout,
  } = useWorkout();

  const {
    workoutStarted,
    currentExerciseIndex,
    currentSet,
    isResting,
    isWorkoutActive,
    timeRemaining,
    workoutComplete,
    todaysExercises,
    currentReps,
    todaysAudioUrl,
  } = workoutState;

  const currentExercise = todaysExercises[currentExerciseIndex]?.exercise;
  const today = new Date().getDay();

  const checkIfWorkoutCompletedToday = useCallback(async (exercises: typeof todaysExercises) => {
    if (!user || exercises.length === 0) return false;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    for (const routineDay of exercises) {
      const exercise = routineDay.exercise;
      
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('set_number')
        .eq('user_id', user.id)
        .eq('exercise_id', exercise.id)
        .gte('completed_at', todayStart.toISOString())
        .lte('completed_at', todayEnd.toISOString());

      if (error || !logs) return false;

      const completedSets = new Set(logs.map(l => l.set_number));
      for (let i = 1; i <= exercise.sets; i++) {
        if (!completedSets.has(i)) {
          return false;
        }
      }
    }

    return true;
  }, [user]);

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

      const { data: days } = await supabase
        .from('routine_days')
        .select('*, exercises(*)')
        .eq('routine_id', routine.id)
        .eq('day_of_week', today)
        .order('exercise_order');

      if (days && days.length > 0) {
        const mappedExercises = days.map((d: any) => ({ ...d, exercise: d.exercises }));
        
        // Only update exercises if not already in an active workout
        if (!workoutStarted) {
          setTodaysExercises(mappedExercises);
        }
        
        const dayWithAudio = days.find((d: any) => d.audio_url);
        if (dayWithAudio && !workoutStarted) {
          setTodaysAudioUrl(dayWithAudio.audio_url);
        }
        
        const completed = await checkIfWorkoutCompletedToday(mappedExercises);
        setAlreadyCompletedToday(completed);
      } else {
        if (!workoutStarted) {
          setTodaysExercises([]);
        }
      }
    } else {
      const { data: routines } = await supabase
        .from('routines')
        .select('*')
        .or(`user_id.eq.${user.id},is_shared.eq.true`);

      setAvailableRoutines(routines || []);
      setShowRoutineSelector(true);
    }

    setLoading(false);
  }, [user, today, checkIfWorkoutCompletedToday, workoutStarted, setTodaysExercises, setTodaysAudioUrl]);

  useEffect(() => {
    fetchActiveRoutine();
  }, [fetchActiveRoutine]);

  // Fetch last reps for current exercise when it changes
  const fetchLastReps = useCallback(async () => {
    if (!user || !currentExercise) return;
    
    const { data: lastLog } = await supabase
      .from('workout_logs')
      .select('reps')
      .eq('user_id', user.id)
      .eq('exercise_id', currentExercise.id)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (lastLog?.reps) {
      setCurrentReps(lastLog.reps);
    } else {
      setCurrentReps(currentExercise.reps);
    }
  }, [user, currentExercise, setCurrentReps]);

  useEffect(() => {
    fetchLastReps();
  }, [fetchLastReps]);

  const selectRoutine = async (routine: Routine) => {
    if (!user) return;

    await supabase.from('routines').update({ is_active: false }).eq('user_id', user.id);
    await supabase.from('routines').update({ is_active: true }).eq('id', routine.id);

    setShowRoutineSelector(false);
    fetchActiveRoutine();
  };

  const handleBeginWorkout = () => {
    setWorkoutStarted(true);
    activateWorkout();
    
    if (todaysAudioUrl) {
      try {
        const audio = new Audio(todaysAudioUrl);
        audio.loop = true;
        audioRef.current = audio;
        audio.play().catch(err => {
          console.log('Audio autoplay blocked:', err);
        });
      } catch (err) {
        console.log('Failed to play audio:', err);
      }
    }
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
  };

  const handleSetComplete = async (feedback?: 'too_hard' | 'too_easy' | 'neutral') => {
    if (!currentExercise || !user) return;

    const { error } = await supabase.from('workout_logs').insert({
      user_id: user.id,
      exercise_id: currentExercise.id,
      exercise_name: currentExercise.name,
      set_number: currentSet,
      weight_used: currentExercise.current_weight,
      workout_type: currentExercise.workout_type,
      difficulty_feedback: feedback || 'neutral',
      reps: currentReps,
    });

    if (error) {
      console.error('Failed to log workout:', error);
      toast({ title: 'Error', description: 'Failed to save workout data', variant: 'destructive' });
    }

    if (feedback === 'too_easy') {
      const newWeight = currentExercise.current_weight + currentExercise.weight_increment;
      await supabase
        .from('exercises')
        .update({ current_weight: newWeight })
        .eq('id', currentExercise.id);
      toast({ title: 'Weight Increased', description: `Next time: ${formatWeight(newWeight)}` });
    } else if (feedback === 'too_hard') {
      const newWeight = Math.max(0, currentExercise.current_weight - currentExercise.weight_increment);
      await supabase
        .from('exercises')
        .update({ current_weight: newWeight })
        .eq('id', currentExercise.id);
      toast({ title: 'Weight Decreased', description: `Next time: ${formatWeight(newWeight)}` });
    }

    // Move to next set or exercise
    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      setIsResting(true, currentExercise.rest_seconds);
    } else {
      if (currentExerciseIndex < todaysExercises.length - 1) {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
        setCurrentSet(1);
        setIsWorkoutActive(false);
        toast({ title: 'Next Exercise', description: todaysExercises[currentExerciseIndex + 1].exercise.name });
      } else {
        setIsWorkoutActive(false);
        setWorkoutComplete(true);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        toast({ title: 'Workout Complete!', description: 'Great job crushing it today!' });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openWeightEditor = () => {
    if (!currentExercise) return;
    setEditedWeight(convertWeight(currentExercise.current_weight).toString());
    setIsEditingWeight(true);
    setTimeout(() => weightInputRef.current?.focus(), 50);
  };

  const saveWeight = async () => {
    if (!currentExercise || !user) return;
    
    const inputWeight = parseFloat(editedWeight);
    if (isNaN(inputWeight) || inputWeight < 0) {
      toast({ title: 'Invalid weight', variant: 'destructive' });
      return;
    }

    const newWeightLbs = convertToLbs(inputWeight);

    const { error } = await supabase
      .from('exercises')
      .update({ current_weight: newWeightLbs })
      .eq('id', currentExercise.id);

    if (error) {
      toast({ title: 'Failed to update weight', variant: 'destructive' });
      return;
    }

    setTodaysExercises(todaysExercises.map(rd => 
      rd.exercise.id === currentExercise.id 
        ? { ...rd, exercise: { ...rd.exercise, current_weight: newWeightLbs } }
        : rd
    ));
    setIsEditingWeight(false);
    toast({ title: 'Weight updated' });
  };

  const openRepsEditor = () => {
    setEditedReps(currentReps.toString());
    setIsEditingReps(true);
    setTimeout(() => repsInputRef.current?.focus(), 50);
  };

  const saveReps = () => {
    const inputReps = parseInt(editedReps);
    if (isNaN(inputReps) || inputReps < 1) {
      toast({ title: 'Invalid reps', variant: 'destructive' });
      return;
    }
    setCurrentReps(inputReps);
    setIsEditingReps(false);
    toast({ title: 'Reps updated' });
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

  // Already completed today's workout
  if (alreadyCompletedToday && !workoutStarted) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 py-12 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-fire flex items-center justify-center mx-auto mb-6">
              <Check className="w-12 h-12 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-display text-gradient-fire mb-4">
              Congrats! You've completed today's workout!
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              All {todaysExercises.length} exercises for {DAYS_OF_WEEK[today]} are done. Rest up and come back tomorrow!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="fire" size="lg" onClick={() => navigate('/analytics')}>
                View Progress
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/routines')}>
                Edit Routine
              </Button>
            </div>
          </motion.div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // Workout Complete Screen (just finished now)
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

  // Start Workout Screen (before workout begins)
  if (!workoutStarted) {
    return (
      <div className="min-h-screen pb-20">
        <Header />
        <main className="px-4 py-12 max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-display text-foreground mb-2">
                {DAYS_OF_WEEK[today]}'s Workout
              </h2>
              <p className="text-lg text-muted-foreground">
                {todaysExercises.length} exercise{todaysExercises.length !== 1 ? 's' : ''} • {activeRoutine?.name}
              </p>
            </div>

            {/* Exercise Preview */}
            <div className="space-y-2 text-left">
              {todaysExercises.map((day, idx) => (
                <div
                  key={day.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{day.exercise.name}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatWeight(day.exercise.current_weight)} × {day.exercise.reps} reps × {day.exercise.sets} sets
                  </span>
                </div>
              ))}
            </div>

            {todaysAudioUrl && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Audio will play when you start
              </p>
            )}

            <Button
              variant="success"
              size="xl"
              className="w-full text-xl py-8 shadow-lg shadow-green-500/25"
              onClick={handleBeginWorkout}
            >
              <Play className="w-8 h-8 mr-2" />
              Start Workout
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

                <div className="flex flex-col items-center gap-3 text-xl text-muted-foreground mb-4">
                  {/* Weight and Reps Row */}
                  <div className="flex items-center gap-4">
                    {/* Weight Editor */}
                    {isEditingWeight ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={weightInputRef}
                          type="number"
                          value={editedWeight}
                          onChange={(e) => setEditedWeight(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveWeight();
                            if (e.key === 'Escape') setIsEditingWeight(false);
                          }}
                          className="w-20 px-2 py-1 text-center font-bold text-primary bg-background border border-border rounded"
                        />
                        <Button size="sm" variant="fire" onClick={saveWeight}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingWeight(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <button
                        onClick={openWeightEditor}
                        className="flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer"
                      >
                        {currentExercise ? formatWeight(currentExercise.current_weight) : ''}
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    
                    <span className="text-muted-foreground">×</span>
                    
                    {/* Reps Editor */}
                    {isEditingReps ? (
                      <div className="flex items-center gap-2">
                        <input
                          ref={repsInputRef}
                          type="number"
                          value={editedReps}
                          onChange={(e) => setEditedReps(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveReps();
                            if (e.key === 'Escape') setIsEditingReps(false);
                          }}
                          className="w-16 px-2 py-1 text-center font-bold text-primary bg-background border border-border rounded"
                        />
                        <Button size="sm" variant="fire" onClick={saveReps}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditingReps(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <button
                        onClick={openRepsEditor}
                        className="flex items-center gap-1 font-bold text-primary hover:underline cursor-pointer"
                      >
                        {currentReps} reps
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Feedback and Set Info Row */}
                  <div className="flex items-center gap-3">
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
                    {formatWeight(day.exercise.current_weight)}
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
