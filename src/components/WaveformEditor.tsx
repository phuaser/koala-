import React, { useRef, useEffect, useState } from 'react';
import { PadData } from '../types/sampler';
import { Scissors, Play, RotateCcw, Volume2, Sparkles, Trash2 } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface WaveformEditorProps {
  pad: PadData | null;
  onUpdatePad: (updated: PadData) => void;
  onAutoChop?: () => void;
  onDeletePad?: () => void;
  isPlayingSample?: boolean;
}

export const WaveformEditor: React.FC<WaveformEditorProps> = ({
  pad,
  onUpdatePad,
  onAutoChop,
  onDeletePad,
  isPlayingSample = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isDraggingRegion, setIsDraggingRegion] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [initialTrims, setInitialTrims] = useState({ start: 0, end: 1 });
  const [playheadPercent, setPlayheadPercent] = useState<number | null>(null);
  const [isCompact, setIsCompact] = useState(true);

  // Real-time Playhead Animation (ตัววิ่งบอกตำแหน่งเสียง)
  useEffect(() => {
    let animId: number;
    const updatePlayhead = () => {
      if (pad) {
        const progress = audioEngine.getPadPlaybackProgress(pad.id);
        if (progress !== null) {
          setPlayheadPercent(progress * 100);
        } else {
          setPlayheadPercent(null);
        }
      } else {
        setPlayheadPercent(null);
      }
      animId = requestAnimationFrame(updatePlayhead);
    };

    animId = requestAnimationFrame(updatePlayhead);
    return () => cancelAnimationFrame(animId);
  }, [pad?.id]);

  // Draw full waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // High-tech dark maroon cyber background
    ctx.fillStyle = '#1c0410';
    ctx.fillRect(0, 0, width, height);

    // Grid lines for high-tech look
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Center zero-crossing baseline
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    if (!pad?.audioBuffer) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.font = '12px "JetBrains Mono", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('เลือกหรือเคาะ PAD เพื่อดูคลื่นเสียง / ลากไฟล์ .koala มาวาง', width / 2, height / 2 + 4);
      return;
    }

    const buffer = pad.audioBuffer;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Draw High-Tech Electric Cyan Waveform bars with glow
    ctx.fillStyle = '#00f0ff';
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(0, 240, 255, 0.7)';

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const yMin = (1 + min) * amp;
      const yMax = Math.max(yMin + 1.5, (1 + max) * amp);
      ctx.fillRect(i, yMin, 1.2, yMax - yMin);
    }
    ctx.shadowBlur = 0;
  }, [pad?.audioBuffer, pad?.name]);

  // Handle Dragging Trim Handles
  const handlePointerDown = (e: React.PointerEvent, type: 'start' | 'end' | 'region') => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (!pad) return;

    setDragStartX(e.clientX);
    setInitialTrims({ start: pad.startTrim, end: pad.endTrim });

    if (type === 'start') setIsDraggingStart(true);
    if (type === 'end') setIsDraggingEnd(true);
    if (type === 'region') setIsDraggingRegion(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !pad) return;
    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = (e.clientX - dragStartX) / rect.width;

    if (isDraggingStart) {
      const newStart = Math.max(0, Math.min(pad.endTrim - 0.02, initialTrims.start + deltaX));
      onUpdatePad({ ...pad, startTrim: Number(newStart.toFixed(3)) });
    } else if (isDraggingEnd) {
      const newEnd = Math.max(pad.startTrim + 0.02, Math.min(1, initialTrims.end + deltaX));
      onUpdatePad({ ...pad, endTrim: Number(newEnd.toFixed(3)) });
    } else if (isDraggingRegion) {
      const length = initialTrims.end - initialTrims.start;
      let newStart = initialTrims.start + deltaX;
      let newEnd = initialTrims.end + deltaX;

      if (newStart < 0) {
        newStart = 0;
        newEnd = length;
      } else if (newEnd > 1) {
        newEnd = 1;
        newStart = 1 - length;
      }
      onUpdatePad({
        ...pad,
        startTrim: Number(newStart.toFixed(3)),
        endTrim: Number(newEnd.toFixed(3)),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDraggingStart(false);
    setIsDraggingEnd(false);
    setIsDraggingRegion(false);
  };

  const startPercent = (pad?.startTrim ?? 0) * 100;
  const endPercent = (pad?.endTrim ?? 1) * 100;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Main Waveform Box (High-Tech Cyan Glow Border) - Compact height */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`relative w-full ${
          isCompact ? 'h-14 sm:h-18' : 'h-28 sm:h-36'
        } bg-[#18040d] rounded-xl border border-[#00f0ff]/70 shadow-[0_0_15px_rgba(0,240,255,0.25)] overflow-hidden select-none touch-none transition-all duration-200`}
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={isCompact ? 90 : 160}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
        />

        {/* Selected Slice Region (Red/Rose Overlay with handles) */}
        {pad?.audioBuffer && (
          <div
            onPointerDown={(e) => handlePointerDown(e, 'region')}
            className="absolute top-0 bottom-0 bg-[#e11d48]/45 border-y-2 border-[#e11d48] cursor-grab active:cursor-grabbing transition-opacity"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(1, endPercent - startPercent)}%`,
            }}
          >
            {/* Left Trim Handle */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'start')}
              className="absolute -left-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center group"
            >
              <div className="w-1.5 h-12 bg-white rounded-full group-hover:scale-125 transition-transform shadow-[0_0_10px_#fff]" />
            </div>

            {/* Right Trim Handle */}
            <div
              onPointerDown={(e) => handlePointerDown(e, 'end')}
              className="absolute -right-2 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center group"
            >
              <div className="w-1.5 h-12 bg-white rounded-full group-hover:scale-125 transition-transform shadow-[0_0_10px_#fff]" />
            </div>

            {/* Top slice label */}
            <div className="absolute top-1 left-2 text-[9px] font-mono-numbers font-extrabold text-white bg-black/60 px-1.5 py-0.5 rounded pointer-events-none shadow-sm">
              SLICE: {Math.round(startPercent)}% - {Math.round(endPercent)}%
            </div>
          </div>
        )}

        {/* Real-Time Running Playhead Cursor (ตัววิ่งตำแหน่งเสียง) */}
        {playheadPercent !== null && (
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30"
            style={{
              left: `${playheadPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Laser Line */}
            <div className="w-0.5 h-full bg-white shadow-[0_0_12px_#00f0ff,0_0_4px_#ffffff]" />
            {/* Top needle marker */}
            <div className="w-2.5 h-2.5 -ml-1 -mt-0.5 bg-[#00f0ff] rotate-45 shadow-[0_0_10px_#00f0ff]" />
          </div>
        )}

        {/* Pad Name Tag & Compact Toggle */}
        <div className="absolute top-1.5 right-2 flex items-center gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            title={isCompact ? 'ขยายแทร็กคลื่นเสียง' : 'ย่อแทร็กคลื่นเสียงให้เล็กลง'}
            className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-black/70 hover:bg-black text-white/70 hover:text-white border border-white/20 transition-all cursor-pointer"
          >
            {isCompact ? 'ขยายแทร็ก ↕' : 'ย่อแทร็ก ✕'}
          </button>
          {pad && (
            <span className="text-[11px] font-extrabold text-[#00f0ff] bg-black/85 px-2 py-0.5 rounded-md border border-[#00f0ff]/40 shadow-sm pointer-events-none truncate max-w-[120px]">
              {pad.name}
            </span>
          )}
        </div>
      </div>

      {/* Control Strip under Waveform */}
      {pad && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex flex-wrap items-center gap-1">
            {/* ONE SHOT */}
            <button
              type="button"
              onClick={() => onUpdatePad({ ...pad, playMode: 'oneshot' })}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                pad.playMode === 'oneshot'
                  ? 'bg-[#e11d48] text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              ONE SHOT
            </button>

            {/* REVERSE */}
            <button
              type="button"
              onClick={() => onUpdatePad({ ...pad, reverse: !pad.reverse })}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                pad.reverse
                  ? 'bg-[#e11d48] text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              REVERSE
            </button>

            {/* LOOP */}
            <button
              type="button"
              onClick={() => onUpdatePad({ ...pad, playMode: 'loop' })}
              className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                pad.playMode === 'loop'
                  ? 'bg-[#e11d48] text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              LOOP
            </button>

            {/* CHOKE TOGGLE */}
            <div className="flex items-center bg-black/50 border border-white/10 rounded-lg px-2 py-0.5">
              <span className="text-[10px] text-white/50 mr-1.5 font-extrabold">CHOKE:</span>
              {[0, 1, 2, 3].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onUpdatePad({ ...pad, chokeGroup: g })}
                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded ${
                    pad.chokeGroup === g
                      ? 'bg-[#00f0ff] text-black shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {g === 0 ? 'OFF' : g}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Auto-Chop */}
            {onAutoChop && (
              <button
                type="button"
                onClick={onAutoChop}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#00f0ff]/20 text-[#00f0ff] hover:bg-[#00f0ff]/30 text-[11px] font-extrabold border border-[#00f0ff]/40 transition-colors shadow-sm"
                title="สับเป็นชิ้นๆ กระจายลง Pad"
              >
                <Scissors className="w-3 h-3" />
                <span>AUTO CHOP</span>
              </button>
            )}

            {/* Delete / Clear */}
            {onDeletePad && (
              <button
                type="button"
                onClick={onDeletePad}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-[11px] font-extrabold border border-rose-500/30 transition-colors"
                title="ลบเสียงออกจาก Pad นี้"
              >
                <Trash2 className="w-3 h-3" />
                <span>DELETE</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
