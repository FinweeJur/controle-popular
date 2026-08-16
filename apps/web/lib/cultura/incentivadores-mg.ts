import { readFileSync } from "node:fs";
import path from "node:path";
import type { IncentivadorChaveavel } from "@/lib/cultura/juncao-fornecedor";

/**
 * Leitura de `data/rouanet-mg-incentivadores.json` — os incentivadores da Lei
 * Rouanet com endereço em MG, coletados do SALIC em 15/08/2026.
 *
 * Roda no BUILD, como `lib/brumadinho/repasse.ts`: o arquivo tem 1,4 MB e
 * 20.784 registros, e nada disso pode atravessar a fronteira do cliente. Foi
 * coleção como prop de componente de cliente que levou uma rota a 35,5 MiB
 * contra o teto de 25 MiB deste projeto.
 *
 * ═══ O FORMATO É COMPACTADO, E O DICIONÁRIO NÃO É DETALHE ═══
 *
 * `esqueleto` é a ordem das colunas; `linhas` são arrays posicionais; e quatro
 * colunas (`municipio`, `UF`, `responsavel`, `tipo_pessoa`) guardam um ÍNDICE
 * para o vetor correspondente em `dicionarios`, não o valor. Ler `linha[1]` e
 * exibir daria "7" no lugar de "Belo Horizonte". O expansor abaixo consulta o
 * dicionário pelo NOME da coluna, então acrescentar coluna nova ao coletor não
 * quebra a leitura em silêncio.
 *
 * ═══ `cgccpf` É STRING, E TEM DE CONTINUAR SENDO ═══
 *
 * `"00000000108634"` vira `108634` em qualquer passagem por `Number` — o zero
 * à esquerda some e a junção com `fornecedores.cnpj` falha CALADA, sem erro
 * nenhum. `JSON.parse` preserva a string; o resto do caminho também tem de
 * preservar. Ver `normalizarCnpjChave`.
 */

interface ArquivoIncentivadores {
  fonte: string;
  coletado_em: string;
  observacao_total_doado: string;
  esqueleto: string[];
  dicionarios: Record<string, string[]>;
  linhas: Array<Array<string | number>>;
}

export interface AcervoIncentivadores {
  fonte: string;
  coletado_em: string;
  /** A ressalva da própria fonte sobre `total_doado`. Vem do arquivo, não daqui. */
  observacao_total_doado: string;
  incentivadores: IncentivadorChaveavel[];
}

let cache: AcervoIncentivadores | null | undefined;

/**
 * O acervo inteiro, expandido. `null` quando o arquivo não foi coletado.
 *
 * `null` e não exceção: arquivo de dado ausente não derruba o build — mesma
 * regra de `arquivoRepasse()` e de `lib/clima/risco.ts`. Quem chama trata a
 * ausência como "fonte não publicada nesta build", nunca como lista vazia.
 */
export function acervoIncentivadoresMg(raiz = process.cwd()): AcervoIncentivadores | null {
  if (cache !== undefined) return cache;
  try {
    const bruto = JSON.parse(
      readFileSync(path.join(raiz, "data", "rouanet-mg-incentivadores.json"), "utf-8")
    ) as ArquivoIncentivadores;
    cache = {
      fonte: bruto.fonte,
      coletado_em: bruto.coletado_em,
      observacao_total_doado: bruto.observacao_total_doado,
      incentivadores: bruto.linhas.map((linha) => expandirLinha(linha, bruto)),
    };
  } catch {
    cache = null;
  }
  return cache;
}

/** Uma linha posicional vira registro, resolvendo os índices de dicionário. */
function expandirLinha(
  linha: Array<string | number>,
  arquivo: ArquivoIncentivadores
): IncentivadorChaveavel {
  const registro: Record<string, unknown> = {};
  arquivo.esqueleto.forEach((coluna, i) => {
    const dicionario = arquivo.dicionarios[coluna];
    const valor = linha[i];
    if (dicionario) {
      // Índice fora do vetor é corrupção do arquivo, não valor: string vazia
      // aqui viraria uma cidade fantasma no ranking por município.
      const rotulo = dicionario[Number(valor)];
      if (rotulo === undefined) {
        throw new Error(
          `ABORTADO: coluna "${coluna}" com índice ${valor} fora do dicionário ` +
            `(${dicionario.length} entradas) — o arquivo e o coletor divergiram.`
        );
      }
      registro[coluna] = rotulo;
    } else {
      registro[coluna] = valor;
    }
  });
  return {
    // `String()` sem `Number` em lugar nenhum: ver o cabeçalho.
    nome: String(registro.nome ?? ""),
    municipio: String(registro.municipio ?? ""),
    UF: String(registro.UF ?? ""),
    total_doado: Number(registro.total_doado) || 0,
    tipo_pessoa: String(registro.tipo_pessoa ?? ""),
    cgccpf: String(registro.cgccpf ?? ""),
  };
}

/** Só para teste: descarta o memo entre casos que leem raízes diferentes. */
export function _limparCacheParaTeste(): void {
  cache = undefined;
}
