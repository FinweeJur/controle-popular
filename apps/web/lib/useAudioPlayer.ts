"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EstacaoRadio } from "@/lib/radio/estacoes";
import { prepararAudio, carregarModelo, criarCaptura, liberarTranscritor } from "@/lib/radio/transcricao";

/**
 * Hook para controle do player de áudio do rádio
 * Gerencia estado de reprodução, carregamento e controle de áudio
 */
export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const [idAtual, setIdAtual] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [jaTocou, setJaTocou] = useState(false);

  const tocar = useCallback(async (estacao: EstacaoRadio) => {
    setCarregando(true);
    try {
      const audio = await prepararAudio(estacao, hlsRef);
      audioRef.current = audio;
      setIdAtual(estacao.id);
      setJaTocou(true);
      
      await audio.play();
      setTocando(true);
    } catch (error) {
      console.error("Erro ao tocar rádio:", error);
      throw error;
    } finally {
      setCarregando(false);
    }
  }, []);

  const pausar = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setTocando(false);
    }
  }, []);

  const parar = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    audioRef.current = null;
    setIdAtual(null);
    setTocando(false);
    setJaTocou(false);
  }, []);

  // Limpa recursos ao desmontar
  useEffect(() => {
    return () => {
      parar();
    };
  }, [parar]);

  return {
    audioRef,
    hlsRef,
    idAtual,
    tocando,
    carregando,
    jaTocou,
    tocar,
    pausar,
    parar
  };
}