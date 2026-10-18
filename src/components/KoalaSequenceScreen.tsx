import React, { useRef, useEffect, useState } from 'react';
import { PadData, BankId } from '../types/sampler';
import {
  Play,
  Pause,
  Circle,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Music,
  Zap,
  Trash2,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';
import { TrackSoundPickerModal } from './TrackSoundPickerModal';
import { DEMO_PATTERNS } from '../audio/presetKits';

interface KoalaSequenceScreenProps {
  isPlaying: boolean;
  isRecording: boolean;
  onTogglePlay: () => void;
  onToggleRecord: () => void;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  metronome: boolean;
  onToggleMetronome: () => void;
  
  // Patterns (8 pattern slots)
  patterns: boolean[][][]; // 8 patterns x 16 tracks x 16 steps
  activePatternIdx: number;
  queuedPatternIdx?: number | null;
  onSelectPattern: (idx: number) => void;
  onToggleStep: (trackIdx: number, stepIdx: number) => void;
  onClearPattern: () => void;
  onLoadDemoPattern: (patternIdx: number) => void;
  swing: number;
  onChangeSwing: (swing: number) => void;

  // Track to Pad mapping
  trackPadAssignments: number[];
  onChangeTrackPad: (trackIdx: number, padId: number) => void;
  
  // Pads
  pads: PadData[];
  activeBank: BankId;
  onSelectBank: (bank: BankId) => void;
  triggeredPadId: number | null;
  selectedPadId: number;
  onTriggerPad: (pad: PadData) => void;
  onSelectPad: (pad: PadData) => void;
  onQuickMicRecord: (padId: number) => void;
  onEditPad: (pad: PadData) => void;
  isRecordingMic: boolean;
  recordingTargetPadId: number | null;

  // Actions
  onUndo: () => void;
  onClear: () => void;
  barLength: number; // 1, 2, 4
  onChangeBarLength: (bars: number) => void;
  isKeyboardMode: boolean;
  onToggleKeyboardMode: () => void;
  onSwitchToSampleTab: () => void;
  
  // Current step animation
  currentStep: number;
  shortcutKeys: string[];
}

export const KoalaSequenceScreen: React.FC<KoalaSequenceScreenProps> = ({
  isPlaying,
  isRecording,
  onTogglePlay,
  onToggleRecord,
  bpm,
  onChangeBpm,
  metronome,
  onToggleMetronome,
  patterns,
  activePatternIdx,
  queuedPatternIdx = null,
  onSelectPattern,
  onToggleStep,
  onClearPattern,
  onLoadDemoPattern,
  swing,
  onChangeSwing,
  trackPadAssignments,
  onChangeTrackPad,
  pads,
  activeBank,
  onSelectBank,
  triggeredPadId,
  selectedPadId,
  onTriggerPad,
  onSelectPad,
  onQuickMicRecord,
  onEditPad,
  isRecordingMic,
  recordingTargetPadId,
  onUndo,
  onClear,
  barLength,
  onChangeBarLength,
  isKeyboardMode,
  onToggleKeyboardMode,
  onSwitchToSampleTab,
  currentStep,
  shortcutKeys,
}) => {
  // View mode: 'GRID' (Step Sequencer) or 'PADS' (Koala 4x4 Pads)
  const [sequenceView, setSequenceView] = useState<'GRID' | 'PADS'>('GRID');

  // Track Sound Picker Modal state
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerTrackIdx, setPickerTrackIdx] = useState<number>(0);

  // Visible tracks in Step Grid (16 full tracks so no notes are hidden!)
  const [visibleTrackCount, setVisibleTrackCount] = useState<number>(16);

  const bankOffset = ['A', 'B', 'C', 'D'].indexOf(activeBank) * 16;
  const currentBankPads = pads.slice(bankOffset, bankOffset + 16);
  const selectedPad = pads.find((p) => p.id === selectedPadId) || currentBankPads[0] || pads[0];

  // Helper to open sound picker for a specific track
  const handleOpenSoundPicker = (tIdx: number) => {
    setPickerTrackIdx(tIdx);
    setPickerModalOpen(true);
  };

  // Quick fill patterns for a track
  const handleQuickFill = (trackIdx: number, type: '4-beat' | '2-beat' | 'clear') => {
    for (let step = 0; step < 16; step++) {
      const isCurrentlyActive = patterns[activePatternIdx]?.[trackIdx]?.[step] || false;
      let shouldBeActive = false;
      if (type === '4-beat') {
        shouldBeActive = step % 4 === 0;
      } else if (type === '2-beat') {
        shouldBeActive = step % 2 === 0;
      } else if (type === 'clear') {
        shouldBeActive = false;
      }

      if (isCurrentlyActive !== shouldBeActive) {
        onToggleStep(trackIdx, step);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto select-none">
      {/* 1. Main View Switcher: [สเต็ปซีเควนเซอร์ (STEP GRID)] vs [แป้นกดสด (PADS)] */}
      <div className="flex items-center justify-between gap-2 p-1 bg-[#090d16] border-2 border-[#00f0ff]/30 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={() => setSequenceView('GRID')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer ${
            sequenceView === 'GRID'
              ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_#00f0ff]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>สร้างจังหวะเอง (STEP GRID)</span>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-bold ml-1">
            เลือกเสียงได้อิสระ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSequenceView('PADS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black tracking-wider transition-all cursor-pointer ${
            sequenceView === 'PADS'
              ? 'bg-[#00f0ff] text-black shadow-[0_0_20px_#00f0ff]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Music className="w-4 h-4" />
          <span>แป้นกดสด KOALA (PADS)</span>
          <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-black/20 font-bold ml-1">
            4x4 Pads
          </span>
        </button>
      </div>

      {/* 2. Top Shared Transport Bar (Play, Rec, BPM, Metronome, Swing, Pattern Slots) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 bg-[#0c1017] border border-[#00f0ff]/20 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        {/* Play, Rec, Metronome */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#07090e] border border-white/10 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={onTogglePlay}
              className={`w-12 h-9 flex items-center justify-center rounded-lg transition-all ${
                isPlaying
                  ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_#00f0ff]'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onToggleRecord}
              className={`w-12 h-9 flex items-center justify-center rounded-lg transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-[0_0_15px_#f43f5e] animate-pulse'
                  : 'text-rose-500/80 hover:text-rose-400 hover:bg-white/5'
              }`}
            >
              <Circle className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* BPM Box */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#07090e] border border-[#00f0ff]/30 rounded-xl shadow-inner">
            <input
              type="number"
              min={50}
              max={200}
              value={bpm}
              onChange={(e) => onChangeBpm(Math.max(40, Math.min(220, Number(e.target.value))))}
              className="w-12 bg-transparent font-mono-numbers text-sm font-extrabold text-[#00f0ff] focus:outline-none text-right"
            />
            <span className="text-[10px] font-bold text-white/50 tracking-wider">BPM</span>
          </div>

          {/* Swing */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#07090e] border border-white/10 rounded-xl">
            <span className="text-[10px] font-bold text-white/50">SWING</span>
            <input
              type="range"
              min="0"
              max="50"
              value={swing}
              onChange={(e) => onChangeSwing(Number(e.target.value))}
              className="w-14 accent-[#00f0ff] cursor-pointer"
            />
            <span className="font-mono-numbers text-xs text-white font-bold w-6 text-right">
              {swing}%
            </span>
          </div>

          {/* Metronome */}
          <button
            type="button"
            onClick={onToggleMetronome}
            title="เสียงติ๊กจังหวะ (Click)"
            className={`w-10 h-9 flex items-center justify-center rounded-xl border transition-all ${
              metronome
                ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                : 'bg-[#07090e] border-white/10 text-white/40 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        {/* Patterns Bank (8 Pattern Slots) */}
        <div className="flex items-center gap-1 flex-1 max-w-sm">
          <button
            type="button"
            onClick={() => onSelectPattern((activePatternIdx - 1 + 8) % 8)}
            className="w-6 h-8 flex items-center justify-center text-white/40 hover:text-[#00f0ff] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 grid grid-cols-4 grid-rows-2 gap-1 p-1 bg-[#07090e] border border-white/10 rounded-xl">
            {Array.from({ length: 8 }).map((_, pIdx) => {
              const isActive = activePatternIdx === pIdx;
              const isQueued = queuedPatternIdx === pIdx;
              const patternData = patterns[pIdx] || [];
              const hasData = patternData.some((row) => row.some((step) => step));

              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => onSelectPattern(pIdx)}
                  title={
                    isQueued
                      ? `P${pIdx + 1}: กำลังรอจบห้องเพื่อสลับมาเล่น`
                      : isActive
                      ? `P${pIdx + 1}: กำลังเล่นอยู่`
                      : `P${pIdx + 1}: แตะเพื่อสลับ (รอจบห้อง)`
                  }
                  className={`relative h-6 sm:h-7 rounded border flex items-center justify-center px-1 overflow-hidden transition-all ${
                    isQueued
                      ? 'border-amber-400 bg-amber-500/30 text-amber-300 font-extrabold animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                      : isActive
                      ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff] font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                      : hasData
                      ? 'border-white/20 bg-[#121824] text-white/80 hover:border-white/40'
                      : 'border-white/5 bg-transparent text-white/20 hover:text-white/40'
                  }`}
                >
                  <span className="text-[10px] font-mono-numbers">
                    {isQueued ? `>P${pIdx + 1}` : `P${pIdx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onSelectPattern((activePatternIdx + 1) % 8)}
            className="w-6 h-8 flex items-center justify-center text-white/40 hover:text-[#00f0ff] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Clear & Undo Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onUndo}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all"
            title="ย้อนกลับ (Undo)"
          >
            UNDO
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition-all"
            title="ล้าง Pattern นี้"
          >
            CLEAR
          </button>
        </div>
      </div>

      {/* VIEW A: STEP SEQUENCER GRID (สร้างจังหวะเอง พร้อมตัวเลือกเสียงทุกแทร็ก) */}
      {sequenceView === 'GRID' && (
        <div className="flex flex-col gap-3 p-3 sm:p-4 bg-[#0a0d14] border border-[#00f0ff]/25 rounded-3xl shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
          {/* Preset Beats Strip */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-[#00f0ff] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>พรีเซ็ตจังหวะ:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DEMO_PATTERNS.map((demo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onLoadDemoPattern(idx)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/5 hover:bg-[#00f0ff]/20 text-slate-300 hover:text-[#00f0ff] border border-white/10 hover:border-[#00f0ff]/40 transition-all"
                  >
                    {demo.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Track count toggle */}
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setVisibleTrackCount(visibleTrackCount === 8 ? 16 : 8)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold border border-white/10 transition-colors"
              >
                {visibleTrackCount === 8 ? 'แสดงครบ 16 แทร็ก ▼' : 'แสดง 8 แทร็กหลัก ▲'}
              </button>
            </div>
          </div>

          {/* Step Header (Numbers 1-16 with 4-beat quarter division) */}
          <div className="flex items-center gap-1.5 pl-36 sm:pl-48 overflow-x-auto pb-1">
            {Array.from({ length: 16 }).map((_, stepIdx) => {
              const isCur = isPlaying && currentStep === stepIdx;
              const isQuarter = stepIdx % 4 === 0;

              return (
                <div
                  key={stepIdx}
                  className={`flex-1 min-w-[28px] sm:min-w-[34px] py-1 text-center rounded text-[10px] font-mono-numbers font-black transition-all ${
                    isCur
                      ? 'bg-white text-black shadow-[0_0_12px_#00f0ff] scale-105 ring-2 ring-[#00f0ff]'
                      : isQuarter
                      ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                      : 'bg-white/5 text-white/40'
                  }`}
                >
                  {stepIdx + 1}
                </div>
              );
            })}
          </div>

          {/* Multitrack Step Rows */}
          <div className="flex flex-col gap-2 max-h-[62vh] overflow-y-auto pr-1">
            {Array.from({ length: visibleTrackCount }).map((_, trackIdx) => {
              const assignedPadId = trackPadAssignments[trackIdx] ?? trackIdx;
              const pad = pads.find((p) => p.id === assignedPadId) || pads[trackIdx] || pads[0];
              const padNumberInBank = (pad.id % 16) + 1;
              const trackSteps = patterns[activePatternIdx]?.[trackIdx] || Array(16).fill(false);

              return (
                <div
                  key={trackIdx}
                  className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#0e1320] border border-white/10 hover:border-white/20 transition-all"
                >
                  {/* Track Info & Sound Picker Button */}
                  <div className="w-34 sm:w-46 shrink-0 flex items-center justify-between gap-1.5 pr-1">
                    {/* Sound Selector Card (Click to open Sound Picker) */}
                    <button
                      type="button"
                      onClick={() => handleOpenSoundPicker(trackIdx)}
                      title={`คลิกเพื่อเลือกเปลี่ยนเสียง Track ${trackIdx + 1}`}
                      className="flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-xl border transition-all text-left group overflow-hidden bg-black/40 hover:bg-[#00f0ff]/10 hover:border-[#00f0ff]/50 cursor-pointer"
                      style={{
                        borderColor: `${pad.color}50`,
                      }}
                    >
                      {/* Bank & Pad tag */}
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: pad.color }}
                      >
                        {pad.bank}{padNumberInBank}
                      </span>

                      {/* Name */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-[11px] font-extrabold text-white truncate group-hover:text-[#00f0ff]">
                          {pad.name}
                        </span>
                        <span className="text-[9px] text-[#00f0ff] font-medium flex items-center gap-0.5">
                          <span>เปลี่ยนเสียง</span>
                          <ChevronDown className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </button>

                    {/* Audition Play Button */}
                    <button
                      type="button"
                      onClick={() => onTriggerPad(pad)}
                      title="ฟังเสียง Pad นี้"
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-[#00f0ff]/20 text-slate-300 hover:text-[#00f0ff] transition-colors"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Quick Fill Dropdown or Menu */}
                    <button
                      type="button"
                      onClick={() => handleQuickFill(trackIdx, '4-beat')}
                      title="ใส่ทุก 4 สเต็ป (4-on-the-floor)"
                      className="hidden sm:inline-flex px-1.5 py-1 text-[9px] font-bold rounded bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white"
                    >
                      4Beat
                    </button>
                  </div>

                  {/* 16 Interactive Step Buttons */}
                  <div className="flex-1 grid grid-cols-16 gap-1 min-w-[340px]">
                    {Array.from({ length: 16 }).map((_, stepIdx) => {
                      const isActive = trackSteps[stepIdx] || false;
                      const isCur = isPlaying && currentStep === stepIdx;
                      const isQuarter = stepIdx % 4 === 0;

                      return (
                        <button
                          key={stepIdx}
                          type="button"
                          onClick={() => onToggleStep(trackIdx, stepIdx)}
                          title={`Track ${trackIdx + 1} (${pad.name}) - Step ${stepIdx + 1}`}
                          className={`h-9 sm:h-10 rounded-lg cursor-pointer transition-all flex items-center justify-center relative overflow-hidden ${
                            isActive
                              ? isCur
                                ? 'brightness-150 scale-95 shadow-[0_0_15px_#fff] ring-2 ring-white'
                                : 'shadow-md shadow-black/40'
                              : isCur
                              ? 'bg-white/30 ring-1 ring-[#00f0ff]'
                              : isQuarter
                              ? 'bg-white/10 hover:bg-white/20'
                              : 'bg-black/40 hover:bg-white/10'
                          }`}
                          style={{
                            backgroundColor: isActive ? pad.color : undefined,
                          }}
                        >
                          {/* Step number on inactive beat quarters */}
                          {!isActive && (
                            <span
                              className={`text-[8px] font-mono-numbers font-bold ${
                                isQuarter ? 'text-white/40' : 'text-white/15'
                              }`}
                            >
                              {stepIdx + 1}
                            </span>
                          )}

                          {/* Active note visual badge */}
                          {isActive && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW B: AUTHENTIC KOALA 4X4 PADS (แป้นกดสด พร้อมคลื่นเสียงและตัววิ่ง) */}
      {sequenceView === 'PADS' && (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
          {/* Action Strip (Keyboard Mode Icon, UNDO, CLEAR, 1 BAR Dropdown) */}
          <div className="flex items-center justify-between gap-1.5 px-1">
            <button
              type="button"
              onClick={onToggleKeyboardMode}
              title="โหมดคีย์บอร์ดเปียโน"
              className={`flex items-center justify-center px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                isKeyboardMode
                  ? 'bg-[#00f0ff] text-black border-[#00f0ff] shadow-[0_0_10px_#00f0ff]'
                  : 'bg-[#0c1017] text-white/80 border-white/10 hover:text-white'
              }`}
            >
              <div className="flex h-3 w-5 border border-current rounded-xs overflow-hidden">
                <div className="w-1 border-r border-current bg-white" />
                <div className="w-1 border-r border-current bg-white relative">
                  <div className="absolute top-0 right-0 w-0.5 h-1.5 bg-black" />
                </div>
                <div className="w-1 border-r border-current bg-white" />
                <div className="w-1 border-r border-current bg-white relative">
                  <div className="absolute top-0 right-0 w-0.5 h-1.5 bg-black" />
                </div>
                <div className="w-1 bg-white" />
              </div>
            </button>

            <button
              type="button"
              onClick={onUndo}
              className="flex-1 py-1.5 px-2 bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 text-center"
            >
              UNDO
            </button>

            <button
              type="button"
              onClick={onClear}
              className="flex-1 py-1.5 px-2 bg-white text-rose-600 hover:bg-rose-50 text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 text-center"
            >
              CLEAR
            </button>

            <button
              type="button"
              onClick={() => onChangeBarLength(barLength === 1 ? 2 : barLength === 2 ? 4 : 1)}
              className="py-1.5 px-2.5 bg-white text-slate-950 hover:bg-slate-200 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center justify-center gap-1"
            >
              <span>{barLength} BAR{barLength > 1 ? 'S' : ''}</span>
              <span className="text-[9px] text-rose-600">▲</span>
            </button>
          </div>

          {/* 16-Step LED Runner Bar */}
          <div className="flex items-center gap-1.5 p-2 bg-[#080c14] border border-[#00f0ff]/25 rounded-2xl shadow-inner">
            <div className="flex items-center gap-1 text-[9px] font-mono-numbers font-extrabold text-[#00f0ff] px-2 py-0.5 bg-[#00f0ff]/10 rounded border border-[#00f0ff]/30">
              <Zap className="w-3 h-3 text-[#00f0ff] animate-pulse" />
              <span>STEP</span>
              <span className="text-white text-xs">{isPlaying ? currentStep + 1 : '--'}/16</span>
            </div>
            <div className="flex-1 grid grid-cols-16 gap-1 h-5 items-center">
              {Array.from({ length: 16 }).map((_, stepIdx) => {
                const isCur = isPlaying && currentStep === stepIdx;
                const isDownBeat = stepIdx % 4 === 0;
                return (
                  <div
                    key={stepIdx}
                    className={`relative h-full rounded flex items-center justify-center transition-all ${
                      isCur
                        ? 'bg-white shadow-[0_0_15px_#00f0ff,0_0_5px_#fff] scale-110 z-10 ring-2 ring-[#00f0ff]'
                        : isDownBeat
                        ? 'bg-[#00f0ff]/25 border border-[#00f0ff]/50 text-[#00f0ff]'
                        : 'bg-white/5 border border-white/5 text-white/30'
                    }`}
                  >
                    <span className={`text-[8px] font-mono-numbers font-bold ${isCur ? 'text-black font-extrabold' : ''}`}>
                      {stepIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Pad Waveform HUD with Live Laser Running Playhead */}
          {selectedPad && (
            <SelectedPadWaveformHUD
              pad={selectedPad}
              onTrigger={() => onTriggerPad(selectedPad)}
              onEdit={() => onEditPad(selectedPad)}
              onOpenSamplesTab={onSwitchToSampleTab}
            />
          )}

          {/* Chunky 16 Pads (4x4 Matrix with real-time running playhead on each pad) */}
          <div className="grid grid-cols-4 gap-2 sm:gap-2.5 p-2.5 sm:p-3 bg-[#0a0d14] rounded-3xl border border-[#00f0ff]/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
            {currentBankPads.map((pad, idx) => {
              const hasAudio = !!pad.audioBuffer;
              const isTriggered = triggeredPadId === pad.id;
              const isSelected = selectedPadId === pad.id;

              return (
                <PadBox
                  key={pad.id}
                  pad={pad}
                  shortcutKey={shortcutKeys[idx]}
                  hasAudio={hasAudio}
                  isTriggered={isTriggered}
                  isSelected={isSelected}
                  onTrigger={() => onTriggerPad(pad)}
                  onSelect={() => onSelectPad(pad)}
                  onEdit={() => onEditPad(pad)}
                  isRecording={isRecordingMic && recordingTargetPadId === pad.id}
                />
              );
            })}
          </div>

          {/* Bottom Bank Switcher: A, B, C, D + ^ SAMPLES Toggle */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="w-16" />
            <div className="flex items-center gap-1.5 p-1 bg-[#090d14] border border-white/10 rounded-xl">
              {(['A', 'B', 'C', 'D'] as BankId[]).map((bank) => (
                <button
                  key={bank}
                  type="button"
                  onClick={() => onSelectBank(bank)}
                  className={`w-10 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                    activeBank === bank
                      ? 'bg-[#00f0ff] text-black shadow-[0_0_15px_#00f0ff]'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {bank}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onSwitchToSampleTab}
              className="text-xs font-bold text-white/50 hover:text-[#00f0ff] transition-colors flex items-center gap-1"
            >
              <span>^ SAMPLES</span>
            </button>
          </div>
        </div>
      )}

      {/* Track Sound Picker Modal */}
      <TrackSoundPickerModal
        isOpen={pickerModalOpen}
        onClose={() => setPickerModalOpen(false)}
        trackIdx={pickerTrackIdx}
        currentPadId={trackPadAssignments[pickerTrackIdx] ?? pickerTrackIdx}
        pads={pads}
        onSelectPad={(tIdx, pId) => {
          onChangeTrackPad(tIdx, pId);
        }}
        onPreviewPad={(p) => onTriggerPad(p)}
      />
    </div>
  );
};

// Compact Waveform HUD with Live Laser Running Playhead for the Selected Pad
const SelectedPadWaveformHUD: React.FC<{
  pad: PadData;
  onTrigger: () => void;
  onEdit: () => void;
  onOpenSamplesTab: () => void;
}> = ({ pad, onTrigger, onEdit, onOpenSamplesTab }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playheadRef = useRef<HTMLDivElement | null>(null);
  const sweepRef = useRef<HTMLDivElement | null>(null);
  const timeBadgeRef = useRef<HTMLSpanElement | null>(null);

  // Draw Waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Dark maroon / cyber background
    ctx.fillStyle = '#10030a';
    ctx.fillRect(0, 0, width, height);

    // Grid baseline
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!pad.audioBuffer) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO AUDIO', width / 2, height / 2 + 3);
      return;
    }

    const data = pad.audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.8)';

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const yMin = (1 + min) * amp;
      const yMax = Math.max(yMin + 1.2, (1 + max) * amp);
      ctx.fillRect(i, yMin, 1.2, yMax - yMin);
    }
    ctx.shadowBlur = 0;
  }, [pad.audioBuffer, pad.name]);

  // 60FPS Laser Playhead Animation Loop (ตัววิ่งตำแหน่งเสียง)
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const details = audioEngine.getPadPlaybackDetails(pad.id);

      if (details !== null && playheadRef.current && sweepRef.current) {
        const pct = details.globalProgress * 100;
        playheadRef.current.style.display = 'block';
        playheadRef.current.style.left = `${pct}%`;

        sweepRef.current.style.display = 'block';
        sweepRef.current.style.left = `${(pad.startTrim ?? 0) * 100}%`;
        sweepRef.current.style.width = `${Math.max(1, pct - (pad.startTrim ?? 0) * 100)}%`;

        if (timeBadgeRef.current) {
          timeBadgeRef.current.textContent = `▶ ${details.currentTime.toFixed(2)}s / ${details.totalTime.toFixed(2)}s (${Math.round(details.sliceProgress * 100)}%)`;
          timeBadgeRef.current.style.display = 'inline-block';
        }
      } else {
        if (playheadRef.current) playheadRef.current.style.display = 'none';
        if (sweepRef.current) sweepRef.current.style.display = 'none';
        if (timeBadgeRef.current) timeBadgeRef.current.style.display = 'none';
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [pad.id, pad.startTrim, pad.endTrim]);

  return (
    <div className="relative p-2 bg-[#090308] border border-[#00f0ff]/30 rounded-2xl overflow-hidden shadow-inner flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
          <span className="font-extrabold text-white">{pad.name}</span>
          <span className="text-[10px] text-[#00f0ff] font-mono-numbers">
            {pad.bank}{(pad.id % 16) + 1}
          </span>
          {/* Running time badge */}
          <span
            ref={timeBadgeRef}
            className="text-[10px] font-mono-numbers text-[#00f0ff] font-extrabold px-1.5 py-0.5 rounded bg-[#00f0ff]/20 border border-[#00f0ff]/40 hidden"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onTrigger}
            className="px-2 py-0.5 bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 text-[#00f0ff] border border-[#00f0ff]/40 text-[10px] font-bold rounded-md transition-colors"
          >
            ▶ PLAY
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-md transition-colors"
          >
            EDIT
          </button>
          <button
            type="button"
            onClick={onOpenSamplesTab}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-md transition-colors"
          >
            ^ FULL
          </button>
        </div>
      </div>

      {/* Waveform View with Laser Playhead Runner */}
      <div className="relative w-full h-12 bg-black/60 rounded-xl overflow-hidden border border-white/10">
        <canvas
          ref={canvasRef}
          width={600}
          height={60}
          className="w-full h-full block"
        />

        {/* Luminous Glowing Sweep Overlay */}
        <div
          ref={sweepRef}
          className="absolute top-0 bottom-0 pointer-events-none bg-gradient-to-r from-[#00f0ff]/10 to-[#00f0ff]/30 border-r border-[#00f0ff]/60 hidden"
        />

        {/* Laser Runner Needle (เส้นตัววิ่งตามเสียงจริง) */}
        <div
          ref={playheadRef}
          className="absolute top-0 bottom-0 w-1 bg-white pointer-events-none shadow-[0_0_12px_#00f0ff,0_0_4px_#fff] z-20 hidden -translate-x-1/2"
        >
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#00f0ff] rotate-45 shadow-[0_0_8px_#00f0ff]" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-[#00f0ff] rotate-45 shadow-[0_0_8px_#00f0ff]" />
        </div>
      </div>
    </div>
  );
};

// PadBox Component with Individual Real-Time Playhead Runner
const PadBox: React.FC<{
  pad: PadData;
  shortcutKey: string;
  hasAudio: boolean;
  isTriggered: boolean;
  isSelected: boolean;
  onTrigger: () => void;
  onSelect: () => void;
  onEdit: () => void;
  isRecording: boolean;
}> = ({
  pad,
  shortcutKey,
  hasAudio,
  isTriggered,
  isSelected,
  onTrigger,
  onSelect,
  onEdit,
  isRecording,
}) => {
  const runnerRef = useRef<HTMLDivElement | null>(null);
  const runnerSweepRef = useRef<HTMLDivElement | null>(null);

  // Pad playhead runner loop
  useEffect(() => {
    let animId: number;

    const tick = () => {
      const details = audioEngine.getPadPlaybackDetails(pad.id);

      if (details !== null && runnerRef.current && runnerSweepRef.current) {
        const pct = details.globalProgress * 100;
        runnerRef.current.style.display = 'block';
        runnerRef.current.style.left = `${pct}%`;

        runnerSweepRef.current.style.display = 'block';
        runnerSweepRef.current.style.width = `${pct}%`;
      } else {
        if (runnerRef.current) runnerRef.current.style.display = 'none';
        if (runnerSweepRef.current) runnerSweepRef.current.style.display = 'none';
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [pad.id]);

  return (
    <div
      onClick={() => {
        onSelect();
        onTrigger();
      }}
      className={`relative aspect-square rounded-2xl flex flex-col justify-between p-2.5 cursor-pointer transition-all duration-75 select-none overflow-hidden ${
        isTriggered
          ? 'scale-95 brightness-125 shadow-[0_0_25px_#00f0ff] z-10'
          : isSelected
          ? 'ring-2 ring-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]'
          : 'hover:brightness-110'
      } ${
        hasAudio
          ? 'bg-[#00f0ff] text-black shadow-md font-bold'
          : 'bg-[#180612] text-white/50 border border-white/5 hover:border-white/20'
      } ${isRecording ? 'ring-4 ring-rose-500 animate-pulse' : ''}`}
    >
      {/* Individual Pad Playhead Sweep Overlay */}
      <div
        ref={runnerSweepRef}
        className="absolute inset-y-0 left-0 bg-white/30 pointer-events-none hidden z-0"
      />

      {/* Individual Pad Playhead Laser Runner (ตัววิ่งตำแหน่งเสียงบน Pad) */}
      <div
        ref={runnerRef}
        className="absolute top-0 bottom-0 w-1 bg-white pointer-events-none shadow-[0_0_8px_#ffffff] z-10 hidden -translate-x-1/2"
      />

      {/* Top row: Pad Bank Index & Shortcut */}
      <div className="flex items-center justify-between z-10">
        <span
          className={`text-[10px] font-mono-numbers font-black ${
            hasAudio ? 'text-black/80' : 'text-white/40'
          }`}
        >
          {pad.bank}{(pad.id % 16) + 1}
        </span>

        {shortcutKey && (
          <span
            className={`text-[9px] font-mono-numbers px-1 rounded ${
              hasAudio ? 'bg-black/20 text-black font-extrabold' : 'bg-white/10 text-white/60'
            }`}
          >
            {shortcutKey}
          </span>
        )}
      </div>

      {/* Pad Center: Name */}
      <div className="flex flex-col items-center justify-center my-auto z-10 text-center">
        <span
          className={`text-xs font-black truncate max-w-full px-1 ${
            hasAudio ? 'text-black tracking-tight' : 'text-white/40 font-medium'
          }`}
        >
          {pad.name}
        </span>
      </div>

      {/* Bottom row: Edit button */}
      <div className="flex items-center justify-end z-10">
        {hasAudio && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 rounded-md bg-black/15 hover:bg-black/30 text-black transition-colors"
          >
            <Sliders className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
