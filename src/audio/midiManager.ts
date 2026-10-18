// Web MIDI API Manager with M-VAVE SMK-37 Preset & Interactive MIDI Learn

export interface MidiMapping {
  // Pad triggers (Bank A 0-15 or current bank): mapped to MIDI note numbers
  padNotes: Record<number, number>; // midiNote -> padIndex (0 to 15)
  // Control Change mappings (e.g. Footswitch CC 64 -> Play/Pause)
  ccPlayStop: number; // default 64 (sustain / footswitch pedal)
  ccVolume: number;   // default 20
  ccPitch: number;    // default 21
  ccPan: number;      // default 22
  ccFilter: number;   // default 23
}

export const DEFAULT_MVAVE_MAPPING: MidiMapping = {
  // M-VAVE SMK-37 / SMK-25 16 Drum Pads (Standard chromatic 36-51, C1 to D#2)
  padNotes: {
    36: 0,  // Pad 1 (Kick)
    37: 1,  // Pad 2 (Snare)
    38: 2,  // Pad 3 (Closed Hat)
    39: 3,  // Pad 4 (Open Hat)
    40: 4,  // Pad 5 (Clap)
    41: 5,  // Pad 6 (Rim)
    42: 6,  // Pad 7 (808 Bass)
    43: 7,  // Pad 8 (Chord 1)
    44: 8,  // Pad 9 (Chord 2)
    45: 9,  // Pad 10 (Chord 3)
    46: 10, // Pad 11 (Chord 4)
    47: 11, // Pad 12 (Vocal 1)
    48: 12, // Pad 13 (Vocal 2)
    49: 13, // Pad 14 (Guitar)
    50: 14, // Pad 15 (Vinyl Pop)
    51: 15, // Pad 16 (Tape Rewind)
  },
  ccPlayStop: 64, // M-VAVE Footswitch Pedal / Sustain
  ccVolume: 20,   // Knob 1
  ccPitch: 21,    // Knob 2
  ccPan: 22,      // Knob 3
  ccFilter: 23,   // Knob 4
};

type MidiEventHandler = (event: {
  type: 'noteon' | 'noteoff' | 'cc';
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  padIndex?: number;
}) => void;

class MidiManager {
  private midiAccess: MIDIAccess | null = null;
  private isSupported = false;
  private connectedDevices: string[] = [];
  private mapping: MidiMapping = { ...DEFAULT_MVAVE_MAPPING };
  private listeners: Set<MidiEventHandler> = new Set();

  // MIDI Learn state
  public isLearning = false;
  public learningTarget: 'pad' | 'playstop' | 'volume' | 'pitch' | 'pan' | null = null;
  public learningPadIndex: number | null = null;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public async init(): Promise<boolean> {
    if (!this.isSupported) return false;

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.updateConnectedDevices();

      this.midiAccess.onstatechange = () => {
        this.updateConnectedDevices();
      };

      this.attachInputs();
      return true;
    } catch {
      // Permission denied or MIDI not available
      return false;
    }
  }

  private updateConnectedDevices() {
    if (!this.midiAccess) return;
    const devices: string[] = [];
    this.midiAccess.inputs.forEach((input) => {
      const name = input.name || input.manufacturer || 'MIDI Device';
      if (!devices.includes(name)) {
        devices.push(name);
      }
    });
    this.connectedDevices = devices;
  }

  private attachInputs() {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = (e) => this.handleMidiMessage(e);
    });
  }

  private handleMidiMessage(e: MIDIMessageEvent) {
    if (!e.data || e.data.length < 2) return;
    const status = e.data[0];
    const data1 = e.data[1];
    const data2 = e.data.length > 2 ? e.data[2] : 0;

    const command = status >> 4;
    // const channel = status & 0xf;

    // Note On (command 9 with velocity > 0)
    if (command === 9 && data2 > 0) {
      const note = data1;
      const velocity = data2;

      // Handle MIDI Learn
      if (this.isLearning) {
        if (this.learningTarget === 'pad' && this.learningPadIndex !== null) {
          this.mapping.padNotes[note] = this.learningPadIndex;
          this.stopLearning();
          return;
        }
      }

      // Check pad mapping
      const mappedPad = this.mapping.padNotes[note];
      this.emit({
        type: 'noteon',
        note,
        velocity,
        padIndex: mappedPad !== undefined ? mappedPad : undefined,
      });
      return;
    }

    // Note Off (command 8 or command 9 with velocity === 0)
    if (command === 8 || (command === 9 && data2 === 0)) {
      const note = data1;
      const mappedPad = this.mapping.padNotes[note];
      this.emit({
        type: 'noteoff',
        note,
        padIndex: mappedPad !== undefined ? mappedPad : undefined,
      });
      return;
    }

    // Control Change (command 11)
    if (command === 11) {
      const controller = data1;
      const value = data2;

      // Handle MIDI Learn for CC
      if (this.isLearning) {
        if (this.learningTarget === 'playstop') {
          this.mapping.ccPlayStop = controller;
          this.stopLearning();
          return;
        }
        if (this.learningTarget === 'volume') {
          this.mapping.ccVolume = controller;
          this.stopLearning();
          return;
        }
        if (this.learningTarget === 'pitch') {
          this.mapping.ccPitch = controller;
          this.stopLearning();
          return;
        }
        if (this.learningTarget === 'pan') {
          this.mapping.ccPan = controller;
          this.stopLearning();
          return;
        }
      }

      this.emit({
        type: 'cc',
        controller,
        value,
      });
    }
  }

  public subscribe(handler: MidiEventHandler) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private emit(event: Parameters<MidiEventHandler>[0]) {
    this.listeners.forEach((h) => h(event));
  }

  public getConnectedDevices(): string[] {
    return this.connectedDevices;
  }

  public getMapping(): MidiMapping {
    return { ...this.mapping };
  }

  public setMapping(mapping: MidiMapping) {
    this.mapping = { ...mapping };
  }

  public resetToMVaveSMK37() {
    this.mapping = { ...DEFAULT_MVAVE_MAPPING };
  }

  public startLearning(target: 'pad' | 'playstop' | 'volume' | 'pitch' | 'pan', padIndex: number | null = null) {
    this.isLearning = true;
    this.learningTarget = target;
    this.learningPadIndex = padIndex;
  }

  public stopLearning() {
    this.isLearning = false;
    this.learningTarget = null;
    this.learningPadIndex = null;
  }
}

export const midiManager = new MidiManager();
