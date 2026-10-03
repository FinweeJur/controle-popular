/**
 * scripts/memoria/checar-datas-mistica.mts
 *
 * O QUE É: rastreador de INCONSISTÊNCIA DE DATA na memória (Mística do Dia e
 * Linha do tempo). Procura, no título e no resumo de cada verbete, datas em
 * texto ("27 de agosto", "12/05") e compara com o dia/mês em que o verbete
 * está guardado. Quando diferem, lista — como o caso do Dom Hélder, cujo
 * verbete mora em 21/12 mas o texto diz que faleceu em 27 de agosto de 1999.
 *
 * POR QUE EXISTE (dono, 03/10/2026): "Procure mais inconsistências" — o dado
 * gerado colou fatos e datas; a tela pode afirmar dia errado, e número/texto
 * errado é dano.
 *
 * ISTO É TRIAGEM, NÃO VEREDITO: muitos resumos citam datas de CONTEXTO (outra
 * data do mesmo fato), então há falso positivo. O relatório separa o que veio
 * do TÍTULO (mais forte) do que veio só do resumo.
 *
 * USO: `npx tsx scripts/memoria/checar-datas-mistica.mts`
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CALENDARIO } from "../../apps/web/lib/memoria/correcoes";
import { chaveCorrecao } from "../../apps/web/lib/memoria/correcoes";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DESTINO = resolve(RAIZ, "docs", "relatorios-automacao", "inconsistencias-mistica.md");

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const RX_DIA_MES = /(\d{1,2})\s*º?\s+de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/gi;
const RX_BARRA = /\b(\d{1,2})\/(\d{1,2})\b/g;

interface Achado {
  indice: number;
  chave: string;
  onda: "titulo" | "resumo";
  guardado: string;
  citado: string;
  texto: string;
}

function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** Datas "DD de mês" e "DD/MM" no texto → lista "MM-DD". */
function datasCitadas(texto: string): string[] {
  const out: string[] = [];
  for (const m of texto.matchAll(RX_DIA_MES)) {
    const mes = MESES[m[2].toLowerCase()];
    const dia = Number(m[1]);
    if (mes && dia >= 1 && dia <= 31) out.push(`${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
  }
  for (const m of texto.matchAll(RX_BARRA)) {
    const dia = Number(m[1]);
    const mes = Number(m[2]);
    if (mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
      out.push(`${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`);
    }
  }
  return out;
}

const achados: Achado[] = [];

CALENDARIO.forEach((e, indice) => {
  const guardado = e.diaMes;
  const chave = chaveCorrecao(e);
  const noTitulo = datasCitadas(e.titulo).filter((d) => d !== guardado);
  const noResumo = datasCitadas(e.resumo ?? "").filter((d) => d !== guardado);
  for (const d of noTitulo) {
    achados.push({ indice, chave, onda: "titulo", guardado, citado: d, texto: e.titulo });
  }
  for (const d of noResumo) {
    // Não repete o que o título já denunciou.
    if (noTitulo.includes(d)) continue;
    achados.push({ indice, chave, onda: "resumo", guardado, citado: d, texto: (e.resumo ?? "").slice(0, 160) });
  }
});

const fortes = achados.filter((a) => a.onda === "titulo");

const linhas: string[] = [];
linhas.push("# Inconsistências de data na memória (triagem)");
linhas.push("");
linhas.push("> Compara o dia/mês em que o verbete está guardado com as datas citadas no");
linhas.push("> título (forte) e no resumo (contexto — pode ser falso positivo). Gerado por");
linhas.push("> `scripts/memoria/checar-datas-mistica.mts`.");
linhas.push("");
linhas.push(`- Verbetes analisados: ${CALENDARIO.length}`);
linhas.push(`- Título com data diferente do guardado: ${fortes.length}`);
linhas.push(`- Só no resumo (triagem): ${achados.length - fortes.length}`);
linhas.push("");
linhas.push("## Título × data guardada (forte)");
linhas.push("");
linhas.push("| # | guardado | citado | chave |");
linhas.push("|---|---|---|---|");
for (const a of fortes) linhas.push(`| ${a.indice} | ${a.guardado} | ${a.citado} | \`${a.chave}\` |`);
linhas.push("");
linhas.push("## Só no resumo (contexto, revisar)");
linhas.push("");
linhas.push("| # | guardado | citado | trecho |");
linhas.push("|---|---|---|---|");
for (const a of achados.filter((x) => x.onda === "resumo")) {
  linhas.push(`| ${a.indice} | ${a.guardado} | ${a.citado} | ${a.texto.replace(/\|/g, " ").replace(/\n+/g, " ")} |`);
}
linhas.push("");

writeFileSync(DESTINO, linhas.join("\n"), "utf8");
console.log(`[datas] ${achados.length} suspeitas (${fortes.length} no título) em ${CALENDARIO.length} verbetes → ${DESTINO}`);
console.log("[datas] FORTES:");
for (const a of fortes.slice(0, 40)) console.log(`  #${a.indice} guardado ${a.guardado} x citado ${a.citado} — ${a.texto.slice(0, 90)}`);
