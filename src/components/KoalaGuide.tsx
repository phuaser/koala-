import React, { useState } from 'react';
import { BookOpen, Disc, Sparkles, Layers, Sliders, Cpu, Radio, ChevronRight, CheckCircle2 } from 'lucide-react';

export const KoalaGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'app' | 'kidkoala' | 'workflow' | 'gear' | 'koalafile'>('app');

  return (
    <section className="flex flex-col gap-6 p-6 sm:p-8 bg-[#111216] border border-white/10 rounded-3xl text-white/90">
      {/* Section Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#00d2ff]">
          <BookOpen className="w-4 h-4" />
          <span>KOALA IN MUSIC ENCYCLOPEDIA</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          เจาะลึก: ทำไมชื่อ "Koala" ถึงโด่งดังในวงการเสียงดนตรี?
        </h2>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          ในวงการดนตรีและการทำบีท (Beatmaking) คำว่า <strong>Koala</strong> หมายถึง 2 สิ่งที่เป็นตำนาน: 
          หนึ่งคือ <strong>Koala Sampler</strong> แอปแซมเพลอร์พกพาอันดับหนึ่งของโลก และสองคือ <strong>Kid Koala</strong> ปรมาจารย์ดีเจ Turntablist ระดับตำนาน
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-black/40 rounded-xl border border-white/5 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('app')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'app'
              ? 'bg-[#00d2ff] text-black font-bold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>Koala Sampler (แอปทำบีท)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('koalafile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'koalafile'
              ? 'bg-[#00d2ff] text-black font-bold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ไฟล์ .koala คืออะไร?</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gear')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'gear'
              ? 'bg-[#00d2ff] text-black font-bold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>M-VAVE SMK-37 & MIDI</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kidkoala')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'kidkoala'
              ? 'bg-[#00d2ff] text-black font-bold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Kid Koala (ดีเจระดับตำนาน)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'workflow'
              ? 'bg-[#00d2ff] text-black font-bold shadow-md'
              : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>สูตรลับการทำบีท 4 ขั้นตอน</span>
        </button>
      </div>

      {/* Tab 1: Koala Sampler */}
      {activeTab === 'app' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-mono-numbers text-orange-400 font-bold">01. Roland SP-404 ในกระเป๋ากางเกง</span>
              <h3 className="text-base font-bold text-white">Koala Sampler คืออะไร?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                <strong>Koala Sampler</strong> พัฒนาโดย <em>Marek Bereza (Elf Audio)</em> เป็นแอปทำเพลงแนวแซมเพลอร์ (Pocket Beatmaking App) 
                ที่เปิดตัวบน iOS และต่อมาขยายสู่ Android, macOS, และ Windows 
                ได้รับการยกย่องจากโปรดิวเซอร์ระดับโลกอย่างกว้างขวางว่าเป็นแอปแซมเปิลที่ให้ความรู้สึกเหมือนเครื่อง Hardware Roland SP-404 หรือ Akai MPC มากที่สุด
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-mono-numbers text-orange-400 font-bold">02. ทำไมถึงกลายเป็นปรากฏการณ์?</span>
              <h3 className="text-base font-bold text-white">จุดเด่นที่ทำให้ทุกคนหลงรัก</h3>
              <ul className="flex flex-col gap-2.5 text-xs text-white/75">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Friction (ไม่มีอุปสรรค):</strong> เปิดแอปปุ๊บ กด Pad อัดเสียงไมค์ได้ทันที ตัดเสียงและเล่นเป็นบีทได้ในไม่กี่วินาที</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Resampling พลังไร้ขีดจำกัด:</strong> สามารถเปิดเล่นบีท ใส่เอฟเฟกต์สด บิดฟิลเตอร์ แล้วอัด Master Output กลับลงมาที่ Pad ว่างเพื่อสร้างเสียงใหม่</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>AI Stem Separation:</strong> แยกเสียงร้อง (Vocal), เสียงกลอง (Drums), เบส (Bass) และคอร์ด ออกจากเพลงหรือวิดีโอได้อัตโนมัติ</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-mono-numbers text-orange-400 font-bold">03. สเปกและโครงสร้างของแอป</span>
              <h3 className="text-base font-bold text-white">สถาปัตยกรรม 64 Pads (4 Banks)</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-white/40 block text-[10px]">PAD SLOTS</span>
                  <span className="font-bold text-sm text-white">64 Pads (A, B, C, D)</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-white/40 block text-[10px]">EXPORT COMPATIBILITY</span>
                  <span className="font-bold text-sm text-white">Ableton Live Project</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-white/40 block text-[10px]">PERFORMANCE FX</span>
                  <span className="font-bold text-sm text-white">16+ DJ Effects</span>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                  <span className="text-white/40 block text-[10px]">MIDI COMPLIANT</span>
                  <span className="font-bold text-sm text-white">Full MIDI Map Support</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-950/20 to-black/40 border border-orange-500/20 flex flex-col gap-2">
              <span className="text-xs font-bold text-orange-400">💡 คำคมจากชุมชนโปรดิวเซอร์</span>
              <p className="text-xs text-white/80 italic leading-relaxed">
                "ถ้าคุณมีไอเดียทำบีทในหัวตอนนั่งรถไฟฟ้าหรือคาเฟ่ Koala Sampler คือเครื่องมือเดียวที่คุณหยิบมือถือขึ้นมาแล้วจบเพลงได้ก่อนถึงสถานีปลายทาง"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab: ไฟล์ .koala คืออะไร? */}
      {activeTab === 'koalafile' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-mono-numbers text-[#00d2ff] font-bold">PROJECT CONTAINER ARCHITECTURE</span>
              <h3 className="text-base font-bold text-white">ไฟล์ .koala คืออะไร?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                ไฟล์ที่มีนามสกุล <strong>.koala</strong> คือไฟล์โครงสร้างเพลงและโปรเจกต์ (Song File) ประจำตัวของแอป <strong>Koala Sampler</strong> 
                โดยเบื้องหลังแล้ว มันคือไฟล์บีบอัดประเภท <strong>ZIP Container</strong> ที่รวมทุกสิ่งทุกอย่างที่จำเป็นสำหรับเพลงนั้นไว้ในไฟล์เดียวอย่างสมบูรณ์แบบ
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <h3 className="text-base font-bold text-white">โครงสร้างภายในของไฟล์ .koala</h3>
              <ul className="flex flex-col gap-2.5 text-xs text-white/75">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00d2ff] shrink-0 mt-0.5" />
                  <span><strong>song.json:</strong> ไฟล์ Manifest บันทึกความเร็ว BPM, ค่า Swing, ตาราง 16-Step Sequencer, จุดตัดเสียง Start/End Trimming, ระดับเสียง Volume, Pitch และ Choke Groups</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00d2ff] shrink-0 mt-0.5" />
                  <span><strong>โฟลเดอร์ samples/ (หรือไฟล์เสียง .wav):</strong> บรรจุไฟล์เสียงแซมเปิลจริงทั้งหมดแบบ 16-bit PCM WAV คุณภาพสูงของทุกๆ Pad ตั้งแต่ Pad A1 ถึง D16</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <h3 className="text-base font-bold text-white">การนำไปใช้งานข้ามแพลตฟอร์ม</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                เนื่องจากเป็นไฟล์ Package เดียว คุณจึงสามารถ:
              </p>
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <strong className="text-[#00d2ff] block mb-0.5">1. แชร์ข้ามเครื่องทันที:</strong>
                  ส่งไฟล์ผ่าน AirDrop, LINE, Google Drive ระหว่าง iPhone, iPad, Android, macOS และ Windows
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                  <strong className="text-[#00d2ff] block mb-0.5">2. แตกไฟล์ดึงเสียงแซมเปิล:</strong>
                  หากเปลี่ยนนามสกุลจาก <code>.koala</code> เป็น <code>.zip</code> คุณสามารถแตกไฟล์เพื่อดึงไฟล์เสียง WAV ทั้งหมดออกมาใช้ใน Ableton Live หรือ FL Studio ได้ทันที
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-[#00d2ff]/30 text-[#00d2ff]">
                  <strong className="block mb-0.5">3. ใช้งานในเว็บแอปนี้:</strong>
                  คุณสามารถกดปุ่ม <strong>.KOALA</strong> ที่ด้านบนเพื่อเปิดไฟล์โปรเจกต์ หรือดาวน์โหลดบีทปัจจุบันของคุณเป็นไฟล์ .koala แท้ได้ 100%!
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Kid Koala */}
      {activeTab === 'kidkoala' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <span className="text-xs font-mono-numbers text-orange-400 font-bold">THE TURNTABLISM MASTER</span>
              <h3 className="text-base font-bold text-white">Kid Koala (Eric San) คือใคร?</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                <strong>Kid Koala</strong> (เกิดปี 1974) เป็นดีเจ, นักแต่งเพลง และนักวาดการ์ตูนชาวแคนาดาเชื้อสายจีน สังกัดค่ายเพลงอินดี้อิเล็กทรอนิกส์ในตำนาน <strong>Ninja Tune</strong> 
                เขาคือผู้ปฏิวัติศาสตร์การสแครชแผ่นเสียง (Turntablism) ให้กลายเป็นการบรรเลงดนตรีที่มีทั้งความอบอุ่น อารมณ์ขัน และความซับซ้อนระดับคอนเสิร์ต
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <h3 className="text-base font-bold text-white">ผลงานระดับประวัติศาสตร์</h3>
              <ul className="flex flex-col gap-2.5 text-xs text-white/75">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Gorillaz:</strong> เขาเป็นดีเจสแครชแผ่นเสียงในเพลงไอคอนิกอย่าง <em>"Clint Eastwood"</em> และ <em>"19-2000"</em> ในอัลบั้มเปิดตัวของ Gorillaz</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Deltron 3030:</strong> ซูเปอร์กรุ๊ปแนว Sci-Fi Hip Hop ร่วมกับ Del the Funky Homosapien และ Dan the Automator</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>อัลบั้มเดี่ยว 'Carpal Tunnel Syndrome':</strong> อัลบั้มที่ผสมผสานแผ่นเสียงเพลงแจ๊ส ละครวิทยุ และการสแครชจนเป็นมาสเตอร์พีซของโลก</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
              <h3 className="text-base font-bold text-white">เอกลักษณ์ทางดนตรีของ Kid Koala</h3>
              <p className="text-xs text-white/70 leading-relaxed">
                ไม่เหมือนดีเจแนวประชันความเร็วทั่วไป Kid Koala มีชื่อเสียงจากการนำแผ่นเสียงที่ไม่น่าเชื่อ เช่น 
                เสียงอ่านนิทานเด็ก เสียงจิบชา หรือเสียงดนตรีบลูส์โบราณ มาสแครชด้วยมือเปล่าจนกลายเป็นเมโลดี้ร้องเพลงได้ 
                เขามักแสดงสดด้วยเครื่องเล่นแผ่นเสียง (Turntables) พร้อมกัน 3-4 เครื่องโดยไม่ใช้คอมพิวเตอร์ช่วย
              </p>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-white/80">
                <span className="text-orange-400 font-bold block mb-1">ความเชื่อมโยงกับดนตรี:</span>
                ทั้ง Kid Koala และ Koala Sampler ต่างยึดถือจิตวิญญาณเดียวกัน นั่นคือ <strong>"การหยิบเศษเสียงรอบตัว (Sampling) มาเรียงร้อยเป็นดนตรีชิ้นใหม่"</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Workflow */}
      {activeTab === 'workflow' && (
        <div className="flex flex-col gap-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center text-xs">
                1
              </span>
              <h4 className="text-xs font-bold text-white">SAMPLE (อัดหรือดูดเสียง)</h4>
              <p className="text-[11px] text-white/60 leading-relaxed">
                อัดเสียงจากไมค์ เคาะโต๊ะ หรือนำเข้าเพลงโปรดเข้ามา จากนั้นระบบจะสร้าง Waveform พร้อมใช้งาน
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center text-xs">
                2
              </span>
              <h4 className="text-xs font-bold text-white">AUTO-CHOP (สับท่อน)</h4>
              <p className="text-[11px] text-white/60 leading-relaxed">
                สั่ง Auto-Slice ตาม Transient หรือแบ่งเป็น 16 ชิ้นเท่าๆ กัน กระจายลงบนแต่ละ Pad พร้อมเซ็ต Choke Group
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center text-xs">
                3
              </span>
              <h4 className="text-xs font-bold text-white">SEQUENCE & SWING</h4>
              <p className="text-[11px] text-white/60 leading-relaxed">
                วางโครงสร้างจังหวะกลอง ปรับ Swing ประมาณ 20-35% เพื่อให้ได้ความรู้สึกเมากรู๊ฟแบบ J Dilla
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2">
              <span className="w-6 h-6 rounded-full bg-orange-500 text-black font-bold flex items-center justify-center text-xs">
                4
              </span>
              <h4 className="text-xs font-bold text-white">PERFORM & RESAMPLE</h4>
              <p className="text-[11px] text-white/60 leading-relaxed">
                แตะ XY Filter, ใส่ Tape Stop, สับ Stutter แล้ว Resample ซ้อนเป็นเสียงใหม่ลง Pad ว่าง
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Hardware & Gear */}
      {activeTab === 'gear' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
            <h3 className="text-base font-bold text-white">การเชื่อมต่อกับ MIDI Controllers</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              คุณสามารถนำสาย USB-C หรือตัวแปลง Lightning-to-USB ต่อมือถือ/แท็บเล็ตเข้ากับคีย์บอร์ดใบ้หรือแพดกลองยอดนิยม เช่น:
            </p>
            <ul className="flex flex-col gap-2 text-xs text-white/80">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                <span><strong>Akai MPK Mini MK3:</strong> คีย์บอร์ดและแพดกลองยอดนิยม ต่อแล้วแมปปุ่มได้ทันที</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                <span><strong>Novation Launchpad X:</strong> ควบคุม 64 Pads ได้เต็มผืนเหมือนเครื่องจริง</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                <span><strong>Roland SP-404MKII:</strong> ส่งเสียงผ่านสาย USB-C เดียวทั้งสัญญาณเสียงและ MIDI</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3">
            <h3 className="text-base font-bold text-white">เคล็ดลับการส่งออกไปยัง DAW</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              เมื่อทำบีทใน Koala เสร็จ สามารถกด Export เป็น:
            </p>
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <strong className="text-orange-400">Ableton Live Set (.als):</strong> จะสร้างโฟลเดอร์โปรเจกต์ที่มีท่อนเพลงและคลิปเสียงทั้งหมดพร้อมเปิดในคอมพิวเตอร์
              </div>
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/5">
                <strong className="text-orange-400">Separated Audio Stems:</strong> แยกไฟล์ WAV ของแต่ละ Pad ออกมาอย่างอิสระเพื่อนำไปมิกซ์และมาสเตอร์
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
