/**
 * @file Acervo de jurisprudência com as ementas completas aplicadas.
 *
 * POR QUE ESTE MÓDULO EXISTE
 *
 * O acervo bruto (`data/jurisprudencia-casos.json`) guarda 4.971 ementas
 * recortadas pela fonte oficial em ~500 caracteres. A coleta de recuperação
 * (`scripts/completar-ementas-tjmg.mts`) baixou o acórdão em PDF dos 86 casos
 * que tinham link e gravou o texto integral em `data/ementas-completas.json`.
 *
 * O conserto NÃO é aplicado dentro do JSON bruto por dois motivos:
 *
 * 1. o arquivo tem 58 MB em uma linha; reescrevê-lo a cada recuperação
 *    produz um diff ilegível e arriscado;
 * 2. a rotina que atualiza o acervo sobrescreve o arquivo inteiro — o texto
 *    recuperado se perderia no dia seguinte.
 *
 * Separar as duas camadas deixa o dado recuperado auditável: cada entrada
 * guarda a URL do acórdão e a data da coleta. Quem importa o acervo deve usar
 * este módulo, não o JSON bruto.
 */
import bruto from "@/data/jurisprudencia-casos.json";
import completas from "@/data/ementas-completas.json";
import type { CasoJurisprudencia } from "./jurisprudencia";

interface ArquivoBruto {
  geradoEm: string;
  total: number;
  casos: CasoJurisprudencia[];
}

interface EmentaCompleta {
  ementa: string;
  fonte: string;
  coletado_em: string;
}

const COMPLETAS = completas as Record<string, EmentaCompleta>;
const ARQUIVO = bruto as ArquivoBruto;

/**
 * O acervo com a melhor ementa disponível por processo.
 *
 * A troca só acontece quando o texto recuperado é MAIOR que o atual: assim uma
 * coleta parcial ou um PDF sem ementa não encurta o que já estava na tela.
 */
export const ACERVO_JURISPRUDENCIA = {
  ...ARQUIVO,
  casos: ARQUIVO.casos.map((caso) => {
    const completa = COMPLETAS[caso.processo];
    if (!completa || completa.ementa.length <= caso.ementa.length) return caso;
    return { ...caso, ementa: completa.ementa };
  }),
};
