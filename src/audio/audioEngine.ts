import { PadData, PerformanceFXState } from '../types/sampler';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // FX Nodes
  private filterNode: BiquadFilterNode | null = null;
  private bitcrushNode: WaveShaperNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private tapeStopGain: GainNode | null = null;

  // Active playing sources tracking for choke groups & stopping & progress
  private activeVoices: Map<
    number,
    {
      source: AudioBufferSourceNode;
      gain: GainNode;
      panner?: StereoPannerNode | null;
      chokeGroup: number;
      startTime: number;
      duration: number;
      startTrim: number;
      endTrim: number;
      playbackRate: number;
      isLoop?: boolean;
      isReverse?: boolean;
    }
  > = new Map();
  
  // Mic Recording
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private micAnalyser: AnalyserNode | null = null;
  private micAudioProcessor: ScriptProcessorNode | null = null;
  private micPCMChunks: Float32Array[] = [];
  private micStreamSource: MediaStreamAudioSourceNode | null = null;
  private micMuteGain: GainNode | null = null;

  // Resampling
  private resampleDestination: MediaStreamAudioDestinationNode | null = null;
  private resampleRecorder: MediaRecorder | null = null;
  private resampleChunks: Blob[] = [];

  public isInitialized = false;

  public init() {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Create Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    // Performance Filter
    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = 'lowpass';
    this.filterNode.frequency.value = 20000;
    this.filterNode.Q.value = 1.0;

    // Tape Stop Gain
    this.tapeStopGain = this.ctx.createGain();
    this.tapeStopGain.gain.value = 1.0;

    // Bitcrush / Saturation waveshaper
    this.bitcrushNode = this.ctx.createWaveShaper();
    this.bitcrushNode.curve = this.makeDistortionCurve(0);
    this.bitcrushNode.oversample = 'none';

    // Delay
    this.delayNode = this.ctx.createDelay(1.0);
    this.delayNode.delayTime.value = 0.28; // ~120 bpm eighth
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = 0.35;
    this.delayWetGain = this.ctx.createGain();
    this.delayWetGain.gain.value = 0;

    this.delayNode.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayNode.connect(this.delayWetGain);

    // Reverb
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createSyntheticImpulse(1.6, 2.0);
    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0;

    this.reverbConvolver.connect(this.reverbWetGain);

    // Dry Path
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    // Connect FX Chain:
    // Sources -> filterNode -> tapeStopGain -> bitcrushNode
    // Then splits into:
    //  - dryGain -> masterGain
    //  - delayNode -> delayWetGain -> masterGain
    //  - reverbConvolver -> reverbWetGain -> masterGain
    // masterGain -> analyser -> destination
    this.filterNode.connect(this.tapeStopGain);
    this.tapeStopGain.connect(this.bitcrushNode);

    this.bitcrushNode.connect(this.dryGain);
    this.bitcrushNode.connect(this.delayNode);
    this.bitcrushNode.connect(this.reverbConvolver);

    this.dryGain.connect(this.masterGain);
    this.delayWetGain.connect(this.masterGain);
    this.reverbWetGain.connect(this.masterGain);

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Resampling Destination
    this.resampleDestination = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.resampleDestination);

    this.isInitialized = true;
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      this.init();
    }
    return this.ctx!;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  // Generate synthetic impulse response for reverb
  private createSyntheticImpulse(duration: number, decay: number): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const dec = Math.pow(1 - n, decay);
      left[i] = (Math.random() * 2 - 1) * dec;
      right[i] = (Math.random() * 2 - 1) * dec;
    }
    return impulse;
  }

  private makeDistortionCurve(amount: number): Float32Array<ArrayBuffer> {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    const k = typeof amount === 'number' && amount > 0 ? amount * 20 : 0;
    
    if (k === 0) {
      for (let i = 0; i < n_samples; ++i) {
        curve[i] = (i * 2) / n_samples - 1;
      }
      return curve;
    }

    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Update Performance FX in real-time
  public updateFX(fx: PerformanceFXState) {
    if (!this.ctx || !this.filterNode || !this.tapeStopGain || !this.bitcrushNode || !this.delayWetGain || !this.reverbWetGain) return;
    const now = this.ctx.currentTime;

    // Filter
    if (fx.filterActive) {
      this.filterNode.type = fx.filterType;
      this.filterNode.frequency.setTargetAtTime(fx.filterCutoff, now, 0.02);
      this.filterNode.Q.setTargetAtTime(fx.filterResonance, now, 0.02);
    } else {
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.setTargetAtTime(20000, now, 0.02);
      this.filterNode.Q.setTargetAtTime(0.7, now, 0.02);
    }

    // Tape Stop effect
    if (fx.tapeStopActive) {
      this.tapeStopGain.gain.cancelScheduledValues(now);
      this.tapeStopGain.gain.setValueAtTime(this.tapeStopGain.gain.value, now);
      this.tapeStopGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    } else {
      this.tapeStopGain.gain.cancelScheduledValues(now);
      this.tapeStopGain.gain.setTargetAtTime(1.0, now, 0.03);
    }

    // Bitcrush / Saturation
    if (fx.bitcrushActive) {
      this.bitcrushNode.curve = this.makeDistortionCurve(1.5);
    } else {
      this.bitcrushNode.curve = this.makeDistortionCurve(0);
    }

    // Delay
    if (fx.delayActive) {
      this.delayWetGain.gain.setTargetAtTime(0.45, now, 0.03);
      if (this.delayFeedbackGain) {
        this.delayFeedbackGain.gain.setTargetAtTime(fx.delayFeedback, now, 0.03);
      }
      if (this.delayNode) {
        this.delayNode.delayTime.setTargetAtTime(fx.delayTime, now, 0.03);
      }
    } else {
      this.delayWetGain.gain.setTargetAtTime(0, now, 0.03);
    }

    // Reverb
    if (fx.reverbActive) {
      this.reverbWetGain.gain.setTargetAtTime(fx.reverbWet, now, 0.03);
    } else {
      this.reverbWetGain.gain.setTargetAtTime(0, now, 0.03);
    }
  }

  // Play a pad sound
  public playPad(pad: PadData, globalPitchShift = 0): AudioBufferSourceNode | null {
    if (!this.ctx || !this.filterNode) {
      this.init();
    }
    const ctx = this.ctx!;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (!pad.audioBuffer) {
      pad.audioBuffer = this.generateProceduralSound(this.getFallbackSoundForPad(pad.id));
    }

    // Handle Choke Group (Mute Group)
    if (pad.chokeGroup > 0) {
      this.activeVoices.forEach((voice, padId) => {
        if (voice.chokeGroup === pad.chokeGroup) {
          try {
            voice.gain.gain.cancelScheduledValues(ctx.currentTime);
            voice.gain.gain.setValueAtTime(voice.gain.gain.value, ctx.currentTime);
            voice.gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.015);
            voice.source.stop(ctx.currentTime + 0.02);
          } catch {
            // Ignore if already stopped
          }
          this.activeVoices.delete(padId);
        }
      });
    }

    // Stop existing voice on this exact pad if already playing
    if (this.activeVoices.has(pad.id)) {
      const prev = this.activeVoices.get(pad.id);
      if (prev) {
        try {
          prev.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.01);
          prev.source.stop(ctx.currentTime + 0.015);
        } catch {}
      }
      this.activeVoices.delete(pad.id);
    }

    // Create Source
    const source = ctx.createBufferSource();
    
    // Reverse buffer if pad.reverse is true
    let bufferToPlay = pad.audioBuffer;
    if (pad.reverse) {
      bufferToPlay = this.getReversedBuffer(pad.audioBuffer);
    }
    source.buffer = bufferToPlay;

    // Playback rate from pitch (semitones) + global pitch shift
    const totalSemitones = pad.pitch + globalPitchShift;
    const playbackRate = Math.pow(2, totalSemitones / 12);
    source.playbackRate.value = Math.max(0.05, Math.min(4.0, playbackRate));

    // Pad Gain Node (Envelope & Volume)
    const padGain = ctx.createGain();
    const now = ctx.currentTime;
    const targetVolume = Math.max(0.0001, pad.volume);

    if (pad.attack > 0.005) {
      padGain.gain.setValueAtTime(0.0001, now);
      padGain.gain.linearRampToValueAtTime(targetVolume, now + pad.attack);
    } else {
      padGain.gain.setValueAtTime(targetVolume, now);
    }

    // Panner
    const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = pad.pan;
    }

    // Connect node chain
    if (panner) {
      source.connect(padGain);
      padGain.connect(panner);
      panner.connect(this.filterNode!);
    } else {
      source.connect(padGain);
      padGain.connect(this.filterNode!);
    }

    // Calculate Trimming
    const duration = bufferToPlay.duration;
    const offset = Math.max(0, pad.startTrim * duration);
    const playLength = Math.max(0.02, (pad.endTrim - pad.startTrim) * duration);

    // Loop mode
    if (pad.playMode === 'loop') {
      source.loop = true;
      source.loopStart = offset;
      source.loopEnd = offset + playLength;
    }

    // Start playback
    source.start(now, offset, pad.playMode === 'loop' ? undefined : playLength);

    this.activeVoices.set(pad.id, {
      source,
      gain: padGain,
      panner,
      chokeGroup: pad.chokeGroup,
      startTime: now,
      duration: duration,
      startTrim: pad.startTrim,
      endTrim: pad.endTrim,
      playbackRate: playbackRate,
      isLoop: pad.playMode === 'loop',
      isReverse: pad.reverse,
    });

    source.onended = () => {
      if (this.activeVoices.get(pad.id)?.source === source) {
        this.activeVoices.delete(pad.id);
      }
    };

    return source;
  }

  // Real-time immediate update of volume, pitch, pan while playing or holding
  public updateVoiceRealtime(
    padId: number,
    params: { volume?: number; pitch?: number; pan?: number }
  ): void {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(padId);
    if (!voice) return;

    const now = this.ctx.currentTime;

    // Instant volume change
    if (params.volume !== undefined && voice.gain) {
      const targetVol = Math.max(0.0001, params.volume);
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setTargetAtTime(targetVol, now, 0.012);
    }

    // Instant pitch change
    if (params.pitch !== undefined && voice.source) {
      const newRate = Math.pow(2, params.pitch / 12);
      voice.playbackRate = Math.max(0.05, Math.min(4.0, newRate));
      voice.source.playbackRate.cancelScheduledValues(now);
      voice.source.playbackRate.setTargetAtTime(voice.playbackRate, now, 0.015);
    }

    // Instant pan change
    if (params.pan !== undefined && voice.panner) {
      const targetPan = Math.max(-1, Math.min(1, params.pan));
      voice.panner.pan.cancelScheduledValues(now);
      voice.panner.pan.setTargetAtTime(targetPan, now, 0.015);
    }
  }

  // Get real-time global playback position (0.0 to 1.0) of a sample for playhead cursor (ตัววิ่ง)
  public getPadPlaybackProgress(padId: number): number | null {
    if (!this.ctx) return null;
    const voice = this.activeVoices.get(padId);
    if (!voice) return null;

    const now = this.ctx.currentTime;
    const elapsed = (now - voice.startTime) * voice.playbackRate;
    const sliceDuration = (voice.endTrim - voice.startTrim) * voice.duration;

    if (sliceDuration <= 0) return null;

    // If one-shot has finished its slice duration
    if (!voice.isLoop && elapsed >= sliceDuration) {
      return null;
    }

    // Position inside the active slice (0.0 to 1.0)
    const progressInSlice = voice.isLoop
      ? (elapsed % sliceDuration) / sliceDuration
      : Math.min(1, Math.max(0, elapsed / sliceDuration));

    // Global sample position (0.0 to 1.0)
    const globalProgress = voice.isReverse
      ? voice.endTrim - progressInSlice * (voice.endTrim - voice.startTrim)
      : voice.startTrim + progressInSlice * (voice.endTrim - voice.startTrim);

    return Math.max(0, Math.min(1, globalProgress));
  }

  // Get position within slice (0.0 to 1.0)
  public getPadSliceProgress(padId: number): number | null {
    if (!this.ctx) return null;
    const voice = this.activeVoices.get(padId);
    if (!voice) return null;

    const now = this.ctx.currentTime;
    const elapsed = (now - voice.startTime) * voice.playbackRate;
    const sliceDuration = (voice.endTrim - voice.startTrim) * voice.duration;

    if (sliceDuration <= 0) return null;

    if (!voice.isLoop && elapsed >= sliceDuration) {
      return null;
    }

    const progressInSlice = voice.isLoop
      ? (elapsed % sliceDuration) / sliceDuration
      : Math.min(1, Math.max(0, elapsed / sliceDuration));

    return Math.max(0, Math.min(1, progressInSlice));
  }

  // Get detailed playback stats for playhead badge (current seconds, total seconds, progress)
  public getPadPlaybackDetails(padId: number): {
    currentTime: number;
    totalTime: number;
    globalProgress: number;
    sliceProgress: number;
  } | null {
    if (!this.ctx) return null;
    const voice = this.activeVoices.get(padId);
    if (!voice) return null;

    const now = this.ctx.currentTime;
    const elapsed = (now - voice.startTime) * voice.playbackRate;
    const sliceDuration = (voice.endTrim - voice.startTrim) * voice.duration;

    if (sliceDuration <= 0) return null;

    if (!voice.isLoop && elapsed >= sliceDuration) {
      return null;
    }

    const currentSliceTime = voice.isLoop ? elapsed % sliceDuration : Math.min(sliceDuration, elapsed);
    const sliceProgress = currentSliceTime / sliceDuration;
    const globalProgress = voice.isReverse
      ? voice.endTrim - sliceProgress * (voice.endTrim - voice.startTrim)
      : voice.startTrim + sliceProgress * (voice.endTrim - voice.startTrim);

    return {
      currentTime: currentSliceTime,
      totalTime: sliceDuration,
      globalProgress: Math.max(0, Math.min(1, globalProgress)),
      sliceProgress: Math.max(0, Math.min(1, sliceProgress)),
    };
  }

  // Stop a playing pad (e.g. for Gate mode)
  public stopPad(padId: number, releaseTime = 0.05) {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(padId);
    if (!voice) return;

    const now = this.ctx.currentTime;
    try {
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
      voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
      voice.source.stop(now + releaseTime + 0.01);
    } catch {}
    this.activeVoices.delete(padId);
  }

  // Stop all actively playing voices immediately
  public stopAllVoices(releaseTime = 0.01) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.activeVoices.forEach((voice) => {
      try {
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setValueAtTime(voice.gain.gain.value, now);
        voice.gain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);
        voice.source.stop(now + releaseTime + 0.005);
      } catch {}
    });
    this.activeVoices.clear();
  }

  // Reverse an AudioBuffer
  private getReversedBuffer(buffer: AudioBuffer): AudioBuffer {
    const ctx = this.ctx!;
    const reversed = ctx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const srcData = buffer.getChannelData(c);
      const destData = reversed.getChannelData(c);
      for (let i = 0; i < buffer.length; i++) {
        destData[i] = srcData[buffer.length - 1 - i];
      }
    }
    return reversed;
  }

  // Metronome Click
  public playClick(isHigh = false) {
    if (!this.ctx) this.init();
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(isHigh ? 1200 : 800, now);
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // ----------------------------------------------------------------
  // MICROPHONE SAMPLING
  // ----------------------------------------------------------------
  public async requestMicPermission(): Promise<{ granted: boolean; error?: string }> {
    try {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        return {
          granted: false,
          error: 'เบราว์เซอร์ไม่รองรับ Web Audio / Microphone หรือไม่ได้เปิดบน HTTPS',
        };
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { granted: true };
    } catch (err: unknown) {
      const e = err as Error;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        return {
          granted: false,
          error: 'ผู้ใช้ปฏิเสธการให้สิทธิ์ไมค์ หรือถูกบล็อกโดยเบราว์เซอร์ (คลิกไอคอนกุญแจ 🔒 ที่แถบ URL เพื่อเปิด)',
        };
      }
      if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        return {
          granted: false,
          error: 'ไม่พบอุปกรณ์ไมโครโฟนที่เชื่อมต่อกับคอมพิวเตอร์หรือมือถือ',
        };
      }
      return {
        granted: false,
        error: e.message || 'ไม่สามารถเปิดใช้งานไมโครโฟนได้',
      };
    }
  }

  public async startMicRecording(): Promise<boolean> {
    try {
      this.init();
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      this.recordedChunks = [];
      this.micPCMChunks = [];

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        return false;
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Connect to Analyser for live oscilloscope & VU meter
      this.micStreamSource = ctx.createMediaStreamSource(this.mediaStream);
      this.micAnalyser = ctx.createAnalyser();
      this.micAnalyser.fftSize = 256;
      this.micAnalyser.smoothingTimeConstant = 0.5;
      this.micStreamSource.connect(this.micAnalyser);

      // Connect to ScriptProcessor for raw lossless PCM capture
      this.micAudioProcessor = ctx.createScriptProcessor(4096, 1, 1);
      this.micAudioProcessor.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0);
        this.micPCMChunks.push(new Float32Array(input));
      };
      this.micStreamSource.connect(this.micAudioProcessor);

      // Route processor to a muted gain node to keep processor active without speaker feedback
      this.micMuteGain = ctx.createGain();
      this.micMuteGain.gain.value = 0;
      this.micAudioProcessor.connect(this.micMuteGain);
      this.micMuteGain.connect(ctx.destination);

      // Also start MediaRecorder as secondary fallback if supported
      try {
        const mimeType =
          typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : '';
        const options = mimeType ? { mimeType } : undefined;
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            this.recordedChunks.push(e.data);
          }
        };
        this.mediaRecorder.start();
      } catch {}

      return true;
    } catch {
      return false;
    }
  }

  public async stopMicRecording(): Promise<AudioBuffer | null> {
    const ctx = this.getContext();

    // Stop MediaRecorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
    }

    // Disconnect Web Audio processor & nodes
    if (this.micAudioProcessor) {
      try {
        this.micAudioProcessor.disconnect();
      } catch {}
      this.micAudioProcessor = null;
    }
    if (this.micMuteGain) {
      try {
        this.micMuteGain.disconnect();
      } catch {}
      this.micMuteGain = null;
    }
    if (this.micStreamSource) {
      try {
        this.micStreamSource.disconnect();
      } catch {}
      this.micStreamSource = null;
    }

    // Stop all microphone hardware tracks
    if (this.mediaStream) {
      try {
        this.mediaStream.getTracks().forEach((t) => t.stop());
      } catch {}
      this.mediaStream = null;
    }

    // Method 1: Build AudioBuffer directly from raw PCM chunks
    if (this.micPCMChunks.length > 0) {
      const totalLength = this.micPCMChunks.reduce((acc, c) => acc + c.length, 0);
      if (totalLength > 100) {
        const audioBuffer = ctx.createBuffer(1, totalLength, ctx.sampleRate);
        const channelData = audioBuffer.getChannelData(0);
        let offset = 0;
        for (const chunk of this.micPCMChunks) {
          channelData.set(chunk, offset);
          offset += chunk.length;
        }
        this.micPCMChunks = [];
        return audioBuffer;
      }
    }

    // Method 2: Fallback from MediaRecorder chunks
    if (this.recordedChunks.length > 0) {
      const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        return audioBuffer;
      } catch {}
    }

    return null;
  }

  // Get current microphone input level (0.0 to 1.0)
  public getMicLevel(): number {
    if (!this.micAnalyser) return 0;
    const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
    this.micAnalyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const avg = sum / dataArray.length;
    return Math.min(1, avg / 128);
  }

  // Get waveform time domain byte data for oscilloscope
  public getMicWaveformData(outputArray: Uint8Array): void {
    if (!this.micAnalyser) {
      outputArray.fill(128);
      return;
    }
    (this.micAnalyser.getByteTimeDomainData as (arr: Uint8Array) => void)(outputArray);
  }

  // ----------------------------------------------------------------
  // RESAMPLING (Record Master Output back into a Pad)
  // ----------------------------------------------------------------
  public startResampling() {
    if (!this.resampleDestination) return;
    this.resampleChunks = [];
    try {
      this.resampleRecorder = new MediaRecorder(this.resampleDestination.stream);
      this.resampleRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.resampleChunks.push(e.data);
        }
      };
      this.resampleRecorder.start();
    } catch {}
  }

  public async stopResampling(): Promise<AudioBuffer | null> {
    if (!this.resampleRecorder || this.resampleRecorder.state === 'inactive') return null;

    return new Promise((resolve) => {
      this.resampleRecorder!.onstop = async () => {
        const blob = new Blob(this.resampleChunks, { type: 'audio/webm' });
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.getContext().decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch {
          resolve(null);
        }
      };
      try {
        this.resampleRecorder!.stop();
      } catch {
        resolve(null);
      }
    });
  }

  // ----------------------------------------------------------------
  // FILE IMPORT
  // ----------------------------------------------------------------
  public async loadAudioFile(file: File): Promise<AudioBuffer | null> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = this.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }

  // Get distinct fallback sound type for any pad across Banks A, B, C, D
  public getFallbackSoundForPad(padId: number): string {
    const soundList = [
      'kick', 'snare', 'hihat-closed', 'hihat-open',
      'clap', 'perc-rim', '808-bass', 'rhodes-chord-1',
      'rhodes-chord-2', 'rhodes-chord-3', 'rhodes-chord-4', 'vocal-chop-1',
      'vocal-chop-2', 'guitar-lick', 'vinyl-crackle', 'fx-tape-rewind'
    ];
    return soundList[padId % soundList.length];
  }

  // ----------------------------------------------------------------
  // PROCEDURAL HIGH-FIDELITY INSTRUMENTS & DRUMS
  // Built-in pristine samples modeled on classic samplers (SP-404, MPC)
  // ----------------------------------------------------------------
  public generateProceduralSound(type: string, note = 60): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;

    switch (type) {
      case 'kick': {
        // Deep punchy 808/Boom Bap Kick
        const duration = 0.5;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          // Pitch envelope: 150Hz -> 45Hz
          const freq = 45 + 110 * Math.exp(-t * 28);
          const phase = 2 * Math.PI * freq * t;
          // Click transient
          const click = Math.exp(-t * 120) * (Math.random() * 0.4 - 0.2);
          // Amplitude envelope
          const amp = Math.exp(-t * 8.5);
          // Soft saturation
          const raw = Math.sin(phase) + click;
          data[i] = Math.tanh(raw * 1.5) * amp;
        }
        return buffer;
      }

      case 'snare': {
        // Punchy vintage Snare with snappy wire rattle
        const duration = 0.35;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          // Body tone
          const bodyFreq = 185 * Math.exp(-t * 15);
          const body = Math.sin(2 * Math.PI * bodyFreq * t) * Math.exp(-t * 22);
          // Snappy noise wire
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 14);
          data[i] = (body * 0.6 + noise * 0.75) * Math.exp(-t * 6);
        }
        return buffer;
      }

      case 'hihat-closed': {
        // Crisp sizzling hi-hat
        const duration = 0.08;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          // Multi-osc metal frequency simulation
          const metal = Math.sin(2 * Math.PI * 3400 * t) +
                        Math.sin(2 * Math.PI * 5200 * t) +
                        Math.sin(2 * Math.PI * 7100 * t) +
                        (Math.random() * 2 - 1) * 1.2;
          data[i] = metal * Math.exp(-t * 70) * 0.4;
        }
        return buffer;
      }

      case 'hihat-open': {
        // Open sizzling hat
        const duration = 0.45;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const metal = Math.sin(2 * Math.PI * 3400 * t) +
                        Math.sin(2 * Math.PI * 5800 * t) +
                        Math.sin(2 * Math.PI * 8200 * t) +
                        (Math.random() * 2 - 1) * 1.5;
          data[i] = metal * Math.exp(-t * 8) * 0.35;
        }
        return buffer;
      }

      case 'clap': {
        // Analog multi-burst clap
        const duration = 0.35;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          let burst = 0;
          // Staggered claps
          if (t < 0.01) burst = Math.random() * 2 - 1;
          else if (t < 0.02) burst = (Math.random() * 2 - 1) * 0.8;
          else if (t < 0.032) burst = (Math.random() * 2 - 1) * 0.9;
          else burst = (Math.random() * 2 - 1) * Math.exp(-(t - 0.032) * 15);
          data[i] = burst * 0.7;
        }
        return buffer;
      }

      case 'perc-rim': {
        // High-pitched woodblock / rimshot
        const duration = 0.12;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const tone = Math.sin(2 * Math.PI * 880 * t) + 0.4 * Math.sin(2 * Math.PI * 1760 * t);
          data[i] = tone * Math.exp(-t * 45) * 0.7;
        }
        return buffer;
      }

      case '808-bass': {
        // Deep sub 808 bass (e.g. F1 / 43.65 Hz)
        const duration = 1.2;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        const freq = 43.65; // F1

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const fund = Math.sin(2 * Math.PI * freq * t);
          const second = 0.25 * Math.sin(2 * Math.PI * freq * 2 * t);
          const third = 0.1 * Math.sin(2 * Math.PI * freq * 3 * t);
          const saturation = Math.tanh((fund + second + third) * 1.8);
          data[i] = saturation * Math.exp(-t * 2.2);
        }
        return buffer;
      }

      case 'rhodes-chord-1': {
        // Warm Lo-Fi Dm9 Chord (D, F, A, C, E)
        return this.synthesizePolyChord([146.83, 174.61, 220.0, 261.63, 329.63], 1.8);
      }

      case 'rhodes-chord-2': {
        // G13 Chord (G, B, F, A, E)
        return this.synthesizePolyChord([98.0, 196.0, 246.94, 349.23, 440.0], 1.8);
      }

      case 'rhodes-chord-3': {
        // Cmaj9 Chord (C, E, G, B, D)
        return this.synthesizePolyChord([130.81, 164.81, 196.0, 246.94, 293.66], 1.8);
      }

      case 'rhodes-chord-4': {
        // Am7 Chord (A, C, E, G)
        return this.synthesizePolyChord([110.0, 130.81, 164.81, 196.0], 1.8);
      }

      case 'vocal-chop-1': {
        // Formant vocal chop "Yeah!"
        return this.synthesizeVocalChop('yeah', 260, 0.45);
      }

      case 'vocal-chop-2': {
        // Formant vocal chop "Ooh"
        return this.synthesizeVocalChop('ooh', 320, 0.55);
      }

      case 'guitar-lick': {
        // Lo-fi jazz guitar lick
        const duration = 1.0;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        const notes = [220, 261.63, 293.66, 329.63]; // A, C, D, E

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const noteIdx = Math.min(notes.length - 1, Math.floor(t * 4));
          const noteT = t % 0.25;
          const f = notes[noteIdx];
          const pluck = Math.sin(2 * Math.PI * f * noteT) + 0.3 * Math.sin(2 * Math.PI * f * 2 * noteT);
          data[i] = pluck * Math.exp(-noteT * 12) * 0.45;
        }
        return buffer;
      }

      case 'vinyl-crackle': {
        // Clean subtle vinyl texture without 50Hz buzz or continuous hiss
        const duration = 0.6;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          // Soft isolated dust clicks only, zero electrical hum
          const pop = Math.random() > 0.9992 ? (Math.random() * 2 - 1) * 0.12 : 0;
          data[i] = pop * Math.exp(-t * 3);
        }
        return buffer;
      }

      case 'fx-tape-rewind': {
        // Tape scratch / reverse sweep
        const duration = 0.6;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const f = 200 + 1200 * Math.pow(t / duration, 2);
          const noise = (Math.random() * 2 - 1) * 0.2;
          data[i] = (Math.sin(2 * Math.PI * f * t) + noise) * (t / duration) * 0.4;
        }
        return buffer;
      }

      default: {
        // Fallback sine blip
        const duration = 0.2;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          data[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 20) * 0.5;
        }
        return buffer;
      }
    }
  }

  // Synthesize Polyphonic Rhodes EP tone
  private synthesizePolyChord(frequencies: number[], duration: number): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sampleL = 0;
      let sampleR = 0;
      const tremolo = 1 + 0.15 * Math.sin(2 * Math.PI * 4.5 * t);

      frequencies.forEach((f, idx) => {
        // Rhodes bell harmonic + warm fundamental
        const fundamental = Math.sin(2 * Math.PI * f * t);
        const tine = 0.35 * Math.sin(2 * Math.PI * f * 2.75 * t) * Math.exp(-t * 12);
        const tone = (fundamental + tine) * Math.exp(-t * 1.6);
        // Stereo spread
        const pan = (idx / (frequencies.length - 1)) * 0.6 - 0.3;
        sampleL += tone * (1 - pan);
        sampleR += tone * (1 + pan);
      });

      left[i] = sampleL * 0.16 * tremolo;
      right[i] = sampleR * 0.16 * tremolo;
    }
    return buffer;
  }

  // Synthesize Formant Vocal Chop
  private synthesizeVocalChop(vowel: 'yeah' | 'ooh', pitch: number, duration: number): AudioBuffer {
    const ctx = this.getContext();
    const sampleRate = ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Formant frequency peaks for vowels
    const f1 = vowel === 'yeah' ? 600 : 350;
    const f2 = vowel === 'yeah' ? 1900 : 800;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Vibrato & slight glide
      const vibrato = 1 + 0.03 * Math.sin(2 * Math.PI * 6 * t);
      const curPitch = pitch * (1 + 0.1 * Math.exp(-t * 10)) * vibrato;
      // Carrier wave
      const carrier = (Math.sin(2 * Math.PI * curPitch * t) > 0 ? 1 : -1) * 0.5;
      // Resonant formants
      const res1 = Math.sin(2 * Math.PI * f1 * t);
      const res2 = Math.sin(2 * Math.PI * f2 * t);
      const vocal = carrier * 0.3 + (res1 * 0.4 + res2 * 0.3);
      data[i] = vocal * Math.exp(-t * (1 / duration) * 2.5) * 0.45;
    }
    return buffer;
  }
}

export const audioEngine = new AudioEngine();
