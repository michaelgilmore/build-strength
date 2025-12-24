import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, Calendar, Dumbbell, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useWeightUnit } from '@/hooks/useWeightUnit';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface WorkoutLog {
  id: string;
  exercise_name: string;
  weight_used: number;
  completed_at: string;
  difficulty_feedback: string;
}

interface ChartData {
  date: string;
  weight: number;
  volume: number;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'all'>('month');

  const { user } = useAuth();
  const { formatWeight, convertWeight, unit } = useWeightUnit();

  const fetchLogs = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .order('completed_at', { ascending: false });

    if (!error) {
      setLogs(data || []);
      if (data && data.length > 0) {
        setSelectedExercise(data[0].exercise_name);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Get unique exercises
  const exercises = [...new Set(logs.map((l) => l.exercise_name))];

  // Filter logs by date range
  const getFilteredLogs = () => {
    const now = new Date();
    let cutoff = new Date(0);

    if (dateRange === 'week') {
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'month') {
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return logs.filter((l) => new Date(l.completed_at) >= cutoff);
  };

  // Prepare chart data for selected exercise
  const getChartData = (): ChartData[] => {
    const filtered = getFilteredLogs().filter((l) => l.exercise_name === selectedExercise);
    const grouped: Record<string, { weights: number[]; volume: number }> = {};

    filtered.forEach((log) => {
      const date = new Date(log.completed_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = { weights: [], volume: 0 };
      }
      grouped[date].weights.push(log.weight_used);
      grouped[date].volume += log.weight_used;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        weight: convertWeight(Math.max(...data.weights)),
        volume: convertWeight(data.volume),
      }))
      .reverse();
  };

  // Weekly consistency data
  const getConsistencyData = () => {
    const filtered = getFilteredLogs();
    const days: Record<string, number> = {};

    filtered.forEach((log) => {
      const day = new Date(log.completed_at).toLocaleDateString('en-US', { weekday: 'short' });
      days[day] = (days[day] || 0) + 1;
    });

    const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return order.map((day) => ({ day, workouts: days[day] || 0 }));
  };

  // Stats
  const filteredLogs = getFilteredLogs();
  const totalWorkouts = [...new Set(filteredLogs.map((l) => new Date(l.completed_at).toDateString()))].length;
  const totalVolume = convertWeight(filteredLogs.reduce((acc, l) => acc + l.weight_used, 0));
  const tooEasyCount = filteredLogs.filter((l) => l.difficulty_feedback === 'too_easy').length;
  const tooHardCount = filteredLogs.filter((l) => l.difficulty_feedback === 'too_hard').length;

  // Personal bests
  const personalBests = exercises.map((ex) => {
    const exLogs = logs.filter((l) => l.exercise_name === ex);
    const maxWeight = Math.max(...exLogs.map((l) => l.weight_used), 0);
    return { name: ex, weight: maxWeight };
  }).sort((a, b) => b.weight - a.weight).slice(0, 5);

  const volumeUnit = unit === 'kg' ? 't' : 'klbs';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <Header title="Analytics" />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {logs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-display text-foreground mb-2">No Data Yet</h2>
            <p className="text-muted-foreground">
              Complete some workouts to see your progress here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="flex gap-2">
              {(['week', 'month', 'all'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    dateRange === range
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'All Time'}
                </button>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-intense p-4"
              >
                <Calendar className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">{totalWorkouts}</div>
                <div className="text-sm text-muted-foreground">Workouts</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card-intense p-4"
              >
                <Dumbbell className="w-5 h-5 text-primary mb-2" />
                <div className="text-2xl font-display text-foreground">
                  {(totalVolume / 1000).toFixed(1)}{volumeUnit}
                </div>
                <div className="text-sm text-muted-foreground">Total Volume</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card-intense p-4"
              >
                <TrendingUp className="w-5 h-5 text-success mb-2" />
                <div className="text-2xl font-display text-foreground">{tooEasyCount}</div>
                <div className="text-sm text-muted-foreground">Weight Increases</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card-intense p-4"
              >
                <TrendingUp className="w-5 h-5 text-destructive mb-2 rotate-180" />
                <div className="text-2xl font-display text-foreground">{tooHardCount}</div>
                <div className="text-sm text-muted-foreground">Weight Decreases</div>
              </motion.div>
            </div>

            {/* Exercise Selector */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Exercise Progress</label>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {exercises.slice(0, 8).map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setSelectedExercise(ex)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      selectedExercise === ex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {/* Weight Progress Chart */}
            {selectedExercise && getChartData().length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card-intense p-4"
              >
                <h3 className="font-display text-foreground mb-4">Weight Progress</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Consistency Chart */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-intense p-4"
            >
              <h3 className="font-display text-foreground mb-4">Weekly Consistency</h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getConsistencyData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="workouts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Personal Bests */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-intense p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-display text-foreground">Personal Bests</h3>
              </div>
              <div className="space-y-2">
                {personalBests.map((pb, idx) => (
                  <div key={pb.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        idx === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                      )}>
                        {idx + 1}
                      </span>
                      <span className="font-medium">{pb.name}</span>
                    </div>
                    <span className="font-display text-primary">{formatWeight(pb.weight)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
