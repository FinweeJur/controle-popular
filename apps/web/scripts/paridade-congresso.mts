import fs from "node:fs";
import * as q from "../lib/db/queries/congresso.js";

const t = fs.readFileSync("X:/DevCoder/controle-popular-congresso/.env", "utf8");
const env = (k: string) => t.match(new RegExp("^" + k + "=(.*)$", "m"))?.[1].trim().replace(/^["']|["']$/g, "") ?? "";
async function rest(path: string) {
  const r = await fetch(`${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/${path}`, {
    headers: { apikey: env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`, "Accept-Profile": "congresso", Prefer: "count=exact" },
  });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status} ${await r.text()}`);
  return { linhas: (await r.json()) as any[], total: Number((r.headers.get("content-range") || "").split("/")[1]) };
}
const chave = (r: any[]) => r.map((o) => JSON.stringify(Object.entries(o).sort(([a],[b]) => a.localeCompare(b)))).sort().join("|");
const ok = (n: string, a: any[], b: any[], nota = "") =>
  console.log(chave(a) === chave(b) ? "IGUAL " : "DIFERE", `${n.padEnd(22)} (supabase=${a.length} neon=${b.length}) ${nota}`);

// 1) contagem de membros por bancada
// PAGINAR e obrigatorio: o PostgREST corta em 1000 linhas SEM erro, e
// bancada_membros tem 58 mil. Pedir `limit=100000` nao adianta — o teto e
// do servidor. Foi exatamente por isso que o `fetchAll()` existia no app.
async function todas(path: string) {
  const out: any[] = [];
  for (let de = 0; ; de += 1000) {
    const r = await fetch(`${env("NEXT_PUBLIC_SUPABASE_URL")}/rest/v1/${path}`, {
      headers: { apikey: env("SUPABASE_SERVICE_ROLE_KEY"), Authorization: `Bearer ${env("SUPABASE_SERVICE_ROLE_KEY")}`, "Accept-Profile": "congresso", Range: `${de}-${de + 999}` },
    });
    const lote = (await r.json()) as any[];
    out.push(...lote);
    if (lote.length < 1000) return out;
  }
}
const vinc = await todas("bancada_membros?select=bancada_id");
console.log("   (vinculos lidos do supabase:", vinc.length, ")");
const cont = new Map<string, number>();
for (const v of vinc) cont.set(v.bancada_id, (cont.get(v.bancada_id) ?? 0) + 1);
const banc = (await rest("bancadas?select=id&limit=10000")).linhas.map((b) => ({ id: b.id, membros: cont.get(b.id) ?? 0 }));
const banc2 = ((await q.listarBancadasComContagem()) ?? []).map((b: any) => ({ id: b.id, membros: b.membros }));
ok("contagem de membros", banc, banc2);

// 2) cobertura da analise
const a1 = (await rest("analises?select=id&status=eq.ok&limit=1")).total;
const t1 = (await rest("proposicoes?select=id&limit=1")).total;
const cob = await q.coberturaAnalise();
console.log(a1 === cob.analisadas && t1 === cob.total ? "IGUAL " : "DIFERE",
  `coberturaAnalise       (supabase=${a1}/${t1} neon=${cob.analisadas}/${cob.total})`);

// 3) totais da home
const th = await q.totaisHome();
console.log(t1 === th.proposicoes ? "IGUAL " : "DIFERE", `totaisHome             (supabase=${t1} neon=${th.proposicoes})`);

// 4) analises com proposicao (rotulos reducionistas)
const rot = ["reducionista_forte", "reducionista"];
const an1 = (await rest(`analises?select=id&status=eq.ok&rotulo=in.(${rot.join(",")})&limit=100000`)).linhas.map((x) => ({ id: x.id }));
const an2 = (await q.analisesComProposicao(rot)).map((x: any) => ({ id: x.id }));
ok("analisesComProposicao", an1, an2);

// 5) temas distintos
const tm1 = new Set<string>();
for (const l of (await rest("proposicoes?select=temas_oficiais&temas_oficiais=not.is.null&limit=100000")).linhas)
  (l.temas_oficiais ?? []).forEach((x: string) => tm1.add(x));
const tm2 = await q.temasDistintos();
ok("temasDistintos", [...tm1].map((x) => ({ x })), tm2.map((x) => ({ x })));

// 6) membros de um orgao
const org = (await rest("orgaos?select=id,sigla&limit=1")).linhas[0];
const m1 = (await rest(`orgao_membros?select=papel,parlamentares(id,nome,partido,uf,email)&orgao_id=eq.${org.id}&limit=10000`)).linhas
  .map((l) => { const p = Array.isArray(l.parlamentares) ? l.parlamentares[0] : l.parlamentares; return p ? { ...p, papel: l.papel } : null; })
  .filter(Boolean);
const m2 = await q.membrosDoOrgao(org.id);
ok("membrosDoOrgao", m1 as any[], m2, `[${org.sigla}]`);
process.exit(0);
