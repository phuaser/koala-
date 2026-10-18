import React, { useState } from 'react';
import { Play, Pause, Square, Volume2, RotateCcw, Sparkles } from 'lucide-react';
import { PadData } from '../types/sampler';
import { DEMO_PATTERNS } from '../audio/presetKits';

interface SequencerProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStop: () => void;
  currentStep: number;
  bpm: number;
  onChangeBpm: (bpm: number) => void;
  swing: number;
  onChangeSwing: (swing: number) => void;
  metronome: boolean;
  onToggleMetronome: () => void;
  pads: PadData[];
  selectedPadIndex: number;
  onSelectPadIndex: (index: number) => void;
  steps: boolean[][]; // 16 pads x 16 steps
  onToggleStep: (padIdx: number, stepIdx: number) => void;
  onClearPattern: () => void;
  onLoadDemoPattern: (patternIdx: number) => void;
}

export const Sequencer: React.FC<SequencerProps> = ({
  isPlaying,
  onTogglePlay,
  onStop,
  currentStep,
  bpm,
  onChangeBpm,
  swing,
  onChangeSwing,
  metronome,
  onToggleMetronome,
  pads,
  selectedPadIndex,
  onSelectPadIndex,
  steps,
  onToggleStep,
  onClearPattern,
  onLoadDemoPattern,
}) => {
  const [selectedDemo, setSelectedDemo] = useState(0);

  // Core 8 rhythm/melodic pads from Bank A
  const primaryTrackPads = pads.slice(0, 8);

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#111216] border border-white/10 rounded-2xl">
      {/* Top Controls: Transport, BPM, Swing, Metronome, Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        {/* Play / Stop buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
              isPlaying
                ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <button
            type="button"
            onClick={onStop}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            title="Stop & Reset"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onToggleMetronome}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              metronome
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>CLICK</span>
          </button>
        </div>

        {/* BPM & Swing Sliders */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-[11px] font-semibold">BPM</span>
            <input
              type="range"
              min="60"
              max="160"
              value={bpm}
              onChange={(e) => onChangeBpm(Number(e.target.value))}
              className="w-20 accent-orange-500 cursor-pointer"
            />
            <span className="font-mono-numbers font-bold text-white w-7 text-right">
              {bpm}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-white/50 text-[11px] font-semibold">SWING</span>
            <input
              type="range"
              min="0"
              max="50"
              value={swing}
              onChange={(e) => onChangeSwing(Number(e.target.value))}
              className="w-16 accent-orange-500 cursor-pointer"
            />
            <span className="font-mono-numbers font-bold text-white w-6 text-right">
              {swing}%
            </span>
          </div>
        </div>

        {/* Preset Patterns & Clear */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-lg border border-white/5">
            {DEMO_PATTERNS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedDemo(idx);
                  onLoadDemoPattern(idx);
                }}
                className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                  selectedDemo === idx
                    ? 'bg-orange-500 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {p.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearPattern}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-white/40 hover:text-rose-400 bg-white/5 hover:bg-rose-950/20 rounded-lg transition-colors"
            title="ล้างสเต็ปทั้งหมด"
          >
            <RotateCcw className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* 16-Step Multitrack Grid */}
      <div className="flex flex-col gap-1.5 overflow-x-auto pb-1">
        {/* Step Indicator Header (1 to 16 with 4 beats highlighting) */}
        <div className="flex items-center gap-1 pl-28 min-w-[540px]">
          {Array.from({ length: 16 }).map((_, stepIdx) => {
            const isQuarter = stepIdx % 4 === 0;
            const isCur = isPlaying && currentStep === stepIdx;
            return (
              <div
                key={stepIdx}
                className={`flex-1 text-center py-1 rounded text-[10px] font-mono-numbers font-bold transition-colors ${
                  isCur
                    ? 'bg-orange-500 text-black shadow-[0_0_8px_#f97316]'
                    : isQuarter
                    ? 'text-white/70 bg-white/5'
                    : 'text-white/30'
                }`}
              >
                {stepIdx + 1}
              </div>
            );
          })}
        </div>

        {/* Tracks for primary drum/chords */}
        {primaryTrackPads.map((pad, trackIdx) => {
          const isSelected = selectedPadIndex === trackIdx;
          return (
            <div
              key={pad.id}
              className={`flex items-center gap-1.5 p-1 rounded-lg transition-colors min-w-[540px] ${
                isSelected ? 'bg-white/5' : 'hover:bg-white/[0.02]'
              }`}
            >
              {/* Track Pad Label */}
              <button
                type="button"
                onClick={() => onSelectPadIndex(trackIdx)}
                className="w-26 shrink-0 text-left px-2 py-1.5 rounded flex items-center justify-between group cursor-pointer"
                style={{
                  borderLeft: `3px solid ${pad.color}`,
                }}
              >
                <span className="text-xs font-semibold text-white/90 truncate">
                  {pad.name}
                </span>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: pad.color }}
                />
              </button>

              {/* 16 Steps */}
              <div className="flex-1 grid grid-cols-16 gap-1">
                {Array.from({ length: 16 }).map((_, stepIdx) => {
                  const isActive = steps[trackIdx]?.[stepIdx] || false;
                  const isCurrent = isPlaying && currentStep === stepIdx;
                  const isBeatQuarter = stepIdx % 4 === 0;

                  return (
                    <button
                      key={stepIdx}
                      type="button"
                      onClick={() => onToggleStep(trackIdx, stepIdx)}
                      className={`h-8 rounded cursor-pointer transition-all ${
                        isActive
                          ? isCurrent
                            ? 'brightness-150 scale-95 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                            : 'shadow-sm'
                          : isCurrent
                          ? 'bg-white/25 ring-1 ring-white/50'
                          : isBeatQuarter
                          ? 'bg-white/10 hover:bg-white/20'
                          : 'bg-[#181a22] hover:bg-white/10'
                      }`}
                      style={{
                        backgroundColor: isActive ? pad.color : undefined,
                      }}
                      title={`Track: ${pad.name}, Step: ${stepIdx + 1}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
