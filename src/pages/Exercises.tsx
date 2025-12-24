import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import ExerciseCard from '@/components/ExerciseCard';
import ExerciseForm from '@/components/ExerciseForm';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Exercise {
  id: string;
  name: string;
  starting_weight: number;
  current_weight: number;
  sets: number;
  weight_increment: number;
  workout_type: string;
  duration_seconds: number;
  rest_seconds: number;
}

export default function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExercises = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load exercises',
        variant: 'destructive',
      });
    } else {
      setExercises(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExercises();
  }, [user]);

  const handleAddExercise = async (data: any) => {
    if (!user) return;

    const { error } = await supabase.from('exercises').insert({
      user_id: user.id,
      name: data.name,
      starting_weight: data.starting_weight,
      current_weight: data.current_weight,
      sets: data.sets,
      weight_increment: data.weight_increment,
      workout_type: data.workout_type,
      duration_seconds: data.duration_seconds,
      rest_seconds: data.rest_seconds,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to add exercise',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Exercise Added',
        description: `${data.name} has been added to your library.`,
      });
      fetchExercises();
      setShowForm(false);
    }
  };

  const handleEditExercise = async (data: any) => {
    if (!editingExercise) return;

    const { error } = await supabase
      .from('exercises')
      .update({
        name: data.name,
        starting_weight: data.starting_weight,
        current_weight: data.current_weight,
        sets: data.sets,
        weight_increment: data.weight_increment,
        workout_type: data.workout_type,
        duration_seconds: data.duration_seconds,
        rest_seconds: data.rest_seconds,
      })
      .eq('id', editingExercise.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update exercise',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Exercise Updated',
        description: `${data.name} has been updated.`,
      });
      fetchExercises();
      setEditingExercise(null);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    const { error } = await supabase.from('exercises').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete exercise',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Exercise Deleted',
        description: 'The exercise has been removed.',
      });
      setExercises((prev) => prev.filter((ex) => ex.id !== id));
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Header title="Exercises" />
      
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-display text-foreground">Your Library</h2>
            <p className="text-muted-foreground text-sm">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="fire" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
            Add
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : exercises.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display text-foreground mb-2">No Exercises Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by adding your first exercise to your library.
            </p>
            <Button variant="fire" onClick={() => setShowForm(true)}>
              Add Your First Exercise
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={(ex) => setEditingExercise(ex)}
                  onDelete={handleDeleteExercise}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <BottomNav />

      <AnimatePresence>
        {showForm && (
          <ExerciseForm
            onSubmit={handleAddExercise}
            onCancel={() => setShowForm(false)}
          />
        )}
        {editingExercise && (
          <ExerciseForm
            initialData={{
              name: editingExercise.name,
              starting_weight: editingExercise.starting_weight,
              current_weight: editingExercise.current_weight,
              sets: editingExercise.sets,
              weight_increment: editingExercise.weight_increment,
              workout_type: editingExercise.workout_type as 'timed' | 'manual',
              duration_seconds: editingExercise.duration_seconds,
              rest_seconds: editingExercise.rest_seconds,
            }}
            onSubmit={handleEditExercise}
            onCancel={() => setEditingExercise(null)}
            isEditing
          />
        )}
      </AnimatePresence>
    </div>
  );
}
