import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';

// Map exercise names to LottieFiles animation URLs
// Using free fitness animations from LottieFiles
const EXERCISE_ANIMATIONS: Record<string, string> = {
  // Chest
  'Bench Press': 'https://assets2.lottiefiles.com/packages/lf20_wHZvdv.json',
  'Incline Bench Press': 'https://assets2.lottiefiles.com/packages/lf20_wHZvdv.json',
  'Decline Bench Press': 'https://assets2.lottiefiles.com/packages/lf20_wHZvdv.json',
  'Dumbbell Fly': 'https://assets2.lottiefiles.com/packages/lf20_wHZvdv.json',
  'Cable Crossover': 'https://assets2.lottiefiles.com/packages/lf20_wHZvdv.json',
  'Push-Ups': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  
  // Back
  'Deadlift': 'https://assets3.lottiefiles.com/packages/lf20_uzuqovr3.json',
  'Bent Over Row': 'https://assets3.lottiefiles.com/packages/lf20_uzuqovr3.json',
  'Lat Pulldown': 'https://assets3.lottiefiles.com/packages/lf20_uzuqovr3.json',
  'Pull-Ups': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Seated Cable Row': 'https://assets3.lottiefiles.com/packages/lf20_uzuqovr3.json',
  'T-Bar Row': 'https://assets3.lottiefiles.com/packages/lf20_uzuqovr3.json',
  
  // Shoulders
  'Overhead Press': 'https://assets1.lottiefiles.com/packages/lf20_dews3j6m.json',
  'Military Press': 'https://assets1.lottiefiles.com/packages/lf20_dews3j6m.json',
  'Arnold Press': 'https://assets1.lottiefiles.com/packages/lf20_dews3j6m.json',
  'Lateral Raise': 'https://assets1.lottiefiles.com/packages/lf20_dews3j6m.json',
  'Front Raise': 'https://assets1.lottiefiles.com/packages/lf20_dews3j6m.json',
  'Face Pull': 'https://assets1.lottiefiles.com/packages/lf20_dews3j6m.json',
  
  // Legs
  'Squat': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Front Squat': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Leg Press': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Leg Extension': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Leg Curl': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Romanian Deadlift': 'https://assets3.lottiefiles.com/packages/lf20_uzuqovr3.json',
  'Calf Raise': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Lunges': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  'Hip Thrust': 'https://assets8.lottiefiles.com/packages/lf20_hmbwttad.json',
  
  // Biceps
  'Barbell Curl': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Dumbbell Curl': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Hammer Curl': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Preacher Curl': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Concentration Curl': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  
  // Triceps
  'Tricep Pushdown': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Skull Crusher': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Overhead Tricep Extension': 'https://assets5.lottiefiles.com/packages/lf20_tll0j4bb.json',
  'Dips': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Close Grip Bench Press': 'https://assets2.lottiefiles.com/packages/lf20_wHZvdv.json',
  
  // Core
  'Plank': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Crunches': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Russian Twist': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Hanging Leg Raise': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Ab Wheel Rollout': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
  'Cable Crunch': 'https://assets9.lottiefiles.com/packages/lf20_h4nxfmku.json',
};

// Default workout animation for exercises not in the map
const DEFAULT_ANIMATION = 'https://assets10.lottiefiles.com/packages/lf20_w51pcehl.json';

interface ExerciseAnimationProps {
  exerciseName: string;
  className?: string;
}

export default function ExerciseAnimation({ exerciseName, className = '' }: ExerciseAnimationProps) {
  const [animationData, setAnimationData] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAnimation = async () => {
      setLoading(true);
      setError(false);
      
      const animationUrl = EXERCISE_ANIMATIONS[exerciseName] || DEFAULT_ANIMATION;
      
      try {
        const response = await fetch(animationUrl);
        if (!response.ok) throw new Error('Failed to fetch animation');
        const data = await response.json();
        setAnimationData(data);
      } catch (err) {
        console.error('Error loading animation:', err);
        setError(true);
        // Try default animation as fallback
        try {
          const fallbackResponse = await fetch(DEFAULT_ANIMATION);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setAnimationData(fallbackData);
            setError(false);
          }
        } catch (fallbackErr) {
          console.error('Error loading fallback animation:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnimation();
  }, [exerciseName]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-fire opacity-30 animate-pulse" />
      </div>
    );
  }

  if (error || !animationData) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="w-20 h-20 rounded-full bg-gradient-fire/20 flex items-center justify-center">
          <span className="text-3xl">💪</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop={true}
        style={{ width: 120, height: 120 }}
      />
    </div>
  );
}
