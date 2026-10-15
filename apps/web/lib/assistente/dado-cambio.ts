/**
 * Dado direto de câmbio na pergunta do chatbot — a PTAX vigente do dia.
 *
 * ═══ O QUE ISTO É ═══
 *
 * Bloco de contexto para o RAG (irmão dos blocos de repasse): quando a
 * pergunta do cidadão fala de dólar, euro, câmbio, cotação ou Banco Central,
 * injeta a cotação PTAX que o portal JÁ PUBLICA, em uma linha, com a data do
 * arquivo e a rota onde o dado vive. Pergunta sem vocabulário de câmbio →
 * `null`, e o fluxo segue sem prometer número.
 *
 * ═══ FONTE OFICIAL ═══
 *
 * PTAX do Banco Central via Olinda (`olinda.bcb.gov.br`), coletada por
 * `scripts/coletar-cambio.mts` em `data/cambio-dia.json`. O NÚMERO nunca é
 * digitado aqui: sai de `converter(..., dominio "moeda")` de
 * `lib/transformacao/unidades.ts`, que por dentro chama
 * `tabelaMoeda(cotacoes do arquivo)` — a matriz vigente do dia, com o MESMO
 * fallback gracioso de `brlVigente` quando a coleta está ausente ou inválida.
 * A data exibida é a que o arquivo declara (`data`), pela régua `dataBR`.
 *
 * ═══ DECISÕES ═══
 *
 * - O disparo é por conjunto FECHADO de palavras normalizadas sem acento
 *   (mesmo `palavrasDe` do casador de cidades), em limite de palavra: "euro"
 *   casa "euros" mas nunca "europa", que é outro assunto. A expressão "banco
 *   central" é o único casamento de duas palavras.
 * - `tabelaMoeda()` sem args devolve a base de REFERÊNCIA (dólar 5,5), não a
 *   PTAX do arquivo; por isso o caminho é `converter`, que injeta as cotações
 *   coletadas. Trocar os dois trocaria o número da resposta em produção.
 */

import cambioDia from "@/data/cambio-dia.json";
import { converter } from "@/lib/transformacao/unidades";
import { palavrasDe } from "./cidade-na-pergunta";

/** Rota do painel que publica o dado — a citação colada ao número. */
const ROTA_CAMBIO = "/estado-e-economia/orcamento";

/** Palavras (sem acento, minúsculas) que pedem cotação de moeda. */
const PALAVRAS_CAMBIO = new Set([
  "dolar",
  "dolares",
  "euro",
  "euros",
  "cambio",
  "cambios",
  "cotacao",
  "cotacoes",
  "ptax",
]);

/** Cotação em reais do dia — até 4 casas, a precisão que o BC publica. */
const FMT_COTACAO = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

/** O texto já normalizado pergunta por câmbio? */
function pedeCambio(textoNormalizado: string): boolean {
  if (textoNormalizado.includes("banco central")) return true;
  return textoNormalizado.split(" ").some((palavra) => PALAVRAS_CAMBIO.has(palavra));
}

/** Quanto vale 1 unidade da moeda em reais HOJE (arquivo, com fallback). */
function brlDaMoeda(unidade: string): number {
  return converter({ valor: 1, de: unidade, para: "real", dominio: "moeda" });
}

/**
 * Linha da PTAX vigente se a pergunta cita dólar/euro/câmbio/cotação/Banco
 * Central; `null` caso contrário. Não lança, não inventa número.
 *
 * @param pergunta texto já sanitizado do cidadão.
 * @returns bloco de uma linha, ou `null`.
 */
export function blocoCambioSePedir(pergunta: string): string | null {
  if (!pedeCambio(palavrasDe(pergunta))) return null;
  const data = cambioDia.data.slice(0, 10).split("-").reverse().join("/");
  return (
    `Cotação PTAX de ${data}: 1 dólar = R$ ${FMT_COTACAO.format(brlDaMoeda("dolar"))}; ` +
    `1 euro = R$ ${FMT_COTACAO.format(brlDaMoeda("euro"))} (fonte: ${ROTA_CAMBIO})`
  );
}
