import React, { useEffect, useRef, useState } from 'react';
import config from '../config.json';

/**
 * 环境音乐播放器组件Props接口
 */
interface AmbientMusicPlayerProps {
  volume: number;     // 音量大小 (0-1)
  enabled: boolean;   // 是否启用音乐
}

/**
 * AmbientMusicPlayer 环境音乐播放器
 * 播放轻柔的背景音乐，支持音量控制和播放列表
 * 音乐资源托管在腾讯云 COS
 */
export default function AmbientMusicPlayer({ volume, enabled }: AmbientMusicPlayerProps) {
  // 音频元素引用
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // 播放列表状态
  const [playlist, setPlaylist] = useState<string[]>(['piano1.mp3']);  // 默认播放列表
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);      // 当前曲目索引
  
  // 音乐资源基础 URL（从配置文件读取）
  const COS_BASE_URL = config.music.baseUrl;

  // 组件挂载时获取播放列表
  useEffect(() => {
    fetch(`${COS_BASE_URL}/playlist.json`)
      .then(res => {
        if (!res.ok) throw new Error('Playlist not found');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPlaylist(data);
        }
      })
      .catch(err => {
        console.log('Could not load playlist.json, falling back to default piano1.mp3', err);
      });
  }, []);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * 0.8; // 音乐音量设为输入音量的80%，避免被环境音淹没
    }
  }, [volume]);

  // 监听启用状态和曲目变化
  useEffect(() => {
    if (audioRef.current) {
      if (enabled) {
        // We add a small timeout to ensure the src has been updated in the DOM before playing
        setTimeout(() => {
          audioRef.current?.play().catch(e => console.log('Ambient audio autoplay blocked:', e));
        }, 50);
      } else {
        audioRef.current.pause();
      }
    }
  }, [enabled, currentTrackIndex, playlist]);

  const handleTrackEnd = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % playlist.length);
  };

  return (
    <audio 
      ref={audioRef} 
      src={`${COS_BASE_URL}/${playlist[currentTrackIndex]}`}
      onEnded={handleTrackEnd}
      crossOrigin="anonymous"
      autoPlay={enabled}
    />
  );
}
