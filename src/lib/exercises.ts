export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Forearms",
  "Traps",
  "Lats",
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

export const DEFAULT_EXERCISES: { name: string; category: string; defaultWeight: number; muscles: MuscleGroup[] }[] = [
  // Chest
  { name: "Bench Press", category: "Chest", defaultWeight: 60, muscles: ["Chest", "Triceps", "Shoulders"] },
  { name: "Incline Bench Press", category: "Chest", defaultWeight: 50, muscles: ["Chest", "Shoulders", "Triceps"] },
  { name: "Decline Bench Press", category: "Chest", defaultWeight: 55, muscles: ["Chest", "Triceps"] },
  { name: "Dumbbell Chest Press", category: "Chest", defaultWeight: 25, muscles: ["Chest", "Triceps", "Shoulders"] },
  { name: "Incline Dumbbell Press", category: "Chest", defaultWeight: 22, muscles: ["Chest", "Shoulders", "Triceps"] },
  { name: "Chest Fly", category: "Chest", defaultWeight: 15, muscles: ["Chest"] },
  { name: "Cable Crossover", category: "Chest", defaultWeight: 20, muscles: ["Chest"] },
  { name: "Push-Ups", category: "Chest", defaultWeight: 0, muscles: ["Chest", "Triceps", "Shoulders", "Core"] },
  { name: "Dips (Chest)", category: "Chest", defaultWeight: 0, muscles: ["Chest", "Triceps", "Shoulders"] },

  // Back
  { name: "Deadlift", category: "Back", defaultWeight: 100, muscles: ["Back", "Hamstrings", "Glutes", "Core", "Traps"] },
  { name: "Barbell Row", category: "Back", defaultWeight: 60, muscles: ["Back", "Lats", "Biceps", "Traps"] },
  { name: "Lat Pulldown", category: "Back", defaultWeight: 50, muscles: ["Lats", "Biceps", "Back"] },
  { name: "Seated Cable Row", category: "Back", defaultWeight: 55, muscles: ["Back", "Lats", "Biceps", "Traps"] },
  { name: "Pull-Ups", category: "Back", defaultWeight: 0, muscles: ["Lats", "Biceps", "Back", "Core"] },
  { name: "Chin-Ups", category: "Back", defaultWeight: 0, muscles: ["Lats", "Biceps", "Back"] },
  { name: "T-Bar Row", category: "Back", defaultWeight: 45, muscles: ["Back", "Lats", "Biceps", "Traps"] },
  { name: "Single-Arm Dumbbell Row", category: "Back", defaultWeight: 30, muscles: ["Back", "Lats", "Biceps"] },
  { name: "Face Pulls", category: "Back", defaultWeight: 25, muscles: ["Shoulders", "Traps", "Back"] },

  // Shoulders
  { name: "Overhead Press", category: "Shoulders", defaultWeight: 40, muscles: ["Shoulders", "Triceps", "Core"] },
  { name: "Seated Dumbbell Press", category: "Shoulders", defaultWeight: 20, muscles: ["Shoulders", "Triceps"] },
  { name: "Arnold Press", category: "Shoulders", defaultWeight: 18, muscles: ["Shoulders", "Triceps"] },
  { name: "Lateral Raises", category: "Shoulders", defaultWeight: 10, muscles: ["Shoulders"] },
  { name: "Front Raises", category: "Shoulders", defaultWeight: 10, muscles: ["Shoulders"] },
  { name: "Rear Delt Fly", category: "Shoulders", defaultWeight: 10, muscles: ["Shoulders", "Back"] },
  { name: "Upright Row", category: "Shoulders", defaultWeight: 30, muscles: ["Shoulders", "Traps"] },
  { name: "Shrugs", category: "Shoulders", defaultWeight: 40, muscles: ["Traps"] },

  // Arms - Biceps
  { name: "Barbell Curl", category: "Biceps", defaultWeight: 30, muscles: ["Biceps", "Forearms"] },
  { name: "Dumbbell Curl", category: "Biceps", defaultWeight: 12, muscles: ["Biceps"] },
  { name: "Hammer Curl", category: "Biceps", defaultWeight: 12, muscles: ["Biceps", "Forearms"] },
  { name: "Preacher Curl", category: "Biceps", defaultWeight: 25, muscles: ["Biceps"] },
  { name: "Concentration Curl", category: "Biceps", defaultWeight: 10, muscles: ["Biceps"] },
  { name: "Cable Curl", category: "Biceps", defaultWeight: 25, muscles: ["Biceps"] },

  // Arms - Triceps
  { name: "Tricep Pushdown", category: "Triceps", defaultWeight: 30, muscles: ["Triceps"] },
  { name: "Skull Crushers", category: "Triceps", defaultWeight: 25, muscles: ["Triceps"] },
  { name: "Overhead Tricep Extension", category: "Triceps", defaultWeight: 20, muscles: ["Triceps"] },
  { name: "Tricep Dips", category: "Triceps", defaultWeight: 0, muscles: ["Triceps", "Chest", "Shoulders"] },
  { name: "Close-Grip Bench Press", category: "Triceps", defaultWeight: 50, muscles: ["Triceps", "Chest"] },
  { name: "Rope Pushdown", category: "Triceps", defaultWeight: 25, muscles: ["Triceps"] },

  // Legs - Quads
  { name: "Squat", category: "Legs", defaultWeight: 80, muscles: ["Quadriceps", "Glutes", "Hamstrings", "Core"] },
  { name: "Front Squat", category: "Legs", defaultWeight: 60, muscles: ["Quadriceps", "Glutes", "Core"] },
  { name: "Leg Press", category: "Legs", defaultWeight: 120, muscles: ["Quadriceps", "Glutes", "Hamstrings"] },
  { name: "Leg Extension", category: "Legs", defaultWeight: 40, muscles: ["Quadriceps"] },
  { name: "Lunges", category: "Legs", defaultWeight: 20, muscles: ["Quadriceps", "Glutes", "Hamstrings"] },
  { name: "Bulgarian Split Squat", category: "Legs", defaultWeight: 15, muscles: ["Quadriceps", "Glutes", "Hamstrings"] },
  { name: "Hack Squat", category: "Legs", defaultWeight: 80, muscles: ["Quadriceps", "Glutes"] },

  // Legs - Hamstrings
  { name: "Romanian Deadlift", category: "Legs", defaultWeight: 70, muscles: ["Hamstrings", "Glutes", "Back"] },
  { name: "Lying Leg Curl", category: "Legs", defaultWeight: 35, muscles: ["Hamstrings"] },
  { name: "Seated Leg Curl", category: "Legs", defaultWeight: 35, muscles: ["Hamstrings"] },
  { name: "Good Mornings", category: "Legs", defaultWeight: 40, muscles: ["Hamstrings", "Glutes", "Back"] },
  { name: "Glute Bridge", category: "Legs", defaultWeight: 60, muscles: ["Glutes", "Hamstrings"] },
  { name: "Hip Thrust", category: "Legs", defaultWeight: 80, muscles: ["Glutes", "Hamstrings"] },

  // Calves
  { name: "Standing Calf Raise", category: "Calves", defaultWeight: 60, muscles: ["Calves"] },
  { name: "Seated Calf Raise", category: "Calves", defaultWeight: 40, muscles: ["Calves"] },
  { name: "Calf Press", category: "Calves", defaultWeight: 100, muscles: ["Calves"] },

  // Core
  { name: "Plank", category: "Core", defaultWeight: 0, muscles: ["Core", "Shoulders"] },
  { name: "Cable Crunch", category: "Core", defaultWeight: 40, muscles: ["Core"] },
  { name: "Hanging Leg Raise", category: "Core", defaultWeight: 0, muscles: ["Core"] },
  { name: "Ab Wheel Rollout", category: "Core", defaultWeight: 0, muscles: ["Core", "Shoulders"] },
  { name: "Russian Twist", category: "Core", defaultWeight: 10, muscles: ["Core"] },
  { name: "Decline Sit-Ups", category: "Core", defaultWeight: 0, muscles: ["Core"] },
];

export const EXERCISE_CATEGORIES = [
  "All",
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Calves",
  "Core",
];

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
