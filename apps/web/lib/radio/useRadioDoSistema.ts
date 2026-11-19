"use client";

/**
 * @file useRadioDoSistema.ts
 * @description Liga o player de rádio ao sistema operacional e lembra a
 * estação entre visitas.
 *
 * POR QUE EXISTE (dono, 18/11/2026): duas queixas do mesmo dia.
 * 1) No celular e no tablet o áudio tocava sem controle na barra de
 *    notificação. Com a Media Session, o sistema mostra play/pause, o nome da
 *    estação e a origem (Controle Popular · rádio ao vivo), e as teclas de
 *    mídia do fone obedecem.
 * 2) Depois de recarregar a página o player voltava vazio. Agora a última
 *    rádio fica em `localStorage` e o botão volta nela — sem autoplay.
 *
 * POR QUE É UM HOOK SEPARADO: são cinco efeitos (memória, metadados, estado de
 * reprodução e handlers do sistema). No `PlayerRadio`, que já é grande, eles
 * inflariam o componente. As guardas de ambiente moram em
 * `controles-sistema.ts`; a memória, em `estacao-lembrada.ts`.
 *
 * QUEM MANDA NO ÁUDIO continua sendo o `<audio>` do `PlayerRadio`.
 */

import { useEffect, type RefObject } from "react";
import {
  ligarControlesDoSistema,
  publicarEstadoReproducao,
  publicarMidia,
} from "./controles-sistema";
import { lerEstacaoLembrada, salvarEstacaoLembrada } from "./estacao-lembrada";
import { estacaoPorId, ESTACAO_PADRAO_RADIO } from "./estacoes";

interface OpcoesRadioDoSistema {
  /** Id da estação carregada, para o "play" do sistema retomar a mesma. */
  idAtual: string | null;
  /** `setState` do player: usado ao restaurar a estação lembrada. */
  setIdAtual: (id: string) => void;
  /** `true` enquanto o áudio está de fato tocando. */
  tocando: boolean;
  /** `true` depois do primeiro play: evita notificação de estação parada. */
  jaTocou: boolean;
  /** O mesmo elemento `<audio>` do player. */
  audioRef: RefObject<HTMLAudioElement | null>;
  /** Carrega/toca uma estação (pedido vindo do sistema). */
  tocar: (id: string) => void;
}

/** Metadados, controles do sistema e memória da última estação. */
export function useRadioDoSistema({
  idAtual,
  setIdAtual,
  tocando,
  jaTocou,
  audioRef,
  tocar,
}: OpcoesRadioDoSistema) {
  // Leitura pós-hidratação: no servidor não existe `localStorage`, e iniciar
  // o estado com ele mudaria o HTML da hidratação.
  useEffect(() => {
    const salvo = lerEstacaoLembrada();
    if (salvo && estacaoPorId(salvo)) setIdAtual(salvo);
  }, [setIdAtual]);

  useEffect(() => {
    salvarEstacaoLembrada(idAtual);
  }, [idAtual]);

  // Só depois do primeiro play: estação lembrada não abre notificação parada.
  useEffect(() => {
    const estacao = idAtual ? estacaoPorId(idAtual) : null;
    if (estacao && jaTocou) publicarMidia(estacao);
  }, [idAtual, jaTocou]);

  useEffect(() => {
    publicarEstadoReproducao(tocando);
  }, [tocando]);

  // Botões do sistema e teclas de mídia: chamam o MESMO player.
  useEffect(() => {
    const pausar = () => audioRef.current?.pause();
    return ligarControlesDoSistema(() => tocar(idAtual ?? ESTACAO_PADRAO_RADIO), pausar);
  }, [tocar, idAtual, audioRef]);
}
