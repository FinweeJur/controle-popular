/**
 * Warmup do next dev: atinge as principais rotas em background para
 * compilar os bundles antes do usuário precisar delas.
 *
 * Roda em background após o next dev iniciar — cada request ao next dev
 * dispara a compilação daquela rota e cacheia em memória (e no
 * .next/cache/turbopack/ se Turbopack estiver ativo).
 *
 * Uso: npx tsx scripts/warmup-dev.mts [porta]
 */

const PORTA = process.argv[2] || "3000";
const BASE = `http://localhost:${PORTA}`;

const ROTAS = [
  "/",
  "/busca",
  "/indice",
  "/sobre",
  "/ambiental",
  "/ambiental/barragens",
  "/ambiental/legislacao",
  "/ambiental/estudos",
  "/ambiental/decisoes",
  "/ambiental/copam",
  "/ambiental/convenios",
  "/ambiental/tac",
  "/ambiental/licenciamento",
  "/congresso",
  "/congresso/parlamentares",
  "/congresso/bancadas",
  "/congresso/comissoes",
  "/congresso/proposicoes",
  "/congresso/votacoes",
  "/judiciario",
  "/judiciario/tribunais",
  "/judiciario/sirenejud",
  "/judiciario/presidios",
  "/judiciario/defensoria",
  "/paraopeba",
  "/paraopeba/correlacao",
  "/paraopeba/noticias-vale",
  "/paraopeba/vale",
  "/paraopeba/biblioteca",
  "/betim",
];

async function warmup() {
  console.log(`[warmup] Aquecendo ${ROTAS.length} rotas em ${BASE}...`);
  const inicio = Date.now();

  // Espera o servidor ficar pronto (max 30s)
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (r.ok) break;
    } catch {
      // servidor ainda não pronto
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Aquece as rotas com concorrência limitada (5 por vez)
  const CONCORRENCIA = 5;
  let ok = 0;
  let falha = 0;

  for (let i = 0; i < ROTAS.length; i += CONCORRENCIA) {
    const lote = ROTAS.slice(i, i + CONCORRENCIA);
    const resultados = await Promise.allSettled(
      lote.map(async (rota) => {
        const r = await fetch(`${BASE}${rota}`, {
          signal: AbortSignal.timeout(30_000),
        });
        return { rota, status: r.status };
      })
    );
    for (const res of resultados) {
      if (res.status === "fulfilled" && res.value.status === 200) {
        ok++;
      } else {
        falha++;
      }
    }
  }

  const duracao = ((Date.now() - inicio) / 1000).toFixed(1);
  console.log(
    `[warmup] Concluído em ${duracao}s — ${ok} OK, ${falha} falha(s)`
  );
}

warmup();
