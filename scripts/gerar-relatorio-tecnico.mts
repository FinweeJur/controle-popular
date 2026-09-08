/**
 * Gerador do Relatório Técnico Geral do site (Fase 2 do plano
 * PLANO-ESTUDOS-RURAIS-RELATORIO-AUTOMACAO-NEON.md).
 *
 * Fonte da verdade: o código do próprio repositório.
 * - Varre `apps/web/app/` em busca de `page.tsx` / `page.din.tsx` (rotas reais do App Router).
 * - Lê `apps/web/lib/fontes/registry.ts` (fontes oficiais) e `apps/web/lib/eixos/catalogo.ts` (eixos).
 * - Mede os JSONs de `apps/web/data/` e de `etl/` referenciados direta ou indiretamente
 *   (um nível: página -> módulo lib) pelas páginas.
 *
 * Saída: docs/relatorios-automacao/relatorio-tecnico-geral.md
 *
 * Uso: npx tsx scripts/gerar-relatorio-tecnico.mts
 *
 * Regras respeitadas (AGENTS.md): número vem de medição com data, nunca de estimativa;
 * lacuna é informação — quando o gerador não sabe, o relatório diz "não sei".
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { REGISTRY_FONTES } from "../apps/web/lib/fontes/registry.js";
import { CATALOGO_EIXOS } from "../apps/web/lib/eixos/catalogo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RAIZ = path.resolve(__dirname, "..");
const DIR_APP = path.join(RAIZ, "apps", "web", "app");
const DIR_DATA = path.join(RAIZ, "apps", "web", "data");
const DIR_LIB = path.join(RAIZ, "apps", "web", "lib");
const DIR_ETL = path.join(RAIZ, "etl");
const SAIDA = path.join(RAIZ, "docs", "relatorios-automacao", "relatorio-tecnico-geral.md");
const HOJE = new Date().toISOString().slice(0, 10);

/* ---------------- Frentes ---------------- */

const MAPA_FRENTE: Record<string, string> = {
  "[municipio]": "Cidades",
  cidades: "Cidades",
  governo: "Cidades",
  congresso: "Congresso",
  judiciario: "Judiciário",
  "estado-e-economia": "Judiciário",
  funcaosocialterra: "Função Social da Terra",
  "terra-e-territorios": "Função Social da Terra",
  paraopeba: "Paraopeba",
  ambiental: "ONSA (ambiental)",
  "direitos-em-movimento": "Direitos em Movimento (eixo)",
  empresas: "Empresas",
  "transparencia-internacional": "Empresas",
};

function frenteDe(rota: string): string {
  const seg = rota.split("/").filter(Boolean);
  if (seg.length === 0) return "Transversal";
  return MAPA_FRENTE[seg[0]] ?? "Transversal";
}

function subfrenteDe(rota: string): string {
  const seg = rota.split("/").filter(Boolean);
  if (seg.length <= 1) return "—";
  return seg[1];
}

/* ---------------- Varredura de rotas ---------------- */

interface Rota {
  url: string; // ex.: "/ambiental/tac" (segmentos dinâmicos mantidos como [param])
  arquivo: string; // caminho absoluto do page.tsx
  frente: string;
  subfrente: string;
  dinamica: boolean;
}

function varrerRotas(): Rota[] {
  const rotas: Rota[] = [];
  const visitar = (dir: string) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      const cheio = path.join(dir, entrada.name);
      if (entrada.isDirectory()) {
        if (entrada.name === "node_modules" || entrada.name.startsWith("_")) continue;
        visitar(cheio);
      } else if (entrada.name === "page.tsx" || entrada.name === "page.din.tsx") {
        const rel = path.relative(DIR_APP, dir).split(path.sep).join("/");
        const url = rel === "." ? "/" : "/" + rel;
        const seg = url.split("/").filter(Boolean);
        rotas.push({
          url,
          arquivo: cheio,
          frente: frenteDe(url),
          subfrente: subfrenteDe(url),
          dinamica: seg.some((s) => /^\[.+\]$/.test(s)),
        });
      }
    }
  };
  visitar(DIR_APP);
  rotas.sort((a, b) => (a.frente + a.url).localeCompare(b.frente + b.url));
  return rotas;
}

/* ---------------- Descrição da página ---------------- */

function descrever(rota: Rota): string {
  const src = fs.readFileSync(rota.arquivo, "utf8");
  const inicio = src.slice(0, 6000);

  // 1) Comentário de cabeçalho no padrão `* \`/rota\` — descrição`.
  const mDoc = inicio.match(/\/`[^`]*`[—–-]+\s*([^\n*]+)/);
  if (mDoc) {
    let txt = mDoc[1].trim();
    const ponto = txt.search(/[.!?](\s|$)/);
    if (ponto > 20) txt = txt.slice(0, ponto + 1);
    if (txt.length > 300) txt = txt.slice(0, 297) + "...";
    return txt;
  }

  // 2) metadataDaCidade((c) => `título`, (c) => `descrição`) — padrão municipal.
  const mCidade = inicio.match(/metadataDaCidade\(\s*\(c\)\s*=>\s*`([^`]*)`\s*,\s*(?:\(c\)\s*=>\s*)?`([^`]*)`/);
  if (mCidade) {
    const limpar = (s: string) =>
      s
        .replace(/\$\{[^}]*\}/g, "…")
        .replace(/\s*\|\s*[^|]*$/, "")
        .replace(/\s+/g, " ")
        .trim();
    const desc = limpar(mCidade[2]);
    if (desc.length >= 15) return desc;
    const tit = limpar(mCidade[1]);
    if (tit.length >= 8) return `Título da página: ${tit}`;
  }

  // 3) description de metadata.
  const mDesc = inicio.match(/description:\s*["'`]([^"'`]{15,300})["'`]/);
  if (mDesc && !mDesc[1].includes("${")) return mDesc[1];

  // 4) Título de metadata.
  const mTitle = inicio.match(/title:\s*["'`]([^"'`]{4,120})["'`]/);
  if (mTitle && !mTitle[1].includes("${")) return `Título da página: ${mTitle[1]}`;

  return "⚠️ Lacuna do gerador: a página não segue o padrão de comentário de cabeçalho nem declara título de metadata — não sei dizer pelo código o que ela mostra.";
}

/* ---------------- Mediação de dados ---------------- */

interface Medicao {
  origem: string;
  descricao: string;
}

function medirJson(caminho: string, origem: string): Medicao | null {
  if (!fs.existsSync(caminho)) return null;
  const stat = fs.statSync(caminho);
  const kb = (stat.size / 1024).toFixed(0);
  let bruto: unknown;
  try {
    bruto = JSON.parse(fs.readFileSync(caminho, "utf8"));
  } catch {
    return { origem, descricao: `arquivo presente (${kb} KB) mas JSON não pôde ser lido pelo gerador` };
  }
  if (Array.isArray(bruto)) {
    return { origem, descricao: `${bruto.length} registros (${kb} KB), medido em ${HOJE}` };
  }
  if (bruto && typeof bruto === "object") {
    const listas = Object.entries(bruto as Record<string, unknown>)
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]) => `${k}: ${(v as unknown[]).length}`)
      .slice(0, 4);
    const chaves = Object.keys(bruto as object).length;
    if (listas.length > 0) {
      return { origem, descricao: `objeto com ${chaves} chaves; listas: ${listas.join("; ")} (${kb} KB), medido em ${HOJE}` };
    }
    return { origem, descricao: `objeto com ${chaves} chaves (${kb} KB), medido em ${HOJE}` };
  }
  return null;
}

/** Resolve módulos lib importados pela página (um nível) e coleta JSONs citados. */
function jsonsDaPagina(rota: Rota): Medicao[] {
  const medicoes = new Map<string, Medicao>();
  const vistos = new Set<string>();

  const procurarRefs = (src: string, caminhoArquivo: string) => {
    // JSONs diretos de data/.
    for (const m of src.matchAll(/data\/([A-Za-z0-9_\-./]+\.json)/g)) {
      const alvo = path.join(DIR_DATA, m[1].replace(/\//g, path.sep));
      const med = medirJson(alvo, m[1]);
      if (med) medicoes.set(alvo, med);
    }
    // Bundles ETL via carregarJsonEtl("arquivo.json").
    for (const m of src.matchAll(/carregarJsonEtl<[^>]*>\(\s*["'`]([^"'`]+\.json)["'`]/g)) {
      const achado = acharEtl(m[1]);
      if (achado) {
        const med = medirJson(achado, m[1]);
        if (med) medicoes.set(achado, med);
      }
    }
    void caminhoArquivo;
  };

  const srcPagina = fs.readFileSync(rota.arquivo, "utf8");
  procurarRefs(srcPagina, rota.arquivo);

  // Um nível: módulos locais importados pela página.
  for (const m of srcPagina.matchAll(/from\s+["'](@\/lib\/[A-Za-z0-9_\-./]+|(\.\.?\/)+lib\/[A-Za-z0-9_\-./]+)["']/g)) {
    let rel = m[1].replace(/^@\//, "");
    const candidatos = [rel + ".ts", path.join(rel, "index.ts"), rel + ".tsx"].map((c) =>
      path.join(RAIZ, "apps", "web", c)
    );
    const alvo = candidatos.find((c) => fs.existsSync(c));
    if (!alvo || vistos.has(alvo)) continue;
    vistos.add(alvo);
    try {
      procurarRefs(fs.readFileSync(alvo, "utf8"), alvo);
    } catch {
      /* módulo ilegível: segue */
    }
  }

  return [...medicoes.values()];
}

function acharEtl(nome: string): string | null {
  const candidatos: string[] = [];
  const visitar = (dir: string) => {
    const alvo = path.join(dir, nome);
    if (fs.existsSync(alvo)) candidatos.push(alvo);
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) visitar(path.join(dir, e.name));
    }
  };
  if (fs.existsSync(DIR_ETL)) visitar(DIR_ETL);
  const emData = path.join(DIR_DATA, nome);
  if (fs.existsSync(emData)) return emData;
  return candidatos[0] ?? null;
}

/* ---------------- Fontes ---------------- */

function fontesDaRota(url: string): string[] {
  const achadas: string[] = [];
  for (const f of Object.values(REGISTRY_FONTES)) {
    if (!f.rotaPortal) continue;
    const portal = f.rotaPortal;
    if (url === portal || url.startsWith(portal + "/") || portal === "/[municipio]" && url.startsWith("/[municipio]")) {
      achadas.push(`${f.nome} (${f.orgao}, ${f.esfera}, cadência ${f.frequenciaAtualizacao}, camada ${f.camada})`);
    }
  }
  return achadas;
}

/* ---------------- Geração ---------------- */

const rotas = varrerRotas();
const frentesMap = new Map<string, Rota[]>();
for (const r of rotas) {
  const lista = frentesMap.get(r.frente) ?? [];
  lista.push(r);
  frentesMap.set(r.frente, lista);
}

const totalFontes = Object.keys(REGISTRY_FONTES).length;
const totalEixos = Object.keys(CATALOGO_EIXOS).length;
const totalSubfrentes = Object.values(CATALOGO_EIXOS).reduce((n, e) => n + e.subfrentes.length, 0);

const jsonsData = fs.existsSync(DIR_DATA)
  ? fs.readdirSync(DIR_DATA).filter((f) => f.endsWith(".json")).length
  : 0;

let semDescricao = 0;
let semDado = 0;
const lacunasFonte: string[] = [];

const linhas: string[] = [];
linhas.push("# Relatório técnico geral do site");
linhas.push("");
linhas.push(`> **Tipo:** RELATORIO`);
linhas.push(`> **Domínio:** global`);
linhas.push(`> **Última medição:** ${HOJE}`);
linhas.push(`> **Leitura estimada:** longa (> 15 min)`);
linhas.push(`> **Relacionados:** [PLANO-ESTUDOS-RURAIS-RELATORIO-AUTOMACAO-NEON](../planos/PLANO-ESTUDOS-RURAIS-RELATORIO-AUTOMACAO-NEON.md), [PRODUTO](../01-produto/PRODUTO.md), [linkmender-propostas](linkmender-propostas.md), [AGENTS.md](/AGENTS.md)`);
linhas.push(`> **Palavras-chave:** relatorio tecnico, rotas, frentes, fontes, app router, dado versionado, cobertura, geracao automatica`);
linhas.push("");
linhas.push(`Documento gerado por \`scripts/gerar-relatorio-tecnico.mts\` em ${HOJE}.`);
linhas.push("Fonte da verdade: o código do repositório (rotas do App Router, registry de fontes, catálogo de eixos) e os JSONs versionados, medidos na geração.");
linhas.push("");
linhas.push("## Sumário");
linhas.push("");
linhas.push("- [Resumo geral](#resumo-geral)");
linhas.push("- [Rotas por frente](#rotas-por-frente)");
linhas.push("- [Fontes registradas](#fontes-registradas)");
linhas.push("- [Eixos e subfrentes](#eixos-e-subfrentes)");
linhas.push("- [Lacunas declaradas](#lacunas-declaradas)");
linhas.push("- [Método](#metodo)");
linhas.push("");
linhas.push("## Resumo geral");
linhas.push("");
linhas.push(`- **Rotas mapeadas:** ${rotas.length} (varredura de \`apps/web/app/**/page.tsx\` e \`page.din.tsx\` em ${HOJE})`);
linhas.push(`- **Frentes:** ${[...frentesMap.keys()].length}`);
linhas.push(`- **Fontes registradas:** ${totalFontes} (\`lib/fontes/registry.ts\`)`);
linhas.push(`- **Eixos temáticos:** ${totalEixos}, com ${totalSubfrentes} subfrentes (\`lib/eixos/catalogo.ts\`)`);
linhas.push(`- **JSONs de dado versionado em \`apps/web/data/\`:** ${jsonsData} arquivos`);
linhas.push(`- **Páginas sem descrição extraível:** ${rotas.filter((r) => descrever(r).startsWith("⚠️")).length}`);
linhas.push("");
linhas.push("## Rotas por frente");
linhas.push("");
linhas.push("Formato de cada linha: Rota → o que mostra → fonte(s) → principais dados (medidos em " + HOJE + ").");
linhas.push("");

for (const [frente, lista] of [...frentesMap.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  linhas.push(`### ${frente} (${lista.length} rotas)`);
  linhas.push("");
  for (const r of lista) {
    const desc = descrever(r);
    if (desc.startsWith("⚠️")) semDescricao++;
    const medicoes = jsonsDaPagina(r);
    if (medicoes.length === 0) semDado++;
    const fontes = fontesDaRota(r.url);
    if (fontes.length === 0) lacunasFonte.push(r.url);

    const dadoTxt =
      medicoes.length > 0
        ? medicoes.map((m) => `\`${m.origem}\`: ${m.descricao}`).join("; ")
        : "⚠️ nenhum JSON versionado referenciado direto ou a um nível de módulo lib — ou lê do banco (não medível nesta máquina), ou serve de índice/catálogo";

    linhas.push(`- **\`${r.url}\`${r.dinamica ? " (rota dinâmica)" : ""}** — ${desc}`);
    linhas.push(`  - Fonte(s): ${fontes.length > 0 ? fontes.join("; ") : "nenhuma do registry aponta para esta rota"}`);
    linhas.push(`  - Principais dados: ${dadoTxt}`);
  }
  linhas.push("");
}

linhas.push("## Fontes registradas");
linhas.push("");
linhas.push(`${totalFontes} fontes em \`lib/fontes/registry.ts\`, por frente e camada de armazenamento:`);
linhas.push("");
const porFrenteCamada = new Map<string, number>();
for (const f of Object.values(REGISTRY_FONTES)) {
  const k = `${f.frente} / ${f.camada}`;
  porFrenteCamada.set(k, (porFrenteCamada.get(k) ?? 0) + 1);
}
linhas.push("| Frente / camada | Fontes |");
linhas.push("|---|---|");
for (const [k, n] of [...porFrenteCamada.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  linhas.push(`| ${k} | ${n} |`);
}
linhas.push("");
linhas.push("## Eixos e subfrentes");
linhas.push("");
for (const e of Object.values(CATALOGO_EIXOS)) {
  linhas.push(`- **${e.titulo}** — ${e.subfrentes.length} subfrentes: ${e.subfrentes.map((s) => s.titulo).join(", ")}`);
}
linhas.push("");
linhas.push("## Lacunas declaradas");
linhas.push("");
linhas.push(`1. **${semDescricao} rotas** não revelam pelo código o que mostram (sem comentário de cabeçalho nem metadata title). Listadas acima com ⚠️.`);
linhas.push(`2. **${semDado} rotas** não referenciam JSON versionado direto nem a um nível de módulo lib. Muitas leem do Postgres (camada \`banco\`) — e esta máquina não alcança o banco (Neon em HTTP 402 até nova ordem; quem mede é a máquina \`home-pc\`). Números dessas rotas ficam fora deste relatório de propósito: não invento.`);
linhas.push(`3. **${lacunasFonte.length} rotas** não têm nenhuma fonte do registry apontando para elas. Podem ser páginas institucionais (sobre, privacidade, índices) ou registro faltando no registry.`);
linhas.push(`4. A mediação de JSONs por página cobre **um nível** de módulo lib. Dado que entra por dois níveis de indireção aparece como lacuna — é limite do gerador, não do dado.`);
linhas.push(`5. Rotas dinâmicas (\`[municipio]\`, \`[id]\`, \`[slug]\`) contam uma vez cada, como gabarito. A quantidade de instâncias geradas no build não é medida aqui.`);
linhas.push("");
linhas.push("## Método");
linhas.push("");
linhas.push(`- Rotas: varredura recursiva de \`apps/web/app/\` por \`page.tsx\`/\`page.din.tsx\`, feita em ${HOJE}.`);
linhas.push(`- O que mostra: primeiro parágrafo do comentário de cabeçalho da página no padrão \`\` \`/rota\` — descrição \`\`; na falta, título de \`metadata\`; na falta, lacuna declarada.`);
linhas.push(`- Fontes: casamento da rota com \`rotaPortal\` de cada entrada de \`REGISTRY_FONTES\`.`);
linhas.push(`- Principais dados: JSONs citados pela página (\`data/*.json\`) ou por módulos lib que ela importa (\`carregarJsonEtl("*.json")\`), com contagem de registros/tamanho medida na geração (${HOJE}).`);
linhas.push(`- Números sem medição não entram no relatório. Onde o gerador não soube, ele diz.`);
linhas.push("");

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, linhas.join("\n"), "utf8");

console.log(`OK: ${SAIDA}`);
console.log(`Rotas: ${rotas.length} | Frentes: ${frentesMap.size} | Fontes: ${totalFontes} | Sem descrição: ${semDescricao} | Sem dado medido: ${semDado}`);
