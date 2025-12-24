import { motion } from 'framer-motion';
import { Trash2, Edit, Timer, Hand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  current_weight: number;
  sets: number;
  workout_type: string;
  duration_seconds?: number;
  rest_seconds?: number;
}

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (exercise: Exercise) => void;
}

export default function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
  selectable,
  selected,
  onSelect,
}: ExerciseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileTap={selectable ? { scale: 0.98 } : undefined}
      onClick={() => selectable && onSelect?.(exercise)}
      className={cn(
        'card-intense p-4 cursor-pointer transition-all duration-200',
        selected && 'ring-2 ring-primary bg-primary/10',
        selectable && 'hover:bg-secondary/50'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-display text-lg text-foreground">{exercise.name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="font-semibold text-primary">
              {exercise.current_weight}kg
            </span>
            <span>{exercise.sets} sets</span>
            <div className="flex items-center gap-1">
              {exercise.workout_type === 'timed' ? (
                <>
                  <Timer className="w-4 h-4" />
                  <span>{exercise.duration_seconds}s</span>
                </>
              ) : (
                <>
                  <Hand className="w-4 h-4" />
                  <span>Manual</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(exercise);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(exercise.id);
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
