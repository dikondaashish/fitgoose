import { Pose } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import type { ExerciseType, ExerciseResult } from '../types/fitness';

export class PoseDetectionService {
  private pose: Pose;
  private camera: Camera;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onResultsCallback?: (results: ExerciseResult) => void;
  private currentExercise: ExerciseType = 'squat';
  private repCount = 0;
  private isInPosition = false;

  constructor(
    videoElement: HTMLVideoElement,
    canvasElement: HTMLCanvasElement,
    onResults?: (results: ExerciseResult) => void
  ) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d')!;
    this.onResultsCallback = onResults;

    // Initialize MediaPipe Pose with better error handling
    try {
      this.pose = new Pose({
        locateFile: (file) => {
          console.log('Loading MediaPipe file:', file);
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`;
        }
      });
    } catch (error) {
      console.error('Failed to initialize MediaPipe Pose:', error);
      throw new Error('MediaPipe Pose initialization failed');
    }

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.pose.onResults(this.onPoseResults.bind(this));

    // Initialize camera
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        await this.pose.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });
  }

  async startDetection(): Promise<void> {
    await this.camera.start();
  }

  stopDetection(): void {
    this.camera.stop();
  }

  setExercise(exercise: ExerciseType): void {
    this.currentExercise = exercise;
    this.repCount = 0;
    this.isInPosition = false;
  }

  private onPoseResults(results: any): void {
    // Clear canvas
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw the input image
    this.ctx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);

    if (results.poseLandmarks) {
      // Draw pose landmarks and connections
      drawConnectors(this.ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 4
      });
      drawLandmarks(this.ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 2,
        radius: 6
      });

      // Analyze exercise
      const exerciseResult = this.analyzeExercise(results.poseLandmarks);
      
      if (this.onResultsCallback) {
        this.onResultsCallback(exerciseResult);
      }
    }

    this.ctx.restore();
  }

  private analyzeExercise(landmarks: any[]): ExerciseResult {
    switch (this.currentExercise) {
      case 'squat':
        return this.analyzeSquat(landmarks);
      case 'pushup':
        return this.analyzePushup(landmarks);
      case 'jumping_jack':
        return this.analyzeJumpingJack(landmarks);
      default:
        return {
          exerciseType: this.currentExercise,
          isCorrectForm: false,
          repCount: this.repCount,
          confidence: 0,
          feedback: 'Exercise not implemented yet'
        };
    }
  }

  private analyzeSquat(landmarks: any[]): ExerciseResult {
    // Key landmarks for squat analysis
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftKnee = landmarks[25];
    const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    // Calculate knee angles
    const leftKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
    const rightKneeAngle = this.calculateAngle(rightHip, rightKnee, rightAnkle);
    const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

    // Squat detection logic
    const inSquatPosition = avgKneeAngle < 120; // Knees bent enough
    const correctForm = avgKneeAngle > 70 && avgKneeAngle < 120; // Not too deep, not too shallow

    let feedback = '';
    let tips: string[] = [];

    if (inSquatPosition && !this.isInPosition) {
      // Going down
      this.isInPosition = true;
      if (correctForm) {
        feedback = 'Great squat form!';
      } else if (avgKneeAngle < 70) {
        feedback = 'You can go a bit deeper!';
        tips.push('Try to lower your hips more');
      }
    } else if (!inSquatPosition && this.isInPosition) {
      // Coming up - count rep
      this.isInPosition = false;
      this.repCount++;
      feedback = `Rep ${this.repCount} completed!`;
      
      if (this.repCount % 5 === 0) {
        feedback = `${this.repCount} reps! You're crushing it! 🔥`;
      }
    }

    return {
      exerciseType: 'squat',
      isCorrectForm: correctForm,
      repCount: this.repCount,
      confidence: 0.8,
      feedback,
      tips: tips.length > 0 ? tips : undefined
    };
  }

  private analyzePushup(landmarks: any[]): ExerciseResult {
    // Key landmarks for pushup analysis
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // Calculate elbow angles
    const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
    const avgElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

    // Pushup detection logic
    const inPushupPosition = avgElbowAngle < 120;
    const correctForm = avgElbowAngle > 60 && avgElbowAngle < 120;

    let feedback = '';
    let tips: string[] = [];

    if (inPushupPosition && !this.isInPosition) {
      this.isInPosition = true;
      if (correctForm) {
        feedback = 'Perfect pushup form!';
      } else {
        feedback = 'Good, keep your form tight!';
        tips.push('Keep your back straight');
      }
    } else if (!inPushupPosition && this.isInPosition) {
      this.isInPosition = false;
      this.repCount++;
      feedback = `Pushup ${this.repCount} done!`;
    }

    return {
      exerciseType: 'pushup',
      isCorrectForm: correctForm,
      repCount: this.repCount,
      confidence: 0.7,
      feedback,
      tips: tips.length > 0 ? tips : undefined
    };
  }

  private analyzeJumpingJack(landmarks: any[]): ExerciseResult {
    // Key landmarks for jumping jack analysis
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];
    const nose = landmarks[0];

    // Calculate arm and leg positions
    const armsRaised = leftWrist.y < nose.y && rightWrist.y < nose.y;
    const feetApart = Math.abs(leftAnkle.x - rightAnkle.x) > 0.3;

    const inJackPosition = armsRaised && feetApart;

    let feedback = '';

    if (inJackPosition && !this.isInPosition) {
      this.isInPosition = true;
      feedback = 'Great jumping jack!';
    } else if (!inJackPosition && this.isInPosition) {
      this.isInPosition = false;
      this.repCount++;
      feedback = `Jumping jack ${this.repCount}!`;
    }

    return {
      exerciseType: 'jumping_jack',
      isCorrectForm: inJackPosition,
      repCount: this.repCount,
      confidence: 0.6,
      feedback
    };
  }

  private calculateAngle(a: any, b: any, c: any): number {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    
    return angle;
  }

  resetReps(): void {
    this.repCount = 0;
    this.isInPosition = false;
  }
}
