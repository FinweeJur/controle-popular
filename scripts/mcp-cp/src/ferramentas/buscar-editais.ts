/**
 * `buscar_editais` — busca textual no radar de editais do Jornal Minas Gerais.
 *
 * Fonte oficial: apps/web/data/editais-consolidado.json, gerado por
 * scripts/consolidar-radar-editais.mts a partir do Jornal Minas Gerais
 * (https://www.jornalminasgerais.mg.gov.br). Somente leitura, nenhuma rede.
 *
 * A busca ignora acento e caixa e exige TODOS os termos. A ordenação é por
 * data de publicação, do mais recente para o mais antigo.
 */

import type { Edital } from "../acervo.js";
import { ErroDeEntrada, limitarPagina, type Paginacao } from "../resultado.js";
import { dataBr, normalizar, tokensDeBusca } from "../texto.js";

export interface ConsultaEditais {
  termo: string;
  orgao?: string;
  limite?: number;
  deslocamento?: number;
}

export interface ItemEdital {
  id: string;
  titulo: string;
  orgao: string;
  modalidade: string;
  numero: string;
  dataPublicacao: string;
  objeto: string;
  urlOficial: string | null;
  atualizacoes: number;
}

export interface ResultadoEditais {
  consulta: {
    termo: string;
    orgao: string | null;
    limite: number;
    deslocamento: number;
  };
  total: number;
  mostrando: number;
  temMais: boolean;
  itens: ItemEdital[];
  /** Preenchido só quando a busca volta vazia: ajuda a reformular sem abrir outro arquivo. */
  orgaosDisponiveis: string[];
  mensagem: string;
}

function textoDeBusca(edital: Edital): string {
  return normalizar(
    [edital.titulo, edital.objeto, edital.modalidade, edital.numero, edital.orgao].join(" "),
  );
}

function compararEditais(a: Edital, b: Edital): number {
  if (a.dataPublicacao !== b.dataPublicacao) {
    return a.dataPublicacao < b.dataPublicacao ? 1 : -1;
  }
  return a.id.localeCompare(b.id);
}

export function buscarEditais(
  editais: readonly Edital[],
  consulta: ConsultaEditais,
): ResultadoEditais {
  const termo = consulta.termo.trim().replace(/\s+/g, " ");
  if (!termo) throw new ErroDeEntrada("Informe um `termo` de busca (ex.: credenciamento, barragem, saúde).");

  const pagina: Paginacao = limitarPagina(consulta.limite, consulta.deslocamento);
  const orgaoFiltro = (consulta.orgao ?? "").trim() || null;
  const orgaoNormalizado = orgaoFiltro ? normalizar(orgaoFiltro) : "";
  const tokens = tokensDeBusca(termo);

  const encontrados = editais
    .filter((edital) => {
      if (orgaoNormalizado && !normalizar(edital.orgao).includes(orgaoNormalizado)) return false;
      const alvo = textoDeBusca(edital);
      return tokens.every((token) => alvo.includes(token));
    })
    .sort(compararEditais);

  const fatia = encontrados.slice(pagina.deslocamento, pagina.deslocamento + pagina.limite);
  const itens: ItemEdital[] = fatia.map((edital) => ({
    id: edital.id,
    titulo: edital.titulo,
    orgao: edital.orgao,
    modalidade: edital.modalidade,
    numero: edital.numero,
    dataPublicacao: edital.dataPublicacao,
    objeto: edital.objeto,
    urlOficial: edital.urlOficial,
    atualizacoes: edital.atualizacoes,
  }));

  const orgaosDisponiveis = [...new Set(editais.map((edital) => edital.orgao).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );

  const filtroOrgao = orgaoFiltro ? ` · órgão: ${orgaoFiltro}` : "";
  const dica =
    encontrados.length > 0
      ? ""
      : orgaoFiltro
        ? " Tente um termo mais curto ou remova o filtro de órgão."
        : " Tente um termo mais curto ou um sinônimo.";
  const mensagem =
    encontrados.length === 0
      ? `Nenhum edital encontrado para "${termo}"${filtroOrgao} em ${editais.length} editais do acervo.${dica}`
      : `${encontrados.length} edital(is) para "${termo}"${filtroOrgao}; ` +
        `mostrando ${pagina.deslocamento + 1}–${pagina.deslocamento + itens.length}.`;

  return {
    consulta: {
      termo,
      orgao: orgaoFiltro,
      limite: pagina.limite,
      deslocamento: pagina.deslocamento,
    },
    total: encontrados.length,
    mostrando: itens.length,
    temMais: pagina.deslocamento + itens.length < encontrados.length,
    itens,
    orgaosDisponiveis: encontrados.length === 0 ? orgaosDisponiveis : [],
    mensagem,
  };
}

/** Texto que o cliente MCP recebe. Campos já vêm limpos e cortados do acervo. */
export function formatarEditais(resultado: ResultadoEditais): string {
  const linhas: string[] = [resultado.mensagem];

  if (resultado.itens.length === 0) {
    if (resultado.orgaosDisponiveis.length > 0) {
      linhas.push("", `Órgãos com edital no acervo: ${resultado.orgaosDisponiveis.join("; ")}.`);
    }
    return linhas.join("\n");
  }

  resultado.itens.forEach((item, indice) => {
    const rotuloOrgao = item.orgao || "órgão não informado";
    const modalidade = item.modalidade ? ` · ${item.modalidade}` : "";
    const numero = item.numero ? ` nº ${item.numero}` : "";
    linhas.push(
      "",
      `${resultado.consulta.deslocamento + indice + 1}. ${item.titulo}`,
      `   Órgão: ${rotuloOrgao}${modalidade}${numero} · Publicado em ${dataBr(item.dataPublicacao)}`,
    );
    if (item.objeto) linhas.push(`   Objeto: ${item.objeto}`);
    linhas.push(`   Fonte: ${item.urlOficial ?? "URL oficial não informada"}`);
    linhas.push(
      `   id: ${item.id}${item.atualizacoes > 0 ? ` · ${item.atualizacoes} atualização(ões)` : ""}`,
    );
  });

  if (resultado.temMais) {
    linhas.push(
      "",
      `Há mais resultados. Peça o próximo bloco com deslocamento=${resultado.consulta.deslocamento + resultado.mostrando}.`,
    );
  }

  return linhas.join("\n");
}
