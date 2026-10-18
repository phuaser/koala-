import React, { useState } from 'react';
import { PadData } from '../types/sampler';
import { X, Mic, Volume2, RotateCcw, Play, Check, Scissors, Download } from 'lucide-react';
import { audioEngine } from '../audio/audioEngine';

interface PadEditorModalProps {
  pad: PadData | null;
  onClose: () => void;
  onUpdatePad: (updated: PadData) => void;
  onQuickMicRecord: (padId: number) => void;
  isRecording: boolean;
}

export const PadEditorModal: React.FC<PadEditorModalProps> = ({
  pad,
  onClose,
  onUpdatePad,
  onQuickMicRecord,
  isRecording,
}) => {
  const [name, setName] = useState(pad?.name ?? '');
  const [pitch, setPitch] = useState(pad?.pitch ?? 0);
  const [volume, setVolume] = useState(pad?.volume ?? 0.9);
  const [pan, setPan] = useState(pad?.pan ?? 0);
  const [attack, setAttack] = useState(pad?.attack ?? 0.001);
  const [release, setRelease] = useState(pad?.release ?? 0.1);
  const [chokeGroup, setChokeGroup] = useState(pad?.chokeGroup ?? 0);
  const [reverse, setReverse] = useState(pad?.reverse ?? false);
  const [playMode, setPlayMode] = useState(pad?.playMode ?? 'oneshot');
  const [startTrim, setStartTrim] = useState(pad?.startTrim ?? 0);
  const [endTrim, setEndTrim] = useState(pad?.endTrim ?? 1);

  if (!pad) return null;

  const handleApply = () => {
    onUpdatePad({
      ...pad,
      name,
      pitch,
      volume,
      pan,
      attack,
      release,
      chokeGroup,
      reverse,
      playMode,
      startTrim,
      endTrim,
    });
    onClose();
  };

  const handlePreview = () => {
    const previewPad: PadData = {
      ...pad,
      pitch,
      volume,
      pan,
      attack,
      release,
      chokeGroup,
      reverse,
      playMode,
      startTrim,
      endTrim,
    };
    audioEngine.playPad(previewPad);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#14161d] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0f1015]">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: pad.color }}
            />
            <h2 className="text-sm font-bold text-white tracking-wide">
              PAD INSPECTOR & SAMPLE EDITOR
            </h2>
            <span className="text-[11px] font-mono-numbers text-white/50 bg-white/5 px-2 py-0.5 rounded">
              BANK {pad.bank} · PAD {pad.id % 16 + 1}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          {/* Pad Name & Color Tag */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-white/60">ชื่อแซมเปิล (PAD NAME)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#0b0c10] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 font-medium"
            />
          </div>

          {/* Quick Mic Re-record Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10">
            <div className="flex items-center gap-2">
              <Mic className={`w-4 h-4 ${isRecording ? 'text-red-400 animate-pulse' : 'text-orange-400'}`} />
              <div>
                <p className="text-xs font-semibold text-white">อัดเสียงไมค์ใส่ Pad นี้</p>
                <p className="text-[11px] text-white/40">เคาะโต๊ะ, บีทบ็อกซ์, หรืออัดเสียงพูด</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onQuickMicRecord(pad.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isRecording ? 'STOP REC' : 'RECORD MIC'}
            </button>
          </div>

          {/* Grid of Sliders: Pitch, Volume, Pan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
            {/* Pitch */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">PITCH</span>
                <span className="font-mono-numbers font-bold text-amber-300">
                  {pitch > 0 ? `+${pitch}` : pitch} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Volume */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">VOLUME</span>
                <span className="font-mono-numbers font-bold text-white">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1.5"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Pan */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">PAN</span>
                <span className="font-mono-numbers font-bold text-white">
                  {pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}` : `R${Math.round(pan * 100)}`}
                </span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={pan}
                onChange={(e) => setPan(Number(e.target.value))}
                className="accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Envelope (Attack & Release) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-black/30 border border-white/5">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">ATTACK</span>
                <span className="font-mono-numbers font-bold text-white">
                  {Math.round(attack * 1000)}ms
                </span>
              </div>
              <input
                type="range"
                min="0.001"
                max="0.5"
                step="0.01"
                value={attack}
                onChange={(e) => setAttack(Number(e.target.value))}
                className="accent-orange-500 cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-white/60">RELEASE</span>
                <span className="font-mono-numbers font-bold text-white">
                  {Math.round(release * 1000)}ms
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="1.5"
                step="0.05"
                value={release}
                onChange={(e) => setRelease(Number(e.target.value))}
                className="accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Choke Group & Play Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Choke Group */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/60">
                CHOKE / MUTE GROUP (ตัดเสียงเมื่อกดคู่กัน)
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/10">
                {[0, 1, 2, 3, 4].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setChokeGroup(g)}
                    className={`flex-1 py-1 text-xs font-semibold rounded transition-colors ${
                      chokeGroup === g
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {g === 0 ? 'OFF' : `G${g}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Play Mode */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-white/60">
                PLAY MODE
              </label>
              <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/10">
                {(['oneshot', 'loop'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPlayMode(m)}
                    className={`flex-1 py-1 text-xs font-semibold rounded uppercase transition-colors ${
                      playMode === m
                        ? 'bg-orange-500 text-black font-bold'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {m === 'oneshot' ? '1-SHOT' : 'LOOP'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reverse Toggle & Trimming */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-white/60" />
              <span className="text-xs font-semibold text-white">เล่นย้อนกลับ (REVERSE)</span>
            </div>
            <button
              type="button"
              onClick={() => setReverse(!reverse)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                reverse ? 'bg-amber-500 text-black' : 'bg-white/10 text-white/60 hover:text-white'
              }`}
            >
              {reverse ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-[#0f1015]">
          <button
            type="button"
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>PREVIEW</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-white/50 hover:text-white transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-orange-500 hover:bg-orange-400 text-black rounded-lg transition-colors shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
