/**
 * SERVER-ONLY: agregados do SIRENEJud (CNJ) para a frente Ambiental,
 * lidos de `etl/betim/dados/sirenejud-mg.json` via `carregarJsonEtl`.
 *
 * O que a fonte é: o recorte ambiental e georreferenciado da Base Nacional de
 * Dados do Poder Judiciário (DataJud), publicado pelo CNJ em arquivo em massa
 * (parquet no S3) — regime OPOSTO ao DataJud, cuja licença veda derivados.
 * O coletor (`etl/betim/etl/apis/sirenejud_cnj.py`) descarta nomes de partes
 * na origem: aqui só chegam contagens e tempos.
 *
 * Tolerância a arquivo ausente: devolve `null` e a página renderiza
 * "coleta ainda não rodou" — o arquivo é commitado depois da primeira
 * coleta, mas um checkout limpo não pode quebrar o build por causa dele.
 */
import { carregarJsonEtl } from "@/lib/server-only/json-etl";

export interface MunicipioSirenejud {
  /** Código IBGE real, casado por nome normalizado contra a malha do IBGE. */
  cod_ibge: string | null;
  /** Código da comarca do órgão julgador — o campo que a fonte CHAMA de cod_ibge. */
  cod_comarca_cnj: string;
  /** Grafia da fonte (CNJ) — casamento com outras bases é por cod_ibge. */
  municipio: string | null;
  total: number;
  pendentes: number;
  baixados: number;
  tempo_medio_dias: number | null;
  por_ano: Record<string, number>;
  por_tribunal: Record<string, number>;
  top_classes: [string, number][];
}

export interface SirenejudMg {
  fonte: string;
  url_fonte: string;
  arquivo_origem: string;
  arquivo_modificado_em: string;
  gerado_em: string;
  cobertura: string;
  ressalvas: string[];
  total_processos_br: number;
  total_processos_mg: number;
  anos_anomalos: number;
  municipios_com_processos: number;
  serie_anual_mg: Record<string, number>;
  por_tribunal_mg: Record<string, number>;
  top_classes_mg: [string, number][];
  top_assuntos_mg: [string, number][];
  municipios: MunicipioSirenejud[];
}

let cache: SirenejudMg | null | undefined;

export function carregarSirenejudMg(): SirenejudMg | null {
  if (cache !== undefined) return cache;
  try {
    cache = carregarJsonEtl<SirenejudMg>("sirenejud-mg.json");
  } catch {
    cache = null;
  }
  return cache;
}
