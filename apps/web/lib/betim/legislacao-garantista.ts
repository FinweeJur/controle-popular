import * as q from "@/lib/db/queries/betim";
import type { IdMunicipio } from "@/lib/db/queries/municipios";
import { labelDoDireito, type Rotulo } from "@/lib/congresso/rubrica";
import { TIPO_PROPOSICAO_LABELS } from "@/lib/betim/vereadores";

/**
 * Análise garantista × reducionista do eixo Cidades — lado de apresentação.
 *
 * Espelha `lib/congresso/destaques.ts` (mesma régua, mesma tabela de
 * origem), com UMA diferença estrutural: aqui existem DOIS objetos
 * analisáveis por cidade — `ato` (lei/decreto já sancionado) e
 * `proposicao` (projeto ainda em tramitação) — em vez de um só. As duas
 * páginas de destaque (alertas/bons-exemplos) misturam os dois tipos numa
 * lista só, ordenada por score; cada item carrega `tipoObjeto` para a UI
 * nunca deixar isso implícito.
 */

export type TipoObjeto = "ato" | "proposicao";

const REDUCIONISTAS: Rotulo[] = ["reducionista_forte", "reducionista"];
const GARANTISTAS: Rotulo[] = ["garantista_forte", "garantista"];

export interface DestaqueLegislacao {
  /** id do ato ou da proposição — o que existe de fato, não o id da análise. */
  id: string;
  analiseId: string;
  tipoObjeto: TipoObjeto;
  identificacao: string;
  ementa: string | null;
  /** Data de publicação (ato) ou de apresentação (proposição). */
  data: string | null;
  /** Só proposição tem: ato sancionado não "tramita" mais. */
  situacao: string | null;
  /** Só proposição tem autoria neste schema; ato não tem coluna de autor. */
  autores: string[] | null;
  linkFonte: string | null;
  score: number | null;
  rotulo: Rotulo | null;
  clausula_petrea: boolean;
  vedacao_retrocesso: boolean;
  resumo_neutro: string | null;
  modelo: string | null;
  analisadaEm: string | null;
  /** Slugs de direito vindos de `analise_itens`. */
  direitos: string[];
  /** O item de maior peso, para a UI explicar o rótulo em uma linha. */
  principal: {
    direito: string;
    dispositivo: string;
    direcao: string;
    grau: string;
    trecho: string | null;
  } | null;
}

function identificacaoAto(a: { ato_tipo: string | null; ato_numero: string | null; ato_ano: number | null }): string {
  const tipo = a.ato_tipo?.trim() || "Ato";
  const numero = a.ato_numero ? ` nº ${a.ato_numero}` : "";
  const ano = a.ato_ano ? `/${a.ato_ano}` : "";
  return `${tipo}${numero}${ano}`;
}

function identificacaoProposicao(a: { prop_tipo: string | null; prop_numero: number | null; prop_ano: number | null }): string {
  const tipo = a.prop_tipo ? (TIPO_PROPOSICAO_LABELS[a.prop_tipo] ?? a.prop_tipo) : "Projeto";
  const numero = a.prop_numero ? ` nº ${a.prop_numero}` : "";
  const ano = a.prop_ano ? `/${a.prop_ano}` : "";
  return `${tipo}${numero}${ano}`;
}

/**
 * Carrega análises `status = 'ok'` de uma cidade e junta os itens.
 *
 * `status = 'ok'` é filtro obrigatório — igual ao Congresso, pela mesma
 * razão: análise em `requer_revisao` tem baixa confiança e não pode virar
 * manchete de alerta nem de bom exemplo. Já vem embutido em
 * `analisesDoMunicipio`.
 */
async function carregar(idMunicipio: IdMunicipio, rotulos: Rotulo[]): Promise<DestaqueLegislacao[]> {
  try {
    const analises = await q.analisesDoMunicipio(idMunicipio, rotulos);
    if (!analises || analises.length === 0) return [];

    const itens = await q.itensDeAnalises(idMunicipio, analises.map((a) => a.id));
    const itensPorAnalise = new Map<string, typeof itens>();
    for (const i of itens) {
      const lista = itensPorAnalise.get(i.analise_id) ?? [];
      lista.push(i);
      itensPorAnalise.set(i.analise_id, lista);
    }

    return analises.map((a): DestaqueLegislacao => {
      const meus = (itensPorAnalise.get(a.id) ?? [])
        .slice()
        .sort((x, y) => Math.abs(y.peso ?? 0) - Math.abs(x.peso ?? 0));
      const principal = meus[0];
      const ehAto = a.tipo_objeto === "ato";

      return {
        id: (ehAto ? a.ato_id : a.proposicao_id) as string,
        analiseId: a.id,
        tipoObjeto: a.tipo_objeto,
        identificacao: ehAto ? identificacaoAto(a) : identificacaoProposicao(a),
        ementa: ehAto ? a.ato_ementa : a.prop_ementa,
        data: ehAto ? a.ato_data : a.prop_data,
        situacao: ehAto ? null : a.prop_situacao,
        autores: ehAto ? null : a.prop_autores,
        linkFonte: ehAto ? a.ato_link : a.prop_link,
        score: a.score,
        rotulo: a.rotulo as Rotulo | null,
        clausula_petrea: a.clausula_petrea ?? false,
        vedacao_retrocesso: a.vedacao_retrocesso ?? false,
        resumo_neutro: a.resumo_neutro,
        modelo: a.modelo,
        analisadaEm: a.criado_em,
        direitos: [...new Set(meus.map((i) => i.direito))],
        principal: principal
          ? {
              direito: principal.direito,
              dispositivo: principal.dispositivo,
              direcao: principal.direcao,
              grau: principal.grau ?? "",
              trecho: principal.trecho,
            }
          : null,
      };
    });
  } catch (e) {
    // Migration não rodada / tabela ausente: estado vazio, não erro — mesma
    // convenção do Congresso (ver `lib/congresso/destaques.ts`).
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}

/** Leis e projetos que restringem direitos, do mais grave para o menos. */
export async function alertas(idMunicipio: IdMunicipio, limite?: number): Promise<DestaqueLegislacao[]> {
  const todos = await carregar(idMunicipio, REDUCIONISTAS);
  todos.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
  return limite ? todos.slice(0, limite) : todos;
}

/** Leis e projetos que ampliam direitos, do mais expressivo para o menos. */
export async function bonsExemplos(idMunicipio: IdMunicipio, limite?: number): Promise<DestaqueLegislacao[]> {
  const todos = await carregar(idMunicipio, GARANTISTAS);
  todos.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return limite ? todos.slice(0, limite) : todos;
}

export interface CoberturaLegislacao {
  atosAnalisados: number;
  proposicoesAnalisadas: number;
  totalAtos: number;
  totalProposicoes: number;
  /** `false` quando o banco não respondeu — degrada pra "em breve", não erro. */
  ok: boolean;
}

const COBERTURA_VAZIA: CoberturaLegislacao = {
  atosAnalisados: 0,
  proposicoesAnalisadas: 0,
  totalAtos: 0,
  totalProposicoes: 0,
  ok: false,
};

/**
 * O denominador honesto: quantos atos/proposições já foram analisados e
 * quantos existem no total. Toda tela que rankeia ou lista análises usa
 * isto — sem ele, um "top alertas" parece veredito sobre a Câmara/Prefeitura
 * inteira, quando é uma amostra de dezenas sobre milhares.
 */
export async function coberturaLegislacao(idMunicipio: IdMunicipio): Promise<CoberturaLegislacao> {
  try {
    const c = await q.coberturaAnaliseMunicipio(idMunicipio);
    return c ? { ...c, ok: true } : COBERTURA_VAZIA;
  } catch {
    return COBERTURA_VAZIA;
  }
}

/** "1,6%" pra frações pequenas (não arredonda pra 2%), "12%" pra números redondos. */
export function percentualAnalisado(analisados: number, total: number): string {
  if (total <= 0) return "0%";
  const p = (analisados / total) * 100;
  const casas = p > 0 && p < 10 ? 1 : 0;
  return `${p.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

export interface DireitoContagem {
  direito: string;
  label: string;
  qtd: number;
}

/**
 * Quantos ATOS analisados tocam cada direito — alimenta o filtro por
 * direito de `/camara/legislacao`. Só conta `tipo_objeto = 'ato'`
 * porque aquela página lista só atos oficiais (proposições vivem em
 * `/camara/proposicoes`, sem este filtro).
 */
export async function direitosDeAtos(idMunicipio: IdMunicipio): Promise<DireitoContagem[]> {
  try {
    const linhas = await q.direitosDoMunicipio(idMunicipio);
    if (!linhas) return [];
    const porDireito = new Map<string, number>();
    for (const r of linhas) {
      if (r.tipo_objeto !== "ato") continue;
      porDireito.set(r.direito, (porDireito.get(r.direito) ?? 0) + r.qtd);
    }
    return [...porDireito.entries()]
      .map(([direito, qtd]) => ({ direito, label: labelDoDireito(direito), qtd }))
      .sort((a, b) => b.qtd - a.qtd || a.label.localeCompare(b.label, "pt-BR"));
  } catch {
    return [];
  }
}

export interface AnaliseAtoItem {
  direito: string;
  dispositivo: string;
  direcao: string;
  grau: string;
  trecho: string | null;
}

export interface AnaliseAto {
  rotulo: Rotulo | null;
  score: number | null;
  direitos: string[];
  itens: AnaliseAtoItem[];
}

/**
 * Análise (quando existe) de um conjunto de atos, indexada por `ato_id`.
 *
 * Usada em `/camara/legislacao` para casar cada linha da lista com sua
 * análise: ato ausente do mapa é ato SEM análise — a página não deve
 * escrever "neutro" nesse caso, só não mostrar nada (ver regra de
 * honestidade no handoff do projeto).
 */
export async function analisesDeAtos(
  idMunicipio: IdMunicipio,
  atoIds: string[]
): Promise<Map<string, AnaliseAto>> {
  const mapa = new Map<string, AnaliseAto>();
  if (atoIds.length === 0) return mapa;
  try {
    const resultado = await q.analisesDeObjetos(idMunicipio, { atos: atoIds });
    if (!resultado) return mapa;
    const { linhas, itens } = resultado;

    const itensPorAnalise = new Map<string, typeof itens>();
    for (const i of itens) {
      const lista = itensPorAnalise.get(i.analise_id) ?? [];
      lista.push(i);
      itensPorAnalise.set(i.analise_id, lista);
    }

    for (const l of linhas) {
      // `analisesDeObjetos` não filtra status (a diferença de
      // `analisesDoMunicipio`) porque outros consumidores podem querer o
      // estado bruto; aqui o filtro é deliberado, mesma regra do resto do
      // eixo: análise de baixa confiança não vira badge na lista.
      if (l.status !== "ok" || !l.ato_id) continue;
      const meus = (itensPorAnalise.get(l.id) ?? [])
        .slice()
        .sort((x, y) => Math.abs(y.peso ?? 0) - Math.abs(x.peso ?? 0));
      mapa.set(l.ato_id, {
        rotulo: l.rotulo as Rotulo | null,
        score: l.score,
        direitos: [...new Set(meus.map((i) => i.direito))],
        itens: meus.map((i) => ({
          direito: i.direito,
          dispositivo: i.dispositivo,
          direcao: i.direcao,
          grau: i.grau ?? "",
          trecho: i.trecho,
        })),
      });
    }
  } catch (e) {
    if ((e as { code?: string }).code !== "42P01") throw e;
  }
  return mapa;
}
