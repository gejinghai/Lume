/**
 * audio.worker — Web Worker 音频处理
 *
 * 主线程完成 fetch + decodeAudioData 后，将 Float32Array 声道数据
 * 传给此 Worker 做 CPU 密集的 RMS 扫描、裁剪、交叉淡化。
 *
 * 处理完成后通过 postMessage 将处理后的 Float32Array 传回主线程。
 */

interface ProcessMessage {
  id: number;
  channels: Float32Array[];
  sampleRate: number;
}

interface ProcessResult {
  id: number;
  channels: Float32Array[];
  sampleRate: number;
  loopStart: number;
  loopEnd: number;
}

interface ErrorResult {
  id: number;
  error: string;
}

/** 5ms hop 的 RMS 窗口扫描 */
function findAudioBoundaries(
  channels: Float32Array[],
  sampleRate: number,
  windowMs = 30,
  rmsThreshold = 0.008,
): { startFrame: number; endFrame: number } {
  const numberOfChannels = channels.length;
  const length = channels[0].length;
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
        const s = channels[c][offset + i];
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

/** 等功率 cross-fade (sin² + cos² = 1) */
function applyLoopCrossFade(
  channels: Float32Array[],
  sampleRate: number,
  crossFadeMs = 60,
): void {
  const length = channels[0].length;
  const fadeFrames = Math.min(
    Math.round(sampleRate * crossFadeMs / 1000),
    Math.floor(length / 3),
  );
  if (fadeFrames < 4) return;

  for (let c = 0; c < channels.length; c++) {
    const data = channels[c];
    for (let i = 0; i < fadeFrames; i++) {
      const t = i / fadeFrames;
      const tailWeight = Math.cos(t * Math.PI / 2);
      const headWeight = Math.sin(t * Math.PI / 2);
      data[i] = data[length - fadeFrames + i] * tailWeight + data[i] * headWeight;
    }
  }
}

self.onmessage = (e: MessageEvent<ProcessMessage>) => {
  const { id, channels, sampleRate } = e.data;

  try {
    // 1. Find audio boundaries (RMS scan)
    const { startFrame, endFrame } = findAudioBoundaries(channels, sampleRate);
    const trimmedLength = endFrame - startFrame + 1;

    // 2. Trim to actual content
    const trimmedChannels: Float32Array[] = [];
    for (let c = 0; c < channels.length; c++) {
      trimmedChannels.push(channels[c].slice(startFrame, endFrame + 1));
    }

    // 3. Apply crossfade on trimmed data
    applyLoopCrossFade(trimmedChannels, sampleRate);

    const result: ProcessResult = {
      id,
      channels: trimmedChannels,
      sampleRate,
      loopStart: 0,
      loopEnd: trimmedLength / sampleRate,
    };

    // Transfer Float32Array buffers for zero-copy
    self.postMessage(result, { transfer: trimmedChannels.map(c => c.buffer) });
  } catch (err) {
    const errorResult: ErrorResult = { id, error: String(err) };
    self.postMessage(errorResult);
  }
};
