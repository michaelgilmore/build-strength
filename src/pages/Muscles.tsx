import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { DEFAULT_EXERCISES, MUSCLE_GROUPS, MuscleGroup } from '@/lib/exercises';
import { cn } from '@/lib/utils';

interface MuscleInfo {
  name: MuscleGroup;
  description: string;
  location: string;
  function: string;
}

const MUSCLE_DATA: MuscleInfo[] = [
  {
    name: "Chest",
    description: "The pectoralis major and minor muscles that make up the chest.",
    location: "Front of the upper torso, spanning from the sternum to the shoulder.",
    function: "Pushing movements, bringing the arm across the body, and internal rotation of the arm.",
  },
  {
    name: "Back",
    description: "A complex group of muscles including the erector spinae, rhomboids, and more.",
    location: "Posterior torso from the neck to the lower back.",
    function: "Pulling movements, posture support, and spinal stabilization.",
  },
  {
    name: "Shoulders",
    description: "The deltoid muscles consisting of anterior, lateral, and posterior heads.",
    location: "Covering the shoulder joint, connecting the upper arm to the torso.",
    function: "Arm abduction, flexion, extension, and rotation at the shoulder joint.",
  },
  {
    name: "Biceps",
    description: "The biceps brachii, a two-headed muscle on the front of the upper arm.",
    location: "Front of the upper arm between the shoulder and elbow.",
    function: "Elbow flexion and forearm supination (turning palm upward).",
  },
  {
    name: "Triceps",
    description: "The triceps brachii, a three-headed muscle on the back of the upper arm.",
    location: "Back of the upper arm between the shoulder and elbow.",
    function: "Elbow extension and stabilization of the shoulder joint.",
  },
  {
    name: "Quadriceps",
    description: "A group of four muscles on the front of the thigh.",
    location: "Front of the thigh, from hip to knee.",
    function: "Knee extension and hip flexion; essential for walking, running, and jumping.",
  },
  {
    name: "Hamstrings",
    description: "A group of three muscles on the back of the thigh.",
    location: "Back of the thigh, from hip to knee.",
    function: "Knee flexion and hip extension; important for running and jumping.",
  },
  {
    name: "Glutes",
    description: "The gluteal muscles including the gluteus maximus, medius, and minimus.",
    location: "The buttocks region, connecting the pelvis to the thigh.",
    function: "Hip extension, abduction, and external rotation; key for power movements.",
  },
  {
    name: "Calves",
    description: "The gastrocnemius and soleus muscles of the lower leg.",
    location: "Back of the lower leg, from knee to ankle.",
    function: "Plantarflexion (pointing the foot down) and propulsion during walking and running.",
  },
  {
    name: "Core",
    description: "Muscles including the rectus abdominis, obliques, and transverse abdominis.",
    location: "The midsection, wrapping around the torso.",
    function: "Spinal stabilization, torso rotation, and transfer of power between upper and lower body.",
  },
  {
    name: "Forearms",
    description: "A complex group of muscles controlling wrist and finger movements.",
    location: "Between the elbow and wrist on both sides of the arm.",
    function: "Grip strength, wrist flexion and extension, and finger movements.",
  },
  {
    name: "Traps",
    description: "The trapezius muscle, a large diamond-shaped muscle.",
    location: "Upper back and neck, from the skull to the mid-back.",
    function: "Scapular movement, neck extension, and shoulder elevation (shrugging).",
  },
  {
    name: "Lats",
    description: "The latissimus dorsi, the largest muscle in the upper body.",
    location: "Spanning from the lower back to the upper arm.",
    function: "Arm adduction, extension, and internal rotation; key for pulling movements.",
  },
];

export default function Muscles() {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);

  const muscleInfo = MUSCLE_DATA.find(m => m.name === selectedMuscle);
  
  const exercisesForMuscle = selectedMuscle 
    ? DEFAULT_EXERCISES.filter(ex => ex.muscles.includes(selectedMuscle))
    : [];

  return (
    <div className="min-h-screen pb-20">
      <Header />

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {selectedMuscle ? (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Button
                variant="ghost"
                className="mb-4"
                onClick={() => setSelectedMuscle(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Muscles
              </Button>

              <div className="card-intense p-6 mb-6">
                <h2 className="text-3xl font-display text-gradient-fire mb-4">
                  {selectedMuscle}
                </h2>
                
                {muscleInfo && (
                  <div className="space-y-4 text-muted-foreground">
                    <p>{muscleInfo.description}</p>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Location</h3>
                      <p className="text-sm">{muscleInfo.location}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">Function</h3>
                      <p className="text-sm">{muscleInfo.function}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-display text-foreground flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-primary" />
                  Exercises for {selectedMuscle}
                </h3>
                
                {exercisesForMuscle.length > 0 ? (
                  <div className="grid gap-2">
                    {exercisesForMuscle.map((exercise) => (
                      <motion.div
                        key={exercise.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card-intense p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-foreground">{exercise.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {exercise.muscles.filter(m => m !== selectedMuscle).join(', ')}
                            {exercise.muscles.filter(m => m !== selectedMuscle).length > 0 && ' also targeted'}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                          {exercise.category}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No exercises found for this muscle group.
                  </p>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-display text-foreground mb-2">Muscle Groups</h2>
                <p className="text-muted-foreground">
                  Select a muscle to learn more and find exercises
                </p>
              </div>

              <div className="grid gap-2">
                {MUSCLE_GROUPS.map((muscle, index) => (
                  <motion.button
                    key={muscle}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => setSelectedMuscle(muscle)}
                    className={cn(
                      "card-intense p-4 flex items-center justify-between",
                      "hover:ring-2 hover:ring-primary transition-all text-left"
                    )}
                  >
                    <div>
                      <p className="font-display text-lg text-foreground">{muscle}</p>
                      <p className="text-sm text-muted-foreground">
                        {DEFAULT_EXERCISES.filter(ex => ex.muscles.includes(muscle)).length} exercises
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}