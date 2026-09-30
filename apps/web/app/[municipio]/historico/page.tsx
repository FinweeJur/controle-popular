import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  CAMADAS_MEMORIA,
  REGIAO_POR_UF,
  UF_POR_MUNICIPIO,
  fontesPrimarias,
} from "@/lib/memoria";
import type { VerbeteMemoria } from "@/lib/memoria/tipos";
import { ROTULO_TIPO } from "@/lib/memoria/rotulos";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `História de ${c.nome} — memória das lutas — ${nomePortal(c)}`,
  (c) =>
    `Linha do tempo da memória de ${c.nome}-${c.uf}: marcos do município, do estado, da região e do país, cada um com a fonte.`
);

/** Ano inicial do período do verbete, para ordenar ("1983-1984" → 1983). */
function anoDoPeriodo(periodo: string): number {
  const m = /\d{3,4}/.exec(periodo ?? "");
  return m ? Number(m[0]) : 9999;
}

/** Um marco da linha do tempo, com tipo por extenso e botão de fonte. */
function Marco({ verbete, rotulo }: { verbete: VerbeteMemoria; rotulo: string }) {
  const fontes = fontesPrimarias(verbete);
  return (
    <li className="relative py-4 pl-6 print:break-inside-avoid">
      <span
        aria-hidden="true"
        className="absolute left-[-5px] top-6 h-2 w-2 rounded-full bg-primary"
      />
      <span className="text-[.78em] font-semibold uppercase tracking-wide text-primary">
        {rotulo}
      </span>
      <h3 className="font-display text-[1.1em] font-semibold text-text">
        {verbete.titulo}
        {verbete.periodo ? (
          <span className="ml-2 text-[.75em] font-normal text-muted">{verbete.periodo}</span>
        ) : null}
      </h3>
      <p className="mt-1 text-[.95em] text-text-soft">{verbete.resumo}</p>

      {verbete.tipo.length > 0 ? (
        <p className="mt-2 flex flex-wrap gap-1.5">
          {verbete.tipo.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[.72em] text-text-soft"
            >
              {ROTULO_TIPO[t]}
            </span>
          ))}
        </p>
      ) : null}

      {fontes.length > 0 ? (
        <p className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[.85em] font-semibold text-text">Fonte:</span>
          {fontes.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${f.titulo} — ${f.orgao}, ${f.ano}`}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[.8em] font-semibold text-primary hover:border-primary hover:bg-primary/5"
            >
              {f.orgao} ({f.ano})
            </a>
          ))}
        </p>
      ) : null}
    </li>
  );
}

export default async function HistoricoPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const id = cidade.id_municipio;
  const uf = UF_POR_MUNICIPIO[id] ?? null;
  const regiao = uf ? REGIAO_POR_UF[uf] ?? null : null;

  const local = CAMADAS_MEMORIA.municipio[id] ?? [];
  const doEstado = uf ? CAMADAS_MEMORIA.uf[uf] ?? [] : [];
  const daRegiao = regiao ? CAMADAS_MEMORIA.regiao[regiao] ?? [] : [];
  const doPais = CAMADAS_MEMORIA.pais["br"] ?? [];

  const blocos: { rotulo: string; verbetes: VerbeteMemoria[] }[] = [
    { rotulo: `Aqui em ${cidade.nome}`, verbetes: local },
    { rotulo: `Em ${cidade.uf}`, verbetes: doEstado },
    {
      rotulo: regiao ? `Na região ${regiao.charAt(0).toUpperCase()}${regiao.slice(1)}` : "Na região",
      verbetes: daRegiao,
    },
    { rotulo: "No Brasil", verbetes: doPais },
  ]
    .filter((b) => b.verbetes.length > 0)
    .map((b) => ({
      ...b,
      verbetes: [...b.verbetes].sort((a, c) => anoDoPeriodo(a.periodo) - anoDoPeriodo(c.periodo)),
    }));

  const semLocal = local.length === 0;
  const totalMarcos = blocos.reduce((s, b) => s + b.verbetes.length, 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href={`/${cidade.slug}`} className="transition hover:text-primary">
          {cidade.nome}
        </Link>{" "}
        · <span className="font-semibold text-foreground">História</span>
      </nav>

      <h1 className="mt-3 font-display text-[2em] font-bold tracking-tight text-text">
        História de {cidade.nome}
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm text-text-soft sm:text-base">
        A memória das lutas de {cidade.nome}, do lugar ao país: cada marco com a
        sua fonte. Onde ainda não há verbete local com fonte fechada, a página
        mostra o marco do estado, da região ou do país — e diz, com letras, que
        a lacuna é do município.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:max-w-md">
        <div className="rounded-xl border border-border bg-surface p-3">
          <span className="block text-muted">Marcos nesta página:</span>
          <span className="font-mono font-bold text-foreground">{totalMarcos}</span>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <span className="block text-muted">Verbete local:</span>
          <span className="font-semibold text-foreground">
            {semLocal ? "ainda sem fonte fechada" : `${local.length}`}
          </span>
        </div>
      </div>

      <ol className="mt-8 space-y-2 border-l-2 border-border/70">
        {blocos.flatMap((b) =>
          b.verbetes.map((v, i) => (
            <Marco key={`${b.rotulo}-${v.titulo}-${i}`} verbete={v} rotulo={b.rotulo} />
          ))
        )}
      </ol>

      <p className="mt-8 text-sm text-text-soft">
        Quer a história inteira das lutas, dia a dia?{" "}
        <Link href="/memoria" className="font-semibold text-accent hover:underline">
          Ver a Linha do Tempo das Lutas →
        </Link>
      </p>
    </main>
  );
}
