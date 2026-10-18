/**
 * LinkMender v2 — Pipeline por link quebrado: verificar → buscar → confirmar.
 * Tudo injetado de `fetchFn` e `sleepFn`: o pipeline inteiro roda com fetch
 * mockado e pausa zero nos testes. Primeira rodada real: home-pc.
 *
 * Política (plano Fase 2): só proposta de confiança "alta" vira correção
 * automática; a "media" (sem título ou caminho genérico) sai como
 * `candidatoMedia` para revisão humana.
 */

import {
  avaliarCandidato,
  hostAceitavel,
  tipoConteudoDeUrl,
  tipoDeContentType,
  tituloDaHtml,
} from "./criterios";
import type { CandidatoEntrada } from "./criterios";
import { montarConsultasBusca, buscarNoDuckDuckGo } from "./busca";
import type { FetchFn } from "./busca";
import { sondar, classificarVerificacao } from "./verificar";
import type { Verificacao } from "./verificar";

export interface ContextoLink {
  url: string;
  titulo?: string | null;
  orgao?: string | null;
}

export interface PropostaCorrecao {
  urlVelha: string;
  urlNova: string;
  criterios: string[];
  /** Estratégia de busca que encontrou o candidato (trilha de auditoria). */
  estrategia: string;
}

export interface ResultadoProcessamento {
  verificacao: Verificacao;
  /** Proposta aceita pelos critérios (só confiança "alta") — ou null. */
  proposta: PropostaCorrecao | null;
  /** Candidato de confiança "media" (vai para revisão humana) — ou null. */
  candidatoMedia: { url: string; motivo: string } | null;
  /** Consultas efetivamente disparadas (trilha; útil no relatório). */
  consultas: { estrategia: string; query: string }[];
  /** Por que não houve proposta, quando não houve. */
  semPropostaMotivo?: string;
}

interface Deps {
  fetchFn: FetchFn;
  sleepFn: (ms: number) => Promise<void>;
  pausaMs: number;
}

const MAX_RESULTADOS_POR_BUSCA = 5;

function semProposta(
  verificacao: Verificacao,
  consultas: { estrategia: string; query: string }[],
  motivo: string,
  candidatoMedia: { url: string; motivo: string } | null = null
): ResultadoProcessamento {
  return { verificacao, proposta: null, candidatoMedia, consultas, semPropostaMotivo: motivo };
}

/** REDIRECT: o servidor apontou o destino; propõe se ele é aceitável e vivo. */
async function viaRedirect(
  ctx: ContextoLink,
  verificacao: Verificacao,
  consultas: { estrategia: string; query: string }[],
  deps: Deps
): Promise<ResultadoProcessamento> {
  const destino = verificacao.finalUrl as string;
  let host = "";
  try {
    host = new URL(destino).hostname;
  } catch {
    return semProposta(verificacao, consultas, "destino do redirect nao parseia");
  }
  if (!hostAceitavel(host)) {
    return semProposta(verificacao, consultas, `destino do redirect em dominio nao aceitavel: ${host}`);
  }
  const sondaDestino = classificarVerificacao(destino, await sondar(destino, deps.fetchFn));
  await deps.sleepFn(deps.pausaMs);
  if (sondaDestino.classe !== "OK") {
    return semProposta(verificacao, consultas, `destino do redirect tambem nao vive (${sondaDestino.classe})`);
  }
  return {
    verificacao,
    candidatoMedia: null,
    consultas,
    proposta: {
      urlVelha: ctx.url,
      urlNova: destino,
      criterios: [
        "redirect-declarado-pelo-servidor",
        "dominio-" + (host.includes("r2.dev") ? "r2-ou-proprio" : "oficial"),
        "destino-verificado-vivo",
      ],
      estrategia: "redirect",
    },
  };
}

interface CandidataAvaliada {
  aceita: { urlNova: string; criterios: string[] } | null;
  media: { url: string; motivo: string } | null;
}

/** Sonda UMA candidata e decide: aceita (alta), media (humano) ou descarta. */
async function avaliarCandidata(
  candidata: string,
  ctx: ContextoLink,
  deps: Deps
): Promise<CandidataAvaliada> {
  const bruto = await sondar(candidata, deps.fetchFn);
  const sonda = classificarVerificacao(candidata, bruto);
  await deps.sleepFn(deps.pausaMs);
  const entrada: CandidatoEntrada = {
    urlVelha: ctx.url,
    urlCandidata: candidata,
    statusHttp: sonda.statusHttp ?? 0,
    contentType: sonda.contentType,
    corpoInicial: bruto.corpoInicial,
    tituloItem: ctx.titulo ?? null,
    tituloCandidato: tituloDaHtml(bruto.corpoInicial),
  };
  const avaliacao = avaliarCandidato(entrada);
  if (!avaliacao.aceito) {
    const media =
      avaliacao.confianca === "media" ? { url: candidata, motivo: avaliacao.motivos.join("; ") } : null;
    return { aceita: null, media };
  }
  const criterios = rotularTipo(ctx.url, sonda.contentType, avaliacao.criterios);
  return criterios ? { aceita: { urlNova: candidata, criterios }, media: null } : { aceita: null, media: null };
}

/** Troca o rótulo genérico de tipo pelo tipo concreto medido. */
function rotularTipo(urlVelha: string, contentType: string | null, criterios: string[]): string[] | null {
  const tipoNovo = tipoDeContentType(contentType);
  const tipoOriginal = tipoConteudoDeUrl(urlVelha);
  const limpos = criterios.filter((c) => !c.startsWith("tipo-igual-"));
  if (tipoNovo !== "desconhecido") return [...limpos, `tipo-igual-${tipoNovo}`];
  if (tipoOriginal !== "desconhecido") return [...limpos, `tipo-igual-${tipoOriginal}`];
  return null;
}

/** QUEBRADO/MENTIROSO: dispara as buscas e aceita o primeiro candidato alta. */
async function viaBusca(
  ctx: ContextoLink,
  verificacao: Verificacao,
  consultas: { estrategia: string; query: string }[],
  deps: Deps
): Promise<ResultadoProcessamento> {
  const planejadas = montarConsultasBusca({
    url: ctx.url,
    titulo: ctx.titulo ?? null,
    orgao: ctx.orgao ?? null,
  });
  let media: { url: string; motivo: string } | null = null;

  for (const consulta of planejadas) {
    consultas.push({ estrategia: consulta.estrategia, query: consulta.query });
    const busca = await buscarNoDuckDuckGo(consulta.query, deps.fetchFn);
    await deps.sleepFn(deps.pausaMs);
    if (!busca.ok) continue;

    for (const candidata of busca.links.slice(0, MAX_RESULTADOS_POR_BUSCA)) {
      if (candidata === ctx.url) continue;
      const r = await avaliarCandidata(candidata, ctx, deps);
      if (r.aceita) {
        return {
          verificacao,
          candidatoMedia: null,
          consultas,
          proposta: { urlVelha: ctx.url, urlNova: r.aceita.urlNova, criterios: r.aceita.criterios, estrategia: consulta.estrategia },
        };
      }
      if (r.media && !media) media = r.media;
    }
  }

  const base = `nenhum candidato bateu nos criterios apos ${consultas.length} buscas`;
  return semProposta(
    verificacao,
    consultas,
    media ? `${base}; candidato de revisao humana: ${media.url}` : base,
    media
  );
}

/**
 * Processa UM link: classifica (HTTP + conteúdo). Link vivo não gera nada;
 * REDIRECT aceitável propõe o destino; QUEBRADO/MENTIROSO entra nas buscas.
 */
export async function processarLink(
  ctx: ContextoLink,
  opcoes: {
    fetchFn?: FetchFn;
    sleepFn?: (ms: number) => Promise<void>;
    pausaMs?: number;
  } = {}
): Promise<ResultadoProcessamento> {
  const deps: Deps = {
    fetchFn: opcoes.fetchFn ?? fetch,
    sleepFn: opcoes.sleepFn ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms))),
    pausaMs: opcoes.pausaMs ?? 400,
  };

  const verificacao = classificarVerificacao(ctx.url, await sondar(ctx.url, deps.fetchFn));
  await deps.sleepFn(deps.pausaMs);
  const consultas: { estrategia: string; query: string }[] = [];

  if (verificacao.classe === "OK") return semProposta(verificacao, consultas, "link vivo");
  if (verificacao.classe === "INCONSISTENTE") {
    return semProposta(verificacao, consultas, verificacao.motivo ?? "inconsistente");
  }
  if (verificacao.classe === "REDIRECT" && verificacao.finalUrl) {
    return viaRedirect(ctx, verificacao, consultas, deps);
  }
  return viaBusca(ctx, verificacao, consultas, deps);
}
