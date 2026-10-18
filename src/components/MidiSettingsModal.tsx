import React, { useState, useEffect } from 'react';
import { X, Cpu, Check, RefreshCw, Zap, Radio, Sliders, Palette, Sparkles, Heart } from 'lucide-react';
import { midiManager, DEFAULT_MVAVE_MAPPING, MidiMapping } from '../audio/midiManager';
import { AppThemeId, APP_THEMES } from '../theme/themeConfig';

interface MidiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMidiLearnPad: (padIdx: number) => void;
  currentTheme: AppThemeId;
  onSelectTheme: (themeId: AppThemeId) => void;
}

export const MidiSettingsModal: React.FC<MidiSettingsModalProps> = ({
  isOpen,
  onClose,
  onSelectMidiLearnPad,
  currentTheme,
  onSelectTheme,
}) => {
  const [activeTab, setActiveTab] = useState<'THEMES' | 'MIDI'>('THEMES');
  const [connectedDevices, setConnectedDevices] = useState<string[]>([]);
  const [lastMidiEvent, setLastMidiEvent] = useState<string>('ยังไม่มีสัญญาณ MIDI');
  const [mapping, setMapping] = useState<MidiMapping>(midiManager.getMapping());
  const [isLearningTarget, setIsLearningTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setConnectedDevices(midiManager.getConnectedDevices());

    const unsubscribe = midiManager.subscribe((event) => {
      if (event.type === 'noteon') {
        setLastMidiEvent(`NOTE ON: #${event.note} (Vel: ${event.velocity}) ${event.padIndex !== undefined ? `→ Pad ${event.padIndex + 1}` : ''}`);
      } else if (event.type === 'noteoff') {
        setLastMidiEvent(`NOTE OFF: #${event.note}`);
      } else if (event.type === 'cc') {
        setLastMidiEvent(`CONTROL CHANGE: CC #${event.controller} (Val: ${event.value})`);
      }
      setMapping(midiManager.getMapping());
      setIsLearningTarget(null);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRefresh = async () => {
    await midiManager.init();
    setConnectedDevices(midiManager.getConnectedDevices());
  };

  const handleApplyMVaveSMK37 = () => {
    midiManager.resetToMVaveSMK37();
    setMapping(midiManager.getMapping());
  };

  const handleStartLearnPlayStop = () => {
    setIsLearningTarget('playstop');
    midiManager.startLearning('playstop');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#121520] border border-white/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0c0e17]">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-[#00f0ff]" />
            <h2 className="text-sm font-extrabold tracking-wide uppercase">
              การตั้งค่า & ธีมสี (SETTINGS & THEMES)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center border-b border-white/10 bg-black/30 px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('THEMES')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'THEMES'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>ธีมสีหน้าจอ (COLOR THEMES)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MIDI')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 text-xs font-black border-b-2 transition-all cursor-pointer ${
              activeTab === 'MIDI'
                ? 'border-[#00f0ff] text-[#00f0ff]'
                : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>MIDI คอนโทรลเลอร์ (M-VAVE SMK-37)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: THEMES SELECTION */}
          {activeTab === 'THEMES' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-white/90">
                    เลือกสไตล์ธีมสีของคุณ
                  </h3>
                  <p className="text-[11px] text-white/50 mt-0.5">
                    เปลี่ยนสีหลัก, แสงนีออน, เส้นขอบ และปุ่มควบคุมทั้งหมดในแอป
                  </p>
                </div>
                <span className="text-[10px] font-mono-numbers px-2 py-0.5 rounded bg-white/10 text-white/70">
                  4 สไตล์หลัก
                </span>
              </div>

              {/* Theme Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
                {Object.values(APP_THEMES).map((th) => {
                  const isSelected = currentTheme === th.id;

                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => onSelectTheme(th.id)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'border-2 shadow-lg bg-black/60'
                          : 'bg-black/30 border-white/10 hover:border-white/30 hover:bg-black/40'
                      }`}
                      style={{
                        borderColor: isSelected ? th.primary : undefined,
                        boxShadow: isSelected ? `0 0 20px ${th.glow}` : undefined,
                      }}
                    >
                      {/* Active Check Badge */}
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-black"
                          style={{ backgroundColor: th.primary }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>ใช้งานอยู่</span>
                        </div>
                      )}

                      {/* Header with Title and Swatches */}
                      <div className="flex items-center justify-between gap-2 pr-12">
                        <span className="text-xs font-black text-white">
                          {th.name}
                        </span>
                      </div>

                      <p className="text-[10px] text-white/60 mt-1 leading-relaxed">
                        {th.tagline}
                      </p>

                      {/* Color Palette Preview Swatch Dots */}
                      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-white/10">
                        <span className="text-[9px] font-bold text-white/40 uppercase mr-1">
                          โทนสี:
                        </span>
                        {th.swatch.map((c, i) => (
                          <span
                            key={i}
                            className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                        <span
                          className="ml-auto text-[9px] font-mono-numbers font-black px-1.5 py-0.5 rounded"
                          style={{ color: th.primary }}
                        >
                          {th.nameEn}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: MIDI SETTINGS */}
          {activeTab === 'MIDI' && (
            <div className="flex flex-col gap-4">
              {/* Connected Device Status */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${connectedDevices.length > 0 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'}`} />
                  <div>
                    <p className="text-xs font-bold text-white">
                      {connectedDevices.length > 0
                        ? `เชื่อมต่อแล้ว: ${connectedDevices.join(', ')}`
                        : 'กำลังรอการเชื่อมต่ออุปกรณ์ MIDI (USB หรือ Bluetooth)'}
                    </p>
                    <p className="text-[11px] text-white/50">
                      รองรับ M-VAVE SMK-37, SMK-25, Chocolate Footswitch, MPK Mini, Launchpad
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ค้นหาใหม่</span>
                </button>
              </div>

              {/* Preset Quick Mappings */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold text-white/70">พรีเซ็ตสำเร็จรูป</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyMVaveSMK37}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#00d2ff]/20 hover:bg-[#00d2ff]/30 border border-[#00d2ff]/40 text-xs font-bold text-[#00d2ff] transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>ใช้ค่าเริ่มต้น M-VAVE SMK-37</span>
                  </button>
                </div>
              </div>

              {/* Live Signal Monitor */}
              <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono-numbers text-emerald-300 truncate max-w-sm">
                    {lastMidiEvent}
                  </span>
                </div>
                <span className="text-[10px] text-white/40">MIDI Monitor</span>
              </div>

              {/* M-VAVE Hardware Features Explained */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-white/70 space-y-1.5">
                <p className="font-bold text-white">คำแนะนำการใช้งานกับ M-VAVE SMK-37:</p>
                <ul className="list-disc list-inside space-y-1 text-white/60 text-[11px]">
                  <li><strong className="text-white">แป้นคีย์ 37 คีย์:</strong> เล่นตัวอย่างเสียงที่เลือกแบบ Melodic (Chromatic Pitch ทันที)</li>
                  <li><strong className="text-white">แป้นดรัมแพด 16 อัน:</strong> ควบคุมเสียง Pad 1 - 16 ของแต่ละ Bank A, B, C, D</li>
                  <li><strong className="text-white">แป้นเหยียบ Footswitch (CC 64):</strong> ควบคุม เล่น / หยุด เพลง (Play / Stop)</li>
                  <li><strong className="text-white">Rotary Knobs:</strong> หมุนปรับ Volume, Pitch, Pan ตอบสนองทันทีระหว่างกด</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/10 bg-[#0c0e17] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black text-xs font-black rounded-xl transition-all cursor-pointer shadow-md"
          >
            ตกลง / ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
