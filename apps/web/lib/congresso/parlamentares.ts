import { listarParlamentaresAtivos, listarParlamentaresComResumo, obterParlamentarPorId, presencaDiasDoParlamentar, presencaDiasDeTodos, proposicoesDeAutores, votosPorRotuloDoParlamentar, votosRotuloDeTodos } from "@/lib/db/queries/congresso";
import { agregar, type PerfilAgregado } from "@/lib/congresso/agregado";
import {
  calcularNota,
  classificarRequerimento,
  componenteProducaoAmpla,
  type Nota,
} from "@/lib/congresso/rank";
import type { Rotulo } from "@/lib/congresso/rubrica";
import {
  calcularCoerencia,
  calcularPresencaDias,
  type Coerencia,
  type LinhaVotoRotulo,
  type PresencaDias,
} from "@/lib/atuacao-parlamentar";

export interface Parlamentar {
  id: string;
  casa_id: string;
  id_externo: string;
  nome: string;
  nome_eleitoral: string | null;
  partido: string | null;
  uf: string | null;
  email: string | null;
  url_foto: string | null;
  url_perfil: string | null;
  legislatura: number | null;
  ativo: boolean | null;
}

export interface ProposicaoDoParlamentar {
  id: string;
  identificacao: string | null;
  ementa: string | null;
  data_apresentacao: string | null;
  rotulo: Rotulo | null;
}

/**
 * O perfil de UM deputado — presença oficial, coerência de voto com
 * direitos, e o que ele propõe.
 *
 * A autoria agora é PONDERADA por tipo (`PESO_TIPO_CONGRESSO`, calibrado
 * 2026-09-16 contra a distribuição real da Câmara + hierarquia da CF/88).
 * O que NÃO existe ainda é um ranking numérico agregado de parlamentar
 * (combinando presença + coerência + autoria num único número): isso exige
 * calibrar os três eixos entre si, medida ainda não feita.
 *
 * ⚠ NÃO HÁ GASTO DE VERBA DE GABINETE (CEAP) — este portal não coleta a
 * Cota para Exercício da Atividade Parlamentar. Fora do escopo desta
 * coleta; ao contrário de presença e voto, que já tinham fonte verificada,
 * CEAP exigiria um ETL novo.
 */
/**
 * Peso de autoria por tipo de proposição federal — CALIBRADO, não inventado.
 *
 * Duas medições, 2026-09-16:
 * 1. Distribuição real (API Câmara, `?siglaTipo=X&ano=2026`, X-Total-Count):
 *    REQ 6.764 · PL 4.937 · PDL 969 · PLP 216 · MPV 59 · PEC 6.
 *    O que domina em volume é Requerimento — peso alto por volume premiaria
 *    produção barata, não força normativa.
 * 2. Força institucional (hierarquia legal da própria CF/88):
 *    PEC muda a Constituição; MPV tem força de lei com prazo de caducidade;
 *    PLP exige quórum reforçado; PL/PDL/PDC são norma ordinária; REQ é
 *    procedimento interno, não cria norma.
 * O peso combina os dois eixos: força institucional × escassez relativa.
 * Re-meça a distribuição antes de mexer nos valores.
 */
export const PESO_TIPO_CONGRESSO: Record<string, number> = {
  PEC: 5.0,
  MPV: 4.0,
  PLP: 3.0,
  PL: 1.0,
  PDL: 1.0,
  PDC: 1.0,
  REQ: 0.5,
};

/** Peso de uma proposição a partir da `identificacao` ("PL 3631/2026").
 * Tipo inédito ou sigla não reconhecida vale 1,0 — norma ordinária é a
 * medida padrão; é melhor contar 1 que descartar. */
export function pesoDeIdentificacao(identificacao: string | null): number {
  if (!identificacao) return 1.0;
  const sigla = identificacao.trim().split(/[\s]/)[0]?.toUpperCase();
  if (!sigla) return 1.0;
  return PESO_TIPO_CONGRESSO[sigla] ?? 1.0;
}

/**
 */
export async function obterParlamentar(id: string): Promise<{
  parlamentar: Parlamentar;
  presenca: PresencaDias;
  coerencia: Coerencia;
  perfilAutoria: PerfilAgregado;
  proposicoes: ProposicaoDoParlamentar[];
  nota: Nota;
} | null> {
  const parlamentar = await obterParlamentarPorId(id);
  if (!parlamentar) return null;

  const [diasBrutos, votosRotulo, autorias] = await Promise.all([
    presencaDiasDoParlamentar(id),
    votosPorRotuloDoParlamentar(id),
    proposicoesDeAutores([id]),
  ]);

  const presenca = calcularPresencaDias(diasBrutos);

  // Saldo da PRÓPRIA autoria — mesma régua do eixo Cidades: quantas peças
  // com direção de direitos a pessoa protocolou, e para que lado. Peso por
  // tipo (`PESO_TIPO_CONGRESSO`): uma PEC com direção de direitos conta mais
  // que um requerimento.
  let saldoAutoria = 0;
  let baseAutoria = 0;
  for (const a of autorias) {
    const r = a.rotulo as Rotulo | null;
    const w = pesoDeIdentificacao(a.identificacao);
    if (r === "garantista" || r === "garantista_forte") {
      saldoAutoria += w;
      baseAutoria += w;
    } else if (r === "reducionista" || r === "reducionista_forte") {
      saldoAutoria -= w;
      baseAutoria += w;
    }
  }

  const linhasVoto: LinhaVotoRotulo[] = votosRotulo.map((v) => ({
    vereador_id: id,
    rotulo: v.rotulo,
    voto: v.voto,
    autor_id: null,
    qtd: v.qtd,
  }));
  const coerencia = calcularCoerencia(id, linhasVoto, {
    saldo: saldoAutoria,
    base: baseAutoria,
  });

  const perfilAutoria = agregar(autorias.map((a) => a.rotulo as Rotulo | null));

  // Produção ampla: requerimentos de audiência/fiscalização já coletados,
  // classificados por regex auditável (lib/congresso/rank.ts).
  let qtdAudiencia = 0;
  let qtdFiscalizacao = 0;
  for (const a of autorias) {
    const classe = classificarRequerimento(a.ementa);
    if (classe === "audiencia") qtdAudiencia += 1;
    else if (classe === "fiscalizacao") qtdFiscalizacao += 1;
  }

  const nota = calcularNota({
    saldoAutoria,
    nProposicoesAnalisadas: autorias.filter((a) => a.rotulo).length,
    coerencia: {
      valor: coerencia.fator,
      medido: coerencia.medido,
    },
    presenca: {
      valor: presenca.fator,
      medido: presenca.medido,
    },
    producaoAmpla: componenteProducaoAmpla(qtdAudiencia, qtdFiscalizacao),
  });

  const proposicoes: ProposicaoDoParlamentar[] = autorias
    .map((a) => ({
      id: a.id,
      identificacao: a.identificacao,
      ementa: a.ementa,
      data_apresentacao: a.data_apresentacao,
      rotulo: (a.rotulo as Rotulo | null) ?? null,
    }))
    .sort((x, y) => (y.data_apresentacao ?? "").localeCompare(x.data_apresentacao ?? ""));

  return {
    parlamentar: parlamentar as Parlamentar,
    presenca,
    coerencia,
    perfilAutoria,
    proposicoes,
    nota,
  };
}

export async function listarIdsDeParlamentares(): Promise<string[]> {
  return (await listarParlamentaresAtivos()).map((p) => p.id);
}

/**
 * A nota de TODOS os parlamentares, para a página-índice ordenar.
 *
 * Três consultas em lote no lugar de três por pessoa (presença, voto e
 * autoria já tinham versão individual — as de grupo vivem nas queries):
 * o próximo passo é o mesmo cálculo de `obterParlamentar`, alimentado
 * pelas mesmas funções puras (`lib/atuacao-parlamentar.ts`, `rank.ts`),
 * então index e perfil nunca divergem de régua.
 */
export interface ParlamentarNota {
  id: string;
  casa_id: string;
  nome: string;
  nome_eleitoral: string | null;
  partido: string | null;
  uf: string | null;
  url_foto: string | null;
  nota: Nota;
}

export async function listarNotasPorParlamentar(): Promise<ParlamentarNota[] | null> {
  const linhas = await listarParlamentaresComResumo();
  if (!linhas) return null;
  const ids = linhas.map((l) => l.id);

  const [autorias, presencaDeTodos,votosDeTodos] = await Promise.all([
    proposicoesDeAutores(ids),
    presencaDiasDeTodos(),
    votosRotuloDeTodos(),
  ]);

  const porId = new Map<string, { autorias: typeof autorias; presenca: typeof presencaDeTodos; votos: typeof votosDeTodos }>();
  for (const id of ids) {
    porId.set(id, { autorias: [], presenca: [], votos: [] });
  }
  for (const a of autorias) {
    porId.get(a.parlamentar_id)?.autorias.push(a);
  }
  for (const p of presencaDeTodos) {
    porId.get(p.parlamentar_id)?.presenca.push(p);
  }
  for (const v of votosDeTodos) {
    porId.get(v.parlamentar_id)?.votos.push(v);
  }

  return linhas.map((l) => {
    const base = porId.get(l.id);
    const autorias = base?.autorias ?? [];

    // Saldo ponderado — MESMO laço de `obterParlamentar` (régua única).
    let saldoAutoria = 0;
    let baseAutoria = 0;
    let qtdAudiencia = 0;
    let qtdFiscalizacao = 0;
    for (const a of autorias) {
      const r = a.rotulo as Rotulo | null;
      const w = pesoDeIdentificacao(a.identificacao);
      if (r === "garantista" || r === "garantista_forte") {
        saldoAutoria += w;
        baseAutoria += w;
      } else if (r === "reducionista" || r === "reducionista_forte") {
        saldoAutoria -= w;
        baseAutoria += w;
      }
      const classe = classificarRequerimento(a.ementa);
      if (classe === "audiencia") qtdAudiencia += 1;
      else if (classe === "fiscalizacao") qtdFiscalizacao += 1;
    }

    const presenca = calcularPresencaDias(
      (base?.presenca ?? []).map((p) => ({
        situacao_dia: p.situacao_dia,
        sessoes_total: p.sessoes_total,
        sessoes_presente: p.sessoes_presente,
      }))
    );
    const linhasVoto: LinhaVotoRotulo[] = (base?.votos ?? []).map((v) => ({
      vereador_id: l.id,
      rotulo: v.rotulo,
      voto: v.voto,
      autor_id: null,
      qtd: v.qtd,
    }));
    const coerencia = calcularCoerencia(l.id, linhasVoto, {
      saldo: saldoAutoria,
      base: baseAutoria,
    });

    const nota = calcularNota({
      saldoAutoria,
      nProposicoesAnalisadas: autorias.filter((a) => a.rotulo).length,
      coerencia: { valor: coerencia.fator, medido: coerencia.medido },
      presenca: { valor: presenca.fator, medido: presenca.medido },
      producaoAmpla: componenteProducaoAmpla(qtdAudiencia, qtdFiscalizacao),
    });

    return { ...l, nota };
  }).sort((a, b) => {
    // Quem não tem nota (dado insuficiente) vai para o fim, em ordem de nome —
    // lacuna em ordem explícita, nunca no meio da fila.
    if (a.nota.nota === null && b.nota.nota === null) {
      return (a.nome_eleitoral ?? a.nome).localeCompare(b.nome_eleitoral ?? b.nome, "pt-BR");
    }
    if (a.nota.nota === null) return 1;
    if (b.nota.nota === null) return -1;
    return b.nota.nota - a.nota.nota;
  });
}

export interface ParlamentarResumo {
  id: string;
  casa_id: string;
  nome: string;
  nome_eleitoral: string | null;
  partido: string | null;
  uf: string | null;
  url_foto: string | null;
}

/** Nome de exibição de cada casa — as 2 semeadas em `casas` (ver `0003_seed_casas.sql`). */
export const ROTULO_CASA: Record<string, string> = {
  camara: "Câmara dos Deputados",
  senado: "Senado Federal",
};

/**
 * Todo parlamentar ativo, para a página-índice. Mesma base de
 * `listarIdsDeParlamentares` — só quem tem perfil pré-renderado —, então
 * todo card daqui sempre linka para uma página `/parlamentares/[id]` que
 * existe de fato.
 */
export async function listarParlamentares(): Promise<ParlamentarResumo[] | null> {
  const linhas = await listarParlamentaresComResumo();
  if (!linhas) return null;
  return (linhas as ParlamentarResumo[]).sort((a, b) =>
    (a.nome_eleitoral ?? a.nome).localeCompare(b.nome_eleitoral ?? b.nome, "pt-BR")
  );
}
