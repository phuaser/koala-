import React, { useRef, useState } from 'react';
import { PerformanceFXState } from '../types/sampler';
import { Radio, Zap, Disc, Volume2, Sparkles, RefreshCw } from 'lucide-react';

interface PerformanceFXProps {
  fx: PerformanceFXState;
  onUpdateFX: (newFX: PerformanceFXState) => void;
  isResampling: boolean;
  onStartResample: () => void;
  onStopResample: () => void;
}

export const PerformanceFX: React.FC<PerformanceFXProps> = ({
  fx,
  onUpdateFX,
  isResampling,
  onStartResample,
  onStopResample,
}) => {
  const xyPadRef = useRef<HTMLDivElement | null>(null);
  const [isXYActive, setIsXYActive] = useState(false);

  // XY Touch Pad interaction for Filter Cutoff & Resonance
  const handleXYMove = (clientX: number, clientY: number) => {
    if (!xyPadRef.current) return;
    const rect = xyPadRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

    // X axis: Cutoff frequency (200Hz to 16000Hz) logarithmic
    const minFreq = 200;
    const maxFreq = 16000;
    const cutoff = Math.round(minFreq * Math.pow(maxFreq / minFreq, x));

    // Y axis: Resonance Q (0.5 to 12.0)
    const resonance = +(0.5 + (1 - y) * 11.5).toFixed(1);

    onUpdateFX({
      ...fx,
      filterActive: true,
      filterCutoff: cutoff,
      filterResonance: resonance,
    });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setIsXYActive(true);
    handleXYMove(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isXYActive) {
      handleXYMove(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsXYActive(false);
  };

  // Convert current cutoff to percentage for XY cursor dot
  const minFreq = 200;
  const maxFreq = 16000;
  const cursorX = Math.max(0, Math.min(100, (Math.log(fx.filterCutoff / minFreq) / Math.log(maxFreq / minFreq)) * 100));
  const cursorY = Math.max(0, Math.min(100, (1 - (fx.filterResonance - 0.5) / 11.5) * 100));

  return (
    <div className="flex flex-col gap-3 p-4 bg-[#111216] border border-white/10 rounded-2xl">
      {/* Top Title & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Koala Performance FX
          </h3>
          <span className="text-[11px] text-white/40">
            แตะหรือกดค้างเพื่อใส่เอฟเฟกต์สด
          </span>
        </div>

        {/* Resample Button */}
        <button
          type="button"
          onClick={() => {
            if (isResampling) {
              onStopResample();
            } else {
              onStartResample();
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
            isResampling
              ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]'
              : 'bg-white/10 text-white/90 hover:bg-white/20'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResampling ? 'animate-spin' : ''}`} />
          <span>{isResampling ? 'STOP RESAMPLE' : 'RESAMPLE OUT'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
        {/* XY Filter Pad */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span className="font-semibold text-white/80">XY FILTER TOUCH PAD</span>
            <div className="flex items-center gap-2 font-mono-numbers">
              <span>{fx.filterCutoff}Hz</span>
              <span>·</span>
              <span>Q: {fx.filterResonance}</span>
            </div>
          </div>

          <div
            ref={xyPadRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative h-28 sm:h-32 w-full bg-[#090a0d] rounded-xl border border-white/10 overflow-hidden cursor-crosshair touch-none select-none flex items-center justify-center group"
          >
            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none opacity-20">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="border border-white/30" />
              ))}
            </div>

            {/* Labels */}
            <span className="absolute bottom-1 left-2 text-[9px] font-mono-numbers text-white/30 pointer-events-none">
              CUTOFF (LP) →
            </span>
            <span className="absolute top-1 left-2 text-[9px] font-mono-numbers text-white/30 pointer-events-none">
              ↑ RESONANCE
            </span>

            {/* XY Touch Cursor */}
            <div
              className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full pointer-events-none transition-transform duration-75 flex items-center justify-center"
              style={{
                left: `${cursorX}%`,
                top: `${cursorY}%`,
                backgroundColor: isXYActive ? '#f97316' : 'rgba(249, 115, 22, 0.4)',
                boxShadow: isXYActive
                  ? '0 0 16px #f97316, 0 0 4px #fff'
                  : '0 0 8px rgba(249, 115, 22, 0.5)',
              }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>

            {/* Filter Reset / Bypass button */}
            {fx.filterActive && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateFX({
                    ...fx,
                    filterActive: false,
                    filterCutoff: 16000,
                    filterResonance: 0.7,
                  });
                }}
                className="absolute top-1 right-2 text-[10px] text-white/50 hover:text-white bg-black/50 px-1.5 py-0.5 rounded"
              >
                BYPASS
              </button>
            )}
          </div>
        </div>

        {/* Quick Punch FX Buttons */}
        <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* Tape Stop */}
          <button
            type="button"
            onPointerDown={() => onUpdateFX({ ...fx, tapeStopActive: true })}
            onPointerUp={() => onUpdateFX({ ...fx, tapeStopActive: false })}
            onPointerLeave={() => onUpdateFX({ ...fx, tapeStopActive: false })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              fx.tapeStopActive
                ? 'bg-rose-500/30 border-rose-400 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)] scale-95'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Disc className="w-4 h-4 mb-1 text-rose-400" />
            <span className="text-xs font-semibold">TAPE STOP</span>
            <span className="text-[9px] text-white/40 font-mono-numbers">VINYL BRAKE</span>
          </button>

          {/* Stutter / Repeat */}
          <button
            type="button"
            onClick={() => onUpdateFX({ ...fx, stutterActive: !fx.stutterActive })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              fx.stutterActive
                ? 'bg-amber-500/30 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Radio className="w-4 h-4 mb-1 text-amber-400" />
            <span className="text-xs font-semibold">STUTTER</span>
            <span className="text-[9px] text-white/40 font-mono-numbers">1/16 REPEAT</span>
          </button>

          {/* Lo-Fi Bitcrush & Saturation */}
          <button
            type="button"
            onClick={() => onUpdateFX({ ...fx, bitcrushActive: !fx.bitcrushActive })}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              fx.bitcrushActive
                ? 'bg-purple-500/30 border-purple-400 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 mb-1 text-purple-400" />
            <span className="text-xs font-semibold">LO-FI DIRT</span>
            <span className="text-[9px] text-white/40 font-mono-numbers">SATURATION</span>
          </button>

          {/* Reverb Space */}
          <button
            type="button"
            onClick={() =>
              onUpdateFX({
                ...fx,
                reverbActive: !fx.reverbActive,
                reverbWet: fx.reverbActive ? 0 : 0.45,
              })
            }
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              fx.reverbActive
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Volume2 className="w-4 h-4 mb-1 text-cyan-400" />
            <span className="text-xs font-semibold">REVERB</span>
            <span className="text-[9px] text-white/40 font-mono-numbers">SPACE AMBIENCE</span>
          </button>

          {/* Stereo Echo / Delay */}
          <button
            type="button"
            onClick={() =>
              onUpdateFX({
                ...fx,
                delayActive: !fx.delayActive,
              })
            }
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
              fx.delayActive
                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
            }`}
          >
            <Radio className="w-4 h-4 mb-1 text-emerald-400" />
            <span className="text-xs font-semibold">ECHO DELAY</span>
            <span className="text-[9px] text-white/40 font-mono-numbers">TEMPO SYNC</span>
          </button>

          {/* Pitch Transpose Shift */}
          <div className="flex flex-col justify-between p-2 rounded-xl border border-white/10 bg-white/5">
            <span className="text-[10px] text-center font-semibold text-white/80">GLOBAL PITCH</span>
            <div className="flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={() => onUpdateFX({ ...fx, pitchShift: Math.max(-12, fx.pitchShift - 1) })}
                className="w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-white/10 rounded text-xs font-bold"
              >
                -
              </button>
              <span className="font-mono-numbers text-xs font-bold text-amber-300">
                {fx.pitchShift > 0 ? `+${fx.pitchShift}` : fx.pitchShift}st
              </span>
              <button
                type="button"
                onClick={() => onUpdateFX({ ...fx, pitchShift: Math.min(12, fx.pitchShift + 1) })}
                className="w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-white/10 rounded text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
