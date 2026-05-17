import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * useGaplessAudio — 使用 Web Audio API 实现无缝循环音频播放
 *
 * 主线程负责 fetch + decodeAudioData（异步非阻塞），
 * 然后 Float32Array 声道数据传给 Web Worker 做 CPU 密集的 RMS 扫描、裁剪、交叉淡化。
 */

let _audioCtx: AudioContext | null = null;

interface CachedAudio {
  buffer: AudioBuffer;
  loopStart: number;
  loopEnd: number;
}

const _bufferCache = new Map<string, CachedAudio>();
/** 去重：防止同一 src 并发加载 */
const _pendingLoads = new Map<string, Promise<CachedAudio | null>>();

function getAudioContext(): AudioContext {
  if (!_audioCtx) {
    _audioCtx = new AudioContext();
  }
  if (_audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(() => {});
  }
  return _audioCtx;
}

if (typeof window !== 'undefined') {
  const resume = () => {
    if (_audioCtx && _audioCtx.state === 'suspended') {
      _audioCtx.resume().catch(() => {});
    }
  };
  window.addEventListener('click', resume, { once: true });
  window.addEventListener('touchstart', resume, { once: true });
  window.addEventListener('keydown', resume, { once: true });
}

// ──────── Web Worker 管理 ────────

let _worker: Worker | null = null;
let _nextId = 0;
const _pending = new Map<number, { resolve: (v: { channels: Float32Array[]; sampleRate: number; loopStart: number; loopEnd: number }) => void; reject: (err: unknown) => void }>();

function getWorker(): Worker | null {
  if (_worker) return _worker;
  try {
    _worker = new Worker(new URL('./audio.worker.ts', import.meta.url), { type: 'module' });
    _worker.onmessage = (e: MessageEvent<{ id: number; channels?: Float32Array[]; sampleRate?: number; loopStart?: number; loopEnd?: number; error?: string }>) => {
      const { id, channels, sampleRate, loopStart, loopEnd, error } = e.data;
      const pending = _pending.get(id);
      if (!pending) return;
      _pending.delete(id);

      if (error || !channels || !sampleRate) {
        pending.reject(new Error(error || 'Worker processing failed'));
        return;
      }

      pending.resolve({ channels, sampleRate, loopStart: loopStart ?? 0, loopEnd: loopEnd ?? 0 });
    };

    _worker.onerror = (err) => {
      console.error('[useGaplessAudio] Worker error:', err);
      for (const [id, p] of _pending) {
        p.reject(new Error('Worker crashed'));
        _pending.delete(id);
      }
    };
  } catch (err) {
    console.error('[useGaplessAudio] Failed to create Worker:', err);
    _worker = null;
  }
  return _worker;
}

// ──────── 主线程备用处理（Worker 不可用时降级） ────────

function findAudioBoundaries(
  buffer: AudioBuffer,
  windowMs = 30,
  rmsThreshold = 0.008,
): { startFrame: number; endFrame: number } {
  const { numberOfChannels, sampleRate, length } = buffer;
  const hopFrames = Math.round(sampleRate * 0.005);
  const winFrames = Math.round(sampleRate * windowMs / 1000);
  const totalWindows = Math.max(1, Math.floor((length - winFrames) / hopFrames) + 1);

  const rmsValues: number[] = [];
  for (let w = 0; w < totalWindows; w++) {
    const offset = w * hopFrames;
    let sumSq = 0;
    let count = 0;
    for (let i = 0; i < winFrames && offset + i < length; i++) {
      for (let c = 0; c < numberOfChannels; c++) {
        const s = buffer.getChannelData(c)[offset + i];
        sumSq += s * s;
        count++;
      }
    }
    rmsValues.push(Math.sqrt(sumSq / Math.max(1, count)));
  }

  let firstNonSilent = 0;
  for (let w = 0; w < rmsValues.length; w++) {
    if (rmsValues[w] > rmsThreshold) {
      firstNonSilent = Math.max(0, w - 1);
      break;
    }
  }

  let lastNonSilent = rmsValues.length - 1;
  for (let w = rmsValues.length - 1; w >= 0; w--) {
    if (rmsValues[w] > rmsThreshold) {
      lastNonSilent = Math.min(rmsValues.length - 1, w + 1);
      break;
    }
  }

  return {
    startFrame: Math.max(0, firstNonSilent * hopFrames),
    endFrame: Math.min(length - 1, lastNonSilent * hopFrames + winFrames),
  };
}

function applyLoopCrossFade(
  buffer: AudioBuffer,
  crossFadeMs = 80,
): AudioBuffer {
  const { numberOfChannels, sampleRate, length } = buffer;
  const fadeFrames = Math.min(
    Math.round(sampleRate * crossFadeMs / 1000),
    Math.floor(length / 3),
  );
  if (fadeFrames < 4) return buffer;

  const result = new AudioBuffer({ length, numberOfChannels, sampleRate });
  for (let c = 0; c < numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = result.getChannelData(c);
    dst.set(src);
    for (let i = 0; i < fadeFrames; i++) {
      const t = i / fadeFrames;
      const tailWeight = Math.cos(t * Math.PI / 2);
      const headWeight = Math.sin(t * Math.PI / 2);
      dst[i] = src[length - fadeFrames + i] * tailWeight + src[i] * headWeight;
    }
  }
  return result;
}

async function loadBufferMainThread(src: string): Promise<CachedAudio> {
  const res = await fetch(src);
  const arrayBuffer = await res.arrayBuffer();
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const { startFrame, endFrame } = findAudioBoundaries(audioBuffer);
  const sampleRate = audioBuffer.sampleRate;
  const trimmedLength = endFrame - startFrame + 1;

  const trimmed = new AudioBuffer({
    length: trimmedLength,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate,
  });
  for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
    trimmed.copyToChannel(
      audioBuffer.getChannelData(c).slice(startFrame, endFrame + 1),
      c,
    );
  }

  const seamlessBuffer = applyLoopCrossFade(trimmed, 60);

  return {
    buffer: seamlessBuffer,
    loopStart: 0,
    loopEnd: seamlessBuffer.length / sampleRate,
  };
}

/**
 * 用 Worker 处理音频（RMS 扫描 + 裁剪 + 交叉淡化）。
 * 主线程负责 fetch + decodeAudioData（均异步非阻塞）。
 */
async function loadBufferWithWorker(src: string): Promise<CachedAudio | null> {
  const worker = getWorker();
  if (!worker) return null;

  // 1. Fetch audio file bytes (main thread)
  const res = await fetch(src);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();

  // 2. Decode on main thread (async, non-blocking — native implementation)
  const ctx = getAudioContext();
  const decoded = await ctx.decodeAudioData(arrayBuffer);
  const { sampleRate, numberOfChannels } = decoded;

  // 3. Extract channel data as transferable copies
  const channels: Float32Array[] = [];
  for (let c = 0; c < numberOfChannels; c++) {
    channels.push(decoded.getChannelData(c).slice());
  }

  // 4. Send to Worker for RMS scan + trim + crossfade
  const processed = await new Promise<{ channels: Float32Array[]; sampleRate: number; loopStart: number; loopEnd: number }>((resolve, reject) => {
    const id = _nextId++;
    _pending.set(id, { resolve, reject });

    // 30s timeout fallback to main thread
    const timeout = setTimeout(() => {
      if (_pending.has(id)) {
        _pending.delete(id);
        console.warn('[useGaplessAudio] Worker timeout, falling back to main thread');
        loadBufferMainThread(src).then(
          r => resolve({ channels: [new Float32Array(r.buffer.getChannelData(0))], sampleRate: r.buffer.sampleRate, loopStart: r.loopStart, loopEnd: r.loopEnd }),
          reject,
        );
      }
    }, 30000);

    const origResolve = _pending.get(id)!.resolve;
    const origReject = _pending.get(id)!.reject;
    _pending.set(id, {
      resolve: (v) => { clearTimeout(timeout); origResolve(v); },
      reject: (err) => { clearTimeout(timeout); origReject(err); },
    });

    worker.postMessage({ id, channels, sampleRate }, { transfer: channels.map(c => c.buffer) });
  });

  // 5. Reconstruct AudioBuffer from processed channel data
  const length = processed.channels[0].length;
  const audioBuffer = new AudioBuffer({
    length,
    numberOfChannels: processed.channels.length,
    sampleRate: processed.sampleRate,
  });
  for (let c = 0; c < processed.channels.length; c++) {
    audioBuffer.copyToChannel(processed.channels[c], c);
  }

  return {
    buffer: audioBuffer,
    loopStart: processed.loopStart,
    loopEnd: processed.loopEnd,
  };
}

/** 预加载音效文件并缓存处理后的 AudioBuffer */
export async function loadBuffer(src: string): Promise<CachedAudio | null> {
  // 缓存命中
  const cached = _bufferCache.get(src);
  if (cached) return cached;

  // 已有同 src 的加载进行中
  const pending = _pendingLoads.get(src);
  if (pending) return pending;

  // 启动加载
  const promise = (async (): Promise<CachedAudio | null> => {
    try {
      // 优先用 Worker 处理
      const result = await loadBufferWithWorker(src);
      if (result) {
        _bufferCache.set(src, result);
        return result;
      }
    } catch (err) {
      console.warn('[useGaplessAudio] Worker path failed, falling back to main thread:', err);
    }

    // Worker 不可用或失败，降级主线程
    try {
      const result = await loadBufferMainThread(src);
      _bufferCache.set(src, result);
      return result;
    } catch (err) {
      console.error(`[useGaplessAudio] Failed to load ${src}:`, err);
      return null;
    }
  })();

  _pendingLoads.set(src, promise);
  promise.finally(() => _pendingLoads.delete(src));

  return promise;
}

export interface PlaybackHandle {
  setVolume: (v: number) => void;
}

export function useGaplessAudio(
  src: string | null,
  volume: number,
  playing: boolean,
): PlaybackHandle {
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // 加载 buffer
  useEffect(() => {
    if (!src) return;
    let cancelled = false;

    loadBuffer(src).then((cached) => {
      if (cancelled || !cached) return;
      if (playing) {
        startPlaying(cached, volume, sourceRef, gainRef);
      }
    });

    return () => { cancelled = true; };
  }, [src]);

  // 播放/暂停控制
  useEffect(() => {
    if (!src) return;
    getAudioContext();

    if (playing) {
      const cached = _bufferCache.get(src);
      if (cached) {
        startPlaying(cached, volume, sourceRef, gainRef);
      }
    } else {
      stopPlaying(sourceRef);
    }
  }, [playing, src]);

  // 音量控制
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopPlaying(sourceRef);
      if (gainRef.current) {
        gainRef.current.disconnect();
        gainRef.current = null;
      }
    };
  }, []);

  return {
    setVolume: (v: number) => {
      if (gainRef.current) {
        gainRef.current.gain.value = v;
      }
    },
  };
}

function startPlaying(
  cached: CachedAudio,
  volume: number,
  sourceRef: MutableRefObject<AudioBufferSourceNode | null>,
  gainRef: MutableRefObject<GainNode | null>,
) {
  if (sourceRef.current) {
    try { sourceRef.current.stop(); } catch {}
    sourceRef.current.disconnect();
    sourceRef.current = null;
  }

  const ctx = getAudioContext();

  if (!gainRef.current) {
    gainRef.current = ctx.createGain();
    gainRef.current.connect(ctx.destination);
  }
  gainRef.current.gain.value = volume;

  const source = ctx.createBufferSource();
  source.buffer = cached.buffer;
  source.loop = true;
  source.loopStart = cached.loopStart;
  source.loopEnd = cached.loopEnd;

  source.connect(gainRef.current);
  source.start();

  sourceRef.current = source;
}

function stopPlaying(
  sourceRef: MutableRefObject<AudioBufferSourceNode | null>,
) {
  if (sourceRef.current) {
    try { sourceRef.current.stop(); } catch {}
    sourceRef.current.disconnect();
    sourceRef.current = null;
  }
}
