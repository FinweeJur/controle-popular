/**
 * Leitura do acervo local do Controle Popular.
 *
 * Regra deste módulo: só arquivo local, só leitura, nenhuma rede. Cada JSON é
 * tratado como não confiável — item sem id/título é descartado, campo de tipo
 * errado vira vazio e URL que não seja http/https não entra no índice.
 *
 * Arquivos lidos (versionados em apps/web/data/):
 *   editais-consolidado.json  → editais do Jornal Minas Gerais (radar de editais)
 *   barragens-sigbm.json      → barragens de mineração (ANM/SIGBM)
 *   documentos-rag-fontes.json→ documentos oficiais indexados no RAG
 *   catalogo-bases-dados.json → catálogo das bases públicas do portal
 *   fontes-27-estados.json    → portais oficiais por UF
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dataIso, textoLimpo, urlOficial } from "./texto.js";

export interface Edital {
  id: string;
  titulo: string;
  orgao: string;
  modalidade: string;
  numero: string;
  dataPublicacao: string;
  objeto: string;
  urlOficial: string | null;
  pagina: number | null;
  secao: string;
  atualizacoes: number;
}

export interface Barragem {
  id: string;
  nome: string;
  empreendedor: string;
  uf: string;
  municipio: string;
  situacao: string;
  nivelEmergencia: string;
  categoriaRisco: string;
  danoPotencial: string;
  faseDescaracterizacao: string;
  dataFinalizacaoDce: string;
}

/** Fonte oficial navegável: é o que `abrir_fonte` devolve. */
export interface Fonte {
  /** Id estável com coleção na frente: `edital:...`, `documento:...`, `base:...`, `portal:...`. */
  id: string;
  tipo: "edital" | "documento" | "base-de-dados" | "portal-oficial";
  titulo: string;
  url: string;
  orgao: string;
  /** Data ISO da publicação/coleta, quando a fonte informa. */
  data: string | null;
  /** Arquivo do repositório que originou o registro. */
  origem: string;
}

export interface Acervo {
  editais: Edital[];
  barragens: Barragem[];
  fontes: Fonte[];
  /** Arquivos ausentes ou ilegíveis: o servidor sobe mesmo assim e avisa. */
  avisos: string[];
  /** Diretório de dados efetivamente lido. */
  diretorio: string;
}

export const ARQUIVOS = {
  editais: "editais-consolidado.json",
  barragens: "barragens-sigbm.json",
  documentos: "documentos-rag-fontes.json",
  catalogo: "catalogo-bases-dados.json",
  estados: "fontes-27-estados.json",
} as const;

function lerJson(caminho: string, avisos: string[]): unknown {
  if (!existsSync(caminho)) {
    avisos.push(`arquivo ausente: ${caminho}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(caminho, "utf8"));
  } catch (erro) {
    avisos.push(`arquivo ilegível: ${caminho} (${erro instanceof Error ? erro.message : "erro"})`);
    return null;
  }
}

function comoLista(bruto: unknown, chave?: string): unknown[] {
  if (Array.isArray(bruto)) return bruto;
  if (bruto && typeof bruto === "object" && chave) {
    const interno = (bruto as Record<string, unknown>)[chave];
    if (Array.isArray(interno)) return interno;
  }
  return [];
}

function objeto(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

function inteiroOuNulo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) ? Math.trunc(valor) : null;
}

export function lerEditais(bruto: unknown): Edital[] {
  const saida: Edital[] = [];
  for (const brutoItem of comoLista(bruto, "itens")) {
    const item = objeto(brutoItem);
    const id = textoLimpo(item.id, 80);
    const titulo = textoLimpo(item.titulo, 300);
    // Item sem id ou sem título não é identificável: descarta em vez de inventar.
    if (!id || !titulo) continue;
    saida.push({
      id,
      titulo,
      orgao: textoLimpo(item.orgao, 120),
      modalidade: textoLimpo(item.modalidade, 120),
      numero: textoLimpo(item.numero, 40),
      dataPublicacao: dataIso(item.dataPublicacao),
      objeto: textoLimpo(item.objeto, 600),
      urlOficial: urlOficial(item.urlOficial),
      pagina: inteiroOuNulo(item.pagina),
      secao: textoLimpo(item.secao, 120),
      atualizacoes: Array.isArray(item.atualizacoes) ? item.atualizacoes.length : 0,
    });
  }
  return saida;
}

export function lerBarragens(bruto: unknown): Barragem[] {
  const saida: Barragem[] = [];
  for (const brutoItem of comoLista(bruto, "barragens")) {
    const item = objeto(brutoItem);
    const id = textoLimpo(item.id, 40);
    const nome = textoLimpo(item.nome, 200);
    if (!id || !nome) continue;
    saida.push({
      id,
      nome,
      empreendedor: textoLimpo(item.empreendedor, 200),
      uf: textoLimpo(item.uf, 2).toUpperCase(),
      municipio: textoLimpo(item.municipio, 120),
      situacao: textoLimpo(item.situacao, 80),
      nivelEmergencia: textoLimpo(item.nivel_emergencia, 80),
      categoriaRisco: textoLimpo(item.categoria_risco, 40),
      danoPotencial: textoLimpo(item.dano_potencial, 40),
      faseDescaracterizacao: textoLimpo(item.fase_descaracterizacao, 80),
      dataFinalizacaoDce: dataIso(item.data_finalizacao_dce),
    });
  }
  return saida;
}

/** Os 4 primeiros campos de cada fonte; `data` só quando o arquivo informa. */
export const ROTULOS_ESTADO: Record<string, string> = {
  portal_governo: "portal do governo",
  transparencia: "portal da transparência",
  dados_abertos: "dados abertos",
  diario_oficial: "diário oficial",
  compras_licitacoes: "compras e licitações",
  orgao_ambiental: "órgão ambiental",
  portal_oficial: "portal oficial",
  portal: "portal oficial",
  transparencia_ale: "transparência da assembleia",
  api_dados_abertos: "API de dados abertos",
  tribunal_justica: "tribunal de justiça",
  ministerio_publico: "ministério público",
  defensoria_publica: "defensoria pública",
  tribunal_contas: "tribunal de contas",
  observatorio_social: "observatório social",
  datajud_api: "API DataJud",
  portal_osb: "observatório social",
  portal_oab: "seccional da OAB",
};

export interface EntradaFontes {
  editais: Edital[];
  documentos: unknown;
  catalogo: unknown;
  estados: unknown;
  metaBarragens: { fonte: string; url: string; data: string | null };
}

/**
 * Monta o índice de fontes de `abrir_fonte`.
 * Id com coleção na frente evita colisão entre um edital e um documento de id igual.
 */
export function montarIndiceDeFontes(entrada: EntradaFontes): Fonte[] {
  const fontes: Fonte[] = [];
  const vistos = new Set<string>();

  const adicionar = (fonte: Fonte | null): void => {
    if (!fonte) return;
    if (!fonte.id || !fonte.titulo || !fonte.url) return;
    const chave = fonte.id.toLowerCase();
    if (vistos.has(chave)) return;
    vistos.add(chave);
    fontes.push(fonte);
  };

  for (const edital of entrada.editais) {
    if (!edital.urlOficial) continue;
    adicionar({
      id: `edital:${edital.id}`,
      tipo: "edital",
      titulo: edital.titulo,
      url: edital.urlOficial,
      orgao: edital.orgao,
      data: edital.dataPublicacao || null,
      origem: ARQUIVOS.editais,
    });
  }

  for (const brutoItem of comoLista(entrada.documentos)) {
    const item = objeto(brutoItem);
    const id = textoLimpo(item.id, 120);
    const titulo = textoLimpo(item.titulo, 300);
    const url = urlOficial(item.url) ?? urlOficial(item.urlPdf);
    if (!id || !titulo || !url) continue;
    adicionar({
      id: `documento:${id}`,
      tipo: "documento",
      titulo,
      url,
      orgao: textoLimpo(item.orgao, 160),
      data: dataIso(item.data) || dataIso(item.dataPublicacao) || null,
      origem: ARQUIVOS.documentos,
    });
  }

  for (const brutoItem of comoLista(entrada.catalogo)) {
    const item = objeto(brutoItem);
    const id = textoLimpo(item.id, 120);
    const nome = textoLimpo(item.nome, 300);
    const url = urlOficial(item.urlFonte) ?? urlOficial(item.endpointApi);
    if (!id || !nome || !url) continue;
    adicionar({
      id: `base:${id}`,
      tipo: "base-de-dados",
      titulo: nome,
      url,
      orgao: textoLimpo(item.orgaoFonte, 200),
      data: dataIso(item.atualizadoEm) || null,
      origem: ARQUIVOS.catalogo,
    });
  }

  const meta = entrada.metaBarragens;
  adicionar({
    id: "base:sigbm-barragens",
    tipo: "base-de-dados",
    titulo: meta.fonte || "ANM — SIGBM (barragens de mineração)",
    url: urlOficial(meta.url) ?? "",
    orgao: "Agência Nacional de Mineração (ANM)",
    data: meta.data,
    origem: ARQUIVOS.barragens,
  });

  for (const brutoEstado of comoLista(entrada.estados)) {
    for (const fonte of achatarEstado(objeto(brutoEstado))) adicionar(fonte);
  }

  return fontes;
}

/**
 * Transforma o bloco de um estado em fontes planas. Percorre objeto aninhado
 * com limite de profundidade e de nós: estrutura inesperada não vira laço.
 */
export function achatarEstado(estado: Record<string, unknown>): Fonte[] {
  const uf = textoLimpo(estado.uf, 2).toUpperCase();
  const nome = textoLimpo(estado.nome, 80);
  if (!uf || !nome) return [];

  const saida: Fonte[] = [];
  let nos = 0;

  const caminhar = (valor: unknown, caminho: string[], sigla: string): void => {
    if (nos > 400 || caminho.length > 4) return;
    nos += 1;

    const url = urlOficial(valor);
    if (url) {
      const chave = caminho[caminho.length - 1] ?? "portal";
      const rotulo = ROTULOS_ESTADO[chave] ?? chave.replace(/_/g, " ");
      // A sigla é o que distingue "Acre — TJAC: portal" de "Acre — MPAC: portal".
      const prefixo = sigla ? `${sigla}: ` : "";
      saida.push({
        id: `portal:${uf}-${caminho.join("-")}`,
        tipo: "portal-oficial",
        titulo: `${nome} — ${prefixo}${rotulo}`,
        url,
        orgao: sigla || nome,
        data: null,
        origem: ARQUIVOS.estados,
      });
      return;
    }

    if (!valor || typeof valor !== "object") return;
    const bloco = objeto(valor);
    // `assembleia_sigla` é o nome do campo no bloco legislativo de fontes-27-estados.
    const siglaLocal =
      textoLimpo(bloco.sigla, 40) || textoLimpo(bloco.assembleia_sigla, 40) || sigla;
    for (const [chave, filho] of Object.entries(bloco)) {
      if (chave === "sigla" || chave === "assembleia_sigla") continue;
      caminhar(filho, [...caminho, chave], siglaLocal);
    }
  };

  for (const [secao, bloco] of Object.entries(estado)) {
    if (secao === "uf" || secao === "nome" || secao === "slug" || secao === "regiao" || secao === "capital") {
      continue;
    }
    caminhar(bloco, [secao], "");
  }

  return saida;
}

/**
 * Acha `apps/web/data` subindo a partir do próprio módulo (src/ no teste,
 * dist/ no build). `MCP_CP_DATA_DIR` vence, para quem quer apontar outro acervo.
 */
export function acharDiretorioDados(inicio: string = fileURLToPath(new URL(".", import.meta.url))): string {
  const doAmbiente = process.env.MCP_CP_DATA_DIR?.trim();
  if (doAmbiente) return path.resolve(doAmbiente);

  let atual = path.resolve(inicio);
  for (let nivel = 0; nivel < 8; nivel += 1) {
    const candidato = path.join(atual, "apps", "web", "data");
    if (existsSync(path.join(candidato, ARQUIVOS.editais))) return candidato;
    const pai = path.dirname(atual);
    if (pai === atual) break;
    atual = pai;
  }
  throw new Error(
    "Não achei apps/web/data. Rode o servidor de dentro do repositório ou defina MCP_CP_DATA_DIR.",
  );
}

/** Carrega o acervo inteiro. Arquivo ausente vira aviso, não derruba o servidor. */
export function carregarAcervo(diretorio: string = acharDiretorioDados()): Acervo {
  const avisos: string[] = [];
  const brutoEditais = lerJson(path.join(diretorio, ARQUIVOS.editais), avisos);
  const brutoBarragens = lerJson(path.join(diretorio, ARQUIVOS.barragens), avisos);
  const brutoDocumentos = lerJson(path.join(diretorio, ARQUIVOS.documentos), avisos);
  const brutoCatalogo = lerJson(path.join(diretorio, ARQUIVOS.catalogo), avisos);
  const brutoEstados = lerJson(path.join(diretorio, ARQUIVOS.estados), avisos);

  const editais = lerEditais(brutoEditais);
  const barragens = lerBarragens(brutoBarragens);

  const metaBarragensBruto = objeto(brutoBarragens);
  const metaBarragens = {
    fonte: textoLimpo(metaBarragensBruto.fonte, 200),
    url: urlOficial(metaBarragensBruto.url_fonte) ?? "",
    data: dataIso(metaBarragensBruto.coletado_em) || dataIso(metaBarragensBruto.ultima_atualizacao) || null,
  };

  const fontes = montarIndiceDeFontes({
    editais,
    documentos: brutoDocumentos,
    catalogo: brutoCatalogo,
    estados: brutoEstados,
    metaBarragens,
  });

  return { editais, barragens, fontes, avisos, diretorio };
}
