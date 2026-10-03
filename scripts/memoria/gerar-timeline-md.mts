/**
 * scripts/memoria/gerar-timeline-md.mts
 *
 * O QUE É: gera um Markdown de LEITURA INTEGRAL da linha do tempo da memória
 * — todos os verbetes, com o título curto e o resumo JÁ APLICADOS (a curadoria
 * de `lib/memoria/correcoes.ts`), na ordem cronológica por dia/mês.
 *
 * POR QUE EXISTE: revisar 494 verbetes numa tabela de diff é ruim; este doc
 * mostra o que o leitor vê, em prosa, para o dono ler de ponta a ponta e
 * apontar o que ajustar. SEM diff, SEM proposta — só o texto final.
 *
 * FONTE: `CALENDARIO` (calendário gerado + overlay de correções). Fonte de
 * cada verbete pelo `fonteCurta()` (mesma citação curta da tela).
 *
 * USO: `npx tsx scripts/memoria/gerar-timeline-md.mts`
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { CALENDARIO } from "../../apps/web/lib/memoria/correcoes";
import { fonteCurta } from "../../apps/web/lib/memoria/mistica";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DESTINO = resolve(RAIZ, "docs", "relatorios-automacao", "linha-do-tempo-completa.md");

/** Ordem cronológica do calendário: dia/mês, depois ano (sem ano por último). */
const ordenados = [...CALENDARIO].sort((a, b) => {
  if (a.diaMes !== b.diaMes) return a.diaMes.localeCompare(b.diaMes);
  const anoA = a.ano || "9999";
  const anoB = b.ano || "9999";
  if (anoA !== anoB) return anoA.localeCompare(anoB);
  return a.titulo.localeCompare(b.titulo, "pt-BR");
});

const dias = new Set(ordenados.map((e) => e.diaMes)).size;
const comTituloCurto = ordenados.filter((e) => e.tituloCurto).length;

const linhas: string[] = [];
linhas.push("# Linha do tempo completa — memória das lutas");
linhas.push("");
linhas.push(
  "> Leitura integral (sem diff): os verbetes como a tela mostra, com o título",
);
linhas.push(
  "> curto e o resumo revisados já aplicados. Gerado por",
);
linhas.push("> `scripts/memoria/gerar-timeline-md.mts` a partir do `CALENDARIO`.");
linhas.push("");
linhas.push(`- Verbetes: **${ordenados.length}**`);
linhas.push(`- Dias cobertos: ${dias}`);
linhas.push(`- Com título curto: ${comTituloCurto} de ${ordenados.length}`);
linhas.push(`- Gerado em: ${new Date().toISOString().slice(0, 10)}`);
linhas.push("");
linhas.push("---");

ordenados.forEach((e, i) => {
  const [mes, dia] = e.diaMes.split("-");
  const titulo = e.tituloCurto ?? e.titulo;
  linhas.push("");
  linhas.push(`## ${i + 1} · ${dia}/${mes}${e.ano ? ` · ${e.ano}` : ""} — ${titulo}`);
  linhas.push("");
  if (e.resumo) {
    for (const paragrafo of e.resumo.split(/\n{2,}/)) {
      linhas.push(paragrafo.trim());
      linhas.push("");
    }
  } else {
    linhas.push("_(sem resumo — o título é o texto da fonte)_");
    linhas.push("");
  }
  const partes = [`_${fonteCurta(e)}_`];
  if (e.lugar) partes.push(e.lugar);
  if (e.semData) partes.push("(data aproximada: a fonte não datou)");
  linhas.push(partes.join(" · "));
  linhas.push("");
  linhas.push("---");
});

writeFileSync(DESTINO, linhas.join("\n"), "utf8");
console.log(`[timeline] ${ordenados.length} verbetes em ${dias} dias → ${DESTINO}`);
