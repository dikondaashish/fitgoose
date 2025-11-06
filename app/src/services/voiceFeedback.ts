import type { VoiceFeedback, VoiceCommand, ExerciseType } from '../types/fitness';

export class VoiceFeedbackService {
  private speechSynthesis: SpeechSynthesis;
  private speechRecognition?: any;
  private isListening = false;
  private onCommandCallback?: (command: VoiceCommand) => void;

  // Voice feedback library organized by type
  private feedbackLibrary = {
    encouragement: [
      "You're doing great!",
      "Keep it up!",
      "Nice form!",
      "Perfect!",
      "You've got this!",
      "Looking strong!",
      "Excellent work!",
      "Stay focused!"
    ],
    correction: [
      "Try to go a little lower",
      "Keep your back straight",
      "Slow and controlled",
      "Focus on your form",
      "Remember to breathe",
      "Keep your core tight",
      "Full range of motion"
    ],
    celebration: [
      "That's 5 reps - you're crushing it!",
      "10 reps down! Amazing!",
      "Halfway there! Keep going!",
      "15 reps! You're on fire! 🔥",
      "20 reps! Incredible work!",
      "You completed the set! Well done!",
      "New personal record! Fantastic!"
    ],
    instruction: [
      "Let's start with some squats",
      "Ready for push-ups?",
      "Time for jumping jacks!",
      "Take a 30-second break",
      "Let's switch exercises",
      "Remember to stay hydrated",
      "Focus on your breathing"
    ]
  };

  // Exercise-specific feedback
  private exerciseFeedback = {
    squat: {
      start: "Let's do some squats! Stand with feet shoulder-width apart",
      good: ["Perfect squat!", "Great depth!", "Nice form!"],
      correction: ["Go a bit lower", "Keep your chest up", "Don't let your knees cave in"]
    },
    pushup: {
      start: "Time for push-ups! Keep your body straight",
      good: ["Excellent push-up!", "Perfect form!", "Strong!"],
      correction: ["Keep your back straight", "Go all the way down", "Control the movement"]
    },
    jumping_jack: {
      start: "Let's do jumping jacks! Jump and spread your arms and legs",
      good: ["Great jumping jack!", "Perfect coordination!", "Keep the rhythm!"],
      correction: ["Jump higher", "Spread your arms wider", "Land softly"]
    }
  };

  constructor(onCommand?: (command: VoiceCommand) => void) {
    this.speechSynthesis = window.speechSynthesis;
    this.onCommandCallback = onCommand;
    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      
      this.speechRecognition.continuous = true;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';

      this.speechRecognition.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.toLowerCase().trim();
            this.processVoiceCommand(transcript);
          }
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }

  private processVoiceCommand(transcript: string): void {
    let command: VoiceCommand | null = null;

    // Parse common voice commands
    if (transcript.includes('start workout') || transcript.includes('begin')) {
      command = { command: transcript, action: 'start_workout' };
    } else if (transcript.includes('pause') || transcript.includes('stop')) {
      command = { command: transcript, action: 'pause_workout' };
    } else if (transcript.includes('squat')) {
      command = { 
        command: transcript, 
        action: 'change_exercise', 
        parameters: { exercise: 'squat' } 
      };
    } else if (transcript.includes('push up') || transcript.includes('pushup')) {
      command = { 
        command: transcript, 
        action: 'change_exercise', 
        parameters: { exercise: 'pushup' } 
      };
    } else if (transcript.includes('jumping jack')) {
      command = { 
        command: transcript, 
        action: 'change_exercise', 
        parameters: { exercise: 'jumping_jack' } 
      };
    }

    if (command && this.onCommandCallback) {
      this.onCommandCallback(command);
    }
  }

  speak(message: string, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<void> {
    return new Promise((resolve) => {
      // Cancel current speech if high priority
      if (priority === 'high' && this.speechSynthesis.speaking) {
        this.speechSynthesis.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(message);
      
      // Configure voice settings
      utterance.rate = 1.1; // Slightly faster for workout energy
      utterance.pitch = 1.1; // Slightly higher for enthusiasm
      utterance.volume = 0.8;

      // Try to find an energetic voice
      const voices = this.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Alex') || 
        voice.name.includes('Samantha') ||
        voice.lang.includes('en-US')
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.speechSynthesis.speak(utterance);
    });
  }

  provideFeedback(feedback: VoiceFeedback): void {
    this.speak(feedback.message, feedback.priority);
  }

  giveEncouragement(): void {
    const message = this.getRandomMessage('encouragement');
    this.speak(message, 'medium');
  }

  giveCorrection(tip?: string): void {
    const message = tip || this.getRandomMessage('correction');
    this.speak(message, 'high');
  }

  celebrate(repCount: number): void {
    let message = '';
    
    if (repCount % 10 === 0) {
      message = `${repCount} reps! You're absolutely crushing it! 🔥`;
    } else if (repCount % 5 === 0) {
      message = `${repCount} reps! Keep that energy up!`;
    } else {
      message = this.getRandomMessage('celebration');
    }
    
    this.speak(message, 'high');
  }

  instructExercise(exercise: ExerciseType): void {
    const exerciseData = this.exerciseFeedback[exercise as keyof typeof this.exerciseFeedback];
    const instruction = exerciseData?.start || `Let's do some ${exercise}s!`;
    this.speak(instruction, 'high');
  }

  giveExerciseSpecificFeedback(exercise: ExerciseType, isGood: boolean): void {
    const exerciseData = this.exerciseFeedback[exercise as keyof typeof this.exerciseFeedback];
    if (!exerciseData) return;

    const messages = isGood ? exerciseData.good : exerciseData.correction;
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.speak(message, 'medium');
  }

  private getRandomMessage(type: keyof typeof this.feedbackLibrary): string {
    const messages = this.feedbackLibrary[type];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  startListening(): void {
    if (this.speechRecognition && !this.isListening) {
      this.speechRecognition.start();
      this.isListening = true;
    }
  }

  stopListening(): void {
    if (this.speechRecognition && this.isListening) {
      this.speechRecognition.stop();
      this.isListening = false;
    }
  }

  // Motivational messages for different scenarios
  startWorkout(): void {
    const messages = [
      "Let's get this workout started! You've got this!",
      "Time to sweat! I'm here to guide you every step!",
      "Ready to feel amazing? Let's begin!",
      "Your fitness journey continues now! Let's go!"
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    this.speak(message, 'high');
  }

  endWorkout(totalReps: number, duration: number): void {
    const minutes = Math.floor(duration / 60);
    const message = `Workout complete! You did ${totalReps} reps in ${minutes} minutes. Outstanding work!`;
    this.speak(message, 'high');
  }

  pauseWorkout(): void {
    this.speak("Workout paused. Take your time, I'll be here when you're ready!", 'medium');
  }

  resumeWorkout(): void {
    this.speak("Welcome back! Let's pick up where we left off!", 'medium');
  }
}

// Add type declarations for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
