/**
 * Execução dos projetos de TAC ambiental de Minas Gerais, ano a ano, por
 * mineradora e por órgão. ARQUIVO GERADO — não editar à mão.
 *
 * Gerado por `scripts/coletar-tac-projetos.mts` a partir da captura do painel
 * Power BI (fora do repo). Para regenerar, ver o cabeçalho daquele script — ele
 * documenta o formato DSR e as três compressões que enganam quem lê direto.
 *
 * ═══ COMO NÃO MENTIR COM ESTES NÚMEROS ═══
 *
 * O plano vai até 2029; a fonte só reporta execução até
 * **2025**. Por isso existem DOIS percentuais aqui, e nenhum
 * deles é "o" percentual:
 *
 * · `percentualDoPlanoInteiro` (40.8%) — executado ÷ previsto 2022–2029.
 *   Parece atraso, mas compara o feito com um plano que ainda tem anos pela frente.
 * · `percentualDaJanelaDecorrida` (64.7%) — executado ÷ previsto até 2025.
 *   É a comparação justa, e é a que deve encabeçar qualquer texto.
 *
 * Nos anos posteriores a 2025, `executado: 0` significa
 * **"ainda não reportado"**, não "nada foi feito". Escrever a segunda coisa
 * seria afirmar o que o dado não diz.
 *
 * `relato` é texto DA FONTE, transcrito sem edição — não é obra deste portal.
 */

export interface LinhaTacAmbiental {
  projeto: string;
  mineradora: string;
  /** Órgão ou instituição responsável pela execução (SUTAF, IEF, URAS…). */
  orgao: string;
  ano: number;
  status: string;
  /** Em reais. `null` = a fonte não informa (diferente de zero). */
  previsto: number | null;
  executado: number | null;
  /** Texto da fonte sobre a situação, quando há. */
  relato: string | null;
}

/** Uma linha por projeto × mineradora × ano. */

/**
 * Contagens e totais medidos do array acima — importe ISTO em página de
 * servidor, nunca o array (regra de payload: ver docs/ARQUITETURA.md).
 */
export const COBERTURA_TAC_PROJETOS = {
  linhas: 848,
  projetos: 80,
  combinacoesProjetoMineradora: 106,
  mineradoras: 15,
  orgaos: 9,
  anoInicial: 2022,
  anoFinal: 2029,
  /** Último ano em que a fonte reporta execução — a janela honesta termina aqui. */
  ultimoAnoComExecucao: 2025,
  previstoTotal: 307120704.20228565,
  executadoTotal: 125304594.47000003,
  previstoAteUltimoAnoComExecucao: 193583925.9922857,
  percentualDoPlanoInteiro: 40.8,
  percentualDaJanelaDecorrida: 64.7,
} as const;

/** Série ano a ano — é o que permite mostrar o plano sem achatar o tempo. */

/** Quem prometeu quanto. Ordenado por previsto, do maior para o menor. */

/** Projetos distintos em cada situação declarada pela fonte. */

export interface ContratoTacAmbiental {
  projeto: string;
  mineradora: string;
  orgao: string;
  status: string;
  /** Soma de todos os anos, em reais. */
  previsto: number;
  executado: number;
  /** Primeiro e último ano COM valor previsto — a janela real do contrato. */
  anoInicial: number | null;
  anoFinal: number | null;
  /** Relato mais recente da fonte sobre este contrato, quando há. */
  relato: string | null;
}

/**
 * A unidade de leitura da tela: um contrato por linha (projeto × mineradora),
 * 106 no total — contra 848 células ano-a-ano. É este que a
 * página de servidor importa; `TAC_PROJETOS` só faz sentido para quem for
 * montar série temporal, e pesa o suficiente para nunca entrar numa página de
 * servidor (ver a regra de payload em docs/ARQUITETURA.md).
 */


/**
 * TAC_POR_PROJETO saiu daqui em 2026-08-25 (teto de 3 MiB gzip do Worker,
 * erro 10027): virou etl/betim/dados/tac-projetos-bundle.json, lido por
 * tac-projetos-dados.ts (server-only) e asset public/data/tac-projetos.json
 * para o cliente (PainelTac.tsx).
 */
