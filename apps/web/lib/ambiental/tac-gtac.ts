/**
 * Termos de Ajustamento de Conduta ambientais de Minas Gerais, do sistema GTAC
 * (Ecossistemas/SEMAD). ARQUIVO GERADO �?" não editar à mão.
 *
 * Gerado por `scripts/coletar-tac-gtac-mg.mts`. O cabeçalho daquele script
 * documenta como se chega no dado (a API responde 403 com mensagem enganosa
 * até receber `Referer`/`Origin`) e por que não se pagina (a API ignora
 * `page` e devolve o cadastro inteiro).
 *
 * �.��.��.� DADO PESSOAL �.��.��.�
 *
 * 355 dos 2002 registros trazem CPF de pessoa física no campo de documento da
 * fonte. **Eles não estão aqui**: são redigidos no coletor, antes de tocar o
 * disco. Ficam os 1647 CNPJ, que identificam a empresa signatária. O
 * servidor que cadastrou cada registro (nome e CPF na API) também não entra.
 *
 * O nome do empreendimento fica, inclusive quando é nome de pessoa: ela é parte
 * de um acordo ambiental público.
 */

export interface TacAmbientalGtac {
  id: number;
  empreendimento: string;
  /** CNPJ da signatária. `null` quando a fonte traz CPF �?" redigido na origem. */
  cnpj: string | null;
  municipio: string;
  unidade: string;
  atividade: string;
  modalidade: string;
  fase: string;
  situacao: string;
  classe: string;
  assinatura: string | null;
  inicioVigencia: string | null;
  vencimento: string | null;
  /** Em meses, como a fonte grava. */
  prazoMeses: number | null;
  renovacao: boolean;
  aditivo: boolean;
}
import { carregarJsonEtl } from "@/lib/server-only/json-etl";

interface DadoTacGtacBundle {
  TACS_GTAC: TacAmbientalGtac[];
  COBERTURA_TAC_GTAC: {
    tacs: number;
    comCnpj: number;
    cpfRedigidos: number;
    municipios: number;
    unidades: number;
    anoInicial: number;
    anoFinal: number;
    comVencimentoPassado: number;
    vigentes: number;
    vigentesComVencimentoPassado: number;
    semDataDeVencimento: number;
    coletadoEm: string;
  };
  TAC_GTAC_POR_SITUACAO: { chave: string; tacs: number }[];
  TAC_GTAC_POR_FASE: { chave: string; tacs: number }[];
  TAC_GTAC_POR_UNIDADE: { chave: string; tacs: number }[];
  TAC_GTAC_POR_MUNICIPIO: { chave: string; tacs: number }[];
  TAC_GTAC_POR_ANO: { ano: number; tacs: number }[];
}

const D = carregarJsonEtl<DadoTacGtacBundle>("tac-gtac-bundle.json");

/** Os 2002 TACs do GTAC �?" agora lidos do disco no prerender, não embutidos
 *  no bundle do Worker (teto de 3 MiB gzip, erro 10027 em 2026-08-24). */
export const TACS_GTAC: TacAmbientalGtac[] = D.TACS_GTAC;

export const COBERTURA_TAC_GTAC = D.COBERTURA_TAC_GTAC;

export const TAC_GTAC_POR_SITUACAO = D.TAC_GTAC_POR_SITUACAO;

export const TAC_GTAC_POR_FASE = D.TAC_GTAC_POR_FASE;

export const TAC_GTAC_POR_UNIDADE = D.TAC_GTAC_POR_UNIDADE;

export const TAC_GTAC_POR_MUNICIPIO = D.TAC_GTAC_POR_MUNICIPIO;

export const TAC_GTAC_POR_ANO = D.TAC_GTAC_POR_ANO;
