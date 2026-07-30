import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { notFound } from "next/navigation";
import PerfilAgregadoView from "@/app/congresso/components/PerfilAgregado";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import { obterBancada, ROTULO_TIPO, listarBancadas } from "@/lib/congresso/bancadas";

type Params = Promise<{ id: string }>;

/** ~64 bancadas — pequeno o bastante pra pré-render total no build. */
export async function generateStaticParams() {
  const bancadas = await listarBancadas();
  return (bancadas ?? []).map((b) => ({ id: b.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const dados = await obterBancada(id);
  return {
    title: `${dados?.bancada.nome ?? "Bancada"} — Controle Popular · Congresso`,
  };
}

export default async function Bancada({ params }: { params: Params }) {
  const { id } = await params;
  const dados = await obterBancada(id);
  if (!dados) notFound();

  const { bancada, membros, perfil, proposicoes } = dados;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <nav className="text-sm">
        <Link href="/bancadas" className="underline">
          ← todas as bancadas
        </Link>
      </nav>

      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide opacity-60">
          {ROTULO_TIPO[bancada.tipo]}
          {bancada.legislatura ? ` · ${bancada.legislatura}ª legislatura` : ""}
        </p>
        <h1 className="font-display text-3xl font-bold">{bancada.nome}</h1>
        <p className="opacity-75">
          <span className="font-tabular">{membros.length}</span>{" "}
          {membros.length === 1 ? "parlamentar" : "parlamentares"} ·{" "}
          <span className="font-tabular">{proposicoes.length}</span>{" "}
          {proposicoes.length === 1 ? "proposição de autoria" : "proposições de autoria"}
        </p>
      </header>

      <PerfilAgregadoView
        perfil={perfil}
        sujeito="de autoria desta bancada"
        nota={
          "O perfil soma proposições ASSINADAS por membros da bancada, contando cada uma " +
          "uma vez ainda que vários membros assinem. Assinar não é o mesmo que representar " +
          "a posição do grupo, e frentes parlamentares admitem parlamentares de posições " +
          "opostas sobre o mesmo tema — leia como indício, não como programa."
        }
      />

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">
          Composição{" "}
          <span className="font-tabular text-base font-normal opacity-70">
            ({membros.length})
          </span>
        </h2>
        {membros.length === 0 ? (
          <p className="opacity-75">
            Composição não sincronizada. Rode{" "}
            <code>python -m etl.camara.bancadas</code> — a API só publica membros de
            frentes parlamentares.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {membros.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-md border border-[var(--cp-border)] p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.url_foto ? (
                  <img
                    src={m.url_foto}
                    alt=""
                    width={36}
                    height={48}
                    className="h-12 w-9 rounded object-cover"
                  />
                ) : null}
                <span className="text-sm">
                  <span className="font-medium">{m.nome}</span>
                  {m.partido ? (
                    <span className="opacity-70">
                      {" "}
                      ({m.partido}
                      {m.uf ? `/${m.uf}` : ""})
                    </span>
                  ) : null}
                  {m.papel ? (
                    <span className="block text-xs opacity-70">{m.papel}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">
          Proposições de autoria{" "}
          <span className="font-tabular text-base font-normal opacity-70">
            ({proposicoes.length})
          </span>
        </h2>
        {proposicoes.length === 0 ? (
          <p className="opacity-75">
            Nenhuma proposição de autoria de membros desta bancada no período sincronizado.
          </p>
        ) : (
          <ul className="space-y-3">
            {proposicoes.slice(0, 100).map((p) => (
              <li key={p.id} className="rounded-lg border border-[var(--cp-border)] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/proposicoes/${p.id}`} className="font-semibold underline">
                    {p.identificacao}
                  </Link>
                  <RotuloBadge rotulo={p.rotulo} tamanho="sm" />
                </div>
                <p className="mt-2 text-sm opacity-85">{p.ementa}</p>
                {p.autores.length > 0 ? (
                  <p className="mt-2 text-xs opacity-65">
                    Da bancada: {p.autores.slice(0, 6).join(", ")}
                    {p.autores.length > 6 ? ` e mais ${p.autores.length - 6}` : ""}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        {proposicoes.length > 100 ? (
          <p className="text-sm opacity-70">
            Mostrando as 100 mais recentes de {proposicoes.length}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
