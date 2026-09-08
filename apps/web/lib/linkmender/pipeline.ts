/**
 * LinkMender v2 — Pipeline por link quebrado: verificar → buscar 3× →
 * confirmar por critérios. Tudo injeitado de `fetchFn` e `sleepFn`: o
 * pipeline inteiro roda com fetch mockado (rede desta máquina bloqueada,
 * WinError 10013) e pausa zero nos testes. Primeira rodada real: home-pc.
 */

import {
  avaliarCandidato,
  hostAceitavel,
  tipoConteudoDeUrl,
  tipoDeContentType,
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
  /** Proposta aceita pelos critérios — ou null. */
  proposta: PropostaCorrecao | null;
  /** Consultas efetivamente disparadas (trilha; útil no relatório). */
  consultas: { estrategia: string; query: string }[];
  /** Por que não houve proposta, quando não houve. */
  semPropostaMotivo?: string;
}

const MAX_RESULTADOS_POR_BUSCA = 5;

/**
 * Processa UM link: classifica (HTTP + conteúdo). Se REDIRECT para URL
 * aceitável, propõe o destino (o próprio servidor disse para onde o documento
 * foi). Se QUEBRADO ou MENTIROSO, dispara as 3 buscas em ordem e avalia cada
 * candidato pelos critérios — aceita o PRIMEIRO que bater em todos.
 */
export async function processarLink(
  ctx: ContextoLink,
  opcoes: {
    fetchFn?: FetchFn;
    sleepFn?: (ms: number) => Promise<void>;
    pausaMs?: number;
  } = {}
): Promise<ResultadoProcessamento> {
  const fetchFn = opcoes.fetchFn ?? fetch;
  const sleepFn = opcoes.sleepFn ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const pausaMs = opcoes.pausaMs ?? 400;

  const sondaBruta = await sondar(ctx.url, fetchFn);
  const verificacao = classificarVerificacao(ctx.url, sondaBruta);
  await sleepFn(pausaMs);

  const consultas: { estrategia: string; query: string }[] = [];
  const semProposta = (motivo: string): ResultadoProcessamento => ({
    verificacao,
    proposta: null,
    consultas,
    semPropostaMotivo: motivo,
  });

  if (verificacao.classe === "OK") return semProposta("link vivo");
  if (verificacao.classe === "INCONSISTENTE") {
    return semProposta(verificacao.motivo ?? "inconsistente");
  }

  // REDIRECT: o próprio servidor apontou o destino. Propõe se o destino é
  // domínio aceitável e vivo (verificação do DESTINO, não só da origem).
  if (verificacao.classe === "REDIRECT" && verificacao.finalUrl) {
    const destino = verificacao.finalUrl;
    let host = "";
    try {
      host = new URL(destino).hostname;
    } catch {
      return semProposta("destino do redirect nao parseia");
    }
    if (!hostAceitavel(host)) {
      return semProposta(`destino do redirect em dominio nao aceitavel: ${host}`);
    }
    const sondaDestinoBruta = await sondar(destino, fetchFn);
    const sondaDestino = classificarVerificacao(destino, sondaDestinoBruta);
    await sleepFn(pausaMs);
    if (sondaDestino.classe !== "OK") {
      return semProposta(`destino do redirect tambem nao vive (${sondaDestino.classe})`);
    }
    return {
      verificacao,
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
      consultas,
    };
  }

  // QUEBRADO / MENTIROSO: 3 buscas com palavras-chave diferentes.
  const consultasPlanejadas = montarConsultasBusca({
    url: ctx.url,
    titulo: ctx.titulo ?? null,
    orgao: ctx.orgao ?? null,
  });

  for (const consulta of consultasPlanejadas) {
    consultas.push({ estrategia: consulta.estrategia, query: consulta.query });
    const busca = await buscarNoDuckDuckGo(consulta.query, fetchFn);
    await sleepFn(pausaMs);
    if (!busca.ok || busca.links.length === 0) continue;

    for (const candidata of busca.links.slice(0, MAX_RESULTADOS_POR_BUSCA)) {
      if (candidata === ctx.url) continue;
      const sondaBrutaCand = await sondar(candidata, fetchFn);
      const sonda = classificarVerificacao(candidata, sondaBrutaCand);
      await sleepFn(pausaMs);
      const entrada: CandidatoEntrada = {
        urlVelha: ctx.url,
        urlCandidata: candidata,
        statusHttp: sonda.statusHttp ?? 0,
        contentType: sonda.contentType,
        corpoInicial: sondaBrutaCand.corpoInicial,
        tituloItem: ctx.titulo ?? null,
        tituloCandidato: null,
      };
      const avaliacao = avaliarCandidato(entrada);
      if (!avaliacao.aceito) continue;

      // O tipo do candidato precisa igualar o do ORIGINAL (criterios.ts já
      // valida; aqui só rotula o critério com o tipo concreto).
      const tipoOriginal = tipoConteudoDeUrl(ctx.url);
      const tipoNovo = tipoDeContentType(sonda.contentType);
      const criterios = avaliacao.criterios.filter(
        (c) => !c.startsWith("tipo-igual-")
      );
      if (tipoNovo !== "desconhecido") criterios.push(`tipo-igual-${tipoNovo}`);
      else if (tipoOriginal !== "desconhecido") criterios.push(`tipo-igual-${tipoOriginal}`);
      else return semProposta("tipo do original indeterminavel");

      return {
        verificacao,
        proposta: {
          urlVelha: ctx.url,
          urlNova: candidata,
          criterios,
          estrategia: consulta.estrategia,
        },
        consultas,
      };
    }
  }

  return semProposta(
    `nenhum candidato bateu nos criterios apos ${consultas.length} buscas`
  );
}
