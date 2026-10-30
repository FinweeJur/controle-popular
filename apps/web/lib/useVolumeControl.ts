"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Hook para controlar volume do player de rádio
 * Gerencia estado de volume, mudo e sincronia com elemento de áudio
 */
export function useVolumeControl() {
  const [volume, setVolume] = useState(1);
  const [mudo, setMudo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMudo = useCallback(() => {
    setMudo(prev => !prev);
  }, []);

  const setVolumeLevel = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
  }, []);

  // Sincroniza volume com elemento de áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = mudo ? 0 : volume;
    audio.muted = mudo;
  }, [volume, mudo]);

  return {
    volume,
    mudo,
    setVolume: setVolumeLevel,
    toggleMudo,
    audioRef
  };
}