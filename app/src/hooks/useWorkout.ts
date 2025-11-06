import { useState, useEffect, useRef } from 'react';
import { VoiceFeedbackService } from '../services/voiceFeedback';
import type { 
  ExerciseType, 
  ExerciseResult, 
  VoiceCommand, 
  GooseState, 
  WorkoutSession 
} from '../types/fitness';

export const useWorkout = () => {
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<ExerciseType>('squat');
  const [sessionData, setSessionData] = useState<WorkoutSession | null>(null);
  const [latestExerciseResult, setLatestExerciseResult] = useState<ExerciseResult | null>(null);
  const [gooseState, setGooseState] = useState<GooseState>({
    energyLevel: 0,
    mood: 'focused',
    currentExercise: 'squat',
    sessionActive: false
  });

  const voiceServiceRef = useRef<VoiceFeedbackService | null>(null);
  const sessionStartTime = useRef<Date | null>(null);
  const lastRepTime = useRef<Date | null>(null);
  const lastRepCount = useRef<number>(0);

  // Initialize voice service
  useEffect(() => {
    voiceServiceRef.current = new VoiceFeedbackService(handleVoiceCommand);
    
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, []);

  // Handle voice commands
  const handleVoiceCommand = (command: VoiceCommand) => {
    switch (command.action) {
      case 'start_workout':
        startWorkout();
        break;
      case 'pause_workout':
        pauseWorkout();
        break;
      case 'stop_workout':
        stopWorkout();
        break;
      case 'change_exercise':
        if (command.parameters?.exercise) {
          changeExercise(command.parameters.exercise);
        }
        break;
    }
  };

  // Start workout session
  const startWorkout = () => {
    sessionStartTime.current = new Date();
    
    const newSession: WorkoutSession = {
      id: Date.now().toString(),
      startTime: sessionStartTime.current,
      exercises: [],
      totalReps: 0,
      duration: 0,
      gooseEnergyLevel: 0
    };

    setSessionData(newSession);
    setIsWorkoutActive(true);
    setGooseState(prev => ({
      ...prev,
      sessionActive: true,
      mood: 'excited',
      energyLevel: 10, // Start with some base energy
      currentExercise
    }));

    // Voice feedback
    if (voiceServiceRef.current) {
      voiceServiceRef.current.startWorkout();
      voiceServiceRef.current.instructExercise(currentExercise);
      voiceServiceRef.current.startListening();
    }
  };

  // Pause workout
  const pauseWorkout = () => {
    setIsWorkoutActive(false);
    setGooseState(prev => ({ ...prev, sessionActive: false, mood: 'focused' }));
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.pauseWorkout();
      voiceServiceRef.current.stopListening();
    }
  };

  // Resume workout
  const resumeWorkout = () => {
    setIsWorkoutActive(true);
    setGooseState(prev => ({ ...prev, sessionActive: true, mood: 'encouraging' }));
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.resumeWorkout();
      voiceServiceRef.current.startListening();
    }
  };

  // Stop workout
  const stopWorkout = () => {
    if (sessionData && sessionStartTime.current) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - sessionStartTime.current.getTime()) / 1000);
      
      const finalSession: WorkoutSession = {
        ...sessionData,
        endTime,
        duration
      };

      if (voiceServiceRef.current) {
        voiceServiceRef.current.endWorkout(finalSession.totalReps, duration);
        voiceServiceRef.current.stopListening();
      }
    }

    setIsWorkoutActive(false);
    setSessionData(null);
    setGooseState(prev => ({
      ...prev,
      sessionActive: false,
      mood: 'celebrating',
      energyLevel: 0
    }));
  };

  // Change exercise type
  const changeExercise = (exercise: ExerciseType) => {
    setCurrentExercise(exercise);
    setGooseState(prev => ({ ...prev, currentExercise: exercise, mood: 'focused' }));
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.instructExercise(exercise);
    }
  };

  // Handle exercise results from pose detection
  const handleExerciseResult = (result: ExerciseResult) => {
    const now = new Date();
    
    // Store latest result
    setLatestExerciseResult(result);
    
    // Only process new reps (avoid duplicate processing)
    if (result.repCount > lastRepCount.current) {
      console.log(`New rep detected: ${result.repCount}, Form: ${result.isCorrectForm}`);
      
      // Update session data
      if (sessionData) {
        const updatedSession = {
          ...sessionData,
          exercises: [...sessionData.exercises, result],
          totalReps: result.repCount,
          gooseEnergyLevel: gooseState.energyLevel
        };
        setSessionData(updatedSession);
      }

      // Calculate energy gain based on form and frequency
      let energyGain = 0;
      if (result.isCorrectForm) {
        energyGain = 5; // Base energy for correct form
        
        // Bonus for consistency (reps within reasonable time)
        if (lastRepTime.current) {
          const timeDiff = (now.getTime() - lastRepTime.current.getTime()) / 1000;
          if (timeDiff < 5) { // Within 5 seconds
            energyGain += 2;
          }
        }

        // Milestone bonuses
        if (result.repCount % 10 === 0) {
          energyGain += 10; // Big bonus for milestones
        } else if (result.repCount % 5 === 0) {
          energyGain += 5; // Smaller bonus for 5-rep milestones
        }
      } else {
        energyGain = 1; // Small energy for effort, even with poor form
      }

      // Update Goose state
      const newEnergyLevel = Math.min(100, gooseState.energyLevel + energyGain);
      let newMood: GooseState['mood'] = 'encouraging';
      
      if (newEnergyLevel >= 90) {
        newMood = 'celebrating';
      } else if (newEnergyLevel >= 70) {
        newMood = 'excited';
      } else if (result.isCorrectForm) {
        newMood = 'encouraging';
      } else {
        newMood = 'focused';
      }

      setGooseState(prev => ({
        ...prev,
        energyLevel: newEnergyLevel,
        mood: newMood
      }));

      // Voice feedback for new reps only
      if (voiceServiceRef.current && isWorkoutActive) {
        if (result.isCorrectForm) {
          if (result.repCount % 10 === 0) {
            voiceServiceRef.current.celebrate(result.repCount);
          } else if (result.repCount % 5 === 0) {
            voiceServiceRef.current.giveEncouragement();
          } else {
            voiceServiceRef.current.giveExerciseSpecificFeedback(result.exerciseType, true);
          }
        } else {
          voiceServiceRef.current.giveCorrection(result.tips?.[0]);
        }
      }

      lastRepTime.current = now;
      lastRepCount.current = result.repCount;
    }
  };

  // Auto-decay energy over time (gamification)
  useEffect(() => {
    if (!isWorkoutActive) return;

    const decayInterval = setInterval(() => {
      setGooseState(prev => ({
        ...prev,
        energyLevel: Math.max(0, prev.energyLevel - 1) // Slow decay
      }));
    }, 10000); // Every 10 seconds

    return () => clearInterval(decayInterval);
  }, [isWorkoutActive]);

  return {
    // State
    isWorkoutActive,
    currentExercise,
    sessionData,
    gooseState,
    latestExerciseResult,
    
    // Actions
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    changeExercise,
    handleExerciseResult,
    
    // Voice service reference for manual control
    voiceService: voiceServiceRef.current
  };
};
