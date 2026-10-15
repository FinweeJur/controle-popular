/**
 * Dado direto do Acordo de Brumadinho na pergunta do chatbot — o repasse que
 * o município citado RECEBEU, em valores medidos.
 *
 * ═══ O QUE ISTO É ═══
 *
 * Bloco de contexto para o RAG (irmão do bloco ComunicaBR de `acervo.ts`):
 * se a pergunta cita uma das 853 cidades de MG que estão no arquivo do
 * repasse, devolve a linha com o valor do rateio (Lei 23.830/2021) mais os
 * complementares das Resoluções SEGOV, com o corte temporal da própria fonte
 * e o painel onde conferir. Sem cidade citada, cidade fora dos 853 ou cidade
 * sem valor medido, devolve `null` — "sem dado, nenhuma promessa" (AGENTS §7).
 *
 * ═══ FONTE OFICIAL ═══
 *
 * `public/data/repasse-brumadinho-mg.json` — Pró-Brumadinho (Governo de MG),
 * página "reparação-brumadinho-repasses-aos-853-municipios-de-mg", coletada
 * por `scripts/coletar-repasse-brumadinho-mg.mts`. A leitura e o casamento
 * de nome são TODOS do módulo `lib/brumadinho/repasse.ts`
 * (`arquivoRepasse`, `repasseDoMunicipio`, `TABELAS`) — este arquivo não
 * reimplementa parsing nem casa cidade por conta própria (regra AGENTS §8:
 * o número vem do dado, pelo mesmo caminho da tela).
 *
 * ═══ DECISÕES ═══
 *
 * - Os municípios do próprio arquivo têm o nome do IBGE, então a lista
 *   citável sai mapeando `{ibge7 → codigo, nome}`; o valor é buscado por
 *   `repasseDoMunicipio()` com o código de 7 dígitos (a função LANÇA em 6
 *   dígitos — armadilha 2 de `repasse.ts` — e quem chama trata com catch,
 *   nunca aqui).
 * - Rateio e complementares aparecem SEPARADOS na linha: somar tudo sem
 *   dizer isso inventaria um repasse único que nunca existiu (aviso de
 *   `TABELAS` em `repasse.ts`).
 * - Centavos viram texto com aritmética inteira (`(c - c%100)/100`); dividir
 *   por 100 em float pode trocar o dígito formatado.
 */

import {
  arquivoRepasse,
  repasseDoMunicipio,
  TABELAS,
  type ArquivoRepasse,
  type RepasseMunicipio,
} from "@/lib/brumadinho/repasse";
import { municipioMaisLongoCitado, type CidadeCitavel } from "./cidade-na-pergunta";

/** Painel da execução do Acordo — a citação colada ao número. */
const ROTA_PAINEL = "/paraopeba/execucao";

/** Inteiro em reais com separador de milhar pt-BR (casos decimais à parte). */
const FMT_GRUPO = new Intl.NumberFormat("pt-BR");

/** Centavos → "R$ 2.500.000,00" — soma em inteiro, nunca em float. */
function reais(centavos: number): string {
  const cent = centavos % 100;
  return `R$ ${FMT_GRUPO.format((centavos - cent) / 100)},${String(cent).padStart(2, "0")}`;
}

/** `AAAA-MM-DD` → `DD/MM/AAAA` — mesma régua de `dataBR` do `acervo.ts`,
 *  copiada porque acervo importa este módulo (import circular não). */
function dataBR(iso: string): string {
  return iso.slice(0, 10).split("-").reverse().join("/");
}

/**
 * Cidades legíveis da pergunta, a partir dos nomes do IBGE gravados no
 * próprio arquivo do repasse.
 * ponytail: reconstrói a lista de 853 por chamada; o JSON já vem em cache e
 * o custo é marginal — cache daqui se o perfil de pedidos crescer.
 */
function cidadesLeveis(arq: ArquivoRepasse): CidadeCitavel[] {
  return arq.municipios.map((m) => ({ codigo: m.ibge7, nome: m.nome }));
}

/**
 * A linha do bloco — rateio e complementares ANUNCIADOS SEPARADOS, cada um
 * com sua base legal. `null` se a cidade não tem nenhum valor medido.
 */
function textoDoRepasse(r: RepasseMunicipio, ate: string): string | null {
  const partes: string[] = [];
  if (r.rateio) partes.push(`${reais(r.rateio.centavos)} (rateio ${TABELAS.rateio.baseLegal})`);
  const complementares = r.complementares.reduce((soma, c) => soma + c.centavos, 0);
  if (complementares > 0) partes.push(`${reais(complementares)} complementares`);
  if (partes.length === 0) return null;
  return (
    `${r.nome}/MG — repasse do Acordo de Reparação de Brumadinho: ` +
    `${partes.join(" + ")}, dados até ${ate}. Painel: ${ROTA_PAINEL}`
  );
}

/**
 * Se a pergunta cita uma cidade com repasse medido do Acordo de Brumadinho,
 * devolve a linha com os valores reais; senão `null` (fora dos 853, sem
 * valor, ou erro de leitura — o chamador trata, esta função não lança em
 * fluxo normal, e `repasseDoMunicipio` só lança em código malformado, o que
 * vira `null` pelo catch do compositor).
 *
 * @param pergunta texto já sanitizado do cidadão.
 * @returns bloco de uma linha, ou `null`.
 */
export async function blocoRepasseBrumadinho(pergunta: string): Promise<string | null> {
  const arq = await arquivoRepasse();
  if (!arq) return null;
  const achada = municipioMaisLongoCitado({ cidades: cidadesLeveis(arq), pergunta });
  if (!achada) return null;
  const r = await repasseDoMunicipio(achada.codigo);
  if (!r || r.centavos <= 0) return null;
  return textoDoRepasse(r, dataBR(arq.atualizado_na_fonte));
}
