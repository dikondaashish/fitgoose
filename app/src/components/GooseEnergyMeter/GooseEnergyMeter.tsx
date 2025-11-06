import React, { useEffect, useState } from 'react';
import type { GooseState } from '../../types/fitness';
import './GooseEnergyMeter.css';

interface GooseEnergyMeterProps {
  gooseState: GooseState;
  currentRep: number;
  isCorrectForm: boolean;
}

export const GooseEnergyMeter: React.FC<GooseEnergyMeterProps> = ({
  gooseState,
  currentRep,
  isCorrectForm
}) => {
  const [animatedEnergy, setAnimatedEnergy] = useState(gooseState.energyLevel);
  const [showBoost, setShowBoost] = useState(false);
  
  // Animate energy level changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedEnergy(gooseState.energyLevel);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [gooseState.energyLevel]);

  // Show energy boost animation for good form
  useEffect(() => {
    if (isCorrectForm && currentRep > 0) {
      setShowBoost(true);
      const timer = setTimeout(() => setShowBoost(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [currentRep, isCorrectForm]);

  const getGooseEmoji = () => {
    switch (gooseState.mood) {
      case 'excited':
        return '🦢✨';
      case 'celebrating':
        return '🦢🎉';
      case 'encouraging':
        return '🦢💪';
      case 'focused':
        return '🦢🎯';
      default:
        return '🦢';
    }
  };

  const getEnergyColor = () => {
    if (animatedEnergy >= 80) return '#4CAF50'; // Green
    if (animatedEnergy >= 60) return '#8BC34A'; // Light Green
    if (animatedEnergy >= 40) return '#FFC107'; // Yellow
    if (animatedEnergy >= 20) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  const getEnergyMessage = () => {
    if (animatedEnergy >= 90) return 'MAXIMUM POWER! 🔥';
    if (animatedEnergy >= 70) return 'HIGH ENERGY! 💥';
    if (animatedEnergy >= 50) return 'Good Energy! ⚡';
    if (animatedEnergy >= 30) return 'Building Up... 📈';
    if (animatedEnergy >= 10) return 'Getting Started... 🌱';
    return 'Let\'s Begin! 🚀';
  };

  const getLevelBadge = () => {
    const level = Math.floor(animatedEnergy / 20) + 1;
    const badges = ['🥉', '🥈', '🥇', '🏆', '👑'];
    return badges[Math.min(level - 1, badges.length - 1)];
  };

  return (
    <div className="goose-energy-meter">
      <div className="goose-header">
        <div className="goose-avatar">
          <span className="goose-emoji">{getGooseEmoji()}</span>
          <div className="goose-level-badge">{getLevelBadge()}</div>
        </div>
        <div className="goose-info">
          <h3 className="goose-title">FitGoose Energy</h3>
          <p className="goose-status">{getEnergyMessage()}</p>
        </div>
      </div>

      <div className="energy-bar-container">
        <div className="energy-bar-background">
          <div 
            className="energy-bar-fill"
            style={{ 
              width: `${animatedEnergy}%`,
              backgroundColor: getEnergyColor(),
              transition: 'width 0.5s ease-in-out'
            }}
          />
          <div className="energy-bar-glow" />
        </div>
        <div className="energy-percentage">
          {Math.round(animatedEnergy)}%
        </div>
      </div>

      <div className="energy-stats">
        <div className="stat-item">
          <span className="stat-label">Reps</span>
          <span className="stat-value">{currentRep}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Form</span>
          <span className={`stat-value ${isCorrectForm ? 'good' : 'needs-work'}`}>
            {isCorrectForm ? '✅' : '⚠️'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Mood</span>
          <span className="stat-value">{gooseState.mood}</span>
        </div>
      </div>

      {showBoost && (
        <div className="energy-boost-animation">
          <span className="boost-text">+Energy! ⚡</span>
        </div>
      )}

      {/* Achievement notifications */}
      {animatedEnergy >= 100 && (
        <div className="achievement-notification">
          <div className="achievement-content">
            <span className="achievement-icon">🏆</span>
            <span className="achievement-text">MAXIMUM ENERGY ACHIEVED!</span>
          </div>
        </div>
      )}
    </div>
  );
};
