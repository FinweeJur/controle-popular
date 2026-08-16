import { listarParlamentaresAtivos, listarParlamentaresComResumo, obterParlamentarPorId, presencaDiasDoParlamentar, proposicoesDeAutores, votosPorRotuloDoParlamentar } from "@/lib/db/queries/congresso";
import { agregar, type PerfilAgregado } from "@/lib/congresso/agregado";
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
 * ⚠ NÃO HÁ PONTUAÇÃO NUMÉRICA AQUI, diferente do ranking de vereadores.
 * `PESO_PROPOSICAO` (Cidades) é calibrado sobre os tipos de proposição
 * municipal (Projeto de Lei/Requerimento/Indicação); o Congresso tem outra
 * hierarquia (PL/PEC/MPV/Requerimento, com regimes de tramitação distintos)
 * que inventar um peso agora, sem calibrar contra o que a Câmara federal
 * realmente produz, seria estimar no escuro. O que existe hoje é
 * comparável entre os dois eixos porque usa a MESMA função
 * (`lib/atuacao-parlamentar.ts`): presença e coerência.
 *
 * ⚠ NÃO HÁ GASTO DE VERBA DE GABINETE (CEAP) — este portal não coleta a
 * Cota para Exercício da Atividade Parlamentar. Fora do escopo desta
 * coleta; ao contrário de presença e voto, que já tinham fonte verificada,
 * CEAP exigiria um ETL novo.
 */
export async function obterParlamentar(id: string): Promise<{
  parlamentar: Parlamentar;
  presenca: PresencaDias;
  coerencia: Coerencia;
  perfilAutoria: PerfilAgregado;
  proposicoes: ProposicaoDoParlamentar[];
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
  // com direção de direitos a pessoa protocolou, e para que lado. É o que
  // permite `calcularCoerencia` detectar "vota contra o que propõe".
  let saldoAutoria = 0;
  let baseAutoria = 0;
  for (const a of autorias) {
    const r = a.rotulo as Rotulo | null;
    if (r === "garantista" || r === "garantista_forte") {
      saldoAutoria += 1;
      baseAutoria += 1;
    } else if (r === "reducionista" || r === "reducionista_forte") {
      saldoAutoria -= 1;
      baseAutoria += 1;
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
  };
}

export async function listarIdsDeParlamentares(): Promise<string[]> {
  return (await listarParlamentaresAtivos()).map((p) => p.id);
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
