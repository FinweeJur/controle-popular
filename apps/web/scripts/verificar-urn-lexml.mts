/**
 * verificar-urn-lexml.mts — mede QUANTAS das URNs que `lib/ambiental/
 * urn-lexml.ts` monta resolvem de fato em `normas.leg.br`.
 *
 * A pergunta que este script responde é a única que decide se a ideia
 * entra na tela: montar a URN é barato, mas link canônico que abre página
 * vazia é pior que link nenhum. O número medido está em
 * `docs/URN-LEXML-NORMAS-LEG-BR.md`.
 *
 * ═══ POR QUE LÊ ARQUIVO E NÃO O BANCO ═══
 *
 * `auditoria-links-normas.mjs` (o vizinho que audita `link_pdf`) fala com o
 * Postgres. Este não pode: a máquina onde ele foi escrito não tem o acervo
 * carregado, e a Neon está em cota (HTTP 402 até 01/09). Os dois arquivos
 * que o coletor federal congelou — `etl/betim/dados/legislacao-mma.json` e
 * `legislacao-cndh.json`, 8.940 linhas, os MESMOS dados que a carga grava
 * (ver `docs/LEGISLACAO-FEDERAL-MMA-CNDH.md` §7) — são acervo real, não
 * fixture. As 6.378 estaduais não têm arquivo equivalente; entram na
 * verificação pelo bloco de controle abaixo, com dado real colhido da API
 * da ALMG.
 *
 * ═══ EDUCAÇÃO COM O SERVIDOR ═══
 *
 * Amostra pequena (15 + 5 controles), pausa de 1,5 s entre requisições,
 * User-Agent identificando o projeto — mesma convenção de
 * `auditoria-links-normas.mjs`.
 *
 * Uso:
 *   npx tsx scripts/verificar-urn-lexml.mts [--amostra N]
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  normaResolveu,
  urlApiNormasLegBr,
  urnLexmlDaNorma,
  type NormaParaUrn,
} from "../lib/ambiental/urn-lexml.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, "../../..");

const USER_AGENT =
  "ControlePopularBot/1.0 (+https://controlepopular.com.br; verificacao de URN LexML; contato via github.com/FinweeJur/controle-popular)";
const PAUSA_MS = 1500;
const TIMEOUT_MS = 25_000;

interface LinhaColetor {
  fonte: string;
  esfera: string;
  tipo: string;
  numero: string | null;
  ano: number | null;
  data: string | null;
  ementa: string | null;
}

const dorme = (ms: number) => new Promise((r) => setTimeout(r, ms));

function lerAcervoFederal(): LinhaColetor[] {
  const linhas: LinhaColetor[] = [];
  for (const arquivo of ["legislacao-mma.json", "legislacao-cndh.json"]) {
    const bruto = JSON.parse(readFileSync(path.join(RAIZ, "etl/betim/dados", arquivo), "utf8"));
    linhas.push(...(bruto.linhas as LinhaColetor[]));
  }
  return linhas;
}

/** Amostra ESPALHADA, não as N primeiras: as linhas vêm ordenadas por data,
 *  e pegar do começo mediria só a década de 1930. Passo fixo (sem sorteio)
 *  para o número deste script ser reprodutível. */
function espalhar<T>(itens: T[], quantos: number): T[] {
  if (itens.length <= quantos) return itens;
  const passo = itens.length / quantos;
  return Array.from({ length: quantos }, (_, i) => itens[Math.floor(i * passo)]);
}

/** Controles NEGATIVOS: URNs que a lib se RECUSA a montar. Aqui elas são
 *  montadas à mão, do jeito ingênuo, só para provar que a recusa está certa
 *  — se alguma destas resolvesse, a lib estaria jogando fora link bom. */
const CONTROLES: { rotulo: string; urn: string }[] = [
  {
    rotulo: "estadual MG — Lei nº 26.040/2026 (dado real da API da ALMG)",
    urn: "urn:lex:br;minas.gerais:estadual:lei:2026-08-06;26040",
  },
  {
    rotulo: "estadual MG — mesma lei sem o segmento 'estadual'",
    urn: "urn:lex:br;minas.gerais:lei:2026-08-06;26040",
  },
  {
    rotulo: "Resolução Conama nº 237/1997 — autoridade chutada",
    urn: "urn:lex:br:conselho.nacional.meio.ambiente:resolucao:1997-12-19;237",
  },
  {
    rotulo: "Portaria Ibama nº 349/1990 — autoridade chutada",
    urn: "urn:lex:br:ministerio.meio.ambiente:portaria:1990-03-14;349",
  },
  {
    rotulo: "lei que não existe (controle do próprio método)",
    urn: "urn:lex:br:federal:lei:1998-02-12;9999999",
  },
];

async function consultar(urn: string): Promise<{ http: number; resolveu: boolean; nome?: string }> {
  const resp = await fetch(urlApiNormasLegBr(urn), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const corpo = await resp.json().catch(() => null);
  return {
    http: resp.status,
    resolveu: normaResolveu(corpo),
    nome: (corpo as { name?: string } | null)?.name,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--amostra");
  const tamanho = idx >= 0 ? Number(args[idx + 1]) : 15;

  const acervo = lerAcervoFederal();
  const montaveis = acervo
    .map((l) => ({ linha: l, urn: urnLexmlDaNorma(l as NormaParaUrn) }))
    .filter((x): x is { linha: LinhaColetor; urn: string } => x.urn !== null);

  console.log(`Acervo federal em arquivo: ${acervo.length} normas`);
  console.log(
    `URN montável: ${montaveis.length} (${((100 * montaveis.length) / acervo.length).toFixed(1)}% do federal)`
  );

  // Estratificado por tipo, proporcional, para a amostra não virar só decreto.
  const porTipo = new Map<string, typeof montaveis>();
  for (const m of montaveis) {
    const t = m.linha.tipo.toUpperCase();
    porTipo.set(t, [...(porTipo.get(t) ?? []), m]);
  }
  const amostra: typeof montaveis = [];
  for (const [tipo, linhas] of porTipo) {
    const quota = Math.max(1, Math.round((tamanho * linhas.length) / montaveis.length));
    amostra.push(...espalhar(linhas, quota));
    console.log(`  ${tipo}: ${linhas.length} montáveis, ${quota} na amostra`);
  }

  console.log(`\n=== ${amostra.length} URNs montadas pela lib ===`);
  let resolveram = 0;
  for (const m of amostra) {
    const r = await consultar(m.urn);
    if (r.resolveu) resolveram++;
    console.log(
      `${r.resolveu ? "OK  " : "NAO "} http=${r.http} ${m.urn.padEnd(52)} ${r.nome ?? "(sem norma no corpo)"}`
    );
    await dorme(PAUSA_MS);
  }

  console.log(`\n=== ${CONTROLES.length} controles negativos (a lib devolve null para estes) ===`);
  let controlesQueResolveram = 0;
  for (const c of CONTROLES) {
    const r = await consultar(c.urn);
    if (r.resolveu) controlesQueResolveram++;
    console.log(`${r.resolveu ? "RESOLVEU!" : "nao      "} ${c.rotulo}`);
    await dorme(PAUSA_MS);
  }

  const taxa = (100 * resolveram) / amostra.length;
  console.log(`\n=== resultado ===`);
  console.log(`amostra montável: ${resolveram}/${amostra.length} resolveram (${taxa.toFixed(1)}%)`);
  console.log(
    `controles negativos que resolveram: ${controlesQueResolveram}/${CONTROLES.length} ` +
      `(qualquer número acima de 0 quer dizer que a lib está recusando link bom)`
  );
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});
