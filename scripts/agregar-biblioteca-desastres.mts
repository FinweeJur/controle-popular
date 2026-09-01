/**
 * agregar-biblioteca-desastres.mts — funde as fontes da biblioteca unificada
 * dos desastres de Mariana e Brumadinho num único asset + constantes.
 *
 * Grava:
 * - `apps/web/public/data/biblioteca-desastres.json` — o acervo que o cliente
 *   busca por fetch (padrão `PainelTac`). Lido só depois da triagem.
 * - `apps/web/lib/ambiental/desastres-cobertura.ts` — constantes medidas que a
 *   página de SERVIDOR importa (cartões, gráfico), nunca o array.
 *
 * Rodar:  npx tsx scripts/agregar-biblioteca-desastres.mts [--seco]
 *
 * ═══ O QUE ENTRA, E DE ONDE ═══
 *
 * 1. `apps/web/public/data/biblioteca-ati.json` — acervo das Assessorias
 *    Técnicas Independentes do Paraopeba (AEDAS, Guaicuy, NACAB, ADAI),
 *    coletado por `scripts/coletar-biblioteca-ati.py`. Vira o recorte
 *    "brumadinho" da biblioteca (bacia do Paraopeba).
 * 2. `etl/betim/dados/desastres/*.json` — arquivos por fonte, um por coletor
 *    novo (CIF, MPF, MG, ES...). Cada um deve seguir o schema normalizado
 *    `ItemDesastre` (ver `apps/web/lib/ambiental/desastres.ts`) com o
 *    envelope `{ fonte, geradoEm, ficouDeFora, itens }`.
 *
 * ═══ A TRIAGEM RODA AQUI, UMA VEZ SÓ ═══
 *
 * O cliente busca o JSON pronto; ele não pode re-aplicar a régua de dado
 * pessoal. Por isso o agregador filtra por `triagem.ts::ehItemBloqueado`
 * (mesma implementação do acervo das ATIs — uma cópia só) e conta o que
 * barrou em `COBERTURA_BIBLIOTECA_DESASTRES.barradosPelaTriagem`. Item
 * barrado não entra nem em título. Coleta vazia NÃO sobrescreve o arquivo bom.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ehItemBloqueado } from "../apps/web/lib/paraopeba/triagem";
import type {
  BibliotecaDesastres,
  Desastre,
  EsferaDesastre,
  FonteDesastre,
  ItemDesastre,
} from "../apps/web/lib/ambiental/desastres";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = resolve(AQUI, "..");

const ARQUIVO_ATIS = resolve(RAIZ, "apps/web/public/data/biblioteca-ati.json");
const DIRETORIO_FONTES = resolve(RAIZ, "etl/betim/dados/desastres");
const SAIDA_JSON = resolve(RAIZ, "apps/web/public/data/biblioteca-desastres.json");
const SAIDA_TS = resolve(RAIZ, "apps/web/lib/ambiental/desastres-cobertura.ts");

/** Rótulo curto da ATI — mesmo vocabulário de `lib/paraopeba/biblioteca.ts`. */
const ATI_LABEL: Record<string, string> = {
  aedas: "AEDAS",
  guaicuy: "Guaicuy",
  nacab: "NACAB",
  adai: "ADAI",
};

interface ItemAti {
  id: string;
  ati: string;
  titulo: string;
  data: string | null;
  tipo: string;
  macro_categoria: string;
  tags: string[];
  temas: string[];
  url: string;
}

interface BibliotecaAtiBruta {
  gerado_em: string;
  fontes: { id: string; nome: string; licenca: string }[];
  ficou_de_fora: string;
  itens: ItemAti[];
}

function dedupe(lista: string[]): string[] {
  return [...new Set(lista)];
}

/** ATI → item normalizado. `tipo` é a macro-categoria (vocabulário finito); o
 *  rótulo cru da fonte vai em `tipoOrigem`. Sem resumo: nenhuma fonte publica. */
function daAti(item: ItemAti, geradoEm: string): ItemDesastre {
  return {
    id: `ati:${item.id}`,
    desastre: "brumadinho",
    bacia: "paraopeba",
    titulo: item.titulo,
    data: item.data,
    tipo: item.macro_categoria || item.tipo,
    tipoOrigem: item.tipo,
    orgao: ATI_LABEL[item.ati] ?? item.ati,
    esfera: "ati",
    uf: "MG",
    tags: dedupe([...item.tags, ...item.temas]),
    resumo: null,
    url: item.url,
    fonteId: "biblioteca-atis",
    coletadoEm: geradoEm,
  };
}

function lerAtis(): { itens: ItemDesastre[]; fontes: FonteDesastre[]; geradoEm: string; ficouDeFora: string } {
  if (!existsSync(ARQUIVO_ATIS)) {
    console.error(`! biblioteca-ati.json não existe em ${ARQUIVO_ATIS}`);
    return { itens: [], fontes: [], geradoEm: "", ficouDeFora: "" };
  }
  const bruto: BibliotecaAtiBruta = JSON.parse(readFileSync(ARQUIVO_ATIS, "utf-8"));
  const fontes: FonteDesastre[] = bruto.fontes.map((f) => ({
    id: `ati:${f.id}`,
    nome: f.nome,
    licenca: f.licenca,
    itens: bruto.itens.filter((i) => i.ati === f.id).length,
  }));
  return {
    itens: bruto.itens.map((i) => daAti(i, bruto.gerado_em)),
    fontes,
    geradoEm: bruto.gerado_em,
    ficouDeFora: bruto.ficou_de_fora,
  };
}

/** Arquivos por fonte em `etl/betim/dados/desastres/*.json` — schema
 *  normalizado já no formato `ItemDesastre`. Envelope:
 *  `{ fonte, nome, licenca, geradoEm, ficouDeFora, itens }`. */
function lerFontes(): {
  itens: ItemDesastre[];
  fontes: FonteDesastre[];
  ficouDeFora: string[];
  geradosEm: string[];
} {
  if (!existsSync(DIRETORIO_FONTES)) return { itens: [], fontes: [], ficouDeFora: [], geradosEm: [] };
  const itens: ItemDesastre[] = [];
  const fontes: FonteDesastre[] = [];
  const ficouDeFora: string[] = [];
  const geradosEm: string[] = [];
  for (const arquivo of readdirSync(DIRETORIO_FONTES)) {
    if (!arquivo.endsWith(".json")) continue;
    const bruto = JSON.parse(readFileSync(resolve(DIRETORIO_FONTES, arquivo), "utf-8")) as {
      fonte: string;
      nome?: string;
      licenca?: string;
      geradoEm?: string;
      ficouDeFora?: string;
      itens: ItemDesastre[];
    };
    if (!Array.isArray(bruto.itens)) {
      console.error(`! ${arquivo}: sem campo itens; ignorado`);
      continue;
    }
    itens.push(...bruto.itens);
    fontes.push({
      id: bruto.fonte,
      nome: bruto.nome ?? bruto.fonte,
      licenca: bruto.licenca ?? "não declarada",
      itens: bruto.itens.length,
    });
    if (bruto.ficouDeFora) ficouDeFora.push(bruto.ficouDeFora);
    if (bruto.geradoEm) geradosEm.push(bruto.geradoEm);
  }
  return { itens, fontes, ficouDeFora, geradosEm };
}

function main() {
  const seco = process.argv.includes("--seco");

  const atis = lerAtis();
  const demais = lerFontes();

  const cru: ItemDesastre[] = [...atis.itens, ...demais.itens];
  const barrados = cru.filter((i) =>
    ehItemBloqueado({ tipo: i.tipo, titulo: i.titulo, resumo: i.resumo, temas: i.tags })
  );
  const publicaveis = cru.filter(
    (i) => !ehItemBloqueado({ tipo: i.tipo, titulo: i.titulo, resumo: i.resumo, temas: i.tags })
  );

  // Id único em todo o acervo — fonte que duplica id infla contagem.
  const ids = new Set(publicaveis.map((i) => i.id));
  if (ids.size !== publicaveis.length) {
    const duplicados = publicaveis
      .map((i) => i.id)
      .filter((id, idx, arr) => arr.indexOf(id) !== idx);
    console.error(`! ids duplicados no acervo: ${[...new Set(duplicados)].join(", ")}`);
    process.exit(1);
  }

  const fontes: FonteDesastre[] = [...atis.fontes, ...demais.fontes];
  const ficouDeFora = [atis.ficouDeFora, ...demais.ficouDeFora].filter(Boolean).join(" ");

  const dados: BibliotecaDesastres = {
    geradoEm: new Date().toISOString(),
    fontes,
    ficouDeFora,
    itens: publicaveis,
  };

  if (seco) {
    console.log(`${publicaveis.length} itens publicáveis (+${barrados.length} barrados pela triagem)`);
    console.log(`fontes: ${fontes.map((f) => `${f.id}(${f.itens})`).join(", ")}`);
    return;
  }

  if (publicaveis.length === 0 && existsSync(SAIDA_JSON)) {
    console.error("! agregação vazia: mantendo o arquivo anterior");
    process.exit(1);
  }

  mkdirSync(dirname(SAIDA_JSON), { recursive: true });
  mkdirSync(dirname(SAIDA_TS), { recursive: true });
  writeFileSync(SAIDA_JSON, JSON.stringify(dados, null, 2) + "\n", "utf-8");

  const porDesastre = (d: Desastre) => publicaveis.filter((i) => i.desastre === d).length;
  const porEsfera: Record<string, number> = {};
  for (const i of publicaveis) porEsfera[i.esfera] = (porEsfera[i.esfera] ?? 0) + 1;
  const orgaoMap = new Map<string, number>();
  for (const i of publicaveis) orgaoMap.set(i.orgao, (orgaoMap.get(i.orgao) ?? 0) + 1);
  const anoMap = new Map<number, number>();
  for (const i of publicaveis) {
    if (i.data) {
      const ano = Number(i.data.slice(0, 4));
      if (Number.isFinite(ano)) anoMap.set(ano, (anoMap.get(ano) ?? 0) + 1);
    }
  }

  const ts = `/**
 * Cobertura medida da biblioteca unificada dos desastres de Mariana e
 * Brumadinho. ARQUIVO GERADO por \`scripts/agregar-biblioteca-desastres.mts\`
 * — não editar à mão. Números vêm do dado, nunca digitados.
 *
 * A página de SERVIDOR importa SÓ estas constantes (regra de payload do
 * AGENTS.md). O array mora em \`public/data/biblioteca-desastres.json\`, que
 * o cliente busca com fetch.
 */

export const COBERTURA_BIBLIOTECA_DESASTRES = {
  medidoEm: ${JSON.stringify(dados.geradoEm.slice(0, 10))},
  total: ${publicaveis.length},
  barradosPelaTriagem: ${barrados.length},
  ficouDeFora: ${JSON.stringify(ficouDeFora)},
  porDesastre: ${JSON.stringify({ mariana: porDesastre("mariana"), brumadinho: porDesastre("brumadinho") })},
  porEsfera: ${JSON.stringify(porEsfera)},
  porOrgao: ${JSON.stringify(
    [...orgaoMap.entries()].map(([orgao, total]) => ({ orgao, total })).sort((a, b) => b.total - a.total)
  )},
  porAno: ${JSON.stringify([...anoMap.entries()].map(([ano, total]) => ({ ano, total })).sort((a, b) => a.ano - b.ano))},
  fontes: ${JSON.stringify(fontes)},
} as const;
`;

  writeFileSync(SAIDA_TS, ts, "utf-8");
  console.log(`gravado ${publicaveis.length} itens (${barrados.length} barrados) em ${SAIDA_JSON}`);
  console.log(`cobertura em ${SAIDA_TS}`);
}

main();
