import { motion } from "framer-motion";

// Map exercise categories to emojis for visual representation
const EXERCISE_EMOJIS: Record<string, string> = {
  // Chest
  "Bench Press": "🏋️",
  "Incline Bench Press": "🏋️",
  "Decline Bench Press": "🏋️",
  "Dumbbell Fly": "🦅",
  "Cable Crossover": "💪",
  "Push-Ups": "🫸",

  // Back
  "Deadlift": "🏋️",
  "Bent Over Row": "🚣",
  "Lat Pulldown": "⬇️",
  "Pull-Ups": "🧗",
  "Seated Cable Row": "🚣",
  "T-Bar Row": "🚣",
  "Upright Row": "⬆️",

  // Shoulders
  "Overhead Press": "🙌",
  "Military Press": "🙌",
  "Arnold Press": "🙌",
  "Lateral Raise": "🦅",
  "Front Raise": "🙌",
  "Face Pull": "🎯",

  // Legs
  "Squat": "🦵",
  "Front Squat": "🦵",
  "Leg Press": "🦵",
  "Leg Extension": "🦵",
  "Leg Curl": "🦵",
  "Romanian Deadlift": "🏋️",
  "Calf Raise": "🦶",
  "Lunges": "🚶",
  "Hip Thrust": "🍑",

  // Biceps
  "Barbell Curl": "💪",
  "Dumbbell Curl": "💪",
  "Hammer Curl": "🔨",
  "Preacher Curl": "💪",
  "Concentration Curl": "💪",

  // Triceps
  "Tricep Pushdown": "⬇️",
  "Skull Crusher": "💀",
  "Overhead Tricep Extension": "🙌",
  "Dips": "⬇️",
  "Close Grip Bench Press": "🏋️",

  // Core
  "Plank": "🧘",
  "Crunches": "🔄",
  "Russian Twist": "🌀",
  "Hanging Leg Raise": "🦵",
  "Ab Wheel Rollout": "🎡",
  "Cable Crunch": "🔄",
};

const DEFAULT_EMOJI = "💪";

interface ExerciseAnimationProps {
  exerciseName: string;
  className?: string;
}

export default function ExerciseAnimation({ exerciseName, className = "" }: ExerciseAnimationProps) {
  const emoji = EXERCISE_EMOJIS[exerciseName] || DEFAULT_EMOJI;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-destructive/20 flex items-center justify-center shadow-lg"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.span
          className="text-4xl"
          animate={{
            y: [0, -5, 0],
          }}
          transition={{
            duration: 0.75,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.span>
      </motion.div>
    </div>
  );
}
