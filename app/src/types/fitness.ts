// Type definitions for FitGoose

export interface Pose {
  landmarks: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
  worldLandmarks?: Array<{
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }>;
}

export interface ExerciseResult {
  exerciseType: ExerciseType;
  isCorrectForm: boolean;
  repCount: number;
  confidence: number;
  feedback: string;
  tips?: string[];
}

export type ExerciseType = 'squat' | 'pushup' | 'jumping_jack' | 'plank' | 'lunge';

export interface WorkoutSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  exercises: ExerciseResult[];
  totalReps: number;
  duration: number;
  gooseEnergyLevel: number;
}

export interface VoiceFeedback {
  message: string;
  type: 'encouragement' | 'correction' | 'celebration' | 'instruction';
  priority: 'low' | 'medium' | 'high';
}

export interface GooseState {
  energyLevel: number; // 0-100
  mood: 'excited' | 'encouraging' | 'focused' | 'celebrating';
  currentExercise?: ExerciseType;
  sessionActive: boolean;
}

export interface ExerciseDetectionConfig {
  exerciseType: ExerciseType;
  minConfidence: number;
  repThreshold: number;
  formCheckpoints: string[];
}

export interface CameraState {
  isEnabled: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  error?: string;
}

export interface VoiceCommand {
  command: string;
  action: 'start_workout' | 'pause_workout' | 'stop_workout' | 'change_exercise' | 'repeat_instruction';
  parameters?: Record<string, any>;
}
