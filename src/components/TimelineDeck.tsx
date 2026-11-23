import React, { useCallback, useRef, useState } from 'react';

interface TimelineDeckProps {
  enabled: boolean;
  currentStep: number;
  totalSteps: number;
  currentLabel: string;
  strokeCount: number;
  onJumpToStep: (step: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  isLooping: boolean;
  onToggleLoop: () => void;
  visible: boolean;
  onToggleVisible: () => void;
}

export const TimelineDeck: React.FC<TimelineDeckProps> = ({
  enabled,
  currentStep,
  totalSteps,
  currentLabel,
  strokeCount,
  onJumpToStep,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  isLooping,
  onToggleLoop,
  visible,
  onToggleVisible,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastClickStepRef = useRef<number>(currentStep);

  // Subtle mechanical micro-click sound feedback
  const playTactileClick = useCallback((pitch = 1) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440 * pitch, t);
      osc.frequency.exponentialRampToValueAtTime(70, t + 0.02);
      gain.gain.setValueAtTime(0.035, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.022);
    } catch {
      // Audio context unavailable or blocked
    }
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      if (val !== lastClickStepRef.current) {
        playTactileClick(1 + (val / Math.max(1, totalSteps)) * 0.5);
        lastClickStepRef.current = val;
      }
      onJumpToStep(val);
    }
  };

  const handleStepPrev = () => {
    if (canUndo) {
      playTactileClick(0.9);
      onUndo();
    }
  };

  const handleStepNext = () => {
    if (canRedo) {
      playTactileClick(1.2);
      onRedo();
    }
  };

  const handleJumpStart = () => {
    if (currentStep > 0) {
      playTactileClick(0.7);
      onJumpToStep(0);
    }
  };

  const handleJumpEnd = () => {
    if (currentStep < totalSteps) {
      playTactileClick(1.4);
      onJumpToStep(totalSteps);
    }
  };

  const cycleSpeed = () => {
    playTactileClick(1.1);
    if (speed === 0.5) onSpeedChange(1);
    else if (speed === 1) onSpeedChange(2);
    else if (speed === 2) onSpeedChange(4);
    else onSpeedChange(0.5);
  };

  if (!enabled) return null;

  if (!visible) {
    return (
      <button
        className="timeline-dock-pill"
        onClick={onToggleVisible}
        title="Open Timeline (T)"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>
          TIMELINE [ {currentStep}/{totalSteps} ]
        </span>
      </button>
    );
  }

  const progressPct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className={`timeline-deck ${isCollapsed ? 'collapsed' : ''}`} id="timeline-deck">
      {/* Header Row: Digital Readout & Action Controls (UX-04 unified label) */}
      <div className="timeline-header">
        <div className="val timeline-counter">
          STROKE {currentStep.toString().padStart(2, '0')} / {totalSteps.toString().padStart(2, '0')}
        </div>

        <div className="timeline-info-badge" title={currentLabel}>
          <span>{currentLabel.toUpperCase()}</span>
          <span className="timeline-info-sep">•</span>
          <span>{strokeCount} {strokeCount === 1 ? 'STROKE' : 'STROKES'}</span>
        </div>

        <div className="timeline-header-actions">
          <button
            className="timeline-action-btn"
            onClick={() => setIsCollapsed((v) => !v)}
            title={isCollapsed ? 'Expand Deck' : 'Collapse Deck'}
            aria-label="Collapse deck"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isCollapsed ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
          </button>
          <button
            className="timeline-action-btn close-btn"
            onClick={onToggleVisible}
            title="Hide Timeline (T)"
            aria-label="Close timeline"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="timeline-body">
          {/* Timeline Range Fader with Progress Fill */}
          <div className="timeline-track-wrapper">
            <div className="timeline-track-groove">
              <div
                className="timeline-track-fill"
                style={{ width: `${progressPct}%` }}
              />

              {totalSteps > 1 && totalSteps <= 60 && (
                <div className="timeline-ticks">
                  {Array.from({ length: totalSteps + 1 }).map((_, idx) => {
                    const pos = (idx / totalSteps) * 100;
                    const isPassed = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <span
                        key={idx}
                        className={`timeline-tick ${isPassed ? 'passed' : ''} ${
                          isCurrent ? 'current' : ''
                        }`}
                        style={{ left: `${pos}%` }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <input
              type="range"
              className="timeline-slider"
              min={0}
              max={totalSteps}
              step={1}
              value={currentStep}
              onChange={handleSliderChange}
              onPointerDown={() => {
                if (isPlaying) onTogglePlay();
              }}
              aria-label="Timeline History Step"
              title={`Step ${currentStep} of ${totalSteps} (${currentLabel})`}
            />
          </div>

          {/* Transport Controls Row */}
          <div className="timeline-transport-row">
            <div className="timeline-transport-controls">
              <button
                className="transport-btn"
                onClick={handleJumpStart}
                disabled={currentStep <= 0}
                title="Jump to Start (Home)"
                aria-label="Jump to start"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="3" height="16" rx="1" />
                  <polygon points="21,4 9,12 21,20" />
                </svg>
              </button>
              <button
                className="transport-btn"
                onClick={handleStepPrev}
                disabled={!canUndo}
                title="Step Backward (, or Left Arrow)"
                aria-label="Step backward"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="17,4 7,12 17,20" />
                </svg>
              </button>
              <button
                className={`transport-btn play-btn ${isPlaying ? 'active' : ''}`}
                onClick={() => {
                  playTactileClick(isPlaying ? 0.9 : 1.3);
                  onTogglePlay();
                }}
                disabled={totalSteps === 0}
                title={isPlaying ? 'Pause Replay (Space or K)' : 'Play Replay (Space or K)'}
                aria-label={isPlaying ? 'Pause replay' : 'Play replay'}
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="5" y="4" width="4.5" height="16" rx="1" />
                    <rect x="14.5" y="4" width="4.5" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="7,4 21,12 7,20" />
                  </svg>
                )}
              </button>
              <button
                className="transport-btn"
                onClick={handleStepNext}
                disabled={!canRedo}
                title="Step Forward (. or Right Arrow)"
                aria-label="Step forward"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="7,4 17,12 7,20" />
                </svg>
              </button>
              <button
                className="transport-btn"
                onClick={handleJumpEnd}
                disabled={currentStep >= totalSteps}
                title="Jump to End (End)"
                aria-label="Jump to end"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="3,4 15,12 3,20" />
                  <rect x="18" y="4" width="3" height="16" rx="1" />
                </svg>
              </button>
            </div>

            <div className="timeline-options">
              <button
                className="transport-pill-btn"
                onClick={cycleSpeed}
                title="Cycle Playback Speed (0.5x, 1x, 2x, 4x)"
              >
                SPEED: {speed}X
              </button>

              <button
                className={`transport-pill-btn ${isLooping ? 'active' : ''}`}
                onClick={() => {
                  playTactileClick(1.1);
                  onToggleLoop();
                }}
                title={isLooping ? 'Disable Loop' : 'Enable Loop'}
              >
                LOOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
