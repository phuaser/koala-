import React, { useRef, useState } from 'react';
import { X, Download, Upload, FileCode, CheckCircle2, Sparkles, FolderArchive, Layers } from 'lucide-react';
import { exportKoalaProject, downloadKoalaFile, importKoalaProject, KoalaProjectData } from '../audio/koalaProject';
import { PadData } from '../types/sampler';
import { audioEngine } from '../audio/audioEngine';

interface KoalaProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  pads: PadData[];
  steps?: boolean[][];
  patterns?: boolean[][][];
  bpm: number;
  swing: number;
  onLoadProject: (project: KoalaProjectData) => void;
  showToast: (msg: string) => void;
}

export const KoalaProjectModal: React.FC<KoalaProjectModalProps> = ({
  isOpen,
  onClose,
  pads,
  steps,
  patterns,
  bpm,
  swing,
  onLoadProject,
  showToast,
}) => {
  const [projectName, setProjectName] = useState('My_Koala_Beat');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const patternsToExport: boolean[][][] = patterns || (steps ? [steps] : []);
      const blob = await exportKoalaProject(pads, patternsToExport, bpm, swing, projectName);
      downloadKoalaFile(blob, `${projectName}.koala`);
      showToast(`ส่งออกไฟล์ "${projectName}.koala" สำเร็จแล้ว!`);
      onClose();
    } catch (err) {
      console.error('Export failed', err);
      showToast('เกิดข้อผิดพลาดในการส่งออกไฟล์ .koala');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsImporting(true);

    try {
      audioEngine.init();
      const project = await importKoalaProject(file, audioEngine.getContext());
      if (project) {
        onLoadProject(project);
        showToast(`เปิดโปรเจกต์ "${project.name}.koala" สำเร็จ!`);
        onClose();
      } else {
        showToast('ไม่สามารถเปิดไฟล์ .koala ได้ โปรดตรวจสอบไฟล์');
      }
    } catch (err) {
      console.error('Import failed', err);
      showToast('เกิดข้อผิดพลาดในการนำเข้าไฟล์ .koala');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#14161f] border border-[#00d2ff]/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#0c0d14]">
          <div className="flex items-center gap-2.5">
            <FolderArchive className="w-4 h-4 text-[#00d2ff]" />
            <h2 className="text-sm font-bold tracking-wide">
              KOALA PROJECT (.KOALA) MANAGER
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[75vh]">
          {/* What is .koala explanation */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#00d2ff]/10 via-black/40 to-[#e11d48]/10 border border-[#00d2ff]/20 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00d2ff]">
              <FileCode className="w-4 h-4" />
              <span>ไฟล์ .KOALA คืออะไร?</span>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              <strong>.koala</strong> คือไฟล์โครงสร้างโปรเจกต์ (Song Archive) ของแอป <strong>Koala Sampler</strong> 
              โดยเนื้อแท้แล้วคือ <em>ZIP Archive</em> ที่บรรจุ:
            </p>
            <ul className="text-[11px] text-white/70 flex flex-col gap-1 pl-2">
              <li>• <strong>ไฟล์เสียงแซมเปิลทั้งหมด:</strong> ไฟล์ WAV คุณภาพสูงของทุก Pad (Kick, Snare, Chords, Vocal)</li>
              <li>• <strong>song.json:</strong> บันทึกจังหวะ BPM, Swing, ลำดับ Step Sequencer, ตำแหน่งตัดเสียง (Start/End Trim), และค่าลูกบิด Vol/Pitch/Pan</li>
            </ul>
            <p className="text-[11px] text-white/60">
              คุณสามารถส่งไฟล์ <code>.koala</code> นี้ไปเปิดบน iPhone, iPad, Android, macOS หรือนำไฟล์จากมือถือมาเปิดในแอปนี้ได้ทันที!
            </p>
          </div>

          {/* Import .koala Section */}
          <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-black/40 border border-white/10">
            <span className="text-xs font-bold text-white">1. นำเข้าไฟล์โปรเจกต์ (.KOALA IMPORT)</span>
            <p className="text-[11px] text-white/50">
              เลือกไฟล์ <code>.koala</code> หรือ <code>.zip</code> จากเครื่องของคุณเพื่อโหลดบีทและแซมเปิลทั้งหมดเข้ามา
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".koala,.zip,application/zip"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all border border-white/15"
            >
              <Upload className="w-4 h-4 text-[#00d2ff]" />
              <span>{isImporting ? 'กำลังแตกไฟล์ .koala...' : 'เลือกไฟล์ .koala จากเครื่อง'}</span>
            </button>
          </div>

          {/* Export .koala Section */}
          <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-black/40 border border-white/10">
            <span className="text-xs font-bold text-white">2. ส่งออกเป็นไฟล์ .KOALA (EXPORT PROJECT)</span>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-white/60 font-semibold">ชื่อเพลง / โปรเจกต์</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="bg-[#0b0c10] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#00d2ff] font-medium"
              />
            </div>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExport}
              className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#00d2ff] hover:bg-[#00d2ff]/80 text-black text-xs font-bold rounded-xl transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'กำลังแพ็กไฟล์ .koala...' : 'ดาวน์โหลดไฟล์ .koala'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-white/10 bg-[#0c0d14]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
