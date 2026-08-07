/**
 * Mostra o EFEITO do desconto de presença e coerência sobre o ranking.
 *
 *   npx tsx scripts/efeito-atuacao.mts
 *
 * Existe porque `tsc --noEmit` limpo não prova nada sobre uma mudança de
 * fórmula: a pergunta que importa é quantas posições trocaram de ocupante e
 * por qual motivo. Foi assim que a regra de baixo teor se provou (1.241
 * proposições reclassificadas, 16 de 23 posições trocadas em Betim) — e é
 * assim que se descobre uma régua que passa no compilador e não muda nada,
 * ou que muda demais.
 */
import { getRankingVereadores } from "@/lib/betim/vereadores";
import { comoIdMunicipio } from "@/lib/db/queries/municipios";

const CIDADES: [string, string][] = [
  ["3106705", "Betim"],
  ["3106200", "Belo Horizonte"],
  ["3550308", "São Paulo"],
];

const pct = (x: number | null) => (x === null ? "  —  " : `${(x * 100).toFixed(0)}%`.padStart(5));
const n = (x: number) => x.toFixed(0).padStart(6);

for (const [id, nome] of CIDADES) {
  const { rows, ok } = await getRankingVereadores(comoIdMunicipio(id));
  if (!ok) {
    console.log(`\n${nome}: consulta falhou`);
    continue;
  }

  // Ordem que o ranking teria SEM o desconto — é contra ela que se mede a
  // troca de posições.
  const antes = [...rows]
    .sort(
      (a, b) =>
        b.pontuacaoProducao - a.pontuacaoProducao ||
        (a.nome_urna ?? "").localeCompare(b.nome_urna ?? "", "pt-BR")
    )
    .map((r) => r.id);
  const posAntes = new Map(antes.map((id, i) => [id, i]));

  let trocaram = 0;
  let comPresenca = 0;
  let comCoerencia = 0;
  rows.forEach((r, i) => {
    if (posAntes.get(r.id) !== i) trocaram++;
    if (r.presenca.medido) comPresenca++;
    if (r.coerencia.medido) comCoerencia++;
  });

  console.log(`\n═══ ${nome} ═══`);
  console.log(
    `${rows.length} vereadores · presença medida em ${comPresenca} · ` +
      `coerência medida em ${comCoerencia} · ${trocaram} posições trocaram de ocupante`
  );
  if (rows.length && !comPresenca)
    console.log(`  presença não medida: ${rows[0].presenca.motivo}`);
  if (rows.length && !comCoerencia)
    console.log(`  coerência não medida: ${rows[0].coerencia.motivo}`);

  console.log(
    "  pos  nome                       produção   final  Δpos  presença  coerência"
  );
  for (const r of rows.slice(0, 10)) {
    const i = rows.indexOf(r);
    const d = (posAntes.get(r.id) ?? i) - i;
    console.log(
      `  ${String(i + 1).padStart(3)}  ${(r.nome_urna ?? "?").slice(0, 24).padEnd(24)} ` +
        `${n(r.pontuacaoProducao)} ${n(r.pontuacao)}  ` +
        `${(d > 0 ? `+${d}` : `${d}`).padStart(4)}  ` +
        `${pct(r.presenca.taxa)}     ${pct(r.coerencia.taxa)}`
    );
  }

  // Quem mais perdeu — é o caso que a tela vai ter de explicar.
  const perdas = [...rows]
    .filter((r) => r.pontuacaoProducao > 0)
    .map((r) => ({ r, perda: 1 - r.pontuacao / r.pontuacaoProducao }))
    .sort((a, b) => b.perda - a.perda)
    .slice(0, 3);
  for (const { r, perda } of perdas) {
    if (perda <= 0.001) continue;
    console.log(
      `  ↓ ${(r.nome_urna ?? "?").slice(0, 24)}: −${(perda * 100).toFixed(0)}% ` +
        `(presença ${pct(r.presenca.taxa)}, coerência ${pct(r.coerencia.taxa)}` +
        `${r.coerencia.contradizPropriaAutoria ? ", contradiz a própria autoria" : ""})`
    );
  }
}
