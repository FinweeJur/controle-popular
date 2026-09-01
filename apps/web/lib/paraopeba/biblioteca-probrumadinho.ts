import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  type ItemBiblioteca,
  type FonteBiblioteca,
  ehItemBloqueadoPelaTriagem,
} from "./biblioteca";

/**
 * Acervo oficial do portal Pró-Brumadinho (Governo de Minas Gerais):
 * legislação, deliberações, termos, prestações de contas, artigos acadêmicos
 * e relatórios ambientais publicados em mg.gov.br/pro-brumadinho.
 *
 * ═══ NÃO CONFUNDIR COM `biblioteca.ts` ═══
 *
 * `biblioteca.ts` é o que as **Assessorias Técnicas Independentes** (ATIs)
 * publicaram para as pessoas atingidas. Isto aqui é o que o **Governo de MG**
 * e os órgãos compromitentes do Acordo publicaram como atos oficiais de
 * governança, prestação de contas e reparação. Autoria, finalidade e risco
 * são diferentes — por isso vivem em módulos separados e na tela aparecem
 * em seções distintas.
 *
 * ═══ METADADO E LINK, NUNCA O ARQUIVO ═══
 *
 * Cada item guarda título, data, tipo, órgão, tags temáticas, a URL oficial
 * no portal mg.gov.br e, quando disponível, um micro-resumo gerado por IA
 * (rotulado como tal, com data). Nenhum PDF é hospedado nem copiado.
 *
 * ═══ RESUMOS GERADOS POR MODELO ═══
 *
 * Diferente do acervo das ATIs (que não tem resumo porque a fonte não
 * publica), este acervo pode ter resumos gerados por modelo de IA a partir
 * do texto extraído dos PDFs oficiais. Todo resumo com `resumo_origem ===
 * "modelo"` é afirmação do portal e deve ser rotulado na tela como gerado
 * por máquina (AGENTS.md, regra editorial).
 *
 * ═══ TRIAGEM ═══
 *
 * A mesma `ehItemBloqueadoPelaTriagem` de `biblioteca.ts` roda na leitura.
 */

interface BibliotecaProBrumadinho {
  gerado_em: string;
  fontes: FonteBiblioteca[];
  ficou_de_fora: string;
  itens: ItemBiblioteca[];
}

const VAZIO: BibliotecaProBrumadinho = {
  gerado_em: "",
  fontes: [],
  ficou_de_fora: "",
  itens: [],
};

const ARQUIVO = "biblioteca-pro-brumadinho.json";

interface Lido {
  dados: BibliotecaProBrumadinho;
  barrados: ItemBiblioteca[];
}

let lido: Lido | undefined;
let emVoo: Promise<Lido> | null = null;

async function ler(): Promise<Lido> {
  if (lido) return lido;
  if (emVoo) return emVoo;
  emVoo = (async () => {
    let bruto: BibliotecaProBrumadinho;
    try {
      let texto: string;
      try {
        const { env } = await getCloudflareContext({ async: true });
        if (!env.ASSETS) throw new Error("sem ASSETS");
        const resp = await env.ASSETS.fetch(
          new URL(`http://assets.local/data/${ARQUIVO}`)
        );
        if (!resp.ok) throw new Error(`ASSETS.fetch devolveu ${resp.status}`);
        texto = await resp.text();
      } catch {
        let caminho: string;
        try {
          const esteArquivo = fileURLToPath(import.meta.url);
          caminho = path.resolve(
            path.dirname(esteArquivo),
            "..",
            "..",
            "..",
            "public",
            "data",
            ARQUIVO
          );
          texto = readFileSync(caminho, "utf-8");
        } catch {
          caminho = path.resolve(process.cwd(), "public", "data", ARQUIVO);
          texto = readFileSync(caminho, "utf-8");
        }
      }
      bruto = JSON.parse(texto) as BibliotecaProBrumadinho;
    } catch {
      const vazio: Lido = { dados: VAZIO, barrados: [] };
      lido = vazio;
      return vazio;
    }

    const barrados = bruto.itens.filter(ehItemBloqueadoPelaTriagem);
    const publicaveis = bruto.itens.filter(
      (i) => !ehItemBloqueadoPelaTriagem(i)
    );
    const resultado: Lido = {
      dados: { ...bruto, itens: publicaveis },
      barrados,
    };
    lido = resultado;
    return resultado;
  })();
  return emVoo;
}

/** Acervo oficial já triado. */
export async function bibliotecaProBrumadinho(): Promise<ItemBiblioteca[]> {
  return (await ler()).dados.itens;
}

export async function fontesProBrumadinho(): Promise<FonteBiblioteca[]> {
  return (await ler()).dados.fontes;
}

/**
 * Números medidos do que foi de fato publicado, nunca digitados.
 */
export async function coberturaProBrumadinho(): Promise<{
  geradoEm: string;
  publicados: number;
  barradosPelaTriagem: number;
  ficouDeFora: string;
  periodo: { de: string; ate: string };
  comResumo: number;
}> {
  const { dados, barrados } = await ler();
  const itens = dados.itens;
  const datas = itens
    .map((i) => i.data)
    .filter((d): d is string => Boolean(d))
    .sort();
  const comResumo = itens.filter(
    (i) => i.resumo && i.resumo.trim().length > 0
  ).length;
  return {
    geradoEm: dados.gerado_em,
    publicados: itens.length,
    barradosPelaTriagem: barrados.length,
    ficouDeFora: dados.ficou_de_fora,
    periodo: { de: datas[0] ?? "", ate: datas[datas.length - 1] ?? "" },
    comResumo,
  };
}
