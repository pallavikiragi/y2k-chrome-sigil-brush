import React from 'react';

interface GlobalToolsDockProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  erasing: boolean;
  onToggleErase: () => void;
  animationOn: boolean;
  onToggleAnimation: () => void;
  mode3d: boolean;
  onToggle3D: () => void;
  orbitOn: boolean;
  onToggleOrbit: () => void;
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  panMode: boolean;
  onTogglePan: () => void;
  timelineVisible: boolean;
}

interface DockButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const DockButton: React.FC<DockButtonProps> = ({
  label,
  active,
  disabled = false,
  onClick,
  children,
}) => (
  <button
    type="button"
    className={`global-tools-button${active ? ' is-active' : ''}`}
    aria-label={label}
    aria-pressed={active}
    title={label}
    disabled={disabled}
    onClick={onClick}
  >
    {children}
  </button>
);

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    aria-hidden="true"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

export const GlobalToolsDock: React.FC<GlobalToolsDockProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  erasing,
  onToggleErase,
  animationOn,
  onToggleAnimation,
  mode3d,
  onToggle3D,
  orbitOn,
  onToggleOrbit,
  zoomScale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  panMode,
  onTogglePan,
  timelineVisible,
}) => (
  <div
    className={`global-tools-dock${timelineVisible ? ' timeline-visible' : ''}`}
    role="toolbar"
    aria-label="Global canvas controls"
  >
    <div className="global-tools-row" role="group" aria-label="Canvas actions">
      <DockButton label="Undo" disabled={!canUndo} onClick={onUndo}>
        <Icon><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-2" /></Icon>
      </DockButton>
      <DockButton label="Redo" disabled={!canRedo} onClick={onRedo}>
        <Icon><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h2" /></Icon>
      </DockButton>
      <DockButton label="Toggle eraser tool" active={erasing} onClick={onToggleErase}>
        <Icon><path d="m7 21 10.8-10.8a2.8 2.8 0 0 0-4-4L3 17l4 4Z" /><path d="m12 8 4 4" /><path d="M3 17h11" /></Icon>
      </DockButton>
      <DockButton label={`Animation ${animationOn ? 'on' : 'off'}`} active={animationOn} onClick={onToggleAnimation}>
        <Icon><path d="M12 3v3" /><path d="M12 18v3" /><path d="m4.2 4.2 2.1 2.1" /><path d="m17.7 17.7 2.1 2.1" /><path d="M3 12h3" /><path d="M18 12h3" /><path d="m4.2 19.8 2.1-2.1" /><path d="m17.7 6.3 2.1-2.1" /><circle cx="12" cy="12" r="4" /></Icon>
      </DockButton>
      <DockButton label={`3D view ${mode3d ? 'on' : 'off'}`} active={mode3d} onClick={onToggle3D}>
        <Icon><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.3 7.6 7.7 4.5 7.7-4.5" /><path d="M12 12v9" /></Icon>
      </DockButton>
      <DockButton
        label={`Auto orbit ${orbitOn ? 'on' : 'off'}`}
        active={orbitOn}
        disabled={!mode3d}
        onClick={onToggleOrbit}
      >
        <Icon><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-30 12 12)" /><circle cx="12" cy="12" r="2" /><circle cx="19.3" cy="7.5" r="1" fill="currentColor" stroke="none" /></Icon>
      </DockButton>
    </div>
    <div className="global-tools-row viewport-tools" role="group" aria-label="Viewport controls">
      <DockButton label="Zoom out" onClick={onZoomOut}>
        <Icon><circle cx="10.8" cy="10.8" r="6.8" /><path d="M16 16l5 5M7.8 10.8h6" /></Icon>
      </DockButton>
      <span className="global-tools-zoom" aria-label={`Zoom ${Math.round(zoomScale * 100)} percent`}>
        {Math.round(zoomScale * 100)}%
      </span>
      <DockButton label="Zoom in" onClick={onZoomIn}>
        <Icon><circle cx="10.8" cy="10.8" r="6.8" /><path d="M16 16l5 5M7.8 10.8h6M10.8 7.8v6" /></Icon>
      </DockButton>
      <DockButton label="Reset viewport" onClick={onZoomReset}>
        <Icon><path d="M4 9V4h5" /><path d="M4.5 8a8 8 0 1 1-.2 7" /><path d="M8 12h8" /></Icon>
      </DockButton>
      <DockButton label="Toggle pan tool" active={panMode} onClick={onTogglePan}>
        <Icon><path d="M12 3v18M3 12h18" /><path d="m8 7 4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4" /></Icon>
      </DockButton>
    </div>
  </div>
);
