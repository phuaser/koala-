import React, { useRef, useEffect, useState } from 'react';
import { PadData } from '../types/sampler';
import { Music, Mic } from 'lucide-react';

interface SamplerPadProps {
  pad: PadData;
  index: number;
  shortcutKey: string;
  isTriggered: boolean;
  isSelected?: boolean;
  onTrigger: (pad: PadData) => void;
  onSelect?: (pad: PadData) => void;
  onDropAudioFile?: (padId: number, file: File) => void;
  isRecordingThisPad?: boolean;
  isMidiLearningThisPad?: boolean;
}

export const SamplerPad: React.FC<SamplerPadProps> = ({
  pad,
  shortcutKey,
  isTriggered,
  isSelected = false,
  onTrigger,
  onSelect,
  onDropAudioFile,
  isRecordingThisPad = false,
  isMidiLearningThisPad = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const hasAudio = !!pad.audioBuffer;

  // Alternate pad colors between Cyan and Magenta (Koala high-tech palette)
  const isCyan =
    pad.category === 'kick' ||
    pad.category === 'snare' ||
    pad.category === 'hihat' ||
    pad.category === 'bass' ||
    pad.id % 2 === 0;

  const padBgColor = hasAudio
    ? isCyan
      ? '#00d2ff'
      : '#e11d48'
    : '#250817';

  // Draw Mini Waveform on pad's canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (!pad.audioBuffer) return;

    const data = pad.audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    // Dark silhouette waveform contrasting against cyan/magenta background
    ctx.fillStyle = '#0f172a';

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const yMin = (1 + min) * amp;
      const yMax = Math.max(yMin + 1, (1 + max) * amp);
      ctx.fillRect(i, yMin, 1, yMax - yMin);
    }
  }, [pad.audioBuffer, pad.name]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Select and trigger the pad cleanly
    if (onSelect) onSelect(pad);
    onTrigger(pad);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (onDropAudioFile && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
        onDropAudioFile(pad.id, file);
      }
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group flex flex-col justify-between p-2.5 rounded-2xl select-none cursor-pointer transition-all duration-75 min-h-[82px] sm:min-h-[96px] overflow-hidden ${
        isTriggered
          ? 'scale-[0.96] brightness-125 ring-4 ring-white shadow-[0_0_25px_rgba(255,255,255,0.7)] z-10'
          : isSelected
          ? 'ring-3 ring-white shadow-[0_0_15px_rgba(255,255,255,0.6)]'
          : isMidiLearningThisPad
          ? 'ring-4 ring-amber-400 animate-pulse'
          : isDragOver
          ? 'ring-4 ring-[#00f0ff] scale-[0.98]'
          : 'border border-black/25 hover:brightness-105 hover:border-white/30'
      }`}
      style={{
        backgroundColor: padBgColor,
      }}
    >
      {/* Mini Waveform Canvas (Silhouetted in the center of pad) */}
      {hasAudio ? (
        <canvas
          ref={canvasRef}
          width={120}
          height={48}
          className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-85"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <Music className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Top Header: Shortcut Key & Choke / Pitch Tag (No clickable buttons) */}
      <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
        <span
          className={`font-mono-numbers text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm ${
            hasAudio ? 'text-black bg-white/80' : 'text-white/40 bg-black/40'
          }`}
        >
          {pad.bank}{(pad.id % 16) + 1}
          {shortcutKey ? ` • ${shortcutKey}` : ''}
        </span>

        <div className="flex items-center gap-1">
          {pad.chokeGroup > 0 && (
            <span className="text-[9px] font-mono-numbers font-bold text-white bg-black/70 px-1 rounded">
              CH{pad.chokeGroup}
            </span>
          )}
          {pad.pitch !== 0 && (
            <span className="text-[9px] font-mono-numbers font-bold text-white bg-black/70 px-1 rounded">
              {pad.pitch > 0 ? `+${pad.pitch}` : pad.pitch}st
            </span>
          )}
        </div>
      </div>

      {/* Middle Center: Recording or MIDI Learn indicator */}
      {isRecordingThisPad && (
        <div className="relative z-20 flex items-center justify-center gap-1 text-white bg-rose-600 py-0.5 px-2.5 rounded-full mx-auto text-[9px] font-black shadow-lg animate-pulse pointer-events-none">
          <Mic className="w-3 h-3 text-white" />
          <span>RECORDING</span>
        </div>
      )}

      {isMidiLearningThisPad && (
        <div className="relative z-20 flex items-center justify-center text-amber-300 bg-black/90 py-0.5 px-2 rounded-full mx-auto text-[9px] font-black animate-pulse pointer-events-none">
          PRESS MIDI PAD
        </div>
      )}

      {/* Bottom Footer: Sound Name (Completely clean, no accidental buttons!) */}
      <div className="relative z-10 flex items-center justify-between w-full pt-1 pointer-events-none">
        <span
          className={`text-[10px] sm:text-xs font-black truncate max-w-full leading-tight drop-shadow-sm ${
            hasAudio ? 'text-slate-950 uppercase' : 'text-white/30'
          }`}
        >
          {hasAudio ? pad.name : 'EMPTY'}
        </span>
      </div>
    </div>
  );
};
