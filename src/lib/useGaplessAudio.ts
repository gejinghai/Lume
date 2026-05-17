import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * useGaplessAudio — 使用 Web Audio API 实现无缝循环音频播放
 *
 * 解决 HTML5 <audio loop> 在 MP3 循环时出现 1-2s 停顿 gap 的问题。
 *
 * 关键策略：
 * 1. 用 AudioBufferSourceNode.loop = true 替代 <audio loop>
 * 2. 解码后用 RMS 窗口扫描精确裁剪首尾静音 / encoder fade
 * 3. 在循环边界做交叉淡化（cross-fade），使首尾波形平滑衔接
 */

let _audioCtx: AudioContext | null = null;

interface CachedAudio {
  buffer: AudioBuffer;
  loopStart: number;
  loopEnd: number;
}

const _bufferCache = new Map<string, CachedAudio>();

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

/**
 * 用 RMS 窗口扫描找到实际音频内容的起止位置。
 * 比单样本振幅阈值更精确，能跳过 encoder fade in/out 导致的低音量段。
 *
 * @param windowMs  RMS 窗口长度（毫秒）
 * @param rmsThreshold  RMS 阈值，低于此值视为静音
 */
function findAudioBoundaries(
  buffer: AudioBuffer,
  windowMs = 30,
  rmsThreshold = 0.008, // ≈ -42dB
): { startFrame: number; endFrame: number } {
  const { numberOfChannels, sampleRate, length } = buffer;
  const hopFrames = Math.round(sampleRate * 0.005); // 5ms hop
  const winFrames = Math.round(sampleRate * windowMs / 1000);

  const totalWindows = Math.max(1, Math.floor((length - winFrames) / hopFrames) + 1);

  // 计算每个窗口的 RMS
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

  // 从头找到第一个超过阈值的窗口
  let firstNonSilent = 0;
  for (let w = 0; w < rmsValues.length; w++) {
    if (rmsValues[w] > rmsThreshold) {
      firstNonSilent = Math.max(0, w - 1); // 往前多退一个窗口作为余量
      break;
    }
  }

  // 从尾找到最后一个超过阈值的窗口
  let lastNonSilent = rmsValues.length - 1;
  for (let w = rmsValues.length - 1; w >= 0; w--) {
    if (rmsValues[w] > rmsThreshold) {
      lastNonSilent = Math.min(rmsValues.length - 1, w + 1);
      break;
    }
  }

  // 转成帧位置
  const startFrame = Math.max(0, firstNonSilent * hopFrames);
  const endFrame = Math.min(length - 1, lastNonSilent * hopFrames + winFrames);

  return { startFrame, endFrame };
}

/**
 * 对 AudioBuffer 做循环交叉淡化，使首尾波形平滑衔接。
 *
 * 线性 cross-fade 对不相关信号（如噪音的不同时间段）会有 -3dB 功率下降，
 * 此处使用等功率 cross-fade（sin² + cos² = 1），保持衔接处音量恒定。
 */
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

    // 等功率 cross-fade: 将结尾 fadeFrames 个样本混入开头
    // sin²(t·π/2) + cos²(t·π/2) = 1 保证功率守恒
    for (let i = 0; i < fadeFrames; i++) {
      const t = i / fadeFrames; // 0 → 1
      const tailWeight = Math.cos(t * Math.PI / 2);
      const headWeight = Math.sin(t * Math.PI / 2);
      dst[i] = src[length - fadeFrames + i] * tailWeight + src[i] * headWeight;
    }
  }

  return result;
}

async function loadBuffer(src: string): Promise<CachedAudio | null> {
  const cached = _bufferCache.get(src);
  if (cached) return cached;

  try {
    const res = await fetch(src);
    const arrayBuffer = await res.arrayBuffer();
    const ctx = getAudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    // 1. 用 RMS 窗口扫描找到真实音频边界
    const { startFrame, endFrame } = findAudioBoundaries(audioBuffer);
    const sampleRate = audioBuffer.sampleRate;
    const trimmedLength = endFrame - startFrame + 1;

    // 2. 裁剪到实际音频内容
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

    // 3. 对循环边界做交叉淡化
    const seamlessBuffer = applyLoopCrossFade(trimmed, 60);

    const cachedAudio: CachedAudio = {
      buffer: seamlessBuffer,
      loopStart: 0,
      loopEnd: seamlessBuffer.length / sampleRate,
    };

    _bufferCache.set(src, cachedAudio);
    return cachedAudio;
  } catch (err) {
    console.error(`[useGaplessAudio] Failed to load ${src}:`, err);
    return null;
  }
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
