import React, { useEffect, useRef, useState } from 'react';
import { PoseDetectionService } from '../../services/poseDetection';
import type { CameraState, ExerciseResult, ExerciseType } from '../../types/fitness';
import './Camera.css';

interface CameraProps {
  exerciseType: ExerciseType;
  onExerciseResult: (result: ExerciseResult) => void;
  isActive: boolean;
}

export const Camera: React.FC<CameraProps> = ({ 
  exerciseType, 
  onExerciseResult, 
  isActive 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseServiceRef = useRef<PoseDetectionService | null>(null);
  
  const [cameraState, setCameraState] = useState<CameraState>({
    isEnabled: false,
    hasPermission: false,
    isLoading: false,
    error: undefined
  });
  const [demoMode, setDemoMode] = useState(false);
  const [demoRepCount, setDemoRepCount] = useState(0);

  // Initialize camera and pose detection
  useEffect(() => {
    if (isActive) {
      // Auto-timeout if camera initialization takes too long
      const autoTimeout = setTimeout(() => {
        if (cameraState.isLoading) {
          setCameraState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Camera initialization timed out. No camera detected or permission denied. Use Demo Mode to test the app.'
          }));
        }
      }, 10000); // 10 second timeout

      initializeCamera();

      return () => {
        clearTimeout(autoTimeout);
      };
    } else {
      cleanup();
    }

    return cleanup;
  }, [isActive]);

  // Update exercise type when it changes
  useEffect(() => {
    if (poseServiceRef.current) {
      poseServiceRef.current.setExercise(exerciseType);
    }
  }, [exerciseType]);

  const initializeCamera = async () => {
    setCameraState(prev => ({ ...prev, isLoading: true, error: undefined }));

    try {
      console.log('Requesting camera access...');
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Add a timeout for the entire camera initialization process
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Camera initialization timeout after 15 seconds')), 15000)
      );

      // Request camera permission with fallback constraints
      const getCameraStream = async (): Promise<MediaStream> => {
        try {
          return await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            }
          });
        } catch (err) {
          console.warn('Failed with ideal constraints, trying basic:', err);
          return await navigator.mediaDevices.getUserMedia({ video: true });
        }
      };

      const stream = await Promise.race([getCameraStream(), timeoutPromise]);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata with timeout
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            if (videoRef.current) {
              videoRef.current.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                resolve();
              };
              videoRef.current.onerror = () => {
                reject(new Error('Video loading failed'));
              };
            }
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Video loading timeout')), 10000)
          )
        ]);

        // Ensure video is playing
        try {
          await videoRef.current.play();
          console.log('Video playing successfully');
        } catch (playError) {
          console.warn('Video autoplay failed, but continuing:', playError);
        }

        // Set camera as ready first
        setCameraState({
          isEnabled: true,
          hasPermission: true,
          isLoading: false,
          error: undefined
        });

        // Initialize pose detection with timeout
        try {
          await Promise.race([
            (async () => {
              if (videoRef.current && canvasRef.current) {
                console.log('Initializing pose detection...');
                poseServiceRef.current = new PoseDetectionService(
                  videoRef.current,
                  canvasRef.current,
                  onExerciseResult
                );
                poseServiceRef.current.setExercise(exerciseType);
                await poseServiceRef.current.startDetection();
                console.log('Pose detection started successfully');
              }
            })(),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Pose detection timeout')), 20000)
            )
          ]);
        } catch (poseError) {
          console.error('Pose detection initialization failed:', poseError);
          // Don't fail the whole camera, just show a warning
          console.warn('Camera is working but pose detection failed. Exercise tracking may not work properly.');
        }
      }
    } catch (error) {
      console.error('Error initializing camera:', error);
      let errorMessage = 'Failed to access camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access and try again.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera or use Demo Mode.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported in this browser. Try Chrome or Firefox.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Camera initialization timed out. Please check your camera and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setCameraState({
        isEnabled: false,
        hasPermission: false,
        isLoading: false,
        error: errorMessage
      });
    }
  };

  const cleanup = () => {
    // Stop pose detection
    if (poseServiceRef.current) {
      poseServiceRef.current.stopDetection();
      poseServiceRef.current = null;
    }

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setCameraState(prev => ({ ...prev, isEnabled: false }));
  };

  const resetExercise = () => {
    if (poseServiceRef.current) {
      poseServiceRef.current.resetReps();
    }
    if (demoMode) {
      setDemoRepCount(0);
    }
  };

  // Demo mode simulation
  useEffect(() => {
    if (demoMode && isActive) {
      const demoInterval = setInterval(() => {
        const newRepCount = demoRepCount + 1;
        setDemoRepCount(newRepCount);
        
        const demoResult = {
          exerciseType: exerciseType,
          isCorrectForm: Math.random() > 0.2, // 80% chance of good form
          repCount: newRepCount,
          confidence: 0.8,
          feedback: `Demo ${exerciseType} rep ${newRepCount}!`
        };
        onExerciseResult(demoResult);
      }, 2000); // New rep every 2 seconds

      return () => clearInterval(demoInterval);
    }
  }, [demoMode, isActive, demoRepCount, exerciseType, onExerciseResult]);

  const getExerciseEmoji = () => {
    switch (exerciseType) {
      case 'squat': return '🏋️';
      case 'pushup': return '💪';
      case 'jumping_jack': return '🤸';
      default: return '🏃';
    }
  };

  const getExerciseInstructions = () => {
    switch (exerciseType) {
      case 'squat':
        return {
          title: 'Squat Instructions',
          steps: [
            'Stand with feet shoulder-width apart',
            'Keep your chest up and core engaged',
            'Lower your body by bending your knees',
            'Go down until thighs are parallel to floor',
            'Push through your heels to return to start'
          ]
        };
      case 'pushup':
        return {
          title: 'Push-up Instructions',
          steps: [
            'Start in plank position with hands shoulder-width apart',
            'Keep your body in a straight line',
            'Lower your chest towards the ground',
            'Push back up to starting position',
            'Keep your core tight throughout'
          ]
        };
      case 'jumping_jack':
        return {
          title: 'Jumping Jack Instructions',
          steps: [
            'Start with feet together, arms at sides',
            'Jump while spreading feet shoulder-width apart',
            'Simultaneously raise arms overhead',
            'Jump back to starting position',
            'Maintain a steady rhythm'
          ]
        };
      default:
        return { title: 'Exercise Instructions', steps: ['Follow the movement pattern'] };
    }
  };

  if (cameraState.error) {
    return (
      <div className="camera-error">
        <div className="error-icon">📷</div>
        <h3>Camera Error</h3>
        <p>{cameraState.error}</p>
        <div className="error-actions">
          <button onClick={initializeCamera} className="retry-button">
            Try Again
          </button>
          <button 
            onClick={() => {
              // Enable demo mode with continuous simulation
              setDemoMode(true);
            }} 
            className="demo-button"
          >
            🎮 Demo Mode
          </button>
        </div>
        <div className="error-note">
          <p><strong>Troubleshooting:</strong></p>
          <ul>
            <li>Use Chrome, Firefox, or Safari</li>
            <li>Allow camera permissions</li>
            <li>Check if camera is working in other apps</li>
            <li>Try refreshing the page</li>
            <li>Use "Demo Mode" to test without camera</li>
          </ul>
        </div>
      </div>
    );
  }

  if (cameraState.isLoading) {
    return (
      <div className="camera-loading">
        <div className="loading-spinner"></div>
        <p>Initializing camera and AI...</p>
      </div>
    );
  }

  if (!cameraState.hasPermission) {
    return (
      <div className="camera-permission">
        <div className="permission-icon">🎥</div>
        <h3>Camera Permission Required</h3>
        <p>FitGoose needs access to your camera to track your movements and provide real-time feedback.</p>
        <button onClick={initializeCamera} className="permission-button">
          Enable Camera
        </button>
      </div>
    );
  }

  // Demo mode display
  if (demoMode) {
    const instructions = getExerciseInstructions();
    return (
      <div className="camera-container">
        <div className="demo-display">
          <div className="demo-header">
            <div className="demo-icon">{getExerciseEmoji()}</div>
            <h3>🎮 Demo Mode: {exerciseType.replace('_', ' ').toUpperCase()}</h3>
            <p>Simulating exercise detection - no camera needed!</p>
          </div>
          
          <div className="exercise-instructions">
            <h4>{instructions.title}</h4>
            <ol>
              {instructions.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="demo-animation">
            <div className="exercise-figure">
              <div className="figure-emoji">{getExerciseEmoji()}</div>
              <div className="motion-indicator">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
              </div>
            </div>
            <p>Simulating {exerciseType} movements...</p>
            <p><strong>Demo Rep Count: {demoRepCount}</strong></p>
          </div>

          <div className="demo-controls">
            <button onClick={() => setDemoMode(false)} className="exit-demo-button">
              📷 Try Camera Again
            </button>
            <button onClick={resetExercise} className="reset-button">
              Reset Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-container">
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
        />
        <canvas
          ref={canvasRef}
          className="pose-overlay"
          width={640}
          height={480}
        />
      </div>
      
      <div className="camera-controls">
        <div className="exercise-info">
          <span className="current-exercise">
            Current: {exerciseType.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <button onClick={resetExercise} className="reset-button">
          Reset Reps
        </button>
        
        <div className="camera-status">
          <div className={`status-indicator ${cameraState.isEnabled ? 'active' : 'inactive'}`}>
            {cameraState.isEnabled ? '🟢 Live' : '🔴 Offline'}
          </div>
        </div>
      </div>
    </div>
  );
};
