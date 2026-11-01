"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import type { EstacaoRadio } from "@/lib/radio/estacoes";
import {
  OPCOES_INFERENCIA_APRIMORADAS,
  carregarModelo,
  criarCaptura,
  liberarTranscritor,
  limparTexto,
  normalizar,
  prepararAudio,
  type CapturaAudio,
  type Transcritor,
} from "@/lib/radio/transcricao";

/**
 * Hook para gerenciar o estado da transcrição
 */
function useTranscricaoState() {
  const [aberta, setAberta] = useState(false);
  const [status, setStatus] = useState<"inativo" | "carregando-modelo" | "ouvindo" | "erro">("inativo");
  const [erro, setErro] = useState<string | null>(null);
  const [trechos, setTrechos] = useState<{ id: number; texto: string }[]>([]);
  const [seguir, setSeguir] = useState(true);
  const [tentativas, setTentativas] = useState(0);

  return {
    aberta,
    status,
    erro,
    trechos,
    seguir,
    setAberta,
    setStatus,
    setErro,
    setTrechos,
    setSeguir,
    setTentativas,
  };
}

/**
 * Hook para gerenciar a captura de áudio
 */
function useAudioCapture() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<{ destroy: () => void } | null>(null);
  const capturaRef = useRef<CapturaAudio | null>(null);
  const filaRef = useRef<Float32Array[]>([]);
  const processandoRef = useRef(false);

  const limparRecursos = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    const captura = capturaRef.current;
    capturaRef.current = null;
    captura?.processor.disconnect();
    captura?.source.disconnect();
    captura?.ganho.disconnect();
    if (captura && captura.ctx.state !== "closed") void captura.ctx.close();
    
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    
    filaRef.current = [];
    processandoRef.current = false;
  }, []);

  return {
    audioRef,
    hlsRef,
    capturaRef,
    filaRef,
    processandoRef,
    limparRecursos,
  };
}

/**
 * Hook para gerenciar o transcritor e processamento
 */
function useTranscriptionProcessing() {
  const transcriberRef = useRef<Transcritor | null>(null);
  const contadorRef = useRef(0);
  const sessaoRef = useRef(0);

  const liberarTranscritorLocal = useCallback(() => {
    const transcriber = transcriberRef.current;
    transcriberRef.current = null;
    liberarTranscritor(transcriber);
  }, []);

  const transcreverBloco = useCallback(async (bloco: Float32Array) => {
    const transcriber = transcriberRef.current;
    if (!transcriber) return;
    
    try {
      const saida = await transcriber(normalizar(bloco), OPCOES_INFERENCIA_APRIMORADAS);
      const texto = limparTexto(saida?.text ?? "");
      
      if (saida?.text && saida.text !== texto) {
        console.log("Texto bruto vs limpo:", { bruto: saida.text, limpo: texto });
      }
      
      if (texto.length > 2) {
        contadorRef.current += 1;
        return { id: contadorRef.current, texto };
      }
    } catch {
      // Bloco ruim não derruba a sessão
    }
    return null;
  }, []);

  const drenarFila = useCallback(async () => {
    if (processandoRef.current) return;
    processandoRef.current = true;
    
    while (filaRef.current.length > 0) {
      const bloco = filaRef.current.shift();
      if (bloco) {
        const resultado = await transcreverBloco(bloco);
        if (resultado) {
          setTrechos((atual) => {
            if (atual.length > 0 && atual[atual.length - 1].texto === resultado.texto) {
              return atual;
            }
            const novo = [...atual, resultado];
            return novo.length > 80 ? novo.slice(-80) : novo;
          });
        }
      }
    }
    
    processandoRef.current = false;
  }, [transcreverBloco]);

  return {
    transcriberRef,
    contadorRef,
    sessaoRef,
    liberarTranscritorLocal,
    drenarFila,
  };
}

/**
 * Hook para controle da transcrição de rádio
 * Gerencia estado de transcrição, tentativas e erro
 */
export function useTranscricaoRadio(estacao: EstacaoRadio) {
  const state = useTranscricaoState();
  const audio = useAudioCapture();
  const processing = useTranscriptionProcessing();

  const parar = useCallback(() => {
    processing.sessaoRef.current += 1;
    audio.limparRecursos();
    processing.liberarTranscritorLocal();
    state.setStatus("inativo");
  }, [audio, processing, state]);

  const ligar = useCallback(async () => {
    state.setErro(null);
    state.setAberta(true);
    state.setTrechos([]);
    state.setStatus("carregando-modelo");
    
    const sessao = ++processing.sessaoRef.current;
    
    try {
      const audioInstance = await prepararAudio(estacao, audio.hlsRef);
      audio.audioRef.current = audioInstance;
      
      if (sessao !== processing.sessaoRef.current) {
        parar();
        return;
      }

      const captura = await criarCaptura(audioInstance, (bloco) => {
        if (audio.filaRef.current.length >= 2) audio.filaRef.current.shift();
        audio.filaRef.current.push(bloco);
        void processing.drenarFila();
      });
      audio.capturaRef.current = captura;

      const transcriber = await carregarModelo();
      if (sessao !== processing.sessaoRef.current) {
        processing.liberarTranscritorLocal();
        parar();
        return;
      }
      
      processing.transcriberRef.current = transcriber;
      state.setStatus("ouvindo");
      state.setTentativas(0);
    } catch (e) {
      parar();
      state.setStatus("erro");
      
      let mensagemErro = "Falha ao carregar a transcrição neste navegador.";
      
      if (e instanceof Error) {
        const mensagem = e.message.toLowerCase();
        
        if (mensagem.includes("cors") || mensagem.includes("cross-origin")) {
          mensagemErro = "Esta estação não permite transcrição online (CORS bloqueado).";
        } else if (mensagem.includes("network") || mensagem.includes("fetch")) {
          mensagemErro = "Não foi possível acessar o stream de áudio da estação.";
        } else if (mensagem.includes("hls") || mensagem.includes("manifest")) {
          mensagemErro = "Formato de stream não suportado para transcrição.";
        } else if (mensagem.includes("audio") || mensagem.includes("play")) {
          mensagemErro = "Não foi possível reproduzir o áudio desta estação.";
        } else if (mensagem.includes("model") || mensagem.includes("whisper")) {
          mensagemErro = "Erro ao carregar modelo de transcrição. Tente novamente.";
        } else if (mensagem.includes("memory") || mensagem.includes("heap")) {
          mensagemErro = "Memória insuficiente para transcrição. Feche outras abas e tente novamente.";
        } else {
          mensagemErro = e.message;
        }
      }
      
      state.setErro(mensagemErro);
      console.error("Erro na transcrição:", e);
      
      const errosNaoCriticos = ["network", "fetch", "model", "whisper", "memory", "heap"];
      const ehErroNaoCritico = errosNaoCriticos.some(erro => 
        mensagemErro.toLowerCase().includes(erro)
      );
      
      if (ehErroNaoCritico && state.tentativas < 2) {
        state.setTentativas(state.tentativas + 1);
      }
    }
  }, [estacao, audio, processing, state, parar]);

  // Efeito para retry automático
  useEffect(() => {
    if (state.tentativas > 0 && state.tentativas <= 2) {
      const timer = setTimeout(() => {
        console.log(`Tentativa ${state.tentativas} de 3 para transcrição...`);
        void ligar();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.tentativas, ligar]);

  // Limpa recursos ao desmontar
  useEffect(() => {
    return () => parar();
  }, [parar]);

  return {
    aberta: state.aberta,
    status: state.status,
    erro: state.erro,
    trechos: state.trechos,
    seguir: state.seguir,
    setAberta: state.setAberta,
    setSeguir: state.setSeguir,
    setErro: state.setErro,
    ligar,
    parar,
  };
}