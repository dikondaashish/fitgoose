# Project Story: Building FitGoose with Goose AI

## How I Built FitGoose Using Goose and Subagents

When I started working on FitGoose, I wanted to create something more than just another fitness app. I wanted to build an AI-powered fitness coach that could actually see you working out and provide real-time, personalized feedback – almost like having a personal trainer in your living room. That's where Goose AI and its subagent architecture came in really handy.

### The Core Concept

The idea was simple: combine computer vision with voice interaction to create an intelligent fitness companion. But building something like this requires coordinating multiple complex systems – camera access, pose detection, exercise analysis, voice feedback, and gamification – all working together in real-time. This is exactly where Goose's subagent pattern shines.

### How I Used Goose Subagents

I structured FitGoose using a multi-agent approach where each subagent handles a specific responsibility:

**1. The Pose Detection Agent**
This was my first subagent – responsible for analyzing video frames and detecting body movements. Using MediaPipe's pose detection, this agent continuously processes camera input at 30fps, identifying key body landmarks (33 points on the body) and calculating joint angles. It decides whether you're performing an exercise correctly, counts reps, and detects form issues. Think of it as the "eyes" of FitGoose.

**2. The Exercise Analysis Agent**
This agent takes the raw pose data and translates it into meaningful exercise insights. It knows the biomechanics of squats (knee angles between 70-120°), push-ups (elbow angles), and jumping jacks (arm and leg positions). This agent essentially acts as the "brain" that understands what a good rep looks like versus a sloppy one.

**3. The Voice Feedback Agent**
Here's where things get interesting – this agent handles both speech recognition and synthesis. It listens for voice commands like "start workout" or "switch to squats" and responds with personalized coaching feedback. But it's not just spitting out random phrases – it has a whole library of encouragement messages, correction tips, and celebration messages that it intelligently selects based on your performance. It's like having a real coach who adapts their communication style based on how you're doing.

**4. The Gamification Agent**
This is probably my favorite part – the gamification agent manages the entire "Goose Energy Meter" system. It tracks your performance, calculates energy gains based on form quality, awards bonuses for consistency and milestones, and even manages the mood system that makes FitGoose feel more alive. As your energy builds up, FitGoose's personality changes – from focused and encouraging to excited and celebrating. It's this agent that makes the whole experience feel less like a workout tracker and more like a game.

**5. The State Management Agent**
Finally, there's the orchestrator – the useWorkout hook acts as a coordination agent that manages communication between all these subagents. It routes data from pose detection to exercise analysis, triggers voice feedback at the right moments, updates the gamification state, and maintains the overall workout session state. Without this coordination layer, everything would just be chaos.

### Why This Architecture Works

What I love about using Goose's subagent pattern is that each component is independently testable and maintainable. If I want to improve the pose detection accuracy, I can work on just that agent without touching the voice system. If I want to add a new exercise type, I just need to extend the exercise analysis agent. This modularity made development so much smoother.

The real magic happens when these agents work together. During a workout, the pose detection agent feeds data to the exercise analysis agent, which then triggers the voice feedback agent at the right moments. Meanwhile, the gamification agent is watching everything and updating the energy meter and mood in real-time. It's a beautiful dance of coordinated AI agents.

### Technical Challenges and Solutions

One of the biggest challenges was managing the real-time nature of everything. The pose detection agent needs to process frames quickly, but we also need to avoid duplicate rep counting. I solved this by implementing a state machine pattern within the exercise analysis agent that tracks whether you're in the "down" or "up" phase of an exercise.

Another challenge was voice feedback timing – you don't want to interrupt the user mid-rep with a correction. The voice feedback agent uses a priority system where high-priority messages (like corrections) can interrupt low-priority ones (like general encouragement), but it's smart enough to wait for natural pauses.

The gamification agent needed to balance being rewarding without being too easy. I implemented an energy decay system that slowly reduces energy over time, encouraging consistent effort. But it also rewards perfect form with bigger bonuses and celebrates milestones (every 5 and 10 reps) to keep motivation high.

### What Makes This Special

What I'm most proud of is how all these agents come together to create a cohesive experience. When you do a perfect squat, the pose detection agent sees it, the exercise analysis agent confirms the form, the voice feedback agent celebrates, and the gamification agent gives you energy points. It all happens seamlessly in real-time, making it feel like you're actually working out with an intelligent companion.

The demo mode was also a fun addition – I created a simulation agent that can run the entire gamification and voice feedback system without needing camera access. This let me test the UI and user experience even when I didn't have a camera handy, and it's great for users who want to explore the app before committing to a workout.

### Future Extensions

Right now, FitGoose supports three exercises (squats, push-ups, and jumping jacks), but the architecture makes it easy to add more. I just need to extend the exercise analysis agent with new detection algorithms. I'm also planning to add a workout history agent that tracks progress over time and a recommendation agent that suggests workout routines based on your performance.

The beauty of the Goose subagent architecture is that adding these new capabilities doesn't require rewriting existing code – I can just add new agents that integrate with the existing system.

### Lessons Learned

Building FitGoose taught me a lot about coordinating multiple AI systems. The key insight is that each agent should have a clear, single responsibility, but they need to communicate effectively through well-defined interfaces. Using TypeScript interfaces for the data structures that pass between agents made this communication explicit and type-safe.

I also learned the importance of graceful degradation – if one agent fails (like camera access), the others can still function. The demo mode is a perfect example of this – the gamification and voice agents work perfectly fine even without pose detection.

At the end of the day, FitGoose is more than just a fitness app – it's a demonstration of how multiple AI agents can work together to create something truly interactive and engaging. The Goose subagent architecture made this possible, and I'm excited to see where we can take it next.

