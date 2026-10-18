import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../audio/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  activePadName?: string | null;
  bpm: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying, activePadName, bpm }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const bufferLength = 128;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const analyser = audioEngine.getAnalyser();

      const width = canvas.width;
      const height = canvas.height;

      // Dark screen background with slight scanline effect
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);

        // Draw Waveform
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#f97316'; // Amber / Orange Koala accent
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(249, 115, 22, 0.6)';

        ctx.beginPath();
        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle flat line
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="relative w-full h-16 bg-[#0a0b0e] rounded-lg border border-white/10 overflow-hidden flex items-center justify-between px-3">
      <canvas
        ref={canvasRef}
        width={360}
        height={64}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-85"
      />
      <div className="relative z-10 flex items-center gap-3">
        <span className="font-mono-numbers text-[11px] font-semibold tracking-wider text-orange-400 bg-orange-950/40 border border-orange-500/20 px-1.5 py-0.5 rounded">
          {bpm} BPM
        </span>
        {activePadName ? (
          <span className="text-xs font-semibold text-white/90 truncate max-w-[140px]">
            {activePadName}
          </span>
        ) : (
          <span className="text-[11px] text-white/40">
            {isPlaying ? 'PLAYING MASTER' : 'READY / IDLE'}
          </span>
        )}
      </div>

      <div className="relative z-10 flex items-center gap-2">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/20'}`} />
          <span className="text-[10px] font-mono-numbers text-white/50">
            {isPlaying ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>
    </div>
  );
};
