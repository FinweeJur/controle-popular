"use client";

import { useState } from "react";
import type { EstacaoRadio } from "@/lib/radio/estacoes";

/**
 * Logo da rádio com desenho de reserva — nunca um quadrado vazio.
 *
 * Papel no portal: mostrar o rosto da emissora na lista, no índice do player e
 * na página. A logo é carregada por hotlink do site oficial (`estacao.logo` ou
 * o favicon da origem); se a imagem falhar, cai num monograma com as iniciais
 * dentro de um disco. Nunca se copia a marca para dentro do repositório:
 * direito autoral é do dono da rádio, e o portal só aponta para a fonte.
 *
 * Por que componente de cliente: `onError` do `<img>` é evento do navegador;
 * sem ele, uma imagem quebrada mostraria só o ícone de "imagem quebrada".
 */

/** Deriva o endereço do favicon a partir do site oficial (fallback). */
function logoEfetiva(estacao: EstacaoRadio): string | null {
  if (estacao.logo) return estacao.logo;
  try {
    return `${new URL(estacao.site).origin}/favicon.ico`;
  } catch {
    return null;
  }
}

/** Iniciais para o monograma (até duas letras significativas). */
function monograma(nome: string): string {
  const palavras = nome
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((p) => p.length > 0 && !/^(de|da|do|das|dos|fm|am|radio|rádio)$/i.test(p));
  const letras = palavras.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return letras.join("") || nome.slice(0, 2).toUpperCase();
}

export interface LogoRadioProps {
  estacao: EstacaoRadio;
  /** Tamanho em pixels do lado do quadrado (padrão 40). */
  tamanho?: number;
  /** Classes extras para o contêiner. */
  className?: string;
}

export default function LogoRadio({
  estacao,
  tamanho = 40,
  className = "",
}: LogoRadioProps) {
  const [falhou, setFalhou] = useState(false);
  const src = logoEfetiva(estacao);
  const dimensoes = { width: tamanho, height: tamanho };

  if (!src || falhou) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-surface-2 font-semibold text-primary ${className}`}
        style={{ ...dimensoes, fontSize: tamanho * 0.38 }}
      >
        {monograma(estacao.nome)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- marca remota de dezenas de hospedes: o otimizador do Next nao cobre dominio arbitrario e o fallback mora no onError
    <img
      src={src}
      alt=""
      width={tamanho}
      height={tamanho}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFalhou(true)}
      className={`shrink-0 rounded-lg border border-border bg-white object-contain p-0.5 ${className}`}
      style={dimensoes}
    />
  );
}
