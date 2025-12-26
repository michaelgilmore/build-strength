import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Timer, Hand, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DEFAULT_EXERCISES, EXERCISE_CATEGORIES } from '@/lib/exercises';
import { cn } from '@/lib/utils';
import { useWeightUnit } from '@/hooks/useWeightUnit';

interface ExerciseFormData {
  name: string;
  starting_weight: number;
  current_weight: number;
  sets: number;
  weight_increment: number;
  workout_type: 'timed' | 'manual';
  duration_seconds: number;
  rest_seconds: number;
}

interface ExerciseFormProps {
  initialData?: Partial<ExerciseFormData>;
  onSubmit: (data: ExerciseFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export default function ExerciseForm({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
}: ExerciseFormProps) {
  const { unit, formatWeight, convertWeight, convertToLbs } = useWeightUnit();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Form stores weights in user's preferred unit for display
  const [formData, setFormData] = useState<ExerciseFormData>({
    name: initialData?.name || '',
    // Convert from kg (stored) to user's unit for display
    starting_weight: initialData?.starting_weight !== undefined 
      ? convertWeight(initialData.starting_weight) 
      : 20,
    current_weight: initialData?.current_weight !== undefined 
      ? convertWeight(initialData.current_weight) 
      : 20,
    sets: initialData?.sets || 3,
    weight_increment: initialData?.weight_increment !== undefined 
      ? convertWeight(initialData.weight_increment) 
      : 2.5,
    workout_type: initialData?.workout_type || 'manual',
    duration_seconds: initialData?.duration_seconds || 60,
    rest_seconds: initialData?.rest_seconds || 90,
  });

  const filteredExercises = DEFAULT_EXERCISES.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectExercise = (exerciseName: string, defaultWeight: number) => {
    setFormData((prev) => ({
      ...prev,
      name: exerciseName,
      starting_weight: defaultWeight || prev.starting_weight,
      current_weight: defaultWeight || prev.current_weight,
    }));
    setSearchQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    // Convert weights from user's unit to lbs for storage
    onSubmit({
      ...formData,
      starting_weight: convertToLbs(formData.starting_weight),
      current_weight: convertToLbs(formData.current_weight),
      weight_increment: convertToLbs(formData.weight_increment),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
    >
      <div className="min-h-screen py-4 px-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display text-foreground">
            {isEditing ? 'Edit Exercise' : 'Add Exercise'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-6 h-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exercise Selector */}
          {!isEditing && (
            <div className="space-y-3">
              <Label>Select Exercise</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {EXERCISE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Exercise List */}
              <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border bg-secondary/50 p-2">
                {filteredExercises.map((ex) => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => selectExercise(ex.name, ex.defaultWeight)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-md transition-colors',
                      formData.name === ex.name
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary'
                    )}
                  >
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-sm ml-2 opacity-70">{formatWeight(ex.defaultWeight)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Exercise Name (for custom or editing) */}
          <div className="space-y-2">
            <Label>Exercise Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter exercise name"
            />
          </div>

          {/* Weight Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Starting Weight ({unit})</Label>
              <Input
                type="number"
                step="0.5"
                value={formData.starting_weight}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    starting_weight: parseFloat(e.target.value) || 0,
                    current_weight: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Sets</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={formData.sets}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sets: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Weight Increment ({unit})</Label>
            <Input
              type="number"
              step="0.5"
              value={formData.weight_increment}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  weight_increment: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </div>

          {/* Workout Type */}
          <div className="space-y-4">
            <Label>Workout Type</Label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, workout_type: 'manual' }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                  formData.workout_type === 'manual'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <Hand className="w-6 h-6" />
                <span className="font-display">Manual</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, workout_type: 'timed' }))}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all',
                  formData.workout_type === 'timed'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                )}
              >
                <Timer className="w-6 h-6" />
                <span className="font-display">Timed</span>
              </button>
            </div>
          </div>

          {/* Timed Settings */}
          {formData.workout_type === 'timed' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  min="10"
                  value={formData.duration_seconds}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration_seconds: parseInt(e.target.value) || 60,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rest (seconds)</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.rest_seconds}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      rest_seconds: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </motion.div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="fire" className="flex-1">
              {isEditing ? 'Save Changes' : 'Add Exercise'}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
