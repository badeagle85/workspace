'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Howl } from 'howler';

interface SoundPlayerProps {
  bgmId: string | null;
  autoPlay?: boolean;
  volume?: number;
  onReady?: () => void;
}

// BGM 정보 (추후 Supabase Storage로 이동)
const bgmSources: Record<string, { name: string; url: string }> = {
  'christmas-1': {
    name: '크리스마스 캐롤',
    // Pixabay 무료 음원 예시 URL (실제 서비스시 교체 필요)
    url: 'https://cdn.pixabay.com/audio/2022/11/22/audio_a93f45e368.mp3',
  },
  'birthday-1': {
    name: '생일 축하',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b9b84c0.mp3',
  },
  'piano-1': {
    name: '잔잔한 피아노',
    url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3',
  },
  'acoustic-1': {
    name: '어쿠스틱 기타',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946bd18f76.mp3',
  },
};

export function SoundPlayer({ bgmId, autoPlay = false, volume = 0.5, onReady }: SoundPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<Howl | null>(null);

  const bgmInfo = bgmId ? bgmSources[bgmId] : null;

  // 사운드 초기화
  useEffect(() => {
    if (!bgmInfo) return;

    const sound = new Howl({
      src: [bgmInfo.url],
      loop: true,
      volume: volume,
      onload: () => {
        setIsLoaded(true);
        onReady?.();
      },
      onplay: () => setIsPlaying(true),
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onloaderror: (id, error) => {
        console.error('Sound load error:', error);
      },
    });

    soundRef.current = sound;

    return () => {
      sound.unload();
    };
  }, [bgmInfo, volume, onReady]);

  // 자동 재생 (사용자 인터랙션 후)
  useEffect(() => {
    if (autoPlay && isLoaded && soundRef.current && !isPlaying) {
      soundRef.current.play();
    }
  }, [autoPlay, isLoaded, isPlaying]);

  // 볼륨 변경
  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.volume(isMuted ? 0 : volume);
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (!soundRef.current) return;

    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  if (!bgmInfo) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <button
        onClick={togglePlay}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isPlaying ? '일시정지' : '재생'}
      >
        {isPlaying ? '⏸️' : '▶️'}
      </button>
      <span className="text-muted-foreground">
        🎵 {bgmInfo.name}
      </span>
      <button
        onClick={toggleMute}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={isMuted ? '음소거 해제' : '음소거'}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}

// 훅으로도 제공 (더 유연한 사용을 위해)
export function useBgmPlayer(bgmId: string | null, options?: { volume?: number }) {
  const [isReady, setIsReady] = useState(false);
  const soundRef = useRef<Howl | null>(null);

  const bgmInfo = bgmId ? bgmSources[bgmId] : null;

  useEffect(() => {
    if (!bgmInfo) return;

    const sound = new Howl({
      src: [bgmInfo.url],
      loop: true,
      volume: options?.volume ?? 0.5,
      onload: () => setIsReady(true),
    });

    soundRef.current = sound;

    return () => {
      sound.unload();
    };
  }, [bgmInfo, options?.volume]);

  const play = useCallback(() => {
    soundRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    soundRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    soundRef.current?.stop();
  }, []);

  return { isReady, play, pause, stop, bgmName: bgmInfo?.name };
}
