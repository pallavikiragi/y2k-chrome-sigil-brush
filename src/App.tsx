import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BrushParams,
  EraserMode,
  HistoryStep,
  RefImageState,
  Stroke,
  SymmetryMode,
  ToolMode,
  ViewTransform,
} from './types';
import { DEFAULT_PARAMS, LIVE_PARAM_KEYS, PAL, SYMMETRY_MODES } from './constants/presets';
import { RenderPipeline } from './core/renderPipeline';
import { CanvasStage } from './components/CanvasStage';
import { ControlPanel } from './components/ControlPanel';
import { GlobalToolsDock } from './components/GlobalToolsDock';
import { TimelineDeck } from './components/TimelineDeck';
import { NoiseOverlay } from './components/NoiseOverlay';
import { ShortcutsModal } from './components/ShortcutsModal';
import { DocsModal } from './components/DocsModal';
import { BaseStyle, export3DModel, exportImage } from './core/export';
import { buildStrokeMesh } from './core/geometry';
import {
  addSpikesToExistingStroke,
  generateRandomSigil,
  SigilStyle,
} from './core/sigilGenerator';

export const App: React.FC = () => {
  const [currentVibe, setCurrentVibe] = useState<string>('Black Mercury');
  const [params, setParams] = useState<BrushParams>(() => {
    const initialVibe = PAL['Black Mercury'] || PAL['Pink K-Pop'];
    return {
      ...DEFAULT_PARAMS,
      ...(initialVibe.params || {}),
    };
  });

  const [symmetry, setSymmetry] = useState<SymmetryMode>('None');
  const [panMode, setPanMode] = useState<boolean>(false);
  const [animOn, setAnimOn] = useState<boolean>(true);
  const [mode3d, setMode3d] = useState<boolean>(false);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [glowEnabled, setGlowEnabled] = useState<boolean>(true);
  const [aberrationEnabled, setAberrationEnabled] = useState<boolean>(true);
  const [noiseEnabled, setNoiseEnabled] = useState<boolean>(false);
  const [exportStatus, setExportStatus] = useState<string>('');
  const [sigilStyle, setSigilStyle] = useState<SigilStyle>('cyber-gothic');
  const [toolMode, setToolMode] = useState<ToolMode>('brush');
  const [eraserSize, setEraserSize] = useState<number>(28);
  const [eraserMode, setEraserMode] = useState<EraserMode>('slice');

  const [panelVisible, setPanelVisible] = useState<boolean>(true);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [docsModalOpen, setDocsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const toastTimerRef = useRef<number | null>(null);

  const [view, setView] = useState<ViewTransform>({ scale: 1, x: 0, y: 0 });
  const [refState, setRefState] = useState<RefImageState>({
    src: '',
    naturalW: 0,
    naturalH: 0,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    scale: 1,
    opacity: 0.4,
    blend: 'normal',
    visible: true,
  });

  const pipelineRef = useRef<RenderPipeline | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const undoStackRef = useRef<HistoryStep[]>([]);
  const redoStackRef = useRef<HistoryStep[]>([]);
  const [canRedo, setCanRedo] = useState<boolean>(false);

  // Skeuomorphic Timeline Deck State
  const [videoSectionEnabled, setVideoSectionEnabled] = useState<boolean>(true);
  const [timelineVisible, setTimelineVisible] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<number>(1);
  const [isLooping, setIsLooping] = useState<boolean>(false);
  const [historyState, setHistoryState] = useState<{
    currentStep: number;
    totalSteps: number;
    strokeCount: number;
    currentLabel: string;
  }>({
    currentStep: 0,
    totalSteps: 0,
    strokeCount: 0,
    currentLabel: 'Initial Canvas',
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 1200);
  }, []);

  const handleToggleAnimation = useCallback(() => {
    setAnimOn((value) => {
      showToast(`Animation: ${value ? 'Off' : 'On'}`);
      return !value;
    });
  }, [showToast]);

  const handleToggle3D = useCallback(() => {
    setMode3d((value) => {
      showToast(`3D View: ${value ? 'Off' : 'On'}`);
      return !value;
    });
  }, [showToast]);

  const handleToggleOrbit = useCallback(() => {
    setAutoOrbit((value) => {
      showToast(`Auto Orbit: ${value ? 'Off' : 'On'}`);
      return !value;
    });
  }, [showToast]);

  const handleTogglePanMode = useCallback(() => {
    setPanMode((value) => {
      showToast(`Pan Tool: ${value ? 'Off' : 'On'}`);
      return !value;
    });
  }, [showToast]);

  const handleToggleEraser = useCallback(() => {
    setToolMode((value) => {
      const next = value === 'eraser' ? 'brush' : 'eraser';
      showToast(next === 'eraser' ? 'Tool: Eraser (E)' : 'Tool: Brush (E)');
      return next;
    });
  }, [showToast]);

  // Update theme colors and CSS variables
  const activeVibe = PAL[currentVibe] || PAL['Black Mercury'] || PAL['Pink K-Pop'];
  (window as any).__ACTIVE_VIBE__ = activeVibe;

  const applyVibeStyles = useCallback((vibeName: string) => {
    const pData = PAL[vibeName];
    if (!pData) return;
    const t = pData.theme || {};
    const rootStyle = document.documentElement.style;
    if (t.accent) rootStyle.setProperty('--accent', t.accent);
    if (t.accentGlow) rootStyle.setProperty('--accent-glow', t.accentGlow);
    if (t.accentTrack) rootStyle.setProperty('--accent-track', t.accentTrack);
    if (t.accentAmbient) rootStyle.setProperty('--accent-ambient', t.accentAmbient);
    if (t.bg) {
      rootStyle.setProperty('--bg', t.bg);
      document.body.style.backgroundColor = t.bg;
    }
    if (t.panelBg) rootStyle.setProperty('--panel-bg', t.panelBg);
    if (t.panelBorder) rootStyle.setProperty('--panel-border', t.panelBorder);
    if (t.panelBorderTop) rootStyle.setProperty('--panel-border-top', t.panelBorderTop);
    if (t.readoutColor) rootStyle.setProperty('--readout-color', t.readoutColor);
    if (t.readoutBg) rootStyle.setProperty('--readout-bg', t.readoutBg);
    if (t.tabActiveBg) rootStyle.setProperty('--tab-active-bg', t.tabActiveBg);
    if (t.tabBorderTop) rootStyle.setProperty('--tab-border-top', t.tabBorderTop);
    if (t.toggleActiveBg) rootStyle.setProperty('--toggle-active-bg', t.toggleActiveBg);

    if (t.accent) {
      const hex = t.accent.replace('#', '');
      const arrow = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${hex}' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") no-repeat calc(100% - 10px) center, linear-gradient(180deg, #282f3c 0%, #1c212c 50%, #131721 100%)`;
      document.querySelectorAll('select').forEach((s) => ((s as HTMLElement).style.background = arrow));
    }

    if (pipelineRef.current) {
      pipelineRef.current.applyTheme(pData);
    }
  }, []);

  const handleVibeChange = useCallback((vibeName: string) => {
    if (!PAL[vibeName]) return;
    setCurrentVibe(vibeName);
    const pData = PAL[vibeName];
    setParams((prev) => ({
      ...prev,
      ...(pData.params || {}),
    }));
    applyVibeStyles(vibeName);
    showToast(`Vibe: ${vibeName}`);
  }, [applyVibeStyles, showToast]);

  useEffect(() => {
    applyVibeStyles(currentVibe);
  }, [currentVibe, applyVibeStyles]);

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => {
      const next = { ...prev, [key]: value };
      if (!LIVE_PARAM_KEYS.has(key as keyof BrushParams) && pipelineRef.current) {
        pipelineRef.current.dirty = true;
      }
      return next;
    });
  };

  // Skeuomorphic History Sync & Scrubbing Engine
  const syncHistoryState = useCallback(() => {
    const cur = undoStackRef.current.length;
    const total = undoStackRef.current.length + redoStackRef.current.length;
    const lastStep = cur > 0 ? undoStackRef.current[cur - 1] : null;
    const currentLabel =
      lastStep?.label || (cur === 0 ? 'Initial Canvas' : `Step #${cur}`);
    setHistoryState({
      currentStep: cur,
      totalSteps: total,
      strokeCount: strokesRef.current.length,
      currentLabel,
    });
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const handleJumpToStep = useCallback(
    (targetStep: number) => {
      if (!pipelineRef.current) return;
      const total = undoStackRef.current.length + redoStackRef.current.length;
      const clamped = Math.max(0, Math.min(total, Math.round(targetStep)));
      const current = undoStackRef.current.length;
      if (clamped === current) return;

      if (clamped < current) {
        // Undo (current - clamped) steps
        const count = current - clamped;
        for (let i = 0; i < count; i++) {
          const step = undoStackRef.current.pop();
          if (!step) break;
          redoStackRef.current.push(step);

          // Revert added strokes
          step.added.forEach((s) => {
            if (s.group) {
              pipelineRef.current?.root.remove(s.group);
            }
            const idx = strokesRef.current.indexOf(s);
            if (idx !== -1) strokesRef.current.splice(idx, 1);
          });

          // Restore removed strokes
          step.removed.forEach((s) => {
            if (!s.group) {
              buildStrokeMesh(
                pipelineRef.current!,
                s,
                window.innerWidth,
                window.innerHeight,
                false
              );
            } else {
              pipelineRef.current?.root.add(s.group);
            }
            if (!strokesRef.current.includes(s)) {
              strokesRef.current.push(s);
            }
          });
        }
      } else {
        // Redo (clamped - current) steps
        const count = clamped - current;
        for (let i = 0; i < count; i++) {
          const step = redoStackRef.current.pop();
          if (!step) break;
          undoStackRef.current.push(step);

          // Re-remove removed strokes
          step.removed.forEach((s) => {
            if (s.group) {
              pipelineRef.current?.root.remove(s.group);
            }
            const idx = strokesRef.current.indexOf(s);
            if (idx !== -1) strokesRef.current.splice(idx, 1);
          });

          // Re-add added strokes
          step.added.forEach((s) => {
            if (!s.group) {
              buildStrokeMesh(
                pipelineRef.current!,
                s,
                window.innerWidth,
                window.innerHeight,
                false
              );
            } else {
              pipelineRef.current?.root.add(s.group);
            }
            if (!strokesRef.current.includes(s)) {
              strokesRef.current.push(s);
            }
          });
        }
      }

      pipelineRef.current.dirty = true;
      syncHistoryState();
    },
    [syncHistoryState]
  );

  const handleUndo = useCallback(() => {
    if (!pipelineRef.current || undoStackRef.current.length === 0) return;
    setIsPlaying(false);
    handleJumpToStep(undoStackRef.current.length - 1);
    showToast('Undo');
  }, [handleJumpToStep, showToast]);

  const handleRedo = useCallback(() => {
    if (!pipelineRef.current || redoStackRef.current.length === 0) return;
    setIsPlaying(false);
    handleJumpToStep(undoStackRef.current.length + 1);
    showToast('Redo');
  }, [handleJumpToStep, showToast]);

  const handleStrokeAdded = useCallback(
    (stroke: Stroke) => {
      setIsPlaying(false);
      redoStackRef.current.forEach((step) => {
        step.added.forEach((s) => s.group?.traverse((o: any) => o.geometry?.dispose()));
      });
      redoStackRef.current = [];
      const num = undoStackRef.current.length + 1;
      undoStackRef.current.push({
        added: [stroke],
        removed: [],
        label: `Stroke #${num}`,
      });
      syncHistoryState();
    },
    [syncHistoryState]
  );

  const handleErasePerformed = useCallback(
    (removed: Stroke[], added: Stroke[]) => {
      setIsPlaying(false);
      redoStackRef.current.forEach((step) => {
        step.added.forEach((s) => s.group?.traverse((o: any) => o.geometry?.dispose()));
      });
      redoStackRef.current = [];
      undoStackRef.current.push({
        added,
        removed,
        label: 'Eraser Cut',
      });
      syncHistoryState();
    },
    [syncHistoryState]
  );

  const handleClear = useCallback(() => {
    if (!pipelineRef.current || strokesRef.current.length === 0) return;
    setIsPlaying(false);
    const removed = strokesRef.current.splice(0);
    removed.forEach((s) => {
      if (s.group) {
        pipelineRef.current?.root.remove(s.group);
      }
    });
    undoStackRef.current.push({
      added: [],
      removed,
      label: 'Clear Canvas',
    });
    redoStackRef.current = [];
    pipelineRef.current.dirty = true;
    syncHistoryState();
    showToast('Canvas Cleared');
  }, [showToast, syncHistoryState]);

  const handleTogglePlay = useCallback(() => {
    const total = undoStackRef.current.length + redoStackRef.current.length;
    if (total === 0) {
      showToast('Draw strokes first to replay');
      return;
    }
    setIsPlaying((prev) => {
      if (!prev) {
        if (undoStackRef.current.length >= total) {
          handleJumpToStep(0);
        }
        showToast('Replay Started (Space / K)');
        return true;
      } else {
        showToast('Replay Paused');
        return false;
      }
    });
  }, [handleJumpToStep, showToast]);

  // Replay animation ticker
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.round(320 / replaySpeed);
    const timer = setInterval(() => {
      const cur = undoStackRef.current.length;
      const total = undoStackRef.current.length + redoStackRef.current.length;
      if (cur < total) {
        handleJumpToStep(cur + 1);
      } else {
        if (isLooping && total > 0) {
          handleJumpToStep(0);
        } else {
          setIsPlaying(false);
        }
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, replaySpeed, isLooping, handleJumpToStep]);

  // Procedural Sigil Generation on Random Path with Spikes
  const handleGenerateSigil = useCallback(
    (style?: SigilStyle) => {
      if (!pipelineRef.current) return;

      // 1. Move existing strokes to undo stack so generation is undoable
      const removed = strokesRef.current.splice(0);
      removed.forEach((s) => {
        if (s.group) {
          pipelineRef.current?.root.remove(s.group);
        }
      });

      // 2. Compute center & scale
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const scale = Math.min(cx, cy) * 0.72;

      const chosenStyle = style || sigilStyle;

      // 3. Choose suitable symmetry
      let activeSym = symmetry;
      if (chosenStyle === 'radial-seal') {
        if (!activeSym.startsWith('Radial')) {
          activeSym = 'Radial 4';
          setSymmetry('Radial 4');
        }
      } else if (activeSym === 'None') {
        activeSym = 'Mirror X';
        setSymmetry('Mirror X');
      }

      // 4. Generate sigil strokes
      const generated = generateRandomSigil({
        center: { x: cx, y: cy },
        scale,
        symmetry: activeSym,
        style: chosenStyle,
        spikeDensity: 0.75,
        spikeLength: 1.05,
        brushParams: params,
      });

      // 5. Build 3D Three.js meshes
      generated.forEach((s) => {
        buildStrokeMesh(
          pipelineRef.current!,
          s,
          window.innerWidth,
          window.innerHeight,
          false
        );
      });

      const styleNames: Record<SigilStyle, string> = {
        'cyber-gothic': 'Cyber Gothic',
        'bio-mecha': 'Bio-Mecha',
        'radial-seal': 'Radial Seal',
        'minimal-blade': 'Minimal Blade',
      };

      setIsPlaying(false);
      strokesRef.current.push(...generated);
      undoStackRef.current.push({
        added: generated,
        removed,
        label: `Sigil (${styleNames[chosenStyle]})`,
      });
      redoStackRef.current = [];
      pipelineRef.current.dirty = true;
      syncHistoryState();

      showToast(`✨ Generated ${styleNames[chosenStyle]} Sigil`);
    },
    [params, symmetry, sigilStyle, showToast, syncHistoryState]
  );

  const handleAddSpikes = useCallback(() => {
    if (!pipelineRef.current || strokesRef.current.length === 0) {
      showToast('Draw a stroke first to attach spikes');
      return;
    }
    const last = strokesRef.current[strokesRef.current.length - 1];
    const newSpikes = addSpikesToExistingStroke(last, 6, 1.15);
    if (newSpikes.length === 0) {
      showToast('Could not attach spikes to stroke');
      return;
    }

    setIsPlaying(false);
    newSpikes.forEach((s) => {
      buildStrokeMesh(
        pipelineRef.current!,
        s,
        window.innerWidth,
        window.innerHeight,
        false
      );
    });

    strokesRef.current.push(...newSpikes);
    undoStackRef.current.push({
      added: newSpikes,
      removed: [],
      label: 'Attached Spikes',
    });
    redoStackRef.current = [];
    pipelineRef.current.dirty = true;
    syncHistoryState();
    showToast('⚡ Attached Spikes to Stroke');
  }, [showToast, syncHistoryState]);

  // Zoom controls
  const handleZoom = useCallback((factor: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    setView((v) => {
      const newScale = Math.max(0.2, Math.min(6.0, +(v.scale * factor).toFixed(3)));
      const ratio = newScale / v.scale;
      const nextView = {
        scale: newScale,
        x: cx - (cx - v.x) * ratio,
        y: cy - (cy - v.y) * ratio,
      };
      pipelineRef.current?.applyViewTransform(nextView);
      showToast(`Zoom: ${Math.round(newScale * 100)}%`);
      return nextView;
    });
  }, [showToast]);

  const handleZoomReset = useCallback(() => {
    const nextView = { scale: 1, x: 0, y: 0 };
    setView(nextView);
    pipelineRef.current?.applyViewTransform(nextView);
    showToast('Zoom Reset: 100%');
  }, [showToast]);

  // Pan Nudge controls
  const handlePanNudge = useCallback((dx: number, dy: number) => {
    setView((v) => {
      const nextView = { ...v, x: v.x + dx, y: v.y + dy };
      pipelineRef.current?.applyViewTransform(nextView);
      return nextView;
    });
  }, []);

  // Brush width nudge
  const handleBrushWidthNudge = useCallback((delta: number) => {
    setParams((prev) => {
      const newWidth = Math.max(1, Math.min(80, +(prev.width + delta).toFixed(1)));
      showToast(`Brush Width: ${newWidth}px`);
      return { ...prev, width: newWidth };
    });
  }, [showToast]);

  // Symmetry cycling
  const handleCycleSymmetry = useCallback(() => {
    setSymmetry((cur) => {
      const idx = SYMMETRY_MODES.indexOf(cur);
      const next = SYMMETRY_MODES[(idx + 1) % SYMMETRY_MODES.length];
      showToast(`Symmetry: ${next}`);
      return next;
    });
  }, [showToast]);

  // Vibe cycling
  const handleCycleVibe = useCallback((reverse: boolean = false) => {
    const keys = Object.keys(PAL);
    setCurrentVibe((cur) => {
      const idx = keys.indexOf(cur);
      const nextIdx = reverse
        ? (idx - 1 + keys.length) % keys.length
        : (idx + 1) % keys.length;
      const nextKey = keys[nextIdx];
      const pData = PAL[nextKey];
      setParams((prev) => ({
        ...prev,
        ...(pData.params || {}),
      }));
      applyVibeStyles(nextKey);
      showToast(`Vibe: ${nextKey}`);
      return nextKey;
    });
  }, [applyVibeStyles, showToast]);

  // Reference Image Management
  const loadRefImage = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const targetDim = Math.min(window.innerWidth, window.innerHeight) * 0.65;
        const maxDim = Math.max(img.naturalWidth, img.naturalHeight);
        const scale = maxDim > targetDim ? +(targetDim / maxDim).toFixed(2) : 1;
        setRefState({
          src,
          naturalW: img.naturalWidth,
          naturalH: img.naturalHeight,
          scale,
          opacity: 0.4,
          blend: 'normal',
          visible: true,
          x: window.innerWidth / 2 - (img.naturalWidth * scale) / 2,
          y: window.innerHeight / 2 - (img.naturalHeight * scale) / 2,
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  // Clipboard Paste & Drag Drop
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) loadRefImage(file);
          break;
        }
      }
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file && file.type.startsWith('image/')) loadRefImage(file);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if (e.key === 'Escape') {
        if (docsModalOpen) {
          e.preventDefault();
          setDocsModalOpen(false);
          return;
        }
        if (shortcutsModalOpen) {
          e.preventDefault();
          setShortcutsModalOpen(false);
          return;
        }
        if (isInput) {
          target.blur();
          return;
        }
        if (panMode) {
          setPanMode(false);
          showToast('Pan Mode: Off');
        }
        return;
      }

      if (isInput) return;

      // Parameter Field Manual / Docs Lab modal (F1 or Shift+D)
      if (e.key === 'F1' || (e.shiftKey && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        setDocsModalOpen((prev) => !prev);
        return;
      }

      // Help / Shortcuts modal (? or /)
      if (e.key === '?' || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Undo & Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Brush Width [ and ]
      if (e.key === '[') {
        e.preventDefault();
        handleBrushWidthNudge(e.shiftKey ? -10 : -2);
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        handleBrushWidthNudge(e.shiftKey ? 10 : 2);
        return;
      }

      // Zoom + / - / 0 / F
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoom(1.18);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoom(0.85);
        return;
      }
      if (e.key === '0' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleZoomReset();
        return;
      }

      // Pan Nudge with Arrow Keys
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePanNudge(e.shiftKey ? 120 : 40, 0);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlePanNudge(e.shiftKey ? -120 : -40, 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePanNudge(0, e.shiftKey ? 120 : 40);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handlePanNudge(0, e.shiftKey ? -120 : -40);
        return;
      }

      // Mode toggles
      const k = e.key.toLowerCase();
      if (k === 'h') {
        e.preventDefault();
        setPanMode((prev) => {
          showToast(!prev ? 'Pan Tool: On' : 'Pan Tool: Off');
          return !prev;
        });
        return;
      }

      if (k === 'd' || e.key === '3') {
        e.preventDefault();
        setMode3d((prev) => {
          showToast(!prev ? '3D View: On' : '3D View: Off');
          return !prev;
        });
        return;
      }

      if (k === 'o') {
        e.preventDefault();
        setAutoOrbit((prev) => {
          showToast(!prev ? 'Auto Orbit: On' : 'Auto Orbit: Off');
          return !prev;
        });
        return;
      }

      // Symmetry cycle
      if (k === 'x') {
        e.preventDefault();
        handleCycleSymmetry();
        return;
      }

      // Vibe cycle
      if (k === 'v') {
        e.preventDefault();
        handleCycleVibe(e.shiftKey);
        return;
      }

      // Animation toggle
      if (k === 'a') {
        e.preventDefault();
        setAnimOn((prev) => {
          showToast(!prev ? 'Animation: On' : 'Animation: Off');
          return !prev;
        });
        return;
      }

      // Post-FX toggles
      if (k === 'g') {
        e.preventDefault();
        setGlowEnabled((prev) => {
          showToast(!prev ? 'Star Glow: On' : 'Star Glow: Off');
          return !prev;
        });
        return;
      }

      if (k === 'b') {
        e.preventDefault();
        setAberrationEnabled((prev) => {
          showToast(!prev ? 'Aberration: On' : 'Aberration: Off');
          return !prev;
        });
        return;
      }

      if (k === 'n') {
        e.preventDefault();
        setNoiseEnabled((prev) => {
          showToast(!prev ? 'Film Noise: On' : 'Film Noise: Off');
          return !prev;
        });
        return;
      }

      // Toggle Eraser / Brush (E)
      if (k === 'e' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setToolMode((prev) => {
          const next = prev === 'eraser' ? 'brush' : 'eraser';
          showToast(next === 'eraser' ? 'Tool: Eraser (E)' : 'Tool: Brush (E)');
          return next;
        });
        return;
      }

      // Generate random sigil with spikes (R) or attach spikes (Shift+R)
      if (k === 'r' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (e.shiftKey) {
          handleAddSpikes();
        } else {
          handleGenerateSigil();
        }
        return;
      }

      // Clear canvas (Shift+C)
      if (e.key === 'C' && e.shiftKey) {
        e.preventDefault();
        handleClear();
        return;
      }

      // Toggle Panel (Tab or P)
      if (e.key === 'Tab' || k === 'p') {
        e.preventDefault();
        setPanelVisible((prev) => {
          showToast(!prev ? 'Panel: Shown' : 'Panel: Hidden (Tab / P)');
          return !prev;
        });
        return;
      }

      // Toggle Chrono Timeline Deck (T)
      if (k === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!videoSectionEnabled) {
          setVideoSectionEnabled(true);
          setTimelineVisible(true);
          showToast('Video Section: On');
        } else {
          setTimelineVisible((prev) => {
            showToast(!prev ? 'Timeline Deck: Shown' : 'Timeline Deck: Hidden (T)');
            return !prev;
          });
        }
        return;
      }

      // Play / Pause Replay (K)
      if (k === 'k' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        handleTogglePlay();
        return;
      }

      // Timeline Step Backward (, or <)
      if (e.key === ',' || e.key === '<') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Timeline Step Forward (. or >)
      if (e.key === '.' || e.key === '>') {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Jump to Start (Home)
      if (e.key === 'Home') {
        e.preventDefault();
        handleJumpToStep(0);
        showToast('Timeline: Jump to Start');
        return;
      }

      // Jump to End (End)
      if (e.key === 'End') {
        e.preventDefault();
        const total = undoStackRef.current.length + redoStackRef.current.length;
        handleJumpToStep(total);
        showToast('Timeline: Jump to End');
        return;
      }
    };

    window.addEventListener('paste', onPaste);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    handleUndo,
    handleRedo,
    handleJumpToStep,
    handleTogglePlay,
    handleClear,
    handleZoom,
    handleZoomReset,
    handlePanNudge,
    handleBrushWidthNudge,
    handleCycleSymmetry,
    handleCycleVibe,
    handleGenerateSigil,
    handleAddSpikes,
    loadRefImage,
    shortcutsModalOpen,
    panMode,
    videoSectionEnabled,
    showToast,
  ]);

  // Export handlers
  const handleExportImage = async (
    isTransparentPNG: boolean,
    aspect: string,
    res: number,
    framing: 'fit' | 'view'
  ) => {
    if (!pipelineRef.current) return;
    try {
      await exportImage(
        pipelineRef.current,
        strokesRef.current,
        {
          aspectRatio: aspect,
          resolution: res,
          framing,
          isTransparentPNG,
          view,
          params: {
            ...params,
            glow: glowEnabled ? params.glow : 0,
            aberration: aberrationEnabled ? params.aberration : 0,
            noise: noiseEnabled ? params.noise : 0,
          },
          vibe: activeVibe,
          time: performance.now() / 1000,
        },
        setExportStatus
      );
    } catch (err: any) {
      console.error('Export error:', err);
      setExportStatus(`Export error: ${err.message}`);
    }
  };

  const handleExport3D = async (
    format: 'stl' | 'gltf',
    baseStyle: BaseStyle,
    gridRes: number
  ) => {
    if (!pipelineRef.current) return;
    try {
      await export3DModel(
        pipelineRef.current,
        strokesRef.current,
        {
          format,
          baseStyle,
          gridRes,
          params,
          vibe: activeVibe,
        },
        setExportStatus
      );
    } catch (err: any) {
      console.error('3D Export error:', err);
      setExportStatus(`3D Export error: ${err.message}`);
    }
  };

  return (
    <>
      <CanvasStage
        pipelineRef={pipelineRef}
        strokesRef={strokesRef}
        params={params}
        symmetry={symmetry}
        guideColor={activeVibe.theme.guideColor}
        view={view}
        onViewChange={setView}
        refState={refState}
        mode3d={mode3d}
        panMode={panMode}
        animOn={animOn}
        autoOrbit={autoOrbit}
        glowEnabled={glowEnabled}
        aberrationEnabled={aberrationEnabled}
        toolMode={toolMode}
        eraserSize={eraserSize}
        eraserMode={eraserMode}
        onStrokeAdded={handleStrokeAdded}
        onErasePerformed={handleErasePerformed}
      />

      {noiseEnabled && <NoiseOverlay intensity={params.noise} />}

      {panelVisible ? (
        <ControlPanel
          params={params}
          onParamChange={handleParamChange}
          currentVibe={currentVibe}
          onVibeChange={handleVibeChange}
          vibeData={activeVibe}
          symmetry={symmetry}
          onSymmetryChange={setSymmetry}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canRedo={canRedo}
          onClear={handleClear}
          glowEnabled={glowEnabled}
          onToggleGlow={() => {
            setGlowEnabled((v) => {
              showToast(!v ? 'Star Glow: On' : 'Star Glow: Off');
              return !v;
            });
          }}
          aberrationEnabled={aberrationEnabled}
          onToggleAberration={() => {
            setAberrationEnabled((v) => {
              showToast(!v ? 'Aberration: On' : 'Aberration: Off');
              return !v;
            });
          }}
          noiseEnabled={noiseEnabled}
          onToggleNoise={() => {
            setNoiseEnabled((v) => {
              showToast(!v ? 'Film Noise: On' : 'Film Noise: Off');
              return !v;
            });
          }}
          refState={refState}
          onLoadRefFile={loadRefImage}
          onUpdateRef={(partial) => setRefState((prev) => ({ ...prev, ...partial }))}
          onCenterRef={() => {
            if (!refState.src) return;
            setRefState((prev) => ({
              ...prev,
              x: window.innerWidth / 2 - (prev.naturalW * prev.scale) / 2,
              y: window.innerHeight / 2 - (prev.naturalH * prev.scale) / 2,
            }));
          }}
          onClearRef={() => {
            setRefState((prev) => ({ ...prev, src: '', visible: false }));
          }}
          onExportImage={handleExportImage}
          onExport3D={handleExport3D}
          exportStatus={exportStatus}
          onGenerateSigil={handleGenerateSigil}
          onAddSpikes={handleAddSpikes}
          sigilStyle={sigilStyle}
          onSigilStyleChange={setSigilStyle}
          toolMode={toolMode}
          onToolModeChange={(m) => {
            setToolMode(m);
            showToast(m === 'eraser' ? 'Tool: Eraser (E)' : 'Tool: Brush (E)');
          }}
          eraserSize={eraserSize}
          onEraserSizeChange={setEraserSize}
          eraserMode={eraserMode}
          onEraserModeChange={setEraserMode}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
          onOpenDocs={() => setDocsModalOpen(true)}
          videoSectionEnabled={videoSectionEnabled}
          onToggleVideoSection={() => setVideoSectionEnabled((enabled) => !enabled)}
          onToggleCollapse={() => {
            setPanelVisible(false);
            showToast('Panel: Hidden (Tab / P)');
          }}
        />
      ) : (
        <button
          className="panel-toggle-btn"
          onClick={() => {
            setPanelVisible(true);
            showToast('Panel: Shown');
          }}
          title="Show Controls (Tab or P)"
        >
          <span>◨</span>
          <span>Controls (Tab)</span>
        </button>
      )}

      <GlobalToolsDock
        canUndo={historyState.currentStep > 0}
        canRedo={historyState.totalSteps > historyState.currentStep}
        onUndo={handleUndo}
        onRedo={handleRedo}
        erasing={toolMode === 'eraser'}
        onToggleErase={handleToggleEraser}
        animationOn={animOn}
        onToggleAnimation={handleToggleAnimation}
        mode3d={mode3d}
        onToggle3D={handleToggle3D}
        orbitOn={autoOrbit}
        onToggleOrbit={handleToggleOrbit}
        zoomScale={view.scale}
        onZoomIn={() => handleZoom(1.2)}
        onZoomOut={() => handleZoom(0.83)}
        onZoomReset={handleZoomReset}
        panMode={panMode}
        onTogglePan={handleTogglePanMode}
        timelineVisible={videoSectionEnabled && timelineVisible}
      />

      {toastMessage && <div className="hud-toast">{toastMessage}</div>}

      <TimelineDeck
        enabled={videoSectionEnabled}
        currentStep={historyState.currentStep}
        totalSteps={historyState.totalSteps}
        currentLabel={historyState.currentLabel}
        strokeCount={historyState.strokeCount}
        onJumpToStep={handleJumpToStep}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyState.currentStep > 0}
        canRedo={historyState.totalSteps > historyState.currentStep}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        speed={replaySpeed}
        onSpeedChange={setReplaySpeed}
        isLooping={isLooping}
        onToggleLoop={() => setIsLooping((v) => !v)}
        visible={timelineVisible}
        onToggleVisible={() => setTimelineVisible((v) => !v)}
      />

      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <DocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
        activeVibe={activeVibe}
        currentVibeName={currentVibe}
        initialParams={params}
        canvasStrokes={strokesRef.current}
        onApplyParams={(newParams) => {
          setParams(newParams);
          strokesRef.current.forEach((s) => {
            s.params = { ...newParams };
            if (pipelineRef.current) {
              buildStrokeMesh(
                pipelineRef.current,
                s,
                window.innerWidth,
                window.innerHeight,
                false
              );
            }
          });
          if (pipelineRef.current) {
            pipelineRef.current.dirty = true;
          }
          showToast('✨ Applied Playground Parameters to Canvas');
        }}
      />
    </>
  );
};
