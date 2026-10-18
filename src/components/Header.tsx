import React from 'react';
import { Play, Pause, Cpu, Menu } from 'lucide-react';

interface HeaderProps {
  currentTab: 'SAMPLE' | 'SEQUENCE' | 'PERFORM';
  onSelectTab: (tab: 'SAMPLE' | 'SEQUENCE' | 'PERFORM') => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenMidiModal: () => void;
  onOpenKoalaModal: () => void;
  onOpenPlayStoreModal: () => void;
  isMidiConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isPlaying,
  onTogglePlay,
  onOpenMidiModal,
  onOpenKoalaModal,
  onOpenPlayStoreModal,
  isMidiConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#170510]/95 backdrop-blur-md border-b border-[#00d2ff]/20 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-4">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2 shrink-0">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('SAMPLE');
          }}
          className="flex items-center gap-2 text-sm sm:text-base font-extrabold tracking-tight text-white whitespace-nowrap"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#00d2ff] shadow-[0_0_8px_#00d2ff]" />
          <span>KOALA STUDIO</span>
        </a>
      </div>

      {/* Zone 2: Main Mode Tabs (Exact replica of Koala's top segmented bar: SAMPLE | SEQUENCE | PERFORM | ☰) */}
      <div className="flex items-center p-1 bg-black/50 border border-white/10 rounded-xl">
        <button
          type="button"
          onClick={() => onSelectTab('SAMPLE')}
          className={`px-3.5 sm:px-5 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-all ${
            currentTab === 'SAMPLE'
              ? 'bg-[#e11d48] text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          SAMPLE
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('SEQUENCE')}
          className={`px-3.5 sm:px-5 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-all ${
            currentTab === 'SEQUENCE'
              ? 'bg-[#e11d48] text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          SEQUENCE
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('PERFORM')}
          className={`px-3.5 sm:px-5 py-1.5 text-xs font-bold tracking-wider rounded-lg transition-all ${
            currentTab === 'PERFORM'
              ? 'bg-[#e11d48] text-white shadow-[0_0_12px_rgba(225,29,72,0.6)]'
              : 'text-white/70 hover:text-white'
          }`}
        >
          PERFORM
        </button>

        {/* Menu / Settings */}
        <button
          type="button"
          onClick={onOpenMidiModal}
          title="MIDI & การตั้งค่า"
          className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-1"
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      {/* Zone 3: .KOALA File Manager, Hardware MIDI Status & Quick Play */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenKoalaModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#00d2ff]/40 bg-[#00d2ff]/10 text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-colors shadow-sm"
          title="เปิดหรือบันทึกไฟล์ .koala"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d2ff]" />
          <span>.KOALA</span>
        </button>

        <button
          type="button"
          onClick={onOpenPlayStoreModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border border-emerald-400/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors shadow-sm"
          title="ส่งออกแอปขึ้น Google Play Store (.aab / .apk)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>PLAY STORE</span>
        </button>

        <button
          type="button"
          onClick={onOpenMidiModal}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
            isMidiConnected
              ? 'bg-[#00d2ff]/10 border-[#00d2ff] text-[#00d2ff]'
              : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>{isMidiConnected ? 'M-VAVE ON' : 'MIDI'}</span>
        </button>

        <button
          type="button"
          onClick={onTogglePlay}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
            isPlaying
              ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.6)]'
              : 'bg-[#00d2ff] hover:bg-[#00d2ff]/80 text-black shadow-md'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span className="hidden sm:inline">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>
      </div>
    </header>
  );
};
