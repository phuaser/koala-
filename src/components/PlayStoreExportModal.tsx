import React, { useState } from 'react';
import { X, ExternalLink, Download, Copy, Check, Smartphone, Terminal, Globe, ShieldCheck, Sparkles, Layers } from 'lucide-react';

interface PlayStoreExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreExportModal: React.FC<PlayStoreExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwabuilder' | 'bubblewrap' | 'capacitor' | 'checklist'>('pwabuilder');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-app-domain.com';
  const manifestUrl = `${currentOrigin}/manifest.json`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-2xl bg-[#0c1017] border-2 border-[#00f0ff]/40 rounded-3xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#070a10]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/50 flex items-center justify-center text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>วิธีส่งออกแอปขึ้น GOOGLE PLAY STORE</span>
                <span className="text-[10px] font-bold text-black bg-[#00f0ff] px-2 py-0.5 rounded-full">
                  Android AAB / APK
                </span>
              </h2>
              <p className="text-xs text-[#00f0ff]">
                แปลงเว็บแอปพลิเคชันเป็นไฟล์ .AAB พร้อมขึ้นสโตร์ได้ทันที
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-[#080c14] border-b border-white/10 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pwabuilder')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === 'pwabuilder'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. PWABuilder (แนะนำ ง่ายสุด)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bubblewrap')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === 'bubblewrap'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>2. Google Bubblewrap CLI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('capacitor')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === 'capacitor'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Capacitor (Android Studio)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
              activeTab === 'checklist'
                ? 'bg-[#00f0ff] text-black shadow-[0_0_12px_#00f0ff]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>สิ่งที่ต้องเตรียม (Checklist)</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4 text-xs">
          {/* TAB 1: PWABUILDER */}
          {activeTab === 'pwabuilder' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#00f0ff] font-extrabold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>วิธีที่ 1: ใช้ PWABuilder (ฟรี โดย Microsoft & Google)</span>
                </div>
                <p className="text-white/80 leading-relaxed">
                  เป็นวิธีที่นิยมที่สุดในโลกสำหรับนำ Progressive Web App ขึ้น Google Play Store ไม่จำเป็นต้องมีความรู้ด้าน Android Studio หรือ Java เลย โดยระบบจะแปลงโค้ดและส่งออกไฟล์ <strong>Android App Bundle (.aab)</strong> ให้โดยอัตโนมัติ
                </p>
              </div>

              {/* 4 Steps */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-[#00f0ff] text-black font-extrabold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="font-extrabold text-white text-sm">คัดลอก URL ของแอปพลิเคชัน</span>
                    <p className="text-white/60">นำ URL ที่ deploy หรือลิงก์ AI Studio ไปวางที่ PWABuilder</p>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        readOnly
                        value={currentOrigin}
                        className="flex-1 bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono-numbers text-[11px] text-[#00f0ff]"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(currentOrigin, 'url')}
                        className="px-3 py-1.5 bg-[#00f0ff] text-black font-extrabold rounded-lg hover:bg-[#00f0ff]/80 transition-all flex items-center gap-1 shrink-0"
                      >
                        {copiedText === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedText === 'url' ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-[#00f0ff] text-black font-extrabold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="font-extrabold text-white text-sm">เข้าเว็บไซต์ PWABuilder</span>
                    <p className="text-white/60">
                      วาง URL แล้วกดปุ่ม <strong>"Start"</strong> ระบบจะตรวจสอบ Manifest และ Icons ที่เราเตรียมไว้ให้ครบ 100 คะแนน
                    </p>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#00f0ff] font-extrabold hover:underline w-fit mt-1"
                    >
                      <span>ไปยังเว็บไซต์ pwabuilder.com</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-[#00f0ff] text-black font-extrabold flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="font-extrabold text-white text-sm">กดปุ่ม "Package for Stores" &gt; เลือก Android</span>
                    <p className="text-white/60 leading-relaxed">
                      กำหนด <strong>Package ID</strong> (เช่น <code>com.yourname.koalastudio</code>) และตั้งค่า Signing Key จากนั้นกด <strong>"Generate Package"</strong> คุณจะได้ไฟล์ ZIP ที่มี <code>.aab</code> (Android App Bundle) พร้อมนำขึ้น Google Play Console
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded-full bg-[#00f0ff] text-black font-extrabold flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="flex-1 flex flex-col gap-1.5">
                    <span className="font-extrabold text-white text-sm">อัปโหลดขึ้น Google Play Console</span>
                    <p className="text-white/60">
                      เข้า Google Play Console สร้าง Release ใหม่ แล้วลากไฟล์ <code>.aab</code> วาง กรอกข้อมูลคำอธิบายและรูปภาพตัวอย่างแอป จากนั้นกดส่งตรวจสอบได้เลย!
                    </p>
                    <a
                      href="https://play.google.com/console"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#00f0ff] font-extrabold hover:underline w-fit mt-1"
                    >
                      <span>ไปยัง Google Play Console</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUBBLEWRAP CLI */}
          {activeTab === 'bubblewrap' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <span className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#00f0ff]" />
                  <span>วิธีที่ 2: Google Bubblewrap (Command Line ของ Google)</span>
                </span>
                <p className="text-white/70 leading-relaxed">
                  Bubblewrap คือ CLI ทางการของ Google Chrome ที่สร้างโปรเจกต์ <strong>Trusted Web Activity (TWA)</strong> เหมาะสำหรับนักพัฒนาที่ชอบทำงานบน Terminal:
                </p>
              </div>

              <div className="flex flex-col gap-3 font-mono-numbers">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-white/50">1. ติดตั้ง Bubblewrap CLI:</span>
                  <div className="flex items-center justify-between p-2.5 bg-black/70 rounded-xl border border-white/10">
                    <code className="text-[#00f0ff]">npm i -g @bubblewrap/cli</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('npm i -g @bubblewrap/cli', 'bw1')}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      {copiedText === 'bw1' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-white/50">2. เริ่มต้นสร้างโปรเจกต์จาก Manifest URL:</span>
                  <div className="flex items-center justify-between p-2.5 bg-black/70 rounded-xl border border-white/10">
                    <code className="text-[#00f0ff]">bubblewrap init --manifest={manifestUrl}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(`bubblewrap init --manifest=${manifestUrl}`, 'bw2')}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      {copiedText === 'bw2' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-white/50">3. Build ไฟล์ .AAB:</span>
                  <div className="flex items-center justify-between p-2.5 bg-black/70 rounded-xl border border-white/10">
                    <code className="text-[#00f0ff]">bubblewrap build</code>
                    <button
                      type="button"
                      onClick={() => handleCopy('bubblewrap build', 'bw3')}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      {copiedText === 'bw3' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-white/60 bg-black/40 p-3 rounded-xl border border-white/5">
                ผลลัพธ์: จะได้ไฟล์ <code>app-release-bundle.aab</code> ในโฟลเดอร์สำหรับอัปโหลดเข้าสู่ Google Play Console ได้ทันที!
              </p>
            </div>
          )}

          {/* TAB 3: CAPACITOR */}
          {activeTab === 'capacitor' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
                <span className="font-extrabold text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#00f0ff]" />
                  <span>วิธีที่ 3: CapacitorJS (แปลงเป็น Android Studio Project)</span>
                </span>
                <p className="text-white/70 leading-relaxed">
                  หากต้องการเข้าถึง Hardware ของ Android ลึกขึ้น หรือต้องการปรับแต่งโค้ด Kotlin/Java ใน Android Studio โดยตรง:
                </p>
              </div>

              <div className="flex flex-col gap-2 font-mono-numbers">
                <div className="p-3 bg-black/70 rounded-xl border border-white/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] text-white/50">
                    <span>คำสั่งติดตั้งและรันโปรเจกต์ Capacitor:</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `npm i @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init "Koala Music Studio" com.example.koala\nnpx cap add android\nnpm run build\nnpx cap copy\nnpx cap open android`,
                          'cap'
                        )
                      }
                      className="text-[#00f0ff] hover:underline flex items-center gap-1 font-sans text-xs"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedText === 'cap' ? 'คัดลอกทั้งหมดแล้ว' : 'คัดลอกคำสั่ง'}</span>
                    </button>
                  </div>
                  <pre className="text-[#00f0ff] text-[11px] leading-relaxed whitespace-pre-wrap">
{`npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Koala Music Studio" com.example.koala
npx cap add android
npm run build
npx cap copy
npx cap open android`}
                  </pre>
                </div>
              </div>

              <p className="text-white/60">
                เมื่อ Android Studio เปิดขึ้นมา ให้ไปที่เมนู <strong>Build &gt; Generate Signed Bundle / APK</strong> แล้วเลือก <strong>Android App Bundle</strong>
              </p>
            </div>
          )}

          {/* TAB 4: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                <span className="font-extrabold text-white text-sm">
                  สิ่งที่ต้องเตรียมสำหรับ Google Play Console:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-white">1. Play Console Account</span>
                    <p className="text-white/60 text-[11px] mt-0.5">มีค่าธรรมเนียมสมัครครั้งเดียว $25 USD</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-white">2. App Icon 512x512</span>
                    <p className="text-white/60 text-[11px] mt-0.5">ไฟล์ PNG ขนาด 512x512 px คมชัดสูง</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-white">3. Feature Graphic</span>
                    <p className="text-white/60 text-[11px] mt-0.5">ภาพแบนเนอร์ขนาด 1024x500 px สำหรับโชว์บนสโตร์</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-white">4. Screenshots หน้าจอแอป</span>
                    <p className="text-white/60 text-[11px] mt-0.5">แคปเจอร์หน้าจอทำบีทอย่างน้อย 2-4 รูป</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-white">5. Privacy Policy URL</span>
                    <p className="text-white/60 text-[11px] mt-0.5">นโยบายความเป็นส่วนตัว (ระบุว่าใช้ไมโครโฟนเพื่ออัดเสียงแซมเปิล)</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-white">6. ไฟล์ .AAB (App Bundle)</span>
                    <p className="text-white/60 text-[11px] mt-0.5">ดาวน์โหลดได้จาก PWABuilder หรือ Bubblewrap</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-[#070a10] flex items-center justify-between">
          <a
            href="/manifest.json"
            target="_blank"
            download="manifest.json"
            className="flex items-center gap-1.5 text-[#00f0ff] hover:underline font-extrabold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ดู/ดาวน์โหลด manifest.json</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-[#00f0ff] hover:bg-[#00f0ff]/80 text-black text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
