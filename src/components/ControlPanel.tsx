import React, { useEffect, useRef, useState } from 'react';
import { BrushParams, EraserMode, RefImageState, SymmetryMode, ToolMode, VibePreset } from '../types';
import { PAL, PARAM_DEFS, SYMMETRY_MODES } from '../constants/presets';
import { BaseStyle } from '../core/export';
import { SigilStyle } from '../core/sigilGenerator';
import { SliderRow } from './SliderRow';

const ChevronIcon: React.FC<{ className?: string }> = ({ className = 'deck-chevron' }) => (
  <svg
    className={className}
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

interface CollapsibleDeckProps {
  id: string;
  title: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleDeck: React.FC<CollapsibleDeckProps> = ({
  id,
  title,
  badge,
  headerAction,
  isCollapsed,
  onToggle,
  children,
}) => {
  return (
    <section className={`sidebar-deck ${isCollapsed ? 'is-collapsed' : ''}`} id={`deck-${id}`}>
      <div
        className="deck-header"
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-controls={`deck-body-${id}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className="deck-title">
          <ChevronIcon className="deck-chevron" />
          <span>{title}</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {badge && <span className="deck-badge">{badge}</span>}
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
        </div>
      </div>

      <div id={`deck-body-${id}`} className="deck-body" aria-hidden={isCollapsed}>
        <div className="deck-content">
          {children}
        </div>
      </div>
    </section>
  );
};

interface CollapsibleSubheadProps {
  id: string;
  title: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSubhead: React.FC<CollapsibleSubheadProps> = ({
  id,
  title,
  isCollapsed,
  onToggle,
  children,
}) => {
  return (
    <div className="collapsible-subhead-wrapper">
      <div
        className="deck-subhead clickable"
        role="button"
        tabIndex={0}
        aria-expanded={!isCollapsed}
        aria-controls={`subhead-body-${id}`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <ChevronIcon className={`subhead-chevron ${isCollapsed ? 'is-collapsed' : ''}`} />
        <span>{title}</span>
      </div>
      <div
        id={`subhead-body-${id}`}
        className={`subhead-body ${isCollapsed ? 'is-collapsed' : ''}`}
        aria-hidden={isCollapsed}
      >
        <div className="subhead-content">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ControlPanelProps {
  params: BrushParams;
  onParamChange: (key: string, value: number) => void;
  currentVibe: string;
  onVibeChange: (vibeName: string) => void;
  vibeData: VibePreset;

  // Symmetry
  symmetry: SymmetryMode;
  onSymmetryChange: (sym: SymmetryMode) => void;

  // Actions
  onUndo: () => void;
  onRedo?: () => void;
  canRedo?: boolean;
  onClear: () => void;
  onOpenShortcuts?: () => void;
  onOpenDocs?: () => void;
  videoSectionEnabled: boolean;
  onToggleVideoSection: () => void;
  onToggleCollapse?: () => void;

  // Comp FX Toggles
  glowEnabled: boolean;
  onToggleGlow: () => void;
  aberrationEnabled: boolean;
  onToggleAberration: () => void;
  noiseEnabled: boolean;
  onToggleNoise: () => void;

  // Reference Image
  refState: RefImageState;
  onLoadRefFile: (file: File) => void;
  onUpdateRef: (partial: Partial<RefImageState>) => void;
  onCenterRef: () => void;
  onClearRef: () => void;

  // Procedural Generator
  onGenerateSigil: (style?: SigilStyle) => void;
  onAddSpikes?: () => void;
  sigilStyle: SigilStyle;
  onSigilStyleChange: (style: SigilStyle) => void;

  // Tool & Eraser
  toolMode: ToolMode;
  onToolModeChange: (mode: ToolMode) => void;
  eraserSize: number;
  onEraserSizeChange: (size: number) => void;
  eraserMode: EraserMode;
  onEraserModeChange: (mode: EraserMode) => void;

  // Export
  onExportImage: (isTransparentPNG: boolean, aspect: string, res: number, framing: 'fit' | 'view') => void;
  onExport3D: (format: 'stl' | 'gltf', baseStyle: BaseStyle, gridRes: number) => void;
  exportStatus?: string;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamChange,
  currentVibe,
  onVibeChange,
  vibeData,
  symmetry,
  onSymmetryChange,
  onUndo,
  onRedo,
  canRedo = false,
  onClear,
  onOpenShortcuts,
  onOpenDocs,
  videoSectionEnabled,
  onToggleVideoSection,
  onToggleCollapse,
  glowEnabled,
  onToggleGlow,
  aberrationEnabled,
  onToggleAberration,
  noiseEnabled,
  onToggleNoise,
  refState,
  onLoadRefFile,
  onUpdateRef,
  onCenterRef,
  onClearRef,
  onExportImage,
  onExport3D,
  exportStatus,
  onGenerateSigil,
  onAddSpikes,
  sigilStyle,
  onSigilStyleChange,
  toolMode,
  onToolModeChange,
  eraserSize,
  onEraserSizeChange,
  eraserMode,
  onEraserModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'brush' | 'ref' | 'export'>('brush');
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [collapsedDecks, setCollapsedDecks] = useState<Record<string, boolean>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeMenu);
    return () => document.removeEventListener('pointerdown', closeMenu);
  }, [menuOpen]);

  const toggleDeck = (id: string) => {
    setCollapsedDecks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 1-Step confirmation for destructive Clear action (UX-03)
  const [clearConfirming, setClearConfirming] = useState<boolean>(false);
  const clearTimerRef = React.useRef<number | null>(null);

  const handleClearClick = () => {
    if (clearConfirming) {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
      setClearConfirming(false);
      onClear();
    } else {
      setClearConfirming(true);
      clearTimerRef.current = window.setTimeout(() => {
        setClearConfirming(false);
        clearTimerRef.current = null;
      }, 3500);
    }
  };

  // Export options state
  const [expAspect, setExpAspect] = useState<string>('1:1');
  const [expRes, setExpRes] = useState<number>(2048);
  const [expFraming, setExpFraming] = useState<'fit' | 'view'>('fit');
  const [exp3dBase, setExp3dBase] = useState<BaseStyle>('extruded');
  const [exp3dRes, setExp3dRes] = useState<number>(384);

  const brushDefs = PARAM_DEFS.filter((d) => d.category === 'brush');
  const chromeDefs = PARAM_DEFS.filter((d) => d.category === 'chrome');
  const compDefs = PARAM_DEFS.filter((d) => d.category === 'comp');

  return (
    <aside id="panel" className="sidebar panel-island" aria-label="Control Panel">
      {/* Pinned Top Header: Brand bar & Segmented Mode Switcher */}
      <div className="panel-header-section">
        <div className="panel-brand-bar">
          <div className="brand-logo" title="Y2K NEOTHORN Cybernetic Chrome Engine">
            <span className="brand-logo-text">Y2K NEOTHORN</span>
          </div>
          <div className="panel-brand-actions">
            <div className="main-menu-wrap" ref={menuRef}>
              <button
                className="shortcuts-icon-btn"
                onClick={() => setMenuOpen((open) => !open)}
                title="Main menu"
                aria-label="Main menu"
                aria-expanded={menuOpen}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
              {menuOpen && (
                <div className="main-menu-popover">
                  <div className="main-menu-title">Main Menu</div>
                  <label className="main-menu-option">
                    <span>
                      <strong>Video section</strong>
                      <small>Show the bottom timeline and playback controls</small>
                    </span>
                    <input type="checkbox" checked={videoSectionEnabled} onChange={onToggleVideoSection} />
                  </label>
                </div>
              )}
            </div>
            {onOpenDocs && (
              <button
                className="shortcuts-icon-btn docs-icon-btn"
                onClick={onOpenDocs}
                title="Parameter Field Manual & Interactive Lab (F1 or Shift+D)"
                aria-label="Parameter Documentation"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <line x1="9" y1="7" x2="15" y2="7" />
                  <line x1="9" y1="11" x2="15" y2="11" />
                </svg>
              </button>
            )}
            {onOpenShortcuts && (
              <button
                className="shortcuts-icon-btn"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (? or /)"
                aria-label="Keyboard Shortcuts"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M8 16h8" />
                </svg>
              </button>
            )}
            {onToggleCollapse && (
              <button
                className="sidebar-collapse-btn"
                onClick={onToggleCollapse}
                title="Hide Panel (Tab or P)"
                aria-label="Hide Panel"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Segmented Mode Switcher (UX-02) */}
        <div className="tab-bar segmented-control" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'brush'}
            className={`tab-btn ${activeTab === 'brush' ? 'active' : ''}`}
            onClick={() => setActiveTab('brush')}
          >
            Brush
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'ref'}
            className={`tab-btn ${activeTab === 'ref' ? 'active' : ''}`}
            onClick={() => setActiveTab('ref')}
          >
            Ref
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'export'}
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
        </div>
      </div>

      {/* Scrollable parameters & controls */}
      <div className="panel-scroll-content">

        {/* Tab 1: Brush (Merged Brush & Chrome) */}
        {activeTab === 'brush' && (
          <div id="tab-brush" className="tab-pane active">
            {/* Deck 1: Environment & Camera */}
            <CollapsibleDeck
              id="env"
              title="Environment & View"
              badge={vibeData?.badge || 'Y2K'}
              isCollapsed={!!collapsedDecks['env']}
              onToggle={() => toggleDeck('env')}
            >
              <div className="row">
                <label>Atmosphere / Vibe</label>
                <select
                  id="pal"
                  value={currentVibe}
                  onChange={(e) => onVibeChange(e.target.value)}
                  title="Select Cybernetic Lighting & Color Environment"
                >
                  {Object.entries(PAL).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name || key}
                    </option>
                  ))}
                </select>
              </div>

            </CollapsibleDeck>

            {/* Deck 2: Tool & Material Engine */}
            <CollapsibleDeck
              id="tool"
              title="Tool & Material"
              badge={toolMode.toUpperCase()}
              headerAction={
                onOpenDocs && (
                  <button
                    className="deck-action-pill"
                    onClick={onOpenDocs}
                    title="Open Parameter Docs & Interactive Lab"
                  >
                    Docs ↗
                  </button>
                )
              }
              isCollapsed={!!collapsedDecks['tool']}
              onToggle={() => toggleDeck('tool')}
            >
              {/* Tool Mode Switcher */}
              <div className="tool-selector">
                <button
                  className={`tool-btn ${toolMode === 'brush' ? 'is-active' : ''}`}
                  onClick={() => onToolModeChange('brush')}
                  title="Draw Liquid Chrome Strokes (Shortcut: B)"
                >
                  Brush
                </button>
                <button
                  className={`tool-btn ${toolMode === 'eraser' ? 'is-active' : ''}`}
                  onClick={() => onToolModeChange('eraser')}
                  title="Eraser Brush (Shortcut: E)"
                >
                  Eraser
                </button>
              </div>

              {toolMode === 'eraser' ? (
                <div id="rows-eraser">
                  <div className="deck-subhead">Eraser Parameters</div>
                  <div className="row">
                    <label>
                      Eraser Size <span>{Math.round(eraserSize)}px</span>
                    </label>
                    <input
                      type="range"
                      min="6"
                      max="120"
                      step="2"
                      value={eraserSize}
                      onChange={(e) => onEraserSizeChange(parseFloat(e.target.value))}
                    />
                  </div>

                  <div className="row">
                    <label>Eraser Mode</label>
                    <select
                      value={eraserMode}
                      onChange={(e) => onEraserModeChange(e.target.value as EraserMode)}
                    >
                      <option value="slice">Slice &amp; Carve (Split &amp; Taper)</option>
                      <option value="stroke">Whole Stroke (Delete on Touch)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <>
                  {/* Brush Geometry Parameters */}
                  <CollapsibleSubhead
                    id="brush-geo"
                    title="Brush Geometry"
                    isCollapsed={!!collapsedDecks['sub-brush-geo']}
                    onToggle={() => toggleDeck('sub-brush-geo')}
                  >
                    <div id="rows-brush">
                      {brushDefs.map((def) => (
                        <SliderRow
                          key={def.key}
                          def={def}
                          value={params[def.key]}
                          onChange={onParamChange}
                        />
                      ))}
                    </div>
                  </CollapsibleSubhead>

                  {/* Chrome Material Parameters */}
                  <CollapsibleSubhead
                    id="chrome-mat"
                    title="Chrome Material"
                    isCollapsed={!!collapsedDecks['sub-chrome-mat']}
                    onToggle={() => toggleDeck('sub-chrome-mat')}
                  >
                    <div id="rows-chrome">
                      {chromeDefs.map((def) => (
                        <SliderRow
                          key={def.key}
                          def={def}
                          value={params[def.key]}
                          onChange={onParamChange}
                        />
                      ))}
                    </div>
                  </CollapsibleSubhead>
                </>
              )}
            </CollapsibleDeck>

            {/* Deck 3: Symmetry & Procedural Sigils */}
            <CollapsibleDeck
              id="symmetry"
              title="Symmetry & Sigils"
              badge={symmetry !== 'None' ? symmetry.toUpperCase() : undefined}
              isCollapsed={!!collapsedDecks['symmetry']}
              onToggle={() => toggleDeck('symmetry')}
            >
              <div className="row">
                <label>Symmetry Plane</label>
                <select
                  id="sym"
                  value={symmetry}
                  onChange={(e) => onSymmetryChange(e.target.value as SymmetryMode)}
                >
                  {SYMMETRY_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              <div className="row">
                <label>Sigil Generator</label>
                <select
                  value={sigilStyle}
                  onChange={(e) => onSigilStyleChange(e.target.value as SigilStyle)}
                  title="Select Procedural Sigil Aesthetic"
                >
                  <option value="cyber-gothic">Cyber Gothic (Ribs &amp; Stinger)</option>
                  <option value="bio-mecha">Bio-Mecha (Fin Blades &amp; Barbs)</option>
                  <option value="radial-seal">Radial Seal (Occult Mandala)</option>
                  <option value="minimal-blade">Minimal Blade (Scythe Thorns)</option>
                </select>
              </div>

              <div className="buttons w" style={{ marginTop: 8, marginBottom: 0 }}>
                <button
                  id="btnRandomSigil"
                  onClick={() => onGenerateSigil(sigilStyle)}
                  title="Generate Procedural Sigil on Random Path with Spikes (Shortcut: R)"
                  style={{
                    background: 'linear-gradient(180deg, #443763 0%, #2b2145 48%, #1c1530 52%, #241a3d 100%)',
                    borderTopColor: '#a183fa',
                    color: '#ece4ff',
                  }}
                >
                  Random Sigil
                </button>
                {onAddSpikes && (
                  <button
                    id="btnAddSpikes"
                    onClick={onAddSpikes}
                    title="Attach Thorn Spikes to Most Recent Stroke (Shortcut: Shift+R)"
                  >
                    Add Spikes
                  </button>
                )}
              </div>
            </CollapsibleDeck>

            {/* Deck 4: Canvas History & Actions */}
            <CollapsibleDeck
              id="history"
              title="Canvas History"
              isCollapsed={!!collapsedDecks['history']}
              onToggle={() => toggleDeck('history')}
            >
              <div className="buttons history-actions" style={{ marginTop: 0 }}>
                <div className="undo-redo-group">
                  <button id="undo" onClick={onUndo} title="Undo Stroke (Ctrl+Z)">
                    Undo
                  </button>
                  {onRedo && (
                    <button
                      id="redo"
                      onClick={onRedo}
                      title="Redo Stroke (Ctrl+Shift+Z / Ctrl+Y)"
                      disabled={!canRedo}
                      style={{ opacity: canRedo ? 1 : 0.4 }}
                    >
                      Redo
                    </button>
                  )}
                </div>
                <button
                  id="clear"
                  className={`clear-btn ${clearConfirming ? 'confirming' : ''}`}
                  onClick={handleClearClick}
                  title={clearConfirming ? 'Click again to confirm wipe canvas' : 'Clear Canvas (Shift+C)'}
                >
                  {clearConfirming ? 'Confirm?' : 'Clear'}
                </button>
              </div>
            </CollapsibleDeck>
          </div>
        )}

        {/* Tab 2: Ref */}
        {activeTab === 'ref' && (
          <div id="tab-ref" className="tab-pane active">
            <CollapsibleDeck
              id="ref"
              title="Reference Tracing"
              headerAction={
                <button
                  id="btnLoadRef"
                  className="ref-btn-add"
                  onClick={() => fileInputRef.current?.click()}
                  title="Load Image to Trace (⌘V / Ctrl+V)"
                >
                  + Image
                </button>
              }
              isCollapsed={!!collapsedDecks['ref']}
              onToggle={() => toggleDeck('ref')}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files?.[0]) onLoadRefFile(e.target.files[0]);
                }}
              />

              {refState.src ? (
                <div id="refControls">
                  <div className="row">
                    <label>
                      Ref Opacity <span>{Math.round(refState.opacity * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={refState.opacity}
                      onChange={(e) =>
                        onUpdateRef({ opacity: parseFloat(e.target.value) })
                      }
                    />
                  </div>

                  <div className="row">
                    <label>
                      Ref Scale <span>{refState.scale.toFixed(2)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.2"
                      max="3"
                      step="0.05"
                      value={refState.scale}
                      onChange={(e) =>
                        onUpdateRef({ scale: parseFloat(e.target.value) })
                      }
                    />
                  </div>

                  <div className="row" style={{ marginBottom: 14 }}>
                    <label>Ref Blend</label>
                    <select
                      value={refState.blend}
                      onChange={(e) =>
                        onUpdateRef({
                          blend: e.target.value as 'normal' | 'screen' | 'multiply',
                        })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="screen">Screen (Dark BG)</option>
                      <option value="multiply">Multiply (Light BG)</option>
                    </select>
                  </div>

                  <div className="buttons w" style={{ marginTop: 0 }}>
                    <button onClick={onCenterRef}>Center</button>
                    <button
                      onClick={() => onUpdateRef({ visible: !refState.visible })}
                    >
                      {refState.visible ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={onClearRef}>Remove</button>
                  </div>
                </div>
              ) : (
                <div
                  id="refEmptyHint"
                  style={{
                    fontSize: 11,
                    color: '#8b97ae',
                    lineHeight: 1.55,
                    padding: '8px 2px',
                  }}
                >
                  Paste an image from clipboard (⌘V / Ctrl+V), drag &amp; drop onto canvas, or click{' '}
                  <strong style={{ color: 'var(--accent)' }}>+ Image</strong> to trace existing sigils.
                </div>
              )}
            </CollapsibleDeck>
          </div>
        )}

        {/* Tab 3: Export (Merged with Comp Post-FX) */}
        {activeTab === 'export' && (
          <div id="tab-export" className="tab-pane active">
            {/* Deck 1: Post-Processing & Comp FX */}
            <CollapsibleDeck
              id="postFx"
              title="Post-FX & Comp"
              isCollapsed={!!collapsedDecks['postFx']}
              onToggle={() => toggleDeck('postFx')}
            >
              <div className="buttons w" style={{ marginTop: 0, marginBottom: 14 }}>
                <button
                  id="bCompGlow"
                  className={glowEnabled ? 'is-active' : ''}
                  onClick={onToggleGlow}
                  title="Toggle Star Glow post-process filter (G)"
                >
                  {`Glow: ${glowEnabled ? 'on' : 'off'}`}
                </button>
                <button
                  id="bCompAb"
                  className={aberrationEnabled ? 'is-active' : ''}
                  onClick={onToggleAberration}
                  title="Toggle Chromatic Aberration filter"
                >
                  {`Aberration: ${aberrationEnabled ? 'on' : 'off'}`}
                </button>
                <button
                  id="bCompNoise"
                  className={noiseEnabled ? 'is-active' : ''}
                  onClick={onToggleNoise}
                  title="Toggle Film Grain & Analog Noise DOM overlay"
                >
                  {`Noise: ${noiseEnabled ? 'on' : 'off'}`}
                </button>
              </div>

              <div id="rows-comp">
                {compDefs.map((def) => {
                  const isEnabled =
                    def.key === 'glow'
                      ? glowEnabled
                      : def.key === 'aberration'
                        ? aberrationEnabled
                        : def.key === 'noise'
                          ? noiseEnabled
                          : true;
                  return (
                    <div
                      key={def.key}
                      style={{
                        opacity: isEnabled ? 1 : 0.4,
                        pointerEvents: isEnabled ? 'auto' : 'none',
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      <SliderRow
                        def={def}
                        value={params[def.key]}
                        onChange={onParamChange}
                      />
                    </div>
                  );
                })}
              </div>
            </CollapsibleDeck>

            {/* Deck 2: Image Export */}
            <CollapsibleDeck
              id="imageExport"
              title="Image Export"
              badge={expAspect}
              isCollapsed={!!collapsedDecks['imageExport']}
              onToggle={() => toggleDeck('imageExport')}
            >
              <div className="row">
                <label>Aspect Ratio</label>
                <select
                  value={expAspect}
                  onChange={(e) => setExpAspect(e.target.value)}
                >
                  <option value="1:1">1:1 Square (2048x2048)</option>
                  <option value="4:5">4:5 Portrait (1638x2048)</option>
                  <option value="9:16">9:16 Story / Reels (1152x2048)</option>
                  <option value="16:9">16:9 Landscape (2048x1152)</option>
                  <option value="4:3">4:3 Classic (2048x1536)</option>
                  <option value="auto">Viewport / Screen View</option>
                </select>
              </div>

              <div className="row">
                <label>Resolution</label>
                <select
                  value={expRes}
                  onChange={(e) => setExpRes(parseInt(e.target.value, 10))}
                >
                  <option value="2048">Ultra HD (2048px)</option>
                  <option value="1536">High Res (1536px)</option>
                  <option value="1024">Standard (1024px)</option>
                </select>
              </div>

              <div className="row">
                <label>Framing</label>
                <select
                  value={expFraming}
                  onChange={(e) => setExpFraming(e.target.value as 'fit' | 'view')}
                >
                  <option value="fit">Auto Fit (Centered)</option>
                  <option value="view">Current Viewport</option>
                </select>
              </div>

              <div className="buttons w" style={{ marginTop: 8, marginBottom: 8 }}>
                <button
                  className="export-btn export-btn-accent"
                  onClick={() => onExportImage(true, expAspect, expRes, expFraming)}
                >
                  PNG (Alpha)
                </button>
                <button
                  className="export-btn"
                  onClick={() => onExportImage(false, expAspect, expRes, expFraming)}
                >
                  JPEG (Full Art)
                </button>
              </div>
              <div className="export-hint">
                PNG exports isolated chrome object with alpha transparency. JPEG includes active vibe background, star flares, and analog film grain.
              </div>
            </CollapsibleDeck>

            {/* Deck 3: 3D Model & Print */}
            <CollapsibleDeck
              id="meshExport"
              title="3D Model & Print"
              isCollapsed={!!collapsedDecks['meshExport']}
              onToggle={() => toggleDeck('meshExport')}
            >
              <div className="row">
                <label>3D Style</label>
                <select
                  value={exp3dBase}
                  onChange={(e) => setExp3dBase(e.target.value as BaseStyle)}
                >
                  <option value="extruded">Extruded Sigil (Flat SVG/PNG Style - No Brim)</option>
                  <option value="sigil">Chiseled 3D Sigil (Sculpted Relief - No Brim)</option>
                  <option value="sigil-surface">Chiseled Surface (Mesh Only - No Brim)</option>
                  <option value="solid">Solid Plinth (With Base Block)</option>
                  <option value="surface">Relief Surface (With Base Grid)</option>
                </select>
              </div>

              <div className="row">
                <label>Mesh Density</label>
                <select
                  value={exp3dRes}
                  onChange={(e) => setExp3dRes(parseInt(e.target.value, 10))}
                >
                  <option value="384">Ultra Detail (384x384 - Recommended)</option>
                  <option value="512">Master HD (512x512)</option>
                  <option value="256">Standard (256x256)</option>
                  <option value="180">Draft (180x180)</option>
                </select>
              </div>

              <div className="buttons w" style={{ marginTop: 8, marginBottom: 8 }}>
                <button
                  className="export-btn export-btn-accent"
                  onClick={() => onExport3D('stl', exp3dBase, exp3dRes)}
                >
                  STL (.stl 3D Print)
                </button>
                <button
                  className="export-btn"
                  onClick={() => onExport3D('gltf', exp3dBase, exp3dRes)}
                >
                  GLTF (.glb PBR)
                </button>
              </div>
              <div className="export-hint">
                "Extruded Sigil" produces a clean, flat 3D solid from the exact vector stroke silhouette (like extruding an SVG/PNG), with vertical walls and zero support brim.
              </div>

              {exportStatus && <div className="export-status">{exportStatus}</div>}
            </CollapsibleDeck>
          </div>
        )}

        <div className="hint">
          Drag to draw. Pinch or scroll wheel to zoom. Hold Spacebar to pan. Paste (⌘V) or load a reference image to trace sigils. Pen pressure changes thickness. Ctrl/Cmd+Z to undo.
        </div>
      </div>
    </aside>
  );
};
