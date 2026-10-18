export type BankId = 'A' | 'B' | 'C' | 'D';

export type PlayMode = 'oneshot' | 'loop' | 'gate';

export interface PadData {
  id: number; // 0 to 15 within current bank (overall 0 to 63)
  bank: BankId;
  name: string;
  category: 'kick' | 'snare' | 'hihat' | 'perc' | 'bass' | 'chord' | 'vocal' | 'fx' | 'custom';
  color: string;
  audioBuffer: AudioBuffer | null;
  pitch: number; // semitones -12 to +12
  volume: number; // 0 to 1.5
  pan: number; // -1 to +1
  attack: number; // seconds
  release: number; // seconds
  chokeGroup: number; // 0 = none, 1, 2, 3, 4
  reverse: boolean;
  playMode: PlayMode;
  startTrim: number; // 0 to 1
  endTrim: number; // 0 to 1
  isMuted?: boolean;
}

export interface StepSequence {
  steps: boolean[][]; // 16 pads x 16 steps
}

export interface PerformanceFXState {
  filterActive: boolean;
  filterCutoff: number; // 200 to 18000
  filterResonance: number; // 0 to 15
  filterType: 'lowpass' | 'highpass';
  tapeStopActive: boolean;
  stutterActive: boolean;
  stutterRate: number; // 4, 8, 16, 32
  bitcrushActive: boolean;
  bitDepth: number; // 2 to 16
  reverbActive: boolean;
  reverbWet: number; // 0 to 1
  delayActive: boolean;
  delayTime: number; // 0.1 to 0.8
  delayFeedback: number; // 0 to 0.8
  pitchShift: number; // -12 to +12 global
}

export type PresetKit = 'lofi-nostalgia' | 'boombap-classic' | 'chillhop-dreams' | 'trap-punch';
