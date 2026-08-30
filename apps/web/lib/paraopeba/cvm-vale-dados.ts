/**
 * SERVER-ONLY: documentos da Vale protocolados na CVM (ITR/DFP/FRE), lidos de
 * `apps/web/data/cvm-vale.json` — o arquivo que o coletor
 * `etl/betim/etl/apis/cvm_ciaberta.py` grava a cada rodada.
 *
 * O que a fonte é: dados abertos da CVM (CIA_ABERTA). O coletor baixa o
 * cadastro de companhias, acha o código CVM da Vale pelo CNPJ e filtra os
 * zips anuais de ITR/DFP/FRE; cada registro publicado é a versão mais recente
 * de um período (trimestre para ITR, ano para DFP/FRE), com o link direto ao
 * documento protocolado e o link do arquivo em massa de origem.
 *
 * Tolerância a arquivo ausente: devolve `null` e a página renderiza "coleta
 * ainda não rodou" — o arquivo é versionado depois da primeira coleta, mas um
 * checkout limpo não pode quebrar o build por causa dele (mesma regra do
 * radar em `lib/paraopeba/radar.ts` e do SIRENEJud em
 * `lib/ambiental/sirenejud-dados.ts`).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

export interface DocumentoCvmVale {
  ano: number;
  tipo: "ITR" | "DFP" | "FRE";
  /** ITR: "1T2025"; DFP/FRE: a data de referência ISO do formulário. */
  periodo: string;
  /** Fim do período a que o documento se refere (ISO). */
  data_referencia: string | null;
  /** Data em que a CVM recebeu a protocolação (ISO). */
  data_recebimento: string | null;
  versao: number;
  id_doc: number;
  /** URL do zip anual em massa — o arquivo fonte de onde o registro saiu. */
  link: string;
  /** Link direto ao documento protocolado (rad.cvm.gov.br). */
  link_documento: string | null;
}

export interface CvmVale {
  fonte: string;
  url_fonte: string;
  companhia: string;
  codigo_cvm: number;
  cnpj: string;
  ultima_atualizacao: string;
  gerado_em: string;
  anos_cobertos: string | null;
  periodo_anos: number[];
  total_documentos: number;
  por_tipo: Record<string, number>;
  /** Quantas linhas de protocolação (incluindo republicações) a fonte tem. */
  versoes_totais_na_fonte: number;
  ressalvas: string[];
  falhas: string[];
  documentos: DocumentoCvmVale[];
}

let cache: CvmVale | null | undefined;

export function carregarCvmVale(): CvmVale | null {
  if (cache !== undefined) return cache;
  try {
    const caminho = path.join(process.cwd(), "data", "cvm-vale.json");
    cache = JSON.parse(readFileSync(caminho, "utf-8")) as CvmVale;
  } catch {
    cache = null;
  }
  return cache;
}
