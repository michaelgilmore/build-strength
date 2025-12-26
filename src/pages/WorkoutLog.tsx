import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Calendar, Dumbbell, TrendingUp, ChevronLeft, ChevronRight, Flame, X, Award, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface WorkoutLog {
  id: string;
  exercise_name: string;
  exercise_id: string;
  weight_used: number;
  completed_at: string;
  difficulty_feedback: string;
  set_number: number;
}

interface RoutineDay {
  day_of_week: number;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function WorkoutLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const { user } = useAuth();
  const { formatWeight, convertWeight, unit } = useWeightUnit();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch workout logs
      const { data: logsData } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (logsData) {
        setLogs(logsData);
      }

      // Fetch active routine's scheduled days
      const { data: activeRoutine } = await supabase
        .from('routines')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (activeRoutine) {
        const { data: routineDays } = await supabase
          .from('routine_days')
          .select('day_of_week')
          .eq('routine_id', activeRoutine.id);

        if (routineDays) {
          const uniqueDays = [...new Set(routineDays.map((d: RoutineDay) => d.day_of_week))];
          setScheduledDays(uniqueDays);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Get unique exercises
  const exercises = useMemo(() => [...new Set(logs.map((l) => l.exercise_name))], [logs]);

  // Calendar data
  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Get workout dates for this month
    const workoutDates = new Set(
      logs
        .filter((l) => {
          const date = new Date(l.completed_at);
          return date.getMonth() === month && date.getFullYear() === year;
        })
        .map((l) => new Date(l.completed_at).getDate())
    );

    const days: { day: number; hasWorkout: boolean; isMissed: boolean; isToday: boolean; isFuture: boolean }[] = [];
    const today = new Date();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const isScheduledDay = scheduledDays.includes(dayOfWeek);
      const hasWorkout = workoutDates.has(i);
      const isFuture = date > today;
      const isToday = date.toDateString() === today.toDateString();
      const isMissed = isScheduledDay && !hasWorkout && !isFuture;

      days.push({ day: i, hasWorkout, isMissed, isToday, isFuture });
    }

    return { days, startingDay, daysInMonth };
  }, [currentMonth, logs, scheduledDays]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const monthLogs = logs.filter((l) => {
      const date = new Date(l.completed_at);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const workoutDays = new Set(monthLogs.map((l) => new Date(l.completed_at).toDateString())).size;
    const totalSets = monthLogs.length;
    const totalVolume = monthLogs.reduce((acc, l) => acc + l.weight_used, 0);

    // Calculate missed days for this month
    const today = new Date();
    let missedDays = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      if (date > today) break;
      
      const dayOfWeek = date.getDay();
      if (scheduledDays.includes(dayOfWeek)) {
        const hasWorkout = monthLogs.some((l) => new Date(l.completed_at).getDate() === i);
        if (!hasWorkout) missedDays++;
      }
    }

    // Calculate current streak
    let streak = 0;
    const sortedDates = [...new Set(logs.map((l) => new Date(l.completed_at).toDateString()))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    if (sortedDates.length > 0) {
      let checkDate = new Date();
      // If no workout today, start from yesterday
      if (!sortedDates.includes(checkDate.toDateString())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      for (const dateStr of sortedDates) {
        if (new Date(dateStr).toDateString() === checkDate.toDateString()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (new Date(dateStr) < checkDate) {
          break;
        }
      }
    }

    return { workoutDays, missedDays, totalSets, totalVolume, streak };
  }, [logs, currentMonth, scheduledDays]);

  // Exercise-specific data
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return null;

    const exerciseLogs = logs.filter((l) => l.exercise_name === selectedExercise);
    
    // Group by date and get max weight per day
    const grouped: Record<string, { maxWeight: number; totalVolume: number; sets: number }> = {};
    exerciseLogs.forEach((log) => {
      const date = new Date(log.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = { maxWeight: 0, totalVolume: 0, sets: 0 };
      }
      grouped[date].maxWeight = Math.max(grouped[date].maxWeight, log.weight_used);
      grouped[date].totalVolume += log.weight_used;
      grouped[date].sets++;
    });

    const chartData = Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        weight: convertWeight(data.maxWeight),
        volume: convertWeight(data.totalVolume),
      }))
      .slice(-15)
      .reverse();

    const personalBest = Math.max(...exerciseLogs.map((l) => l.weight_used), 0);
    const totalSessions = new Set(exerciseLogs.map((l) => new Date(l.completed_at).toDateString())).size;
    const avgWeight = exerciseLogs.length > 0 
      ? exerciseLogs.reduce((acc, l) => acc + l.weight_used, 0) / exerciseLogs.length 
      : 0;

    // Calculate progress (first vs last workout)
    const sortedLogs = [...exerciseLogs].sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
    const firstWeight = sortedLogs[0]?.weight_used || 0;
    const lastWeight = sortedLogs[sortedLogs.length - 1]?.weight_used || 0;
    const progress = firstWeight > 0 ? ((lastWeight - firstWeight) / firstWeight) * 100 : 0;

    return { chartData, personalBest, totalSessions, avgWeight, progress };
  }, [selectedExercise, logs, convertWeight]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Workout Log" />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Exercise Drill-down View */}
        {selectedExercise && exerciseData ? (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedExercise(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-display text-foreground">{selectedExercise}</h2>
            </div>

            {/* Exercise Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="card-intense p-4">
                <Award className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">
                  {formatWeight(exerciseData.personalBest)}
                </div>
                <div className="text-sm text-muted-foreground">Personal Best</div>
              </div>

              <div className="card-intense p-4">
                <Calendar className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">
                  {exerciseData.totalSessions}
                </div>
                <div className="text-sm text-muted-foreground">Sessions</div>
              </div>

              <div className="card-intense p-4">
                <Target className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">
                  {formatWeight(exerciseData.avgWeight)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Weight</div>
              </div>

              <div className="card-intense p-4">
                <TrendingUp className={cn(
                  "w-5 h-5 mb-2",
                  exerciseData.progress >= 0 ? "text-success" : "text-destructive rotate-180"
                )} />
                <div className="text-2xl font-display text-foreground">
                  {exerciseData.progress >= 0 ? '+' : ''}{exerciseData.progress.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>

            {/* Weight Progress Chart */}
            {exerciseData.chartData.length > 0 && (
              <div className="card-intense p-4">
                <h3 className="font-display text-foreground mb-4">Weight Progress</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={exerciseData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={11}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: number) => [`${value} ${unit}`, 'Weight']}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Workouts */}
            <div className="card-intense p-4">
              <h3 className="font-display text-foreground mb-4">Recent Workouts</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs
                  .filter((l) => l.exercise_name === selectedExercise)
                  .slice(0, 20)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(log.completed_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">Set {log.set_number}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-primary">{formatWeight(log.weight_used)}</div>
                        {log.difficulty_feedback && (
                          <div className={cn(
                            "text-xs",
                            log.difficulty_feedback === 'too_easy' && "text-success",
                            log.difficulty_feedback === 'too_hard' && "text-destructive",
                            log.difficulty_feedback === 'just_right' && "text-muted-foreground"
                          )}>
                            {log.difficulty_feedback === 'too_easy' ? '↑ Easy' : 
                             log.difficulty_feedback === 'too_hard' ? '↓ Hard' : '● Good'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Main Calendar View */
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-intense p-4"
              >
                <Calendar className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">{summaryStats.workoutDays}</div>
                <div className="text-sm text-muted-foreground">Workout Days</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-intense p-4"
              >
                <X className="w-5 h-5 text-destructive mb-2" />
                <div className="text-2xl font-display text-foreground">{summaryStats.missedDays}</div>
                <div className="text-sm text-muted-foreground">Missed Days</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-intense p-4"
              >
                <Flame className="w-5 h-5 text-warning mb-2" />
                <div className="text-2xl font-display text-foreground">{summaryStats.streak}</div>
                <div className="text-sm text-muted-foreground">Day Streak</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card-intense p-4"
              >
                <Dumbbell className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">
                  {convertWeight(summaryStats.totalVolume).toLocaleString()}
                  <span className="text-sm">{unit === 'kg' ? 'kg' : 'lbs'}</span>
                </div>
                <div className="text-sm text-muted-foreground">Volume</div>
              </motion.div>
            </div>

            {/* Calendar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-intense p-4"
            >
              <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h3 className="font-display text-lg text-foreground">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before the first of the month */}
                {Array.from({ length: calendarData.startingDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {calendarData.days.map(({ day, hasWorkout, isMissed, isToday, isFuture }) => (
                  <div
                    key={day}
                    className={cn(
                      "aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-colors relative",
                      hasWorkout && "bg-success/20 text-success",
                      isMissed && "bg-destructive/20 text-destructive",
                      !hasWorkout && !isMissed && "text-muted-foreground",
                      isFuture && "opacity-40",
                      isToday && "ring-2 ring-primary"
                    )}
                  >
                    {day}
                    {hasWorkout && (
                      <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-success" />
                    )}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success/50" />
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/50" />
                  <span className="text-xs text-muted-foreground">Missed</span>
                </div>
              </div>
            </motion.div>

            {/* Exercise List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-intense p-4"
            >
              <h3 className="font-display text-foreground mb-4">Exercises</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select an exercise to view detailed progress and statistics.
              </p>
              <div className="space-y-2">
                {exercises.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No exercises logged yet. Complete a workout to see your history.
                  </p>
                ) : (
                  exercises.map((exercise) => {
                    const exerciseLogs = logs.filter((l) => l.exercise_name === exercise);
                    const maxWeight = Math.max(...exerciseLogs.map((l) => l.weight_used), 0);
                    const sessions = new Set(exerciseLogs.map((l) => new Date(l.completed_at).toDateString())).size;

                    return (
                      <button
                        key={exercise}
                        onClick={() => setSelectedExercise(exercise)}
                        className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left"
                      >
                        <div>
                          <div className="font-medium">{exercise}</div>
                          <div className="text-xs text-muted-foreground">{sessions} sessions</div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-primary">{formatWeight(maxWeight)}</div>
                          <div className="text-xs text-muted-foreground">PR</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
