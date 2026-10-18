import React, { useState } from 'react';
import { X, Volume2, Search, Check, Sparkles, Music, Disc } from 'lucide-react';
import { PadData, BankId } from '../types/sampler';

interface TrackSoundPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackIdx: number;
  currentPadId: number;
  pads: PadData[];
  onSelectPad: (trackIdx: number, padId: number) => void;
  onPreviewPad: (pad: PadData) => void;
}

export const TrackSoundPickerModal: React.FC<TrackSoundPickerModalProps> = ({
  isOpen,
  onClose,
  trackIdx,
  currentPadId,
  pads,
  onSelectPad,
  onPreviewPad,
}) => {
  const [activeBankFilter, setActiveBankFilter] = useState<BankId | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  if (!isOpen) return null;

  // Filter pads
  const filteredPads = pads.filter((p) => {
    if (activeBankFilter !== 'ALL' && p.bank !== activeBankFilter) return false;
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.bank.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  const categories = [
    { id: 'ALL', label: 'ทั้งหมด (All)' },
    { id: 'kick', label: 'Kick' },
    { id: 'snare', label: 'Snare' },
    { id: 'hihat', label: 'Hi-Hat' },
    { id: 'perc', label: 'Perc / Clap' },
    { id: 'bass', label: 'Bass / 808' },
    { id: 'chord', label: 'Chords' },
    { id: 'vocal', label: 'Vocal' },
    { id: 'fx', label: 'FX' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-[#0c1018] border-2 border-[#00f0ff]/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#070a10] border-b border-[#00f0ff]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff]">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>เลือกเสียงสำหรับ Track {trackIdx + 1}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30">
                  Track #{trackIdx + 1}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                เลือกเสียงจากทั้ง 4 Banks (A, B, C, D) เพื่อใส่ในแทร็กซีเควนเซอร์นี้
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bank & Category Filters */}
        <div className="p-4 bg-[#0a0e16] border-b border-white/5 flex flex-col gap-3">
          {/* Bank Tabs: ALL, A, B, C, D */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-[#06080e] border border-white/10 rounded-xl">
              {(['ALL', 'A', 'B', 'C', 'D'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setActiveBankFilter(b)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeBankFilter === b
                      ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {b === 'ALL' ? 'ทุก Bank' : `Bank ${b}`}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหาชื่อเสียง (เช่น Kick, Snare, 808)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[#06080e] border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff]"
              />
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryFilter(c.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  categoryFilter === c.id
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40'
                    : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sound List / Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[55vh]">
          {filteredPads.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 text-xs">
              ไม่พบเสียงที่ตรงกับการค้นหา
            </div>
          ) : (
            filteredPads.map((pad) => {
              const isCurrent = pad.id === currentPadId;
              const hasAudio = !!pad.audioBuffer;
              const padNumberInBank = (pad.id % 16) + 1;

              return (
                <div
                  key={pad.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-[#00f0ff]/10 border-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
                      : 'bg-[#090d15] border-white/10 hover:border-white/20 hover:bg-[#0e1320]'
                  }`}
                >
                  {/* Left: Pad Badge & Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Bank / Pad ID Badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 border shadow-inner"
                      style={{
                        backgroundColor: `${pad.color}20`,
                        borderColor: pad.color,
                      }}
                    >
                      <span className="text-[10px] font-black text-white/70">
                        {pad.bank}
                      </span>
                      <span className="text-xs font-black" style={{ color: pad.color }}>
                        {padNumberInBank}
                      </span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {pad.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00f0ff] text-black font-extrabold">
                            ใช้ในแทร็กนี้
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="capitalize">{pad.category}</span>
                        <span>•</span>
                        <span className={hasAudio ? 'text-emerald-400 font-medium' : 'text-slate-500'}>
                          {hasAudio ? '● พร้อมเสียง' : '○ ว่าง'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Audition Button */}
                    <button
                      type="button"
                      onClick={() => onPreviewPad(pad)}
                      title="ฟังเสียงทดสอบ"
                      className="p-2 rounded-xl bg-white/5 hover:bg-[#00f0ff]/20 text-slate-300 hover:text-[#00f0ff] transition-colors border border-white/5 hover:border-[#00f0ff]/40"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Select Button */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPad(trackIdx, pad.id);
                        onClose();
                      }}
                      className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-[#00f0ff] text-black shadow-[0_0_10px_#00f0ff]'
                          : 'bg-white hover:bg-slate-200 text-slate-950 shadow-md'
                      }`}
                    >
                      {isCurrent ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>เลือกอยู่</span>
                        </>
                      ) : (
                        <span>เลือกเสียง</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#070a10] border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span>สามารถเลือกเสียงใดก็ได้จากทั้ง 64 Pads ในทุก Bank</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
