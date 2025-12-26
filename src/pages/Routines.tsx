import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Loader2, Calendar, Share2, Trash2, Check, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
}

interface Routine {
  id: string;
  name: string;
  is_shared: boolean;
  is_active: boolean;
  user_id: string;
}

interface RoutineDay {
  id: string;
  routine_id: string;
  day_of_week: number;
  exercise_order: number;
  exercise_id: string;
  exercise?: Exercise;
}

function SortableExerciseItem({ 
  item, 
  onRemove 
}: { 
  item: RoutineDay & { exercise?: Exercise }; 
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border',
        isDragging && 'opacity-50'
      )}
    >
      <button {...attributes} {...listeners} className="touch-none">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </button>
      <div className="flex-1">
        <span className="font-medium">{item.exercise?.name || 'Unknown'}</span>
        <span className="text-sm text-muted-foreground ml-2">
          {item.exercise?.current_weight}kg × {item.exercise?.sets} sets
        </span>
      </div>
      <Button variant="ghost" size="icon" onClick={onRemove} className="text-muted-foreground hover:text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [routineDays, setRoutineDays] = useState<(RoutineDay & { exercise?: Exercise })[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedDay, setSelectedDay] = useState(1); // Monday
  const [loading, setLoading] = useState(true);
  const [showNewRoutine, setShowNewRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRoutines = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order('created_at', { ascending: false });

    if (!error) {
      setRoutines(data || []);
      const active = data?.find((r) => r.is_active && r.user_id === user.id);
      if (active) setSelectedRoutine(active);
    }
    setLoading(false);
  };

  const fetchExercises = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('exercises')
      .select('id, name, current_weight, sets')
      .order('name');

    setExercises(data || []);
  };

  const fetchRoutineDays = async (routineId: string) => {
    const { data } = await supabase
      .from('routine_days')
      .select('*, exercises(id, name, current_weight, sets)')
      .eq('routine_id', routineId)
      .order('exercise_order');

    if (data) {
      setRoutineDays(data.map((d: any) => ({ ...d, exercise: d.exercises })));
    }
  };

  useEffect(() => {
    fetchRoutines();
    fetchExercises();
  }, [user]);

  useEffect(() => {
    if (selectedRoutine) {
      fetchRoutineDays(selectedRoutine.id);
    }
  }, [selectedRoutine]);

  const createRoutine = async () => {
    if (!user || !newRoutineName.trim()) return;

    const { data, error } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        name: newRoutineName.trim(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'Failed to create routine', variant: 'destructive' });
    } else {
      toast({ title: 'Routine Created', description: `${newRoutineName} is ready to build.` });
      setRoutines((prev) => [data, ...prev]);
      setSelectedRoutine(data);
      setNewRoutineName('');
      setShowNewRoutine(false);
    }
  };

  const toggleRoutineActive = async (routine: Routine) => {
    if (!user) return;

    // Deactivate all first
    await supabase.from('routines').update({ is_active: false }).eq('user_id', user.id);

    if (!routine.is_active) {
      await supabase.from('routines').update({ is_active: true }).eq('id', routine.id);
    }

    fetchRoutines();
    toast({
      title: routine.is_active ? 'Routine Deactivated' : 'Routine Activated',
      description: routine.is_active ? 'No active routine.' : `${routine.name} is now your active routine.`,
    });
  };

  const toggleShare = async (routine: Routine) => {
    const { error } = await supabase
      .from('routines')
      .update({ is_shared: !routine.is_shared })
      .eq('id', routine.id);

    if (!error) {
      fetchRoutines();
      toast({
        title: routine.is_shared ? 'Routine Private' : 'Routine Shared',
        description: routine.is_shared ? 'Only you can see this routine.' : 'Others can now view this routine.',
      });
    }
  };

  const deleteRoutine = async (id: string) => {
    const { error } = await supabase.from('routines').delete().eq('id', id);

    if (!error) {
      setRoutines((prev) => prev.filter((r) => r.id !== id));
      if (selectedRoutine?.id === id) setSelectedRoutine(null);
      toast({ title: 'Routine Deleted' });
    }
  };

  const addExercisesToDay = async (exerciseIds: string[]) => {
    if (!selectedRoutine || exerciseIds.length === 0) return;

    let maxOrder = routineDays
      .filter((d) => d.day_of_week === selectedDay)
      .reduce((max, d) => Math.max(max, d.exercise_order), -1);

    const inserts = exerciseIds.map((exerciseId, index) => ({
      routine_id: selectedRoutine.id,
      day_of_week: selectedDay,
      exercise_id: exerciseId,
      exercise_order: maxOrder + 1 + index,
    }));

    const { error } = await supabase.from('routine_days').insert(inserts);

    if (!error) {
      fetchRoutineDays(selectedRoutine.id);
      setShowExercisePicker(false);
      setSelectedExerciseIds([]);
      toast({
        title: 'Exercises Added',
        description: `Added ${exerciseIds.length} exercise${exerciseIds.length > 1 ? 's' : ''} to ${DAYS_OF_WEEK[selectedDay]}.`,
      });
    }
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const openExercisePicker = () => {
    setSelectedExerciseIds([]);
    setShowExercisePicker(true);
  };

  const removeExerciseFromDay = async (id: string) => {
    const { error } = await supabase.from('routine_days').delete().eq('id', id);
    if (!error) {
      setRoutineDays((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const dayExercises = routineDays.filter((d) => d.day_of_week === selectedDay);
    const oldIndex = dayExercises.findIndex((d) => d.id === active.id);
    const newIndex = dayExercises.findIndex((d) => d.id === over.id);

    const reordered = arrayMove(dayExercises, oldIndex, newIndex);
    
    // Update local state immediately
    setRoutineDays((prev) => {
      const otherDays = prev.filter((d) => d.day_of_week !== selectedDay);
      return [...otherDays, ...reordered.map((d, i) => ({ ...d, exercise_order: i }))];
    });

    // Update database
    for (let i = 0; i < reordered.length; i++) {
      await supabase
        .from('routine_days')
        .update({ exercise_order: i })
        .eq('id', reordered[i].id);
    }
  };

  const dayExercises = routineDays
    .filter((d) => d.day_of_week === selectedDay)
    .sort((a, b) => a.exercise_order - b.exercise_order);

  const isOwnRoutine = selectedRoutine && user && routines.find(r => r.id === selectedRoutine.id)?.user_id === user.id;

  return (
    <div className="min-h-screen pb-20">
      <Header title="Routines" />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Routine List */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-display text-foreground">Your Routines</h2>
          <Button variant="fire" size="sm" onClick={() => setShowNewRoutine(true)}>
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* New Routine Form */}
            <AnimatePresence>
              {showNewRoutine && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="card-intense p-4 space-y-3">
                    <Input
                      placeholder="Routine name..."
                      value={newRoutineName}
                      onChange={(e) => setNewRoutineName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setShowNewRoutine(false)}>
                        Cancel
                      </Button>
                      <Button variant="fire" className="flex-1" onClick={createRoutine}>
                        Create
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Routine Cards */}
            <div className="space-y-2 mb-6">
              {routines.filter(r => user && (r.user_id === user.id || r.is_shared)).map((routine: any) => (
                <motion.div
                  key={routine.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'card-intense p-4 cursor-pointer transition-all',
                    selectedRoutine?.id === routine.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedRoutine(routine)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-display text-foreground">{routine.name}</h3>
                        {routine.is_active && (
                          <span className="text-xs text-primary font-semibold">ACTIVE</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {routine.user_id === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRoutineActive(routine);
                            }}
                            className={cn(routine.is_active && 'text-primary')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShare(routine);
                            }}
                            className={cn(routine.is_shared && 'text-primary')}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRoutine(routine.id);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Day Editor */}
            {selectedRoutine && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h3 className="text-lg font-display text-foreground">
                  Edit: {selectedRoutine.name}
                </h3>

                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                  {DAYS_OF_WEEK.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(index)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                        selectedDay === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Exercises for Day */}
                <div className="space-y-2">
                  {dayExercises.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No exercises for {DAYS_OF_WEEK[selectedDay]}
                    </div>
                  ) : (
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={dayExercises.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                        {dayExercises.map((item) => (
                          <SortableExerciseItem
                            key={item.id}
                            item={item}
                            onRemove={() => removeExerciseFromDay(item.id)}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}

                  {isOwnRoutine && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={openExercisePicker}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Exercises
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Exercise Picker Modal */}
            <AnimatePresence>
              {showExercisePicker && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm"
                >
                  <div className="h-full flex flex-col py-4 px-4 max-w-lg mx-auto safe-area-bottom">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-display">Select Exercises</h3>
                      <Button variant="ghost" onClick={() => setShowExercisePicker(false)}>
                        Cancel
                      </Button>
                    </div>

                    {selectedExerciseIds.length > 0 && (
                      <div className="mb-3 text-sm text-muted-foreground">
                        {selectedExerciseIds.length} exercise{selectedExerciseIds.length > 1 ? 's' : ''} selected
                      </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-2 pb-4">
                      {exercises.map((ex) => {
                        const isSelected = selectedExerciseIds.includes(ex.id);
                        return (
                          <button
                            key={ex.id}
                            onClick={() => toggleExerciseSelection(ex.id)}
                            className={cn(
                              "w-full text-left p-4 rounded-lg transition-colors flex items-center gap-3",
                              isSelected
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "bg-secondary hover:bg-secondary/80"
                            )}
                          >
                            <div className={cn(
                              "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{ex.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                {ex.current_weight}kg × {ex.sets} sets
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {exercises.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          No exercises yet. Add some in the Exercises tab.
                        </p>
                      )}
                    </div>

                    {exercises.length > 0 && (
                      <div className="pt-4 border-t border-border bg-background sticky bottom-0">
                        <Button
                          variant="fire"
                          className="w-full"
                          disabled={selectedExerciseIds.length === 0}
                          onClick={() => addExercisesToDay(selectedExerciseIds)}
                        >
                          Add {selectedExerciseIds.length > 0 ? `${selectedExerciseIds.length} ` : ''}Exercise{selectedExerciseIds.length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
