import { audioEngine } from './audioEngine';
import { PadData, BankId, PresetKit } from '../types/sampler';

export function createInitialPads(): PadData[] {
  const pads: PadData[] = [];
  const banks: BankId[] = ['A', 'B', 'C', 'D'];

  // Colors for pad types
  const COLORS = {
    kick: '#ef4444',     // Red
    snare: '#f97316',    // Orange
    hihat: '#eab308',    // Yellow
    perc: '#84cc16',     // Lime
    bass: '#06b6d4',     // Cyan
    chord: '#8b5cf6',    // Purple
    vocal: '#ec4899',    // Pink
    fx: '#14b8a6',       // Teal
    custom: '#64748b',   // Slate
  };

  // Preset definitions for Bank A
  const bankAConfigs: Array<{
    name: string;
    soundType: string;
    category: PadData['category'];
    chokeGroup: number;
    color: string;
    playMode: PadData['playMode'];
  }> = [
    { name: '808 KICK', soundType: 'kick', category: 'kick', chokeGroup: 0, color: COLORS.kick, playMode: 'oneshot' },
    { name: 'VINTAGE SNARE', soundType: 'snare', category: 'snare', chokeGroup: 0, color: COLORS.snare, playMode: 'oneshot' },
    { name: 'CLOSED HAT', soundType: 'hihat-closed', category: 'hihat', chokeGroup: 1, color: COLORS.hihat, playMode: 'oneshot' },
    { name: 'OPEN HAT', soundType: 'hihat-open', category: 'hihat', chokeGroup: 1, color: COLORS.hihat, playMode: 'oneshot' },
    { name: 'ANALOG CLAP', soundType: 'clap', category: 'perc', chokeGroup: 0, color: COLORS.perc, playMode: 'oneshot' },
    { name: 'WOOD RIM', soundType: 'perc-rim', category: 'perc', chokeGroup: 0, color: COLORS.perc, playMode: 'oneshot' },
    { name: 'DEEP 808', soundType: '808-bass', category: 'bass', chokeGroup: 2, color: COLORS.bass, playMode: 'oneshot' },
    { name: 'RHODES Dm9', soundType: 'rhodes-chord-1', category: 'chord', chokeGroup: 3, color: COLORS.chord, playMode: 'oneshot' },
    { name: 'RHODES G13', soundType: 'rhodes-chord-2', category: 'chord', chokeGroup: 3, color: COLORS.chord, playMode: 'oneshot' },
    { name: 'RHODES Cmaj9', soundType: 'rhodes-chord-3', category: 'chord', chokeGroup: 3, color: COLORS.chord, playMode: 'oneshot' },
    { name: 'RHODES Am7', soundType: 'rhodes-chord-4', category: 'chord', chokeGroup: 3, color: COLORS.chord, playMode: 'oneshot' },
    { name: 'VOCAL YEAH', soundType: 'vocal-chop-1', category: 'vocal', chokeGroup: 0, color: COLORS.vocal, playMode: 'oneshot' },
    { name: 'VOCAL OOH', soundType: 'vocal-chop-2', category: 'vocal', chokeGroup: 0, color: COLORS.vocal, playMode: 'oneshot' },
    { name: 'GUITAR LICK', soundType: 'guitar-lick', category: 'chord', chokeGroup: 0, color: COLORS.chord, playMode: 'oneshot' },
    { name: 'VINYL POP', soundType: 'vinyl-crackle', category: 'fx', chokeGroup: 0, color: COLORS.fx, playMode: 'oneshot' },
    { name: 'TAPE REWIND', soundType: 'fx-tape-rewind', category: 'fx', chokeGroup: 0, color: COLORS.fx, playMode: 'oneshot' },
  ];

  // Bank B: Melodic & Basses
  const bankBConfigs: Array<{ name: string; soundType: string; category: PadData['category']; color: string }> = [
    { name: '808 SUB F1', soundType: '808-bass', category: 'bass', color: COLORS.bass },
    { name: '808 SUB G1', soundType: '808-bass', category: 'bass', color: COLORS.bass },
    { name: '808 SUB A1', soundType: '808-bass', category: 'bass', color: COLORS.bass },
    { name: '808 SUB C2', soundType: '808-bass', category: 'bass', color: COLORS.bass },
    { name: 'RHODES Dm9', soundType: 'rhodes-chord-1', category: 'chord', color: COLORS.chord },
    { name: 'RHODES G13', soundType: 'rhodes-chord-2', category: 'chord', color: COLORS.chord },
    { name: 'RHODES Cmaj9', soundType: 'rhodes-chord-3', category: 'chord', color: COLORS.chord },
    { name: 'RHODES Am7', soundType: 'rhodes-chord-4', category: 'chord', color: COLORS.chord },
    { name: 'GUITAR A', soundType: 'guitar-lick', category: 'chord', color: COLORS.chord },
    { name: 'GUITAR C', soundType: 'guitar-lick', category: 'chord', color: COLORS.chord },
    { name: 'GUITAR D', soundType: 'guitar-lick', category: 'chord', color: COLORS.chord },
    { name: 'GUITAR E', soundType: 'guitar-lick', category: 'chord', color: COLORS.chord },
    { name: 'VOX YEAH', soundType: 'vocal-chop-1', category: 'vocal', color: COLORS.vocal },
    { name: 'VOX OOH', soundType: 'vocal-chop-2', category: 'vocal', color: COLORS.vocal },
    { name: 'TAPE REWIND', soundType: 'fx-tape-rewind', category: 'fx', color: COLORS.fx },
    { name: 'VINYL POP', soundType: 'vinyl-crackle', category: 'fx', color: COLORS.fx },
  ];

  // Bank C: Percussion & Rhythm
  const bankCConfigs: Array<{ name: string; soundType: string; category: PadData['category']; color: string }> = [
    { name: '808 KICK PUNCH', soundType: 'kick', category: 'kick', color: COLORS.kick },
    { name: 'BOOM KICK', soundType: 'kick', category: 'kick', color: COLORS.kick },
    { name: 'CRISP SNARE', soundType: 'snare', category: 'snare', color: COLORS.snare },
    { name: 'TIGHT SNARE', soundType: 'snare', category: 'snare', color: COLORS.snare },
    { name: 'CLAP ANALOG', soundType: 'clap', category: 'perc', color: COLORS.perc },
    { name: 'CLAP BRIGHT', soundType: 'clap', category: 'perc', color: COLORS.perc },
    { name: 'CLOSED HAT 1', soundType: 'hihat-closed', category: 'hihat', color: COLORS.hihat },
    { name: 'CLOSED HAT 2', soundType: 'hihat-closed', category: 'hihat', color: COLORS.hihat },
    { name: 'OPEN HAT LONG', soundType: 'hihat-open', category: 'hihat', color: COLORS.hihat },
    { name: 'OPEN HAT SHORT', soundType: 'hihat-open', category: 'hihat', color: COLORS.hihat },
    { name: 'WOOD RIM 1', soundType: 'perc-rim', category: 'perc', color: COLORS.perc },
    { name: 'WOOD RIM 2', soundType: 'perc-rim', category: 'perc', color: COLORS.perc },
    { name: 'PERC TICK', soundType: 'vinyl-crackle', category: 'perc', color: COLORS.perc },
    { name: 'PERC CLICK', soundType: 'perc-rim', category: 'perc', color: COLORS.perc },
    { name: 'VINYL CHOP', soundType: 'vinyl-crackle', category: 'fx', color: COLORS.fx },
    { name: 'TAPE STOP', soundType: 'fx-tape-rewind', category: 'fx', color: COLORS.fx },
  ];

  // Bank D: Chops, Foley & FX
  const bankDConfigs: Array<{ name: string; soundType: string; category: PadData['category']; color: string }> = [
    { name: 'VOCAL DROP', soundType: 'vocal-chop-1', category: 'vocal', color: COLORS.vocal },
    { name: 'VOCAL HIGH', soundType: 'vocal-chop-2', category: 'vocal', color: COLORS.vocal },
    { name: 'JAZZ CHORD 1', soundType: 'rhodes-chord-1', category: 'chord', color: COLORS.chord },
    { name: 'JAZZ CHORD 2', soundType: 'rhodes-chord-2', category: 'chord', color: COLORS.chord },
    { name: 'JAZZ CHORD 3', soundType: 'rhodes-chord-3', category: 'chord', color: COLORS.chord },
    { name: 'JAZZ CHORD 4', soundType: 'rhodes-chord-4', category: 'chord', color: COLORS.chord },
    { name: 'SUB BASS LOW', soundType: '808-bass', category: 'bass', color: COLORS.bass },
    { name: 'SUB BASS MID', soundType: '808-bass', category: 'bass', color: COLORS.bass },
    { name: 'ACOUSTIC KICK', soundType: 'kick', category: 'kick', color: COLORS.kick },
    { name: 'ACOUSTIC SNARE', soundType: 'snare', category: 'snare', color: COLORS.snare },
    { name: 'HIHAT PEDAL', soundType: 'hihat-closed', category: 'hihat', color: COLORS.hihat },
    { name: 'RIDE CYMBAL', soundType: 'hihat-open', category: 'hihat', color: COLORS.hihat },
    { name: 'HAND CLAP', soundType: 'clap', category: 'perc', color: COLORS.perc },
    { name: 'RIM CLICK', soundType: 'perc-rim', category: 'perc', color: COLORS.perc },
    { name: 'VINYL SURFACE', soundType: 'vinyl-crackle', category: 'fx', color: COLORS.fx },
    { name: 'REWIND FX', soundType: 'fx-tape-rewind', category: 'fx', color: COLORS.fx },
  ];

  banks.forEach((bank, bankIdx) => {
    const configMap = {
      A: bankAConfigs,
      B: bankBConfigs,
      C: bankCConfigs,
      D: bankDConfigs,
    }[bank];

    for (let i = 0; i < 16; i++) {
      const overallId = bankIdx * 16 + i;
      const conf = configMap[i];

      pads.push({
        id: overallId,
        bank,
        name: conf.name,
        category: conf.category,
        color: conf.color,
        audioBuffer: audioEngine.generateProceduralSound(conf.soundType),
        pitch: bank === 'B' && conf.category === 'bass' ? (i * 2) - 4 : 0,
        volume: 0.9,
        pan: 0,
        attack: 0.001,
        release: 0.1,
        chokeGroup: conf.category === 'hihat' ? 1 : conf.category === 'bass' ? 2 : 0,
        reverse: false,
        playMode: 'oneshot',
        startTrim: 0,
        endTrim: 1,
      });
    }
  });

  return pads;
}

// Built-in Demo Patterns
export interface DemoPattern {
  name: string;
  bpm: number;
  swing: number;
  description: string;
  steps: boolean[][]; // 16 pads x 16 steps (using bank A pads 0 to 15)
}

export const DEMO_PATTERNS: DemoPattern[] = [
  {
    name: 'Lo-Fi Midnight (ลอฟฟาย ค่ำคืน)',
    bpm: 82,
    swing: 25,
    description: 'จังหวะ Lo-Fi Hip Hop ผ่อนคลาย สไตล์ ChilledCow พร้อมเสียง Rhodes Dm9 และ Cmaj9',
    steps: (() => {
      const s = Array.from({ length: 16 }, () => Array(16).fill(false));
      // Kick (pad 0): steps 0, 7, 10
      s[0][0] = true;
      s[0][7] = true;
      s[0][10] = true;
      // Snare (pad 1): steps 4, 12
      s[1][4] = true;
      s[1][12] = true;
      // Closed Hat (pad 2): every 2 steps
      for (let i = 0; i < 16; i += 2) s[2][i] = true;
      s[2][14] = true;
      // Open Hat (pad 3): step 14
      s[3][14] = true;
      // Deep 808 (pad 6): steps 0, 7, 10
      s[6][0] = true;
      s[6][7] = true;
      s[6][10] = true;
      // Rhodes Dm9 (pad 7): step 0
      s[7][0] = true;
      // Rhodes Cmaj9 (pad 9): step 8
      s[9][8] = true;
      // Vocal Chop Yeah (pad 11): step 12
      s[11][12] = true;
      return s;
    })(),
  },
  {
    name: 'Boom Bap 90s (โกลเด้นอีร่า)',
    bpm: 92,
    swing: 35,
    description: 'สไตล์ฮิปฮอปยุค 90s หนักแน่น สแนร์คมชัด สับไฮแฮทและริฟฟ์กีตาร์แจ๊ส',
    steps: (() => {
      const s = Array.from({ length: 16 }, () => Array(16).fill(false));
      // Kick: steps 0, 3, 8, 11
      s[0][0] = true;
      s[0][3] = true;
      s[0][8] = true;
      s[0][11] = true;
      // Snare: steps 4, 12
      s[1][4] = true;
      s[1][12] = true;
      // Clap: step 12
      s[4][12] = true;
      // Closed Hat: 0, 2, 4, 6, 8, 10, 12, 14, 15
      for (let i = 0; i < 16; i += 2) s[2][i] = true;
      s[2][15] = true;
      // Guitar Lick (pad 13): step 0, 8
      s[13][0] = true;
      s[13][8] = true;
      // Vocal Ooh (pad 12): step 6
      s[12][6] = true;
      return s;
    })(),
  },
  {
    name: 'Neo Soul Chill (นีโอโซล กรู๊ฟ)',
    bpm: 78,
    swing: 40,
    description: 'กรู๊ฟโซลนุ่มลึก สวิงสูง พร้อม Rimshot และคอร์ด Rhodes G13 & Am7',
    steps: (() => {
      const s = Array.from({ length: 16 }, () => Array(16).fill(false));
      // Kick: 0, 6, 10
      s[0][0] = true;
      s[0][6] = true;
      s[0][10] = true;
      // Wood Rim (pad 5): 4, 12
      s[5][4] = true;
      s[5][12] = true;
      // Closed Hat: every step with swing
      for (let i = 0; i < 16; i++) s[2][i] = true;
      // Open Hat: 14
      s[3][14] = true;
      // Deep 808: 0, 6, 10
      s[6][0] = true;
      s[6][6] = true;
      s[6][10] = true;
      // Rhodes G13 (pad 8): 0
      s[8][0] = true;
      // Rhodes Am7 (pad 10): 8
      s[10][8] = true;
      return s;
    })(),
  },
];
