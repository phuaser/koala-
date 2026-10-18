# แผนการปรับโฉม Koala Sampler UI แท้ และระบบ MIDI สำหรับ M-Vave SMK-37

## 1. ปรับดีไซน์ UI ตามภาพต้นฉบับ Koala Sampler
- **แท็บโหมดหลัก 3 โหมด**: `SAMPLE` (หน้าจอแซมเปิลและคลื่นเสียง), `SEQUENCE` (16-Step Beatmaker), `PERFORM` (DJ Touch FX) และปุ่มเมนู `☰` (การตั้งค่า & MIDI)
- **จอแสดงผลคลื่นเสียงขนาดใหญ่ (Main Waveform Editor)**:
  - วาดคลื่นเสียงความละเอียดสูงด้วย Canvas ในโทนสีฟ้า Cyan (`#00d2ff`) บนพื้นหลังไวนิลเข้ม
  - แถบไฮไลต์สีแดง-ชมพู (Slice / Trim Region) สามารถลากปรับจุดเริ่มต้น (Start) และจุดสิ้นสุด (End) ได้แบบเรียลไทม์
  - มีเส้นบอกตำแหน่งเล่น (Playhead scrubbing line) วิ่งตามเสียงขณะเล่น
- **แถบคำสั่งเครื่องมือใต้ Waveform**:
  - `ONE SHOT`, `REVERSE`, `LOOP`, `ATTACK`, `RELEASE`, `CHOKE: 1-4`, `AUTO CHOP`
- **ชุดลูกบิดหมุนเสมือนจริง (Tactile Rotary Knobs)**:
  - ลูกบิดหมุนลากปรับค่า `VOL`, `PITCH`, `PAN` พร้อมปุ่ม `EDIT` และ `CLEAR / DELETE`
- **16 Sampler Pads พร้อมคลื่นเสียงจิ๋ว (Mini Waveforms)**:
  - แต่ละ Pad จะคำนวณและวาดเส้นคลื่นเสียงจริงของตัวอย่างเสียงนั้นๆ ลงไป
  - สีสันคู่โทนฟ้า Cyan และแดง Magenta แบบเดียวกับในภาพหน้าจอ
- **Bank Bar**: แท็บสลับ `A`, `B`, `C`, `D` ที่แถบด้านล่าง

## 2. ระบบเชื่อมต่อ MIDI & Hardware (M-Vave SMK-37)
- **Web MIDI API Engine**:
  - ตรวจจับพอร์ต MIDI ที่เชื่อมต่อผ่านสาย USB หรือ Bluetooth โดยอัตโนมัติ (เช่น M-VAVE SMK-25 / SMK-37, Chocolate Footswitch)
  - แสดงสถานะการเชื่อมต่อ (Connected Device Name)
- **พรีเซ็ตสำเร็จรูปสำหรับ M-VAVE SMK-37**:
  - 16 RGB Drum Pads บน SMK-37 (Note 36–51 / C1–D#2) ต่อตรงกับ Pads 1–16
  - คีย์บอร์ด 37 คีย์ สำหรับเล่นเสียงเมโลดี้ตามระดับเสียง (Chromatic Pitch)
  - แป้นลูกบิด Knobs หมุนควบคุม Volume, Pitch, Pan, Filter Cutoff
  - ช่องต่อฟุตสวิตช์ / Sustain Pedal (CC 64) สั่ง Play / Pause หรือควบคุมจังหวะขณะเล่นกลอง/กีตาร์สด
- **ระบบ MIDI Learn แบบโต้ตอบได้**:
  - ผู้ใช้สามารถกด "MIDI Learn" แล้วแตะ Pad หรือปุ่มใดๆ ในจอ จากนั้นเคาะแป้นหรือเหยียบฟุตสวิตช์บน M-VAVE เพื่อผูกคำสั่งได้ทันที
