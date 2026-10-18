import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioEngine } from './audio/audioEngine';
import { midiManager } from './audio/midiManager';
import { PadData, BankId, PerformanceFXState } from './types/sampler';
import { createInitialPads, DEMO_PATTERNS } from './audio/presetKits';
import { Header } from './components/Header';
import { SamplerPad } from './components/SamplerPad';
import { WaveformEditor } from './components/WaveformEditor';
import { RotaryKnob } from './components/RotaryKnob';
import { PerformanceFX } from './components/PerformanceFX';
import { KoalaSequenceScreen } from './components/KoalaSequenceScreen';
import { PadEditorModal } from './components/PadEditorModal';
import { MidiSettingsModal } from './components/MidiSettingsModal';
import { KoalaProjectModal } from './components/KoalaProjectModal';
import { PlayStoreExportModal } from './components/PlayStoreExportModal';
import { MicRecordModal } from './components/MicRecordModal';
import { PatternSelectorBar } from './components/PatternSelectorBar';
import { AppThemeId, APP_THEMES, DEFAULT_THEME_ID, getSavedTheme, saveTheme } from './theme/themeConfig';
import { importKoalaProject, KoalaProjectData } from './audio/koalaProject';
import { KoalaGuide } from './components/KoalaGuide';
import {
  Upload,
  CheckCircle2,
  Sliders,
  Trash2,
  Cpu,
  BookOpen,
  FolderArchive,
  Sparkles,
  Mic,
  Play,
  Scissors,
  Volume2
} from 'lucide-react';

// Physical keyboard mapping supporting Thai, English, and Numpad
const KEY_CODE_MAP: Record<string, number> = {
  // Row 1 (Pads 1-4)
  Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
  Numpad7: 0, Numpad8: 1, Numpad9: 2,
  // Row 2 (Pads 5-8)
  KeyQ: 4, KeyW: 5, KeyE: 6, KeyR: 7,
  Numpad4: 4, Numpad5: 5, Numpad6: 6,
  // Row 3 (Pads 9-12)
  KeyA: 8, KeyS: 9, KeyD: 10, KeyF: 11,
  Numpad1: 8, Numpad2: 9, Numpad3: 10,
  // Row 4 (Pads 13-16)
  KeyZ: 12, KeyX: 13, KeyC: 14, KeyV: 15,
  Numpad0: 12,
};

const SHORTCUT_KEYS = [
  '1', '2', '3', '4',
  'Q', 'W', 'E', 'R',
  'A', 'S', 'D', 'F',
  'Z', 'X', 'C', 'V',
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<'SAMPLE' | 'SEQUENCE' | 'PERFORM'>('SEQUENCE');
  // Initialize with all 4 Banks (A, B, C, D) fully populated with sounds
  const [pads, setPads] = useState<PadData[]>(() => createInitialPads());
  const [activeBank, setActiveBank] = useState<BankId>('A');
  const [selectedPadId, setSelectedPadId] = useState<number>(0);
  const [triggeredPadId, setTriggeredPadId] = useState<number | null>(null);

  // Modals
  const [editingPad, setEditingPad] = useState<PadData | null>(null);
  const [isMidiModalOpen, setIsMidiModalOpen] = useState<boolean>(false);
  const [isMidiConnected, setIsMidiConnected] = useState<boolean>(false);
  const [midiLearningPadIdx, setMidiLearningPadIdx] = useState<number | null>(null);
  const [isKoalaModalOpen, setIsKoalaModalOpen] = useState<boolean>(false);
  const [isPlayStoreModalOpen, setIsPlayStoreModalOpen] = useState<boolean>(false);

  // Global Drag Over state
  const [isWindowDragOver, setIsWindowDragOver] = useState(false);

  // Performance FX State
  const [fx, setFx] = useState<PerformanceFXState>({
    filterActive: false,
    filterCutoff: 16000,
    filterResonance: 0.7,
    filterType: 'lowpass',
    tapeStopActive: false,
    stutterActive: false,
    stutterRate: 16,
    bitcrushActive: false,
    bitDepth: 8,
    reverbActive: false,
    reverbWet: 0,
    delayActive: false,
    delayTime: 0.28,
    delayFeedback: 0.35,
    pitchShift: 0,
  });

  // 8 Sequencer Patterns (16 pads x 16 steps each)
  const [patterns, setPatterns] = useState<boolean[][][]>(() => {
    const list = Array.from({ length: 8 }, () =>
      Array.from({ length: 16 }, () => Array(16).fill(false))
    );
    // Initialize pattern 0 with Demo Pattern 0
    list[0] = DEMO_PATTERNS[0].steps;
    // Pattern 1 with Demo Pattern 1
    list[1] = DEMO_PATTERNS[1].steps;
    // Pattern 2 with Demo Pattern 2
    list[2] = DEMO_PATTERNS[2].steps;
    return list;
  });

  const [activePatternIdx, setActivePatternIdx] = useState<number>(0);
  const [queuedPatternIdx, setQueuedPatternIdx] = useState<number | null>(null);
  const queuedPatternIdxRef = useRef<number | null>(null);
  queuedPatternIdxRef.current = queuedPatternIdx;

  // Color Theme State
  const [currentThemeId, setCurrentThemeId] = useState<AppThemeId>(() => getSavedTheme());
  const currentTheme = APP_THEMES[currentThemeId] || APP_THEMES[DEFAULT_THEME_ID];

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLiveRecording, setIsLiveRecording] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [bpm, setBpm] = useState<number>(85);
  const [swing, setSwing] = useState<number>(25);
  const [metronome, setMetronome] = useState<boolean>(false);
  const [barLength, setBarLength] = useState<number>(1);
  const [isKeyboardMode, setIsKeyboardMode] = useState<boolean>(false);

  // 16 Sequencer Tracks mapping to Pad IDs (0..63 across Banks A, B, C, D)
  const [trackPadAssignments, setTrackPadAssignments] = useState<number[]>(() =>
    Array.from({ length: 16 }, (_, i) => i)
  );
  const trackPadAssignmentsRef = useRef(trackPadAssignments);
  trackPadAssignmentsRef.current = trackPadAssignments;

  // Pattern history for UNDO
  const [patternHistory, setPatternHistory] = useState<boolean[][][][]>([]);

  // Mic & Resample State
  const [isRecordingMic, setIsRecordingMic] = useState<boolean>(false);
  const [recordingTargetPadId, setRecordingTargetPadId] = useState<number | null>(null);
  const [isMicModalOpen, setIsMicModalOpen] = useState<boolean>(false);
  const [isResampling, setIsResampling] = useState<boolean>(false);

  // Status Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Keep live refs for playback loop & MIDI handlers
  const activeBankRef = useRef(activeBank);
  activeBankRef.current = activeBank;
  const selectedPadIdRef = useRef(selectedPadId);
  selectedPadIdRef.current = selectedPadId;
  const padsRef = useRef(pads);
  padsRef.current = pads;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isLiveRecordingRef = useRef(isLiveRecording);
  isLiveRecordingRef.current = isLiveRecording;
  const currentStepRef = useRef(currentStep);
  currentStepRef.current = currentStep;
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;
  const swingRef = useRef(swing);
  swingRef.current = swing;
  const patternsRef = useRef(patterns);
  patternsRef.current = patterns;
  const activePatternIdxRef = useRef(activePatternIdx);
  activePatternIdxRef.current = activePatternIdx;
  const metronomeRef = useRef(metronome);
  metronomeRef.current = metronome;

  // Initialize MIDI
  useEffect(() => {
    midiManager.init().then((supported) => {
      if (supported && midiManager.getConnectedDevices().length > 0) {
        setIsMidiConnected(true);
      }
    });

    const unsubscribe = midiManager.subscribe((event) => {
      audioEngine.init();
      const ctx = audioEngine.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (event.type === 'noteon') {
        const bankOffset = ['A', 'B', 'C', 'D'].indexOf(activeBankRef.current) * 16;
        let padToPlay: PadData | null = null;
        let pitchOffset = 0;

        if (event.padIndex !== undefined) {
          padToPlay = padsRef.current[bankOffset + event.padIndex];
        } else if (event.note !== undefined) {
          // If playing drum notes 36-51 (SMK-37 default pads)
          if (event.note >= 36 && event.note <= 51) {
            padToPlay = padsRef.current[bankOffset + (event.note - 36)];
          } else {
            // Chromatic keyboard mode on 37 keys: play selected pad at pitch offset!
            padToPlay = padsRef.current.find((p) => p.id === selectedPadIdRef.current) || padsRef.current[bankOffset];
            pitchOffset = event.note - 60; // relative to C4
          }
        }

        if (padToPlay) {
          triggerPad(padToPlay, pitchOffset);
          setSelectedPadId(padToPlay.id);

          // If live recording into sequence
          if (isPlayingRef.current && isLiveRecordingRef.current) {
            recordPadHitToStep(padToPlay.id % 16, currentStepRef.current);
          }
        }
      } else if (event.type === 'cc') {
        const mapping = midiManager.getMapping();
        // Footswitch pedal (CC 64): Toggle Play/Pause
        if (event.controller === mapping.ccPlayStop && (event.value ?? 0) >= 64) {
          setIsPlaying((prev) => !prev);
          showToast('M-Vave Footswitch: สลับเล่น / หยุด');
        }
        // Rotary Knobs: CC 20 (Vol), CC 21 (Pitch), CC 22 (Pan)
        if (event.controller === mapping.ccVolume) {
          const volNorm = Number((((event.value ?? 64) / 127) * 1.5).toFixed(2));
          updateActivePadField('volume', volNorm);
        } else if (event.controller === mapping.ccPitch) {
          const pitchNorm = Math.round(((event.value ?? 64) / 127) * 24 - 12);
          updateActivePadField('pitch', pitchNorm);
        } else if (event.controller === mapping.ccPan) {
          const panNorm = Number(((((event.value ?? 64) / 127) * 2 - 1)).toFixed(2));
          updateActivePadField('pan', panNorm);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Update FX in audio engine
  useEffect(() => {
    audioEngine.updateFX(fx);
  }, [fx]);

  // Trigger pad function with instant AudioContext resume
  const triggerPad = useCallback(
    (pad: PadData, extraPitch = 0) => {
      audioEngine.init();
      const ctx = audioEngine.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      audioEngine.playPad(pad, fx.pitchShift + extraPitch);
      setTriggeredPadId(pad.id);
      setSelectedPadId(pad.id);

      setTimeout(() => {
        setTriggeredPadId((prev) => (prev === pad.id ? null : prev));
      }, 120);
    },
    [fx.pitchShift]
  );

  // Active Selected Pad
  const activePad = pads.find((p) => p.id === selectedPadId) || pads[0] || null;

  const updateActivePadField = (field: keyof PadData, value: any) => {
    if (!activePad) return;
    setPads((prev) =>
      prev.map((p) => (p.id === activePad.id ? { ...p, [field]: value } : p))
    );

    // Instant real-time response during pressing, holding, or dragging knobs!
    if (field === 'volume' || field === 'pitch' || field === 'pan') {
      audioEngine.updateVoiceRealtime(activePad.id, { [field]: value });
    }
  };

  // Quantized Pattern Switcher ("เมื่อกดpต่อไปให้รอจบห้องก่อน")
  const handleSelectPattern = (idx: number) => {
    if (idx === activePatternIdx && queuedPatternIdx === null) return;

    if (!isPlayingRef.current) {
      // Stopped: switch immediately
      setActivePatternIdx(idx);
      activePatternIdxRef.current = idx;
      setQueuedPatternIdx(null);
      queuedPatternIdxRef.current = null;
    } else {
      // Playing: wait for the end of the 16-step bar!
      if (queuedPatternIdxRef.current === idx) {
        // Tap again to cancel queue
        setQueuedPatternIdx(null);
        queuedPatternIdxRef.current = null;
        showToast(`ยกเลิกคิว Pattern P${idx + 1}`);
      } else {
        setQueuedPatternIdx(idx);
        queuedPatternIdxRef.current = idx;
        showToast(`รอจบห้องก่อน แล้วจะสลับไปเล่น P${idx + 1} (Quantized Cue)`);
      }
    }
  };

  // Switch Color Theme
  const handleSelectTheme = (themeId: AppThemeId) => {
    setCurrentThemeId(themeId);
    saveTheme(themeId);
    showToast(`เปลี่ยนธีมเป็น "${APP_THEMES[themeId].name}" เรียบร้อย!`);
  };

  // Record pad hit to step in active pattern
  const recordPadHitToStep = (padTrackIdx: number, stepIdx: number) => {
    setPatterns((prev) => {
      const pIdx = activePatternIdxRef.current;
      const next = prev.map((pat, i) => (i === pIdx ? pat.map((track) => [...track]) : pat));
      if (next[pIdx] && next[pIdx][padTrackIdx]) {
        next[pIdx][padTrackIdx][stepIdx] = true;
      }
      return next;
    });
  };

  // Sequencer Playback Engine
  useEffect(() => {
    if (!isPlaying) {
      audioEngine.stopAllVoices();
      return;
    }

    let timer: NodeJS.Timeout | null = null;

    const scheduleNextStep = () => {
      if (!isPlayingRef.current) return;

      const step = currentStepRef.current;
      const baseStepTime = (60 / bpmRef.current / 4) * 1000;

      const isSwingStep = step % 2 === 1;
      const swingOffset = (swingRef.current / 100) * (baseStepTime * 0.5);
      const currentStepDuration = isSwingStep ? baseStepTime + swingOffset : baseStepTime - swingOffset;

      if (metronomeRef.current && step % 4 === 0) {
        audioEngine.playClick(step === 0);
      }

      // Current active pattern
      const curPat = patternsRef.current[activePatternIdxRef.current];
      const curPads = padsRef.current;

      if (curPat) {
        for (let trackIdx = 0; trackIdx < 16; trackIdx++) {
          if (curPat[trackIdx]?.[step]) {
            const assignedPadId = trackPadAssignmentsRef.current[trackIdx] ?? trackIdx;
            const pad = curPads.find((p) => p.id === assignedPadId) || curPads[trackIdx];
            if (pad) {
              triggerPad(pad);
            }
          }
        }
      }

      // Quantized Pattern Switch: When finishing the 16-step bar (at step 15), switch to queued pattern!
      if (step === 15 && queuedPatternIdxRef.current !== null) {
        const nextPat = queuedPatternIdxRef.current;
        setActivePatternIdx(nextPat);
        activePatternIdxRef.current = nextPat;
        setQueuedPatternIdx(null);
        queuedPatternIdxRef.current = null;
      }

      const nextStep = (step + 1) % 16;
      setCurrentStep(nextStep);

      timer = setTimeout(scheduleNextStep, Math.max(15, currentStepDuration));
    };

    scheduleNextStep();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isPlaying, triggerPad]);

  // Robust Keyboard Shortcuts Handler (Works on Thai, English, Mac & PC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;

      // Resume AudioContext on any key
      audioEngine.init();
      const ctx = audioEngine.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
        return;
      }

      // Check physical key code first (KeyQ, Digit1, etc.)
      let padIdx = KEY_CODE_MAP[e.code];

      // Fallback to character key
      if (padIdx === undefined) {
        padIdx = SHORTCUT_KEYS.indexOf(e.key.toUpperCase());
      }

      if (padIdx !== undefined && padIdx >= 0 && padIdx < 16) {
        const bankOffset = ['A', 'B', 'C', 'D'].indexOf(activeBankRef.current) * 16;
        const targetPad = padsRef.current[bankOffset + padIdx];
        if (targetPad) {
          triggerPad(targetPad);
          setSelectedPadId(targetPad.id);

          if (isPlayingRef.current && isLiveRecordingRef.current) {
            recordPadHitToStep(padIdx, currentStepRef.current);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [triggerPad]);

  // Handle Full-Screen Drag and Drop for .koala, .zip, .wav, .mp3
  const handleDropFiles = async (files: FileList | null, padId = selectedPadId) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    audioEngine.init();
    const ctx = audioEngine.getContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Case 1: .koala or .zip project file
    if (file.name.match(/\.(koala|zip)$/i)) {
      showToast('กำลังแตกและโหลดโปรเจกต์ .koala ครบ 4 Banks...');
      const project = await importKoalaProject(file, ctx);
      if (project) {
        setPads(project.pads);
        setPatterns(project.patterns);
        setBpm(project.bpm);
        setSwing(project.swing);
        setActivePatternIdx(0);
        showToast(`เปิดโปรเจกต์ "${project.name}.koala" สำเร็จ (ครบ 4 Banks & Sequences)!`);
      } else {
        showToast('ไม่สามารถเปิดไฟล์ .koala ได้');
      }
      return;
    }

    // Case 2: Audio sample file
    const buffer = await audioEngine.loadAudioFile(file);
    if (buffer) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 14);
      setPads((prev) =>
        prev.map((p) =>
          p.id === padId
            ? {
                ...p,
                name: cleanName.toUpperCase(),
                audioBuffer: buffer,
                category: 'custom',
                color: '#00f0ff',
                startTrim: 0,
                endTrim: 1,
              }
            : p
        )
      );
      setSelectedPadId(padId);
      showToast(`โหลดเสียง "${cleanName}" ใส่ Pad เรียบร้อย!`);
    }
  };

  // Open dedicated Mic Recording Studio Modal
  const handleOpenMicModal = (padId?: number) => {
    if (padId !== undefined) {
      setSelectedPadId(padId);
    }
    setIsMicModalOpen(true);
  };

  const handleQuickMicRecord = (padId: number) => {
    setSelectedPadId(padId);
    setIsMicModalOpen(true);
  };

  const handleSaveMicRecording = (padId: number, buffer: AudioBuffer, soundName: string) => {
    setPads((prev) =>
      prev.map((p) =>
        p.id === padId
          ? {
              ...p,
              name: soundName.slice(0, 16).toUpperCase(),
              audioBuffer: buffer,
              category: 'vocal',
              color: '#00f0ff',
              startTrim: 0,
              endTrim: 1,
            }
          : p
      )
    );
    setSelectedPadId(padId);
    showToast(`บันทึกเสียง "${soundName}" ลง Pad ${(padId % 16) + 1} เรียบร้อย! กดเล่นได้ทันที`);
  };

  // Auto-Chop active sample
  const handleAutoChop = () => {
    if (!activePad?.audioBuffer) return;
    const slices = 4;
    const baseBuffer = activePad.audioBuffer;
    const startIdx = activePad.id;

    setPads((prev) =>
      prev.map((p) => {
        const sliceOffset = p.id - startIdx;
        if (sliceOffset >= 0 && sliceOffset < slices) {
          const sliceStart = sliceOffset / slices;
          const sliceEnd = (sliceOffset + 1) / slices;
          return {
            ...p,
            name: `${activePad.name.slice(0, 6)} CHOP${sliceOffset + 1}`,
            audioBuffer: baseBuffer,
            startTrim: Number(sliceStart.toFixed(3)),
            endTrim: Number(sliceEnd.toFixed(3)),
            category: 'custom',
            color: '#00f0ff',
            chokeGroup: 1,
          };
        }
        return p;
      })
    );
    showToast(`สับตัวอย่างเสียง ${activePad.name} ออกเป็น ${slices} ชิ้นลงแพดเรียบร้อย!`);
  };

  // Delete active pad sample
  const handleDeleteActivePad = () => {
    if (!activePad) return;
    setPads((prev) =>
      prev.map((p) =>
        p.id === activePad.id
          ? {
              ...p,
              name: `PAD ${p.bank}${p.id % 16 + 1}`,
              audioBuffer: audioEngine.generateProceduralSound(audioEngine.getFallbackSoundForPad(p.id)),
              category: 'custom',
              pitch: 0,
              volume: 0.9,
              pan: 0,
              startTrim: 0,
              endTrim: 1,
            }
          : p
      )
    );
    showToast(`รีเซ็ต Pad เรียบร้อย`);
  };

  // Undo pattern action
  const handleUndoPattern = () => {
    if (patternHistory.length > 0) {
      const prev = patternHistory[patternHistory.length - 1];
      setPatternHistory((h) => h.slice(0, -1));
      setPatterns(prev);
      showToast('UNDO การแก้ไขจังหวะ');
    }
  };

  // Clear current active pattern
  const handleClearCurrentPattern = () => {
    setPatternHistory((h) => [...h, patterns]);
    setPatterns((prev) =>
      prev.map((pat, idx) =>
        idx === activePatternIdx
          ? Array.from({ length: 16 }, () => Array(16).fill(false))
          : pat
      )
    );
    showToast(`ล้างจังหวะ Pattern ${activePatternIdx + 1}`);
  };

  // Toggle step in active pattern (for Step Sequencer Grid)
  const handleToggleStep = (trackIdx: number, stepIdx: number) => {
    setPatternHistory((h) => [...h, patterns]);
    setPatterns((prev) => {
      const pIdx = activePatternIdxRef.current;
      const next = prev.map((pat, i) =>
        i === pIdx
          ? pat.map((track, tIdx) =>
              tIdx === trackIdx
                ? track.map((s, sIdx) => (sIdx === stepIdx ? !s : s))
                : [...track]
            )
          : pat
      );
      return next;
    });

    // Audition sound if note is turned ON
    const isCurrentlyActive = patterns[activePatternIdx]?.[trackIdx]?.[stepIdx];
    if (!isCurrentlyActive) {
      const assignedPadId = trackPadAssignments[trackIdx] ?? trackIdx;
      const pad = pads.find((p) => p.id === assignedPadId) || pads[trackIdx];
      if (pad) triggerPad(pad);
    }
  };

  // Change assigned sound for a sequencer track
  const handleChangeTrackPad = (trackIdx: number, padId: number) => {
    setTrackPadAssignments((prev) => {
      const next = [...prev];
      next[trackIdx] = padId;
      return next;
    });
    const targetPad = pads.find((p) => p.id === padId);
    showToast(`ตั้ง Track ${trackIdx + 1} เป็น [${targetPad?.bank}${(targetPad?.id ?? 0) % 16 + 1}] ${targetPad?.name ?? 'Pad ' + padId}`);
  };

  // Load a demo pattern
  const handleLoadDemoPattern = (patternIdx: number) => {
    const demo = DEMO_PATTERNS[patternIdx];
    if (!demo) return;
    setPatternHistory((h) => [...h, patterns]);
    setPatterns((prev) =>
      prev.map((pat, idx) => (idx === activePatternIdx ? demo.steps.map((row) => [...row]) : pat))
    );
    if (demo.bpm) setBpm(demo.bpm);
    if (demo.swing !== undefined) setSwing(demo.swing);
    showToast(`โหลดจังหวะ ${demo.name}`);
  };

  const bankOffset = ['A', 'B', 'C', 'D'].indexOf(activeBank) * 16;
  const currentBankPads = pads.slice(bankOffset, bankOffset + 16);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsWindowDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.relatedTarget) setIsWindowDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsWindowDragOver(false);
        handleDropFiles(e.dataTransfer.files);
      }}
      className={`min-h-screen text-slate-100 flex flex-col antialiased relative transition-colors duration-300 ${currentTheme.appBgClass}`}
      style={{
        backgroundColor: currentTheme.bgHex,
      }}
    >
      {/* Full-Screen Drag & Drop Overlay */}
      {isWindowDragOver && (
        <div
          className="fixed inset-0 z-50 backdrop-blur-md border-4 border-dashed flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-100"
          style={{
            backgroundColor: `${currentTheme.primary}15`,
            borderColor: currentTheme.primary,
          }}
        >
          <FolderArchive className="w-16 h-16 animate-bounce mb-3" style={{ color: currentTheme.primary }} />
          <h2 className="text-xl font-extrabold text-white">วางไฟล์ .KOALA หรือไฟล์เสียงที่นี่</h2>
          <p className="text-xs mt-1" style={{ color: currentTheme.primary }}>
            จะโหลดเสียงครบทั้ง 4 Banks และ Sequence เข้ามาเล่นทันที
          </p>
        </div>
      )}

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          audioEngine.init();
          const ctx = audioEngine.getContext();
          if (ctx.state === 'suspended') ctx.resume();
          setIsPlaying(!isPlaying);
        }}
        onOpenMidiModal={() => setIsMidiModalOpen(true)}
        onOpenKoalaModal={() => setIsKoalaModalOpen(true)}
        onOpenPlayStoreModal={() => setIsPlayStoreModalOpen(true)}
        isMidiConnected={isMidiConnected}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl text-black font-extrabold text-xs shadow-2xl animate-in slide-in-from-bottom-3 duration-200"
          style={{
            backgroundColor: currentTheme.primary,
            boxShadow: `0 0 20px ${currentTheme.glow}`,
          }}
        >
          <CheckCircle2 className="w-4 h-4 fill-current text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Studio Frame */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 flex flex-col gap-4">
        {/* Chassis container with dynamic Theme styling */}
        <div
          className="flex flex-col gap-3 p-3 sm:p-5 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] ring-1 ring-white/10 transition-all duration-300"
          style={{
            backgroundColor: currentTheme.surfaceHex,
            border: `2px solid ${currentTheme.primary}45`,
            boxShadow: `0 10px 40px rgba(0,0,0,0.9), 0 0 25px ${currentTheme.glow}`,
          }}
        >
          {/* TAB 1: SEQUENCE MODE (Matches user's exact uploaded screenshot in cyber high-tech colors) */}
          {currentTab === 'SEQUENCE' && (
            <KoalaSequenceScreen
              isPlaying={isPlaying}
              isRecording={isLiveRecording}
              onTogglePlay={() => {
                audioEngine.init();
                const ctx = audioEngine.getContext();
                if (ctx.state === 'suspended') ctx.resume();
                setIsPlaying(!isPlaying);
              }}
              onToggleRecord={() => setIsLiveRecording(!isLiveRecording)}
              bpm={bpm}
              onChangeBpm={setBpm}
              metronome={metronome}
              onToggleMetronome={() => setMetronome(!metronome)}
              patterns={patterns}
              activePatternIdx={activePatternIdx}
              queuedPatternIdx={queuedPatternIdx}
              onSelectPattern={handleSelectPattern}
              onToggleStep={handleToggleStep}
              onClearPattern={handleClearCurrentPattern}
              onLoadDemoPattern={handleLoadDemoPattern}
              swing={swing}
              onChangeSwing={setSwing}
              trackPadAssignments={trackPadAssignments}
              onChangeTrackPad={handleChangeTrackPad}
              pads={pads}
              activeBank={activeBank}
              onSelectBank={setActiveBank}
              triggeredPadId={triggeredPadId}
              selectedPadId={selectedPadId}
              onTriggerPad={(p) => triggerPad(p)}
              onSelectPad={(p) => setSelectedPadId(p.id)}
              onQuickMicRecord={handleQuickMicRecord}
              onEditPad={(p) => setEditingPad(p)}
              isRecordingMic={isRecordingMic}
              recordingTargetPadId={recordingTargetPadId}
              onUndo={handleUndoPattern}
              onClear={handleClearCurrentPattern}
              barLength={barLength}
              onChangeBarLength={setBarLength}
              isKeyboardMode={isKeyboardMode}
              onToggleKeyboardMode={() => setIsKeyboardMode(!isKeyboardMode)}
              onSwitchToSampleTab={() => setCurrentTab('SAMPLE')}
              currentStep={currentStep}
              shortcutKeys={SHORTCUT_KEYS}
            />
          )}

          {/* TAB 2: SAMPLE MODE (Waveform Display with Real-Time Playhead Running Cursor) */}
          {currentTab === 'SAMPLE' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              {/* 1. Top Action & Playing Sound Bar (ที่อัดเสียงและตั้งค่าอยู่ด้านบนตามที่ผู้ใช้ต้องการ) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 bg-[#080c14] border-2 border-[#00f0ff]/30 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.7)]">
                {/* Left: Active / Playing Sound Indicator (ปรากฏเสียงที่เล่นด้วย) */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border shadow-inner transition-colors"
                    style={{
                      backgroundColor: `${activePad?.color ?? '#00f0ff'}20`,
                      borderColor: activePad?.color ?? '#00f0ff',
                    }}
                  >
                    <span className="text-[10px] font-black text-white/70">
                      {activePad?.bank ?? 'A'}
                    </span>
                    <span className="text-xs font-black" style={{ color: activePad?.color ?? '#00f0ff' }}>
                      {((activePad?.id ?? 0) % 16) + 1}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-white tracking-wide">
                        {activePad?.name ?? 'EMPTY PAD'}
                      </span>
                      {triggeredPadId === activePad?.id ? (
                        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00f0ff] text-black shadow-[0_0_10px_#00f0ff] animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                          PLAYING
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {activePad?.category ?? 'SAMPLE'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {activePad?.audioBuffer
                        ? `ความยาว ${activePad.audioBuffer.duration.toFixed(2)}s • พร้อมเล่น`
                        : 'ไม่มีเสียง (แตะอัดเสียงด้านขวาหรือลากไฟล์มาใส่)'}
                    </span>
                  </div>

                  {/* Quick Audition Button */}
                  {activePad && (
                    <button
                      type="button"
                      onClick={() => triggerPad(activePad)}
                      title="กดฟังเสียง Pad นี้"
                      className="ml-1 sm:ml-2 px-3 py-1.5 rounded-xl bg-[#00f0ff]/15 hover:bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/40 text-xs font-black transition-all flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>PLAY</span>
                    </button>
                  )}
                </div>

                {/* Right: Sound Recording & Pad Settings moved to TOP (ป้องกันนิ้วไปโดนเวลาตีดรัมแพด) */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mic Recording Button */}
                  {activePad && (
                    <button
                      type="button"
                      onClick={() => handleOpenMicModal(activePad.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black tracking-wide transition-all shadow-md bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white border border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.3)] active:scale-95"
                      title="เปิดสตูดิโออัดเสียงไมค์ (MIC RECORDER) ลง Pad นี้"
                    >
                      <Mic className="w-4 h-4 animate-pulse" />
                      <span>อัดเสียงไมค์ (REC)</span>
                    </button>
                  )}

                  {/* Settings / Edit Pad Button */}
                  {activePad && (
                    <button
                      type="button"
                      onClick={() => setEditingPad(activePad)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black text-xs font-black rounded-xl shadow-[0_0_12px_rgba(0,240,255,0.4)] transition-all"
                      title="ตั้งค่า Pad ละเอียด (Trim, Envelope, Choke, Pitch)"
                    >
                      <Sliders className="w-4 h-4" />
                      <span>ตั้งค่า PAD</span>
                    </button>
                  )}

                  {/* Auto-Chop Button */}
                  {activePad?.audioBuffer && (
                    <button
                      type="button"
                      onClick={handleAutoChop}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-white/10"
                      title="สับเสียง 4 ชิ้นอัตโนมัติ"
                    >
                      <Scissors className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>สับเสียง</span>
                    </button>
                  )}

                  {/* Delete Button */}
                  {activePad && (
                    <button
                      type="button"
                      onClick={handleDeleteActivePad}
                      className="flex items-center gap-1 px-3 py-2 bg-white/5 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl transition-colors border border-white/5 hover:border-rose-500/30"
                      title="ล้างเสียงใน Pad นี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">ลบ</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Compact Waveform Display with Running Playhead Line */}
              <WaveformEditor
                pad={activePad}
                onUpdatePad={(updated) => {
                  setPads((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
                onAutoChop={handleAutoChop}
                onDeletePad={handleDeleteActivePad}
                isPlayingSample={triggeredPadId === activePad?.id}
              />

              {/* 3. Pattern Selector on SAMPLE Screen (เล่น/สลับ P1-P8 พร้อมรอจบห้องก่อนตามคำขอผู้ใช้) */}
              <PatternSelectorBar
                patterns={patterns}
                activePatternIdx={activePatternIdx}
                queuedPatternIdx={queuedPatternIdx}
                onSelectPattern={handleSelectPattern}
                isPlaying={isPlaying}
                onTogglePlay={() => {
                  audioEngine.init();
                  const ctx = audioEngine.getContext();
                  if (ctx.state === 'suspended') ctx.resume();
                  setIsPlaying(!isPlaying);
                }}
                currentStep={currentStep}
                bpm={bpm}
                onChangeBpm={setBpm}
                onUndo={handleUndoPattern}
                onClear={handleClearCurrentPattern}
                isRecording={isLiveRecording}
                onToggleRecord={() => setIsLiveRecording(!isLiveRecording)}
              />

              {/* 4. Middle Row: Rotary Knobs */}
              <div className="flex items-center justify-center gap-8 sm:gap-14 py-2 bg-[#090d15] border border-white/5 rounded-2xl px-4">
                <RotaryKnob
                  label="VOL"
                  value={activePad?.volume ?? 0.9}
                  min={0}
                  max={1.5}
                  step={0.05}
                  defaultValue={0.9}
                  displayValue={`${Math.round((activePad?.volume ?? 0.9) * 100)}%`}
                  onChange={(val) => updateActivePadField('volume', val)}
                />

                <RotaryKnob
                  label="PITCH"
                  value={activePad?.pitch ?? 0}
                  min={-12}
                  max={12}
                  step={1}
                  defaultValue={0}
                  displayValue={`${(activePad?.pitch ?? 0) > 0 ? '+' : ''}${activePad?.pitch ?? 0}st`}
                  onChange={(val) => updateActivePadField('pitch', val)}
                />

                <RotaryKnob
                  label="PAN"
                  value={activePad?.pan ?? 0}
                  min={-1}
                  max={1}
                  step={0.1}
                  defaultValue={0}
                  displayValue={
                    (activePad?.pan ?? 0) === 0
                      ? 'C'
                      : (activePad?.pan ?? 0) < 0
                      ? `L${Math.abs(Math.round((activePad?.pan ?? 0) * 100))}`
                      : `R${Math.round((activePad?.pan ?? 0) * 100)}`
                  }
                  onChange={(val) => updateActivePadField('pan', val)}
                />
              </div>

              {/* 4. 16 Pads Matrix (แป้นตีดรัมแพดสะอาด ไม่มีปุ่มเล็กในแพด ป้องกันนิ้วกดพลาด) */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-[#080b12] rounded-2xl border border-white/5 shadow-inner">
                {currentBankPads.map((pad, idx) => (
                  <SamplerPad
                    key={pad.id}
                    pad={pad}
                    index={idx}
                    shortcutKey={SHORTCUT_KEYS[idx]}
                    isTriggered={triggeredPadId === pad.id}
                    isSelected={selectedPadId === pad.id}
                    onTrigger={triggerPad}
                    onSelect={(p) => setSelectedPadId(p.id)}
                    onDropAudioFile={(id, f) => handleDropFiles([f] as any, id)}
                    isRecordingThisPad={isRecordingMic && recordingTargetPadId === pad.id}
                    isMidiLearningThisPad={midiLearningPadIdx === idx}
                  />
                ))}
              </div>

              {/* 5. Bottom Bank Selector */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {(['A', 'B', 'C', 'D'] as BankId[]).map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setActiveBank(bank)}
                    className={`w-12 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      activeBank === bank
                        ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_#00f0ff]'
                        : 'bg-black/50 text-white/60 hover:text-white hover:bg-black/80'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PERFORM MODE */}
          {currentTab === 'PERFORM' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <PerformanceFX
                fx={fx}
                onUpdateFX={setFx}
                isResampling={isResampling}
                onStartResample={() => {
                  audioEngine.init();
                  audioEngine.startResampling();
                  setIsResampling(true);
                  showToast('เริ่ม Resample: เสียงพร้อม FX กำลังบันทึก');
                }}
                onStopResample={async () => {
                  const buffer = await audioEngine.stopResampling();
                  setIsResampling(false);
                  if (buffer) {
                    const emptyPad = pads.find((p) => !p.audioBuffer) || pads[16];
                    setPads((prev) =>
                      prev.map((p) =>
                        p.id === emptyPad.id
                          ? { ...p, name: 'RESAMPLE 01', audioBuffer: buffer, color: '#00f0ff' }
                          : p
                      )
                    );
                    setSelectedPadId(emptyPad.id);
                    showToast(`Resample สำเร็จลง Pad ${emptyPad.bank}${emptyPad.id % 16 + 1}`);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-white/60">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white/80">M-VAVE SMK-37 & ALL 4 BANKS READY</span>
            <span>·</span>
            <span>16 Pads (C1-D#2)</span>
            <span>·</span>
            <span>Footswitch CC 64</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsKoalaModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 rounded-lg cursor-pointer transition-colors text-xs font-bold shadow-sm"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>.KOALA โปรเจกต์ (เปิด/บันทึก)</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg cursor-pointer transition-colors text-xs font-medium">
              <Upload className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>นำเข้าไฟล์ .koala / WAV</span>
              <input
                type="file"
                accept="audio/*,.koala,.zip"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    handleDropFiles(e.target.files);
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* Thai Guide */}
        <div className="mt-4">
          <KoalaGuide />
        </div>
      </main>

      {/* Koala Project Modal */}
      {isKoalaModalOpen && (
        <KoalaProjectModal
          isOpen={isKoalaModalOpen}
          onClose={() => setIsKoalaModalOpen(false)}
          pads={pads}
          patterns={patterns}
          steps={patterns[activePatternIdx]}
          bpm={bpm}
          swing={swing}
          onLoadProject={(project) => {
            setPads(project.pads);
            setPatterns(project.patterns);
            setBpm(project.bpm);
            setSwing(project.swing);
            setActivePatternIdx(0);
          }}
          showToast={showToast}
        />
      )}

      {/* Google Play Store Export Modal */}
      {isPlayStoreModalOpen && (
        <PlayStoreExportModal
          isOpen={isPlayStoreModalOpen}
          onClose={() => setIsPlayStoreModalOpen(false)}
        />
      )}

      {/* MIDI & Themes Settings Modal */}
      {isMidiModalOpen && (
        <MidiSettingsModal
          isOpen={isMidiModalOpen}
          onClose={() => setIsMidiModalOpen(false)}
          currentTheme={currentThemeId}
          onSelectTheme={handleSelectTheme}
          onSelectMidiLearnPad={(idx) => {
            setMidiLearningPadIdx(idx);
            midiManager.startLearning('pad', idx);
            showToast(`กดแป้นบน M-VAVE SMK-37 เพื่อบันทึกลง Pad ${idx + 1}...`);
          }}
        />
      )}

      {/* Mic Recording Studio Modal */}
      {isMicModalOpen && (
        <MicRecordModal
          isOpen={isMicModalOpen}
          onClose={() => setIsMicModalOpen(false)}
          targetPad={activePad}
          pads={pads}
          onSelectPad={(padId) => setSelectedPadId(padId)}
          onSaveRecording={handleSaveMicRecording}
          showToast={showToast}
        />
      )}

      {/* Pad Inspector / Editor Modal */}
      {editingPad && (
        <PadEditorModal
          pad={editingPad}
          onClose={() => setEditingPad(null)}
          onUpdatePad={(updated) => {
            setPads((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            showToast(`อัปเดตการตั้งค่า Pad "${updated.name}" เรียบร้อย`);
          }}
          onQuickMicRecord={handleQuickMicRecord}
          isRecording={isRecordingMic && recordingTargetPadId === editingPad.id}
        />
      )}

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-4 px-4 text-center text-xs text-white/40">
        <span>Koala Sampler Studio · High-Tech Edition · รองรับ M-VAVE SMK-37 & .koala</span>
      </footer>
    </div>
  );
}
