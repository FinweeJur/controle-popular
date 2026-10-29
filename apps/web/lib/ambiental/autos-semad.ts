/**
 * apps/web/lib/ambiental/autos-semad.ts
 *
 * Autos de infração ambiental do Estado de Minas Gerais — visão estadual.
 *
 * ⚠️ PAPEL NO PORTAL CÍVICO
 * Este módulo publica o AGREGADO dos autos de infração lavrados pela SEMAD e
 * pelo IEF (Instituto Estadual de Florestas), extraído da aba "Autos de
 * Infração" do Painel de Indicadores do Sisema (Power BI público, sem login).
 * Ele responde "quantos autos, de qual órgão, em que situação e em que ano" —
 * nunca "quem foi autuado".
 *
 * ⚠️ O QUE ESTE DADO NÃO É
 * Auto lavrado não é dano ambiental provado nem multa paga: o processo pode
 * ser anulado no julgamento. Por isso a situação do auto viaja junto de toda
 * contagem. O valor da multa NÃO está neste arquivo — o agregado da coleta
 * guarda contagem, não cifra.
 *
 * ⚠️ PRIVACIDADE (AGENTS § 5.2)
 * A entidade coletada (`Autos_Infracao_Completa`) não traz nome, CPF/CNPJ nem
 * RG. A entidade de 74 colunas (`Autos_Infracao`), que traria o titular, é
 * proibida no coletor. Nenhum nome de pessoa entra neste módulo.
 *
 * ⚠️ FONTE E RECORTES
 * O arquivo `data/sisema-autos-infracao.json` é escrito pelo coletor
 * `etl/betim/etl/apis/sisema_autos_infracao.py` (medição de 30/09/2026:
 * 583.644 autos em 1.606 municípios). O detalhe por município do portal usa
 * OUTRA fonte, o CAP da SEMAD (`/consulta-ai`); os dois recortes vêm de
 * sistemas diferentes e não devem ser somados.
 *
 * Funções PURAS sobre o JSON já carregado: rodam no build e no Worker, sem
 * `fs`. Molde: `lib/ambiental/estudos.ts` e `car.ts`.
 */

import bruto from "../../data/sisema-autos-infracao.json";

export interface ContagemRotulo {
  rotulo: string;
  total: number;
}

export interface MunicipioComAutos {
  municipio: string;
  total: number;
  orgaos: ContagemRotulo[];
}

export interface ResumoAutosSemad {
  total: number;
  coletadoEm: string | null;
  fonte: string;
  municipiosDistintos: number;
  orgaos: ContagemRotulo[];
  situacoes: ContagemRotulo[];
  /** Série cronológica, sem os grupos "(sem data)" e "(data fora de faixa)". */
  anos: Array<{ ano: number; total: number }>;
  semData: number;
  foraDeFaixa: number;
  topMunicipios: MunicipioComAutos[];
}

interface DadosBrutos {
  fonte: string;
  fonte_nome: string;
  coletado_em: string | null;
  total: number;
  cobertura: {
    municipios_distintos: number;
    registros_sem_data: number;
    registros_data_fora_de_faixa: number;
  };
  por_orgao: Record<string, number>;
  por_situacao: Record<string, number>;
  por_ano: Record<string, number>;
  por_municipio: Array<{
    municipio: string;
    total: number;
    por_orgao: Record<string, number>;
  }>;
}

const DADOS = bruto as unknown as DadosBrutos;

/** Rótulos legíveis das siglas que aparecem na coluna "Órgão Coordenador". */
export const NOME_ORGAO: Record<string, string> = {
  SEMAD: "Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável (SEMAD)",
  IEF: "Instituto Estadual de Florestas (IEF)",
};

function contagens(registro: Record<string, number>): ContagemRotulo[] {
  return Object.entries(registro)
    .map(([rotulo, total]) => ({ rotulo, total }))
    .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, "pt-BR"));
}

/** Soma das contagens — usada pelo teste de consistência do arquivo. */
export function somarContagens(itens: ContagemRotulo[]): number {
  return itens.reduce((soma, item) => soma + item.total, 0);
}

/**
 * Monta o resumo publicado pela página. `limiteMunicipios` corta só a lista de
 * ranking; o total do estado continua sendo o do arquivo inteiro.
 */
export function resumoAutosSemad(limiteMunicipios = 15): ResumoAutosSemad {
  const anos: Array<{ ano: number; total: number }> = [];
  for (const [chave, total] of Object.entries(DADOS.por_ano)) {
    if (!/^\d{4}$/.test(chave)) continue;
    anos.push({ ano: Number(chave), total });
  }
  anos.sort((a, b) => a.ano - b.ano);

  const topMunicipios = DADOS.por_municipio
    .map((m) => ({
      municipio: m.municipio,
      total: m.total,
      orgaos: contagens(m.por_orgao ?? {}),
    }))
    .sort((a, b) => b.total - a.total || a.municipio.localeCompare(b.municipio, "pt-BR"))
    .slice(0, Math.max(0, limiteMunicipios));

  return {
    total: DADOS.total,
    coletadoEm: DADOS.coletado_em ?? null,
    fonte: DADOS.fonte_nome,
    municipiosDistintos: DADOS.cobertura.municipios_distintos,
    orgaos: contagens(DADOS.por_orgao),
    situacoes: contagens(DADOS.por_situacao),
    anos,
    semData: DADOS.cobertura.registros_sem_data,
    foraDeFaixa: DADOS.cobertura.registros_data_fora_de_faixa,
    topMunicipios,
  };
}

/** Total publicado, sem montar o resumo inteiro (usado no bloco da home). */
export const TOTAL_AUTOS_SEMAD = DADOS.total;

/** Data da coleta que gerou o arquivo versionado. */
export const COLETADO_EM_AUTOS_SEMAD = DADOS.coletado_em ?? null;

/** Percentual com uma casa, sem inventar precisão. */
export function percentual(parte: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((parte / total) * 1000) / 10;
}
