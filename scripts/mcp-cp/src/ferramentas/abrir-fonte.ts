/**
 * `abrir_fonte` — acha a fonte oficial por id ou por URL e devolve o essencial:
 * título, URL oficial e data.
 *
 * O índice é montado de arquivos versionados (ver acervo.ts): editais, documentos
 * do RAG, catálogo de bases e portais oficiais por UF. Nada aqui acessa a rede —
 * "abrir" significa entregar o endereço oficial, não baixar a página.
 *
 * Só entram URLs http/https. Entrada com `javascript:`, `data:` ou caminho
 * relativo nunca vira link clicável na resposta.
 */

import type { Fonte } from "../acervo.js";
import { ErroDeEntrada } from "../resultado.js";
import { chaveUrl, dataBr, normalizar } from "../texto.js";

export interface ConsultaFonte {
  id?: string;
  url?: string;
}

export interface ResultadoFonte {
  encontrado: boolean;
  fonte: Fonte | null;
  /** Quando não acha: até 5 candidatas por domínio ou por id parecido. */
  sugestoes: Fonte[];
  totalIndexado: number;
  mensagem: string;
}

const ROTULO_TIPO: Record<Fonte["tipo"], string> = {
  edital: "Edital",
  documento: "Documento oficial",
  "base-de-dados": "Base de dados",
  "portal-oficial": "Portal oficial",
};

function achado(fonte: Fonte, totalIndexado: number): ResultadoFonte {
  return {
    encontrado: true,
    fonte,
    sugestoes: [],
    totalIndexado,
    mensagem: `${ROTULO_TIPO[fonte.tipo]}: ${fonte.titulo} — ${fonte.url}`,
  };
}

export function abrirFonte(fontes: readonly Fonte[], consulta: ConsultaFonte): ResultadoFonte {
  const id = (consulta.id ?? "").trim();
  const url = (consulta.url ?? "").trim();
  if (!id && !url) throw new ErroDeEntrada("Informe `id` ou `url` da fonte.");
  if (id && url) throw new ErroDeEntrada("Informe só um: `id` ou `url`.");

  if (id) {
    const alvo = normalizar(id);
    const porIdCompleto = fontes.find((fonte) => normalizar(fonte.id) === alvo);
    if (porIdCompleto) return achado(porIdCompleto, fontes.length);

    // Aceita o id sem o prefixo da coleção (ex.: `2026-09-15-7d9995b7`).
    const porIdCurto = fontes.filter((fonte) => normalizar(fonte.id.split(":").slice(1).join(":")) === alvo);
    if (porIdCurto.length === 1 && porIdCurto[0]) return achado(porIdCurto[0], fontes.length);

    const sugestoes = (porIdCurto.length > 1 ? porIdCurto : fontes.filter((fonte) => normalizar(fonte.id).includes(alvo)))
      .slice(0, 5);
    return {
      encontrado: false,
      fonte: null,
      sugestoes,
      totalIndexado: fontes.length,
      mensagem:
        `Nenhuma fonte com id "${id}" entre ${fontes.length} fontes indexadas. ` +
        (sugestoes.length > 0 ? "Veja as sugestões por id parecido." : "Tente a URL oficial ou um id de edital."),
    };
  }

  const alvo = chaveUrl(url);
  const porUrl = fontes.find((fonte) => chaveUrl(fonte.url) === alvo);
  if (porUrl) return achado(porUrl, fontes.length);

  // Sugestão por domínio: quem digitou uma página interna do portal acha o portal.
  const dominio = (() => {
    try {
      return new URL(url).host.toLowerCase();
    } catch {
      return "";
    }
  })();
  const sugestoes = dominio
    ? fontes
        .filter((fonte) => {
          try {
            return new URL(fonte.url).host.toLowerCase() === dominio;
          } catch {
            return false;
          }
        })
        .slice(0, 5)
    : [];

  return {
    encontrado: false,
    fonte: null,
    sugestoes,
    totalIndexado: fontes.length,
    mensagem:
      `Nenhuma fonte indexada para a URL informada entre ${fontes.length} fontes. ` +
      (sugestoes.length > 0
        ? `Este domínio tem ${sugestoes.length} fonte(s) no índice; veja as sugestões.`
        : "Use o id de um edital, de um documento do RAG ou de uma base do catálogo."),
  };
}

/** Texto que o cliente MCP recebe. */
export function formatarFonte(resultado: ResultadoFonte): string {
  const linhas: string[] = [resultado.mensagem];
  const fonte = resultado.fonte;

  if (fonte) {
    linhas.push(
      "",
      `Tipo: ${ROTULO_TIPO[fonte.tipo]}`,
      `Título: ${fonte.titulo}`,
      `URL oficial: ${fonte.url}`,
      `Data: ${dataBr(fonte.data)}`,
      `Órgão: ${fonte.orgao || "não informado"}`,
      `id: ${fonte.id}`,
      `Origem: ${fonte.origem}`,
    );
    return linhas.join("\n");
  }

  if (resultado.sugestoes.length > 0) {
    linhas.push("", "Talvez seja uma destas:");
    resultado.sugestoes.forEach((sugestao) => {
      linhas.push(`- ${sugestao.titulo} (${sugestao.id})`);
      linhas.push(`  ${sugestao.url}`);
    });
  }

  return linhas.join("\n");
}
