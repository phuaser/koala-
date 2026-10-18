import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Square,
  Play,
  RotateCcw,
  Check,
  Sparkles,
  Upload,
  Volume2,
  AlertCircle,
  HelpCircle,
  FolderOpen,
} from 'lucide-react';
import { PadData, BankId } from '../types/sampler';
import { audioEngine } from '../audio/audioEngine';

interface MicRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPad: PadData | null;
  pads: PadData[];
  onSelectPad: (padId: number) => void;
  onSaveRecording: (padId: number, audioBuffer: AudioBuffer, soundName: string) => void;
  showToast: (msg: string) => void;
}

export const MicRecordModal: React.FC<MicRecordModalProps> = ({
  isOpen,
  onClose,
  targetPad,
  pads,
  onSelectPad,
  onSaveRecording,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'MIC' | 'FILE' | 'SYNTH'>('MIC');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBuffer, setRecordedBuffer] = useState<AudioBuffer | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [customSoundName, setCustomSoundName] = useState<string>('');
  const [micPermissionState, setMicPermissionState] = useState<'PROMPT' | 'GRANTED' | 'DENIED' | 'UNSUPPORTED'>('PROMPT');
  const [permissionErrorMsg, setPermissionErrorMsg] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);

  // Pad selection within modal
  const [selectedBank, setSelectedBank] = useState<BankId>(targetPad?.bank ?? 'A');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen && targetPad) {
      setSelectedBank(targetPad.bank);
      setCustomSoundName(`MIC ${targetPad.bank}${((targetPad.id % 16) + 1)}`);
      setRecordedBuffer(null);
      setIsRecording(false);
      setRecordingSeconds(0);
      setIsPlayingPreview(false);

      // Check microphone availability on open
      checkMicrophoneAvailability();
    }
    return () => {
      cleanup();
    };
  }, [isOpen, targetPad?.id]);

  const cleanup = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animFrameRef.current) {
      window.cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  };

  // Check microphone availability
  const checkMicrophoneAvailability = async () => {
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setMicPermissionState('UNSUPPORTED');
      setPermissionErrorMsg('เบราว์เซอร์นี้ไม่รองรับ getUserMedia หรือทำงานบนการเชื่อมต่อที่ไม่ปลอดภัย (ต้องใช้ HTTPS หรือ localhost)');
      return;
    }

    try {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (status.state === 'granted') {
            setMicPermissionState('GRANTED');
          } else if (status.state === 'denied') {
            setMicPermissionState('DENIED');
            setPermissionErrorMsg('สิทธิ์ไมโครโฟนถูกปิดกั้น (Blocked) ในการตั้งค่าเบราว์เซอร์');
          } else {
            setMicPermissionState('PROMPT');
          }
          status.onchange = () => {
            if (status.state === 'granted') setMicPermissionState('GRANTED');
            if (status.state === 'denied') setMicPermissionState('DENIED');
          };
        } catch {
          setMicPermissionState('PROMPT');
        }
      }
    } catch {
      setMicPermissionState('PROMPT');
    }
  };

  // Start continuous visualizer animation
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    const waveData = new Uint8Array(128);

    const drawVisualizer = () => {
      if (!isSubscribed) return;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          ctx.clearRect(0, 0, width, height);

          // Get live mic level and wave
          const level = audioEngine.getMicLevel();
          setMicLevel(level);

          audioEngine.getMicWaveformData(waveData);

          if (isRecording) {
            // High-tech Red / Cyan Pulse Oscilloscope
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#f43f5e';
            ctx.shadowColor = '#f43f5e';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            const sliceWidth = width / waveData.length;
            let x = 0;

            for (let i = 0; i < waveData.length; i++) {
              const v = waveData[i] / 128.0;
              const y = (v * height) / 2;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            ctx.stroke();

            // Glow center line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          } else if (micPermissionState === 'GRANTED') {
            // Idle Cyan Wave
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00f0ff';
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 8;

            ctx.beginPath();
            const sliceWidth = width / waveData.length;
            let x = 0;

            for (let i = 0; i < waveData.length; i++) {
              const v = waveData[i] / 128.0;
              const y = (v * height) / 2;

              if (i === 0) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
              x += sliceWidth;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
          } else {
            // Flat baseline
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
          }
        }
      }
      animFrameRef.current = window.requestAnimationFrame(drawVisualizer);
    };

    animFrameRef.current = window.requestAnimationFrame(drawVisualizer);

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) {
        window.cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isOpen, isRecording, micPermissionState]);

  // Request Mic Permission explicitly
  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    setPermissionErrorMsg('');
    try {
      const res = await audioEngine.requestMicPermission();
      if (res.granted) {
        setMicPermissionState('GRANTED');
        showToast('ไมโครโฟนพร้อมใช้งานแล้ว! กดปุ่มสีแดงเพื่อเริ่มอัด');
      } else {
        setMicPermissionState('DENIED');
        setPermissionErrorMsg(res.error || 'ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน');
      }
    } catch (err: unknown) {
      setMicPermissionState('DENIED');
      setPermissionErrorMsg((err as Error)?.message || 'ไม่สามารถเปิดไมโครโฟนได้');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // Start Live Mic Recording
  const handleStartRecording = async () => {
    setRecordedBuffer(null);
    setIsPlayingPreview(false);
    setRecordingSeconds(0);

    const started = await audioEngine.startMicRecording();
    if (started) {
      setIsRecording(true);
      setMicPermissionState('GRANTED');

      // Start elapsed timer
      const startTime = performance.now();
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        setRecordingSeconds(elapsed);
        if (elapsed >= 60) {
          handleStopRecording();
        }
      }, 50);
    } else {
      setMicPermissionState('DENIED');
      setPermissionErrorMsg('ไม่สามารถเปิดไมโครโฟนได้ (อาจถูกบล็อกในเบราว์เซอร์หรือ iFrame)');
    }
  };

  // Stop Live Mic Recording
  const handleStopRecording = async () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);

    const buffer = await audioEngine.stopMicRecording();
    if (buffer) {
      setRecordedBuffer(buffer);
      showToast(`อัดเสียงสำเร็จ! ความยาว ${buffer.duration.toFixed(2)} วินาที`);
    } else {
      showToast('ไม่พบข้อมูลเสียงที่อัด กรุณาลองใหม่อีกครั้ง');
    }
  };

  // Preview recorded buffer
  const handleTogglePreview = () => {
    if (!recordedBuffer) return;
    if (isPlayingPreview) {
      audioEngine.stopAllVoices();
      setIsPlayingPreview(false);
    } else {
      const tempPad: PadData = {
        id: -999,
        bank: 'A',
        name: 'PREVIEW',
        audioBuffer: recordedBuffer,
        color: '#00f0ff',
        volume: 1,
        pan: 0,
        pitch: 0,
        playMode: 'oneshot',
        reverse: false,
        startTrim: 0,
        endTrim: 1,
        attack: 0.005,
        release: 0.05,
        chokeGroup: 0,
        category: 'vocal',
      };
      audioEngine.playPad(tempPad);
      setIsPlayingPreview(true);
      setTimeout(() => {
        setIsPlayingPreview(false);
      }, (recordedBuffer.duration + 0.1) * 1000);
    }
  };

  // Save to target pad
  const handleSaveToPad = () => {
    if (!recordedBuffer || !targetPad) return;
    onSaveRecording(targetPad.id, recordedBuffer, customSoundName.trim() || 'MIC SAMPLE');
    onClose();
  };

  // Handle direct file upload inside recording modal
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetPad) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = await audioEngine.getContext().decodeAudioData(arrayBuffer);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 14).toUpperCase();
      setRecordedBuffer(buffer);
      setCustomSoundName(cleanName);
      showToast(`โหลดไฟล์เสียง "${cleanName}" สำเร็จ!`);
    } catch {
      showToast('ไม่สามารถถอดรหัสไฟล์เสียงนี้ได้ กรุณาใช้ .wav หรือ .mp3');
    }
  };

  // Procedural Vocal / Beatbox Synthesizer (Instant generation)
  const handleGenerateSynthSound = (soundKey: string, soundLabel: string) => {
    if (!targetPad) return;
    const buffer = audioEngine.generateProceduralSound(soundKey);
    setRecordedBuffer(buffer);
    setCustomSoundName(soundLabel);
    showToast(`สร้างเสียง "${soundLabel}" พร้อมใช้งาน!`);
  };

  if (!isOpen || !targetPad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[#090d16] border border-[#00f0ff]/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#0d1424]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]">
              <Mic className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide">
                  สตูดิโออัดเสียงลง PAD (SAMPLING RECORDER)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                อัดเสียงพูด, ร้อง, บีทบ็อกซ์ หรือเสียงรอบตัวลงแพดได้โดยตรง
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Pad Selector Strip */}
        <div className="px-5 py-2.5 bg-black/40 border-b border-white/5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold">บันทึกลง:</span>
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10"
              style={{ borderColor: targetPad.color }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: targetPad.color }}
              />
              <span className="text-xs font-black text-white">
                BANK {targetPad.bank} • PAD {((targetPad.id % 16) + 1)}
              </span>
              <span className="text-xs text-slate-400">({targetPad.name})</span>
            </div>
          </div>

          {/* Quick Bank & Pad Switcher */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 hidden sm:inline">เปลี่ยน Bank:</span>
            {(['A', 'B', 'C', 'D'] as BankId[]).map((bank) => (
              <button
                key={bank}
                type="button"
                onClick={() => {
                  setSelectedBank(bank);
                  const firstInBank = pads.find((p) => p.bank === bank);
                  if (firstInBank) onSelectPad(firstInBank.id);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedBank === bank
                    ? 'bg-[#00f0ff] text-black shadow-[0_0_8px_#00f0ff]'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {bank}
              </button>
            ))}
          </div>
        </div>

        {/* Source Tabs (Mic / File / Synth) */}
        <div className="flex border-b border-white/10 bg-[#070a12] px-4 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('MIC')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black border-b-2 transition-all ${
              activeTab === 'MIC'
                ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>1. ไมโครโฟนสด (LIVE MIC)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FILE')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black border-b-2 transition-all ${
              activeTab === 'FILE'
                ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>2. เลือกไฟล์เสียง (.WAV/.MP3)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SYNTH')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-black border-b-2 transition-all ${
              activeTab === 'SYNTH'
                ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. สร้างเสียงสังเคราะห์ (SYNTH VOX)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: LIVE MIC RECORDING */}
          {/* ======================================================== */}
          {activeTab === 'MIC' && (
            <div className="space-y-4">
              {/* Permission Banner if Denied / Prompt */}
              {micPermissionState === 'DENIED' && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="font-bold text-rose-300">
                      ⚠️ เบราว์เซอร์ยังไม่ได้รับอนุญาตให้ใช้ไมโครโฟน หรือติดความปลอดภัยใน iFrame
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {permissionErrorMsg || 'กรุณากดอนุญาตการใช้ไมโครโฟน หรือหากใช้ Chrome ให้กดไอคอนกุญแจ 🔒 ที่ด้านซ้ายของช่องใส่ URL แล้วเลือก Microphone = Allow'}
                    </p>
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        onClick={handleRequestPermission}
                        disabled={isRequestingPermission}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5"
                      >
                        <Mic className="w-3.5 h-3.5" />
                        <span>{isRequestingPermission ? 'กำลังตรวจสอบ...' : 'ขอนุญาตไมค์อีกครั้ง'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('FILE')}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                      >
                        ใช้วิธีดึงไฟล์เสียงแทน
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('SYNTH')}
                        className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] text-xs font-bold transition-all"
                      >
                        สร้างเสียงบีทบ็อกซ์/Vocal ทันที
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {micPermissionState === 'PROMPT' && !isRecording && (
                <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>เมื่อกดอัดเสียง เบราว์เซอร์จะแสดงหน้าต่างขอสิทธิ์เปิดไมโครโฟน ให้กด <b>"Allow" (อนุญาต)</b></span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestPermission}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 font-bold text-[11px] whitespace-nowrap"
                  >
                    ทดสอบเปิดไมค์
                  </button>
                </div>
              )}

              {/* Main Visualizer Stage */}
              <div className="relative h-32 sm:h-40 rounded-2xl bg-[#05070e] border border-white/10 overflow-hidden flex flex-col items-center justify-center p-3">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={160}
                  className="w-full h-full object-contain relative z-10"
                />

                {/* Top Overlay Stats */}
                <div className="absolute top-3 left-4 z-20 flex items-center gap-2">
                  {isRecording ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-black tracking-wider animate-pulse shadow-[0_0_12px_#f43f5e]">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      REC
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-bold border border-white/10">
                      STANDBY
                    </span>
                  )}

                  <span className="text-xs font-mono font-bold text-slate-300">
                    {recordingSeconds.toFixed(2)}s
                  </span>
                </div>

                {/* Live VU Level Meter Bar */}
                <div className="absolute bottom-3 left-4 right-4 z-20 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/5">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full transition-all duration-75"
                      style={{
                        width: `${Math.min(100, micLevel * 100)}%`,
                        backgroundColor:
                          micLevel > 0.8 ? '#f43f5e' : micLevel > 0.4 ? '#eab308' : '#00f0ff',
                        boxShadow: `0 0 8px ${micLevel > 0.8 ? '#f43f5e' : '#00f0ff'}`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 w-8 text-right">
                    {Math.round(micLevel * 100)}%
                  </span>
                </div>
              </div>

              {/* Big Record / Stop Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
                {!isRecording ? (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm tracking-wide shadow-[0_0_25px_rgba(244,63,94,0.5)] active:scale-95 transition-all flex items-center justify-center gap-3 border border-rose-400/50"
                  >
                    <div className="w-4 h-4 rounded-full bg-white animate-ping" />
                    <span>🔴 กดเพื่อเริ่มอัดเสียง (START REC)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm tracking-wide shadow-[0_0_35px_#f43f5e] active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse border-2 border-white"
                  >
                    <Square className="w-5 h-5 fill-current" />
                    <span>⏹️ กดเพื่อหยุดและบันทึก (STOP REC)</span>
                  </button>
                )}
              </div>

              {/* Recorded Result Review Section */}
              {recordedBuffer && (
                <div className="p-4 rounded-2xl bg-[#0e172a] border border-[#00f0ff]/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00f0ff] animate-ping" />
                      <span className="text-xs font-black text-white">เสียงที่อัดพร้อมแล้ว!</span>
                      <span className="text-xs text-slate-400">
                        ({recordedBuffer.duration.toFixed(2)} วินาที)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTogglePreview}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isPlayingPreview
                            ? 'bg-rose-500 text-white'
                            : 'bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/30'
                        }`}
                      >
                        {isPlayingPreview ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>หยุดฟัง</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>ทดลองฟัง</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleStartRecording}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>อัดใหม่</span>
                      </button>
                    </div>
                  </div>

                  {/* Sound Name Input & Direct Save */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="text"
                      value={customSoundName}
                      onChange={(e) => setCustomSoundName(e.target.value.toUpperCase())}
                      placeholder="ตั้งชื่อเสียง (เช่น MY VOX 1)"
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00f0ff]"
                    />

                    <button
                      type="button"
                      onClick={handleSaveToPad}
                      className="px-5 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-black text-xs tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4" />
                      <span>✅ บันทึกลง PAD ทันที</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: FILE UPLOAD */}
          {/* ======================================================== */}
          {activeTab === 'FILE' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#00f0ff]/40 hover:border-[#00f0ff] rounded-3xl p-8 bg-black/40 hover:bg-[#00f0ff]/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-3 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#00f0ff]/15 group-hover:bg-[#00f0ff]/25 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] transition-all group-hover:scale-110 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                  <FolderOpen className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-white tracking-wide">
                    คลิกเพื่อเลือกไฟล์เสียง หรือลากไฟล์มาวางที่นี่
                  </h4>
                  <p className="text-xs text-slate-400">
                    รองรับไฟล์เสียงมาตรฐาน: .WAV, .MP3, .M4A, .AAC, .OGG, .AIFF
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                >
                  เลือกไฟล์จากคอมพิวเตอร์ / โทรศัพท์
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {recordedBuffer && (
                <div className="p-4 rounded-2xl bg-[#0e172a] border border-[#00f0ff]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      ไฟล์พร้อมใช้งาน: {customSoundName} ({recordedBuffer.duration.toFixed(2)}s)
                    </span>
                    <button
                      type="button"
                      onClick={handleTogglePreview}
                      className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>ลองฟัง</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={customSoundName}
                      onChange={(e) => setCustomSoundName(e.target.value.toUpperCase())}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00f0ff]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveToPad}
                      className="px-5 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-black text-xs tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกลง PAD</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: PROCEDURAL SYNTH SOUNDS */}
          {/* ======================================================== */}
          {activeTab === 'SYNTH' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#0e172a] border border-white/10 text-xs text-slate-300">
                <span className="font-bold text-[#00f0ff]">✨ โหมดสร้างเสียงจำลองทันที:</span> ไม่ต้องใช้ไมค์ ระบบจะคำนวณคลื่นเสียงสังเคราะห์สไตล์บีทบ็อกซ์และ Vocal ให้พร้อมใช้งานในคลิกเดียว
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { key: 'vocal-chop-1', label: 'VOX AHH 1', desc: 'เสียงพูดทุ้ม' },
                  { key: 'vocal-chop-2', label: 'VOX HEY!', desc: 'เสียงตะโกนไฮป์' },
                  { key: 'vocal-chop-3', label: 'VOX OOH', desc: 'เสียงฮัมโซล' },
                  { key: 'vocal-chop-4', label: 'VOX YEA', desc: 'เสียงแร็พ' },
                  { key: 'procedural-kick', label: 'BOX KICK', desc: 'บีทบ็อกซ์กระเดื่อง' },
                  { key: 'procedural-snare', label: 'BOX SNARE', desc: 'สแนร์เคาะปาก' },
                  { key: 'laser-zap', label: 'LASER FX', desc: 'เสียงเลเซอร์ไซไฟ' },
                  { key: 'synth-sub-bass', label: 'SUB 808', desc: 'เบสต่ำสไตล์ดริฟท์' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleGenerateSynthSound(item.key, item.label)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-[#00f0ff]/15 border border-white/10 hover:border-[#00f0ff]/50 text-left transition-all group flex flex-col justify-between h-20"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white group-hover:text-[#00f0ff]">
                        {item.label}
                      </span>
                      <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#00f0ff]" />
                    </div>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>

              {recordedBuffer && (
                <div className="p-4 rounded-2xl bg-[#0e172a] border border-[#00f0ff]/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">
                      เลือกเสียง: {customSoundName}
                    </span>
                    <button
                      type="button"
                      onClick={handleTogglePreview}
                      className="px-3 py-1.5 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] text-xs font-bold flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>ลองฟัง</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={customSoundName}
                      onChange={(e) => setCustomSoundName(e.target.value.toUpperCase())}
                      className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#00f0ff]"
                    />
                    <button
                      type="button"
                      onClick={handleSaveToPad}
                      className="px-5 py-2 rounded-xl bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black font-black text-xs tracking-wide shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>บันทึกลง PAD</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#0d1424] flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Tip: สามารถอัดเสียงสั้นๆ 1-3 วินาทีแล้วใช้ระบบสับเสียง (Chop) ต่อได้
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition-all"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
