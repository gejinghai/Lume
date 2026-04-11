import React, { useEffect, useRef, useState } from 'react';

interface AmbientMusicPlayerProps {
  volume: number;
  enabled: boolean;
}

export default function AmbientMusicPlayer({ volume, enabled }: AmbientMusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playlist, setPlaylist] = useState<string[]>(['piano1.mp3']);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const COS_BASE_URL = 'https://music-1379744664.cos.ap-guangzhou.myqcloud.com/light-music';

  // Fetch playlist.json on mount via local API proxy
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

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * 0.8; // Make it a bit louder so it's not drowned out by rain/wind
    }
  }, [volume]);

  // Handle Play/Pause and Track changes
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
