import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Circle, RotateCcw, Trash2 } from 'lucide-react';

interface PatternSelectorBarProps {
  patterns: boolean[][][];
  activePatternIdx: number;
  queuedPatternIdx: number | null;
  onSelectPattern: (idx: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentStep: number;
  bpm: number;
  onChangeBpm?: (bpm: number) => void;
  onUndo?: () => void;
  onClear?: () => void;
  isRecording?: boolean;
  onToggleRecord?: () => void;
  compact?: boolean;
}

export const PatternSelectorBar: React.FC<PatternSelectorBarProps> = ({
  patterns,
  activePatternIdx,
  queuedPatternIdx,
  onSelectPattern,
  isPlaying,
  onTogglePlay,
  currentStep,
  bpm,
  onChangeBpm,
  onUndo,
  onClear,
  isRecording = false,
  onToggleRecord,
  compact = false,
}) => {
  return (
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 bg-[#090c14] border border-white/15 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.6)] select-none">
      {/* 1. Play & Record Transport */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onTogglePlay}
          title={isPlaying ? 'หยุดเล่น (Spacebar)' : 'เล่นเพลง (Spacebar)'}
          className={`h-8 sm:h-9 px-3 rounded-xl flex items-center justify-center font-black text-xs transition-all cursor-pointer ${
            isPlaying
              ? 'bg-emerald-400 text-black shadow-[0_0_15px_#34d399]'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {onToggleRecord && (
          <button
            type="button"
            onClick={onToggleRecord}
            title="อัดจังหวะสดลง Pattern (Live Record)"
            className={`h-8 sm:h-9 px-2.5 rounded-xl flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500 text-white shadow-[0_0_12px_#f43f5e] animate-pulse'
                : 'bg-white/5 text-rose-400/80 hover:bg-rose-500/20'
            }`}
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
          </button>
        )}

        {/* BPM Quick Display */}
        {onChangeBpm ? (
          <div className="hidden xs:flex items-center gap-1 px-2 py-1 bg-black/60 border border-white/10 rounded-lg">
            <input
              type="number"
              min={40}
              max={220}
              value={bpm}
              onChange={(e) => onChangeBpm(Math.max(40, Math.min(220, Number(e.target.value))))}
              className="w-10 bg-transparent font-mono-numbers text-xs font-black text-white focus:outline-none text-right"
            />
            <span className="text-[9px] font-bold text-white/50">BPM</span>
          </div>
        ) : (
          <div className="hidden xs:flex items-center gap-0.5 px-2 py-1 bg-black/40 rounded-lg font-mono-numbers text-xs text-white/70">
            <span>{bpm}</span>
            <span className="text-[9px] text-white/40">BPM</span>
          </div>
        )}
      </div>

      {/* 2. Patterns Bank (P1 to P8) with Quantized Cue Warning */}
      <div className="flex items-center gap-1 flex-1 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => onSelectPattern((activePatternIdx - 1 + 8) % 8)}
          title="Pattern ก่อนหน้า (รอจบห้องถ้ากำลังเล่น)"
          className="w-6 sm:w-7 h-8 sm:h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 grid grid-cols-8 gap-1 p-1 bg-black/60 border border-white/10 rounded-xl">
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
                    ? `P${pIdx + 1}: กำลังรอจบห้องเพื่อสลับมาเล่น (แตะอีกครั้งเพื่อยกเลิก)`
                    : isActive
                    ? `P${pIdx + 1}: กำลังเล่นอยู่`
                    : `P${pIdx + 1}: แตะเพื่อสลับ (รอจบห้องก่อน)`
                }
                className={`relative h-7 sm:h-8 rounded-lg flex flex-col items-center justify-center transition-all cursor-pointer ${
                  isQueued
                    ? 'bg-amber-500/30 border-2 border-amber-400 text-amber-300 font-black animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                    : isActive
                    ? 'bg-white text-black font-black shadow-[0_0_12px_rgba(255,255,255,0.6)]'
                    : hasData
                    ? 'bg-[#181d2c] border border-white/20 text-white/90 hover:border-white/50'
                    : 'bg-white/5 border border-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-mono-numbers font-black">
                  P{pIdx + 1}
                </span>

                {/* Has Data Dot */}
                {hasData && !isActive && !isQueued && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 -mt-0.5" />
                )}

                {/* Cue indicator tag */}
                {isQueued && (
                  <span className="text-[7px] font-black leading-none uppercase text-amber-300">
                    CUE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSelectPattern((activePatternIdx + 1) % 8)}
          title="Pattern ถัดไป (รอจบห้องถ้ากำลังเล่น)"
          className="w-6 sm:w-7 h-8 sm:h-9 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. Bar Progress & Quick Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Step / Measure Progress Indicator */}
        {isPlaying && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-black/50 border border-white/10 rounded-lg">
            <span className="text-[9px] font-bold text-white/50">STEP</span>
            <span className="font-mono-numbers text-xs font-black text-emerald-400 w-4 text-center">
              {currentStep + 1}
            </span>
            {queuedPatternIdx !== null && (
              <span className="text-[9px] font-extrabold text-amber-400 animate-pulse ml-1">
                → P{queuedPatternIdx + 1} (รอจบห้อง)
              </span>
            )}
          </div>
        )}

        {onUndo && (
          <button
            type="button"
            onClick={onUndo}
            title="ย้อนกลับการแก้ไข (Undo)"
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white text-[10px] font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            title={`ล้างโน้ตใน P${activePatternIdx + 1}`}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 text-[10px] font-bold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
