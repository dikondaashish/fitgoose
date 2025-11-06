import { useState, useEffect } from 'react';
import { Camera } from './components/Camera/Camera';
import { GooseEnergyMeter } from './components/GooseEnergyMeter/GooseEnergyMeter';
import { useWorkout } from './hooks/useWorkout';
import type { ExerciseType } from './types/fitness';
import './App.css';

function App() {
  const {
    isWorkoutActive,
    currentExercise,
    sessionData,
    gooseState,
    latestExerciseResult,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    changeExercise,
    handleExerciseResult
  } = useWorkout();

  const [currentTime, setCurrentTime] = useState(Date.now());
  const exercises: ExerciseType[] = ['squat', 'pushup', 'jumping_jack'];

  // Update timer every second when workout is active
  useEffect(() => {
    if (isWorkoutActive) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isWorkoutActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentDuration = (): string => {
    if (!sessionData) return '0:00';
    return formatTime(Math.floor((currentTime - sessionData.startTime.getTime()) / 1000));
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="goose-icon">🦢</span>
            FitGoose
            <span className="subtitle">Voice & Motion Fitness Trainer</span>
          </h1>
          
          <div className="workout-controls">
            {!isWorkoutActive ? (
              <button 
                onClick={startWorkout}
                className="start-button"
                aria-label="Start Workout"
              >
                🚀 Start Workout
              </button>
            ) : (
              <div className="active-controls">
                <button 
                  onClick={pauseWorkout}
                  className="pause-button"
                  aria-label="Pause Workout"
                >
                  ⏸️ Pause
                </button>
                <button 
                  onClick={resumeWorkout}
                  className="resume-button"
                  aria-label="Resume Workout"
                >
                  ▶️ Resume
                </button>
                <button 
                  onClick={stopWorkout}
                  className="stop-button"
                  aria-label="Stop Workout"
                >
                  ⏹️ Stop
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="workout-area">
          <div className="left-panel">
            <Camera
              exerciseType={currentExercise}
              onExerciseResult={handleExerciseResult}
              isActive={isWorkoutActive}
            />
            
            <div className="exercise-selector">
              <h3>Choose Exercise</h3>
              <div className="exercise-buttons">
                {exercises.map((exercise) => (
                  <button
                    key={exercise}
                    onClick={() => changeExercise(exercise)}
                    className={`exercise-button ${exercise === currentExercise ? 'active' : ''}`}
                  >
                    {exercise === 'squat' && '🏋️'}
                    {exercise === 'pushup' && '💪'}
                    {exercise === 'jumping_jack' && '🤸'}
                    <span>{exercise.replace('_', ' ').toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="right-panel">
            <GooseEnergyMeter
              gooseState={gooseState}
              currentRep={sessionData?.totalReps || 0}
              isCorrectForm={latestExerciseResult?.isCorrectForm ?? true}
            />

            <div className="session-stats">
              <h3>Workout Session</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{sessionData?.totalReps || 0}</div>
                  <div className="stat-label">Total Reps</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{getCurrentDuration()}</div>
                  <div className="stat-label">Duration</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{currentExercise.replace('_', ' ')}</div>
                  <div className="stat-label">Current Exercise</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{isWorkoutActive ? '🟢 Active' : '🔴 Inactive'}</div>
                  <div className="stat-label">Status</div>
                </div>
              </div>
            </div>

            <div className="instructions">
              <h3>Instructions</h3>
              <div className="instruction-content">
                <p><strong>Voice Commands:</strong></p>
                <ul>
                  <li>"Start workout" - Begin session</li>
                  <li>"Pause" - Pause session</li>
                  <li>"Squat" / "Push up" / "Jumping jack" - Change exercise</li>
                </ul>
                <p><strong>Tips:</strong></p>
                <ul>
                  <li>Stand in front of your camera</li>
                  <li>Ensure good lighting</li>
                  <li>Listen for real-time feedback</li>
                  <li>Maintain proper form for energy boosts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Powered by <strong>Goose AI</strong> • 
          Built with MediaPipe & TensorFlow.js • 
          <a href="https://github.com/block/goose" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
