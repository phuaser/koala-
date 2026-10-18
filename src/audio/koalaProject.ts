import JSZip from 'jszip';
import { PadData, BankId } from '../types/sampler';
import { audioBufferToWav } from './wavEncoder';
import { audioEngine } from './audioEngine';

export interface KoalaProjectData {
  name: string;
  bpm: number;
  swing: number;
  pads: PadData[];
  patterns: boolean[][][]; // 8 patterns x 16 pads x 16 steps
  activePatternIdx: number;
}

// Export current session to a real .koala project archive
export async function exportKoalaProject(
  pads: PadData[],
  patterns: boolean[][][],
  bpm: number,
  swing: number,
  projectName = 'My_Koala_Beat'
): Promise<Blob> {
  const zip = new JSZip();

  // Create song.json manifest matching Koala Sampler structure
  const manifestPads = pads.map((p) => ({
    id: p.id,
    bank: p.bank,
    name: p.name,
    category: p.category,
    pitch: p.pitch,
    volume: p.volume,
    pan: p.pan,
    attack: p.attack,
    release: p.release,
    chokeGroup: p.chokeGroup,
    reverse: p.reverse,
    playMode: p.playMode,
    startTrim: p.startTrim,
    endTrim: p.endTrim,
    hasAudio: !!p.audioBuffer,
    fileName: p.audioBuffer ? `samples/sample${p.id}.wav` : null,
  }));

  const songData = {
    app: 'Koala Sampler',
    version: '1.0',
    name: projectName,
    bpm,
    swing,
    date: new Date().toISOString(),
    pads: manifestPads,
    patterns, // 8 patterns x 16 tracks x 16 steps
    steps: patterns[0] || [], // Backward compatibility
  };

  zip.file('song.json', JSON.stringify(songData, null, 2));

  // Add all audio buffers as WAV files
  const samplesFolder = zip.folder('samples');
  for (const pad of pads) {
    if (pad.audioBuffer && samplesFolder) {
      try {
        const wavBuffer = audioBufferToWav(pad.audioBuffer);
        samplesFolder.file(`sample${pad.id}.wav`, wavBuffer);
      } catch (err) {
        console.warn(`Could not encode pad ${pad.id} to WAV`, err);
      }
    }
  }

  // Generate ZIP blob with .koala mime-type
  const content = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/octet-stream',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return content;
}

// Trigger browser download for .koala file
export function downloadKoalaFile(blob: Blob, filename = 'My_Beat.koala') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.koala') ? filename : `${filename}.koala`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper: Parse pad index 0-63 from various filename formats
function parsePadIndex(filename: string): number {
  const clean = filename.replace(/^.*[\\/]/, ''); // remove folder paths e.g. samples/

  // Format 1: A1-A16, B1-B16, C1-C16, D1-D16
  const bankMatch = clean.match(/^([A-Da-d])_?(\d+)/i);
  if (bankMatch) {
    const bankLetter = bankMatch[1].toUpperCase();
    const bankNum = parseInt(bankMatch[2], 10) - 1;
    const bankOffset = { A: 0, B: 16, C: 32, D: 48 }[bankLetter] ?? 0;
    return bankOffset + Math.max(0, Math.min(15, bankNum));
  }

  // Format 2: sample0.wav, sample_0.wav, pad0.wav, 0.wav
  const numMatch = clean.match(/(?:sample|pad|track)?_?(\d+)/i);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (!isNaN(num) && num >= 0 && num < 64) {
      return num;
    }
  }

  return -1;
}

// Import and unpack a .koala project archive across all 4 banks + sequences
export async function importKoalaProject(
  file: File,
  audioContext: AudioContext
): Promise<KoalaProjectData | null> {
  try {
    const zip = await JSZip.loadAsync(file);

    // Look for song.json, project.json, or any json
    let songJsonStr: string | null = null;
    const songFile = zip.file('song.json') || zip.file('project.json') || Object.values(zip.files).find(f => f.name.endsWith('.json'));
    
    if (songFile) {
      songJsonStr = await songFile.async('text');
    }

    let parsedManifest: any = null;
    if (songJsonStr) {
      try {
        parsedManifest = JSON.parse(songJsonStr);
      } catch {}
    }

    const bpm = parsedManifest?.bpm ?? 88;
    const swing = parsedManifest?.swing ?? 25;
    const name = parsedManifest?.name ?? file.name.replace(/\.koala$/i, '');

    // Initialize 64 pads across Banks A, B, C, D
    const banks: BankId[] = ['A', 'B', 'C', 'D'];
    const loadedPads: PadData[] = [];

    for (let b = 0; b < 4; b++) {
      for (let i = 0; i < 16; i++) {
        const overallId = b * 16 + i;
        const meta = parsedManifest?.pads?.find((p: any) => p.id === overallId) || parsedManifest?.samples?.[overallId];

        loadedPads.push({
          id: overallId,
          bank: banks[b],
          name: meta?.name ?? `PAD ${banks[b]}${i + 1}`,
          category: meta?.category ?? (i < 4 ? 'kick' : i < 8 ? 'snare' : 'chord'),
          color: b % 2 === 0 ? '#00f0ff' : '#38bdf8',
          audioBuffer: null,
          pitch: meta?.pitch ?? 0,
          volume: meta?.volume ?? meta?.vol ?? 0.9,
          pan: meta?.pan ?? 0,
          attack: meta?.attack ?? 0.001,
          release: meta?.release ?? 0.1,
          chokeGroup: meta?.chokeGroup ?? meta?.choke ?? 0,
          reverse: meta?.reverse ?? false,
          playMode: meta?.playMode ?? (meta?.loop ? 'loop' : 'oneshot'),
          startTrim: meta?.startTrim ?? meta?.start ?? 0,
          endTrim: meta?.endTrim ?? meta?.end ?? 1,
        });
      }
    }

    // Extract all audio files in the zip
    const audioFiles = Object.values(zip.files).filter(
      (f) => !f.dir && f.name.match(/\.(wav|mp3|ogg|m4a|aiff|flac|aac)$/i)
    );

    // Track which pad IDs are filled
    const filledPadIndices = new Set<number>();

    for (const aFile of audioFiles) {
      try {
        const arrayBuffer = await aFile.async('arraybuffer');
        const decodedBuffer = await audioContext.decodeAudioData(arrayBuffer);

        let targetPadIndex = parsePadIndex(aFile.name);

        if (targetPadIndex === -1 || filledPadIndices.has(targetPadIndex)) {
          // Find next available empty pad
          targetPadIndex = loadedPads.findIndex((p, idx) => !filledPadIndices.has(idx));
        }

        if (targetPadIndex >= 0 && targetPadIndex < loadedPads.length) {
          loadedPads[targetPadIndex].audioBuffer = decodedBuffer;
          filledPadIndices.add(targetPadIndex);

          if (!parsedManifest?.pads) {
            const cleanName = aFile.name.replace(/^.*[\\/]/, '').replace(/\.[^/.]+$/, '').slice(0, 14);
            loadedPads[targetPadIndex].name = cleanName.toUpperCase();
          }
        }
      } catch (decodeErr) {
        console.warn(`Failed to decode audio file ${aFile.name}`, decodeErr);
      }
    }

    // Ensure all 4 banks have sound (auto-fill any remaining pads so NO PAD IS MUTE)
    loadedPads.forEach((pad, idx) => {
      if (!pad.audioBuffer) {
        pad.audioBuffer = audioEngine.generateProceduralSound(audioEngine.getFallbackSoundForPad(idx));
      }
    });

    // Parse or generate 8 patterns (16 pads x 16 steps)
    const patterns: boolean[][][] = Array.from({ length: 8 }, () =>
      Array.from({ length: 16 }, () => Array(16).fill(false))
    );

    let hasParsedSequence = false;

    // Case 1: manifest has 8 patterns
    if (Array.isArray(parsedManifest?.patterns)) {
      parsedManifest.patterns.forEach((pat: any, pIdx: number) => {
        if (pIdx < 8) {
          if (Array.isArray(pat) && Array.isArray(pat[0])) {
            patterns[pIdx] = pat.slice(0, 16);
            hasParsedSequence = true;
          } else if (Array.isArray(pat?.events)) {
            pat.events.forEach((ev: any) => {
              const p = (ev.pad ?? ev.note ?? ev.track) % 16;
              const s = (ev.step ?? Math.round((ev.time ?? 0) * 4)) % 16;
              if (patterns[pIdx][p]) {
                patterns[pIdx][p][s] = true;
                hasParsedSequence = true;
              }
            });
          }
        }
      });
    }

    // Case 2: manifest has sequences or steps
    if (!hasParsedSequence && Array.isArray(parsedManifest?.steps)) {
      patterns[0] = parsedManifest.steps.slice(0, 16);
      hasParsedSequence = true;
    } else if (!hasParsedSequence && Array.isArray(parsedManifest?.sequences)) {
      parsedManifest.sequences.forEach((seq: any, pIdx: number) => {
        if (pIdx < 8 && Array.isArray(seq?.events)) {
          seq.events.forEach((ev: any) => {
            const p = (ev.pad ?? ev.note ?? 0) % 16;
            const s = (ev.step ?? Math.round((ev.time ?? 0) * 4)) % 16;
            if (patterns[pIdx][p]) {
              patterns[pIdx][p][s] = true;
              hasParsedSequence = true;
            }
          });
        }
      });
    }

    // If no sequence was found in the imported project file, keep patterns clean and empty
    // so no unexpected notes/sounds play automatically from the user's imported pads!
    if (!hasParsedSequence) {
      // All patterns start empty (16 tracks x 16 steps = false)
    }

    return {
      name,
      bpm,
      swing,
      pads: loadedPads,
      patterns,
      activePatternIdx: 0,
    };
  } catch (err) {
    console.error('Error importing .koala project:', err);
    return null;
  }
}
