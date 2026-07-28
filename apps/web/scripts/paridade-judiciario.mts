import fs from "node:fs";
import * as q from "../lib/db/queries/judiciario.js";

const t = fs.readFileSync("X:/DevCoder/controle-popular-judiciario/.env", "utf8");
const env = (k: string) => t.match(new RegExp("^" + k + "=(.*)$", "m"))?.[1].trim().replace(/^["']|["']$/g, "") ?? "";
const URL_ = env("NEXT_PUBLIC_SUPABASE_URL"), KEY = env("SUPABASE_SERVICE_ROLE_KEY");

// PostgREST direto: o supabase-js exige WebSocket global, ausente no Node 20.
async function rest(path: string) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, "Accept-Profile": "judiciario" },
  });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return (await r.json()) as any[];
}
// O PostgREST serializa timestamptz como ISO-8601 ("...T22:10:13.9+00:00");
// o driver do Neon devolve o formato do Postgres ("... 22:10:13.9+00").
// Mesmo instante, texto diferente. Normaliza para comparar DADO, não
// formatação — a diferença real fica registrada, mas não polui o teste.
const iso = (v: unknown) => {
  if (typeof v !== "string") return v;
  // "2026-07-24 22:10:13.979904+00" (Postgres) e
  // "2026-07-24T22:10:13.979904+00:00" (PostgREST) sao o mesmo instante.
  // Atencao: o offset "+00" NAO e ISO valido para o `Date` do JS —
  // precisa virar "+00:00", senao `new Date()` devolve Invalid Date e o
  // `toISOString()` lanca RangeError.
  const m = v.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2}(?:\.\d+)?)(Z|[+-]\d{2}(?::?\d{2})?)?$/);
  if (!m) return v;
  let off = m[3] ?? "Z";
  if (/^[+-]\d{2}$/.test(off)) off += ":00";
  else if (/^[+-]\d{4}$/.test(off)) off = off.slice(0, 3) + ":" + off.slice(3);
  const d = new Date(`${m[1]}T${m[2]}${off}`);
  return isNaN(d.getTime()) ? v : d.toISOString();
};
const norm = (r: any[]) =>
  r.map((o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, iso(v)])));
// Para consultas SEM ordenação declarada, comparar posição a posição é
// defeito do teste: a ordem é indefinida dos dois lados. Compara como
// conjunto.
const cmpSet = (nome: string, a: any[], b: any[]) => {
  const chave = (r: any[]) => norm(r).map((o) => JSON.stringify(o)).sort().join("|");
  console.log(chave(a) === chave(b) ? "IGUAL " : "DIFERE", `${nome.padEnd(18)} (supabase=${a.length} neon=${b.length}) [sem ordem]`);
};
const cmp = (nome: string, a: any[], b: any[]) =>
  console.log(JSON.stringify(norm(a)) === JSON.stringify(norm(b)) ? "IGUAL " : "DIFERE", `${nome.padEnd(18)} (supabase=${a.length} neon=${b.length})`);

cmp("listarTribunais", await rest("tribunais?select=*&order=ramo"), (await q.listarTribunais()) ?? []);
cmpSet("listarVagas",
  (await rest("vagas?select=*")).sort((a, b) => ((a.data_abertura ?? "") < (b.data_abertura ?? "") ? 1 : -1)),
  await q.listarVagas());
cmpSet("listarNomeacoes",
  (await rest("nomeacoes?select=*")).sort((a, b) =>
    ((b.data_deliberacao ?? b.data_mensagem ?? "") > (a.data_deliberacao ?? a.data_mensagem ?? "") ? 1 : -1)),
  (await q.listarNomeacoes()) ?? []);
cmp("ocupacoesAtuais",
  await rest("vw_vacancia?select=*&tribunal_id=eq.stf&atual=is.true"),
  await q.ocupacoesAtuais("stf"));
cmp("proximasVacancias",
  (await rest("vw_vacancia?select=*&atual=is.true")).filter((o) => o.vacancia_projetada)
    .sort((a, b) => (a.vacancia_projetada < b.vacancia_projetada ? -1 : 1)).slice(0, 50),
  await q.proximasVacancias(50));
cmpSet("mandatosDirecao",
  (await rest("mandatos_direcao?select=id,cargo,data_inicio,data_fim,biennio,eleito,magistrados(nome)&tribunal_id=eq.tse"))
    .map((l) => ({ id: l.id, cargo: l.cargo, magistrado_nome: Array.isArray(l.magistrados) ? l.magistrados[0]?.nome ?? "" : l.magistrados?.nome ?? "", data_inicio: l.data_inicio, data_fim: l.data_fim, biennio: l.biennio, eleito: l.eleito })),
  await q.mandatosDirecao("tse"));
