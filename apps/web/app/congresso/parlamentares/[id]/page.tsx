import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { notFound } from "next/navigation";
import PerfilAgregadoView from "@/app/congresso/components/PerfilAgregado";
import PainelPresenca from "@/app/congresso/components/PainelPresenca";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import { obterParlamentar, listarIdsDeParlamentares } from "@/lib/congresso/parlamentares";

type Params = Promise<{ id: string }>;

/**
 * ~512 parlamentares ativos — mesma ordem de grandeza das 354 bancadas, que
 * já pré-renderam por inteiro (ver o comentário em `queries/congresso.ts`).
 * Pré-render total aqui, sem o `exportandoEstatico`/`dynamicParams` que
 * `proposicoes/[id]` usa para 5.500+ itens.
 */
export async function generateStaticParams() {
  return (await listarIdsDeParlamentares()).map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const dados = await obterParlamentar(id);
  if (!dados) return { title: "Parlamentar — Controle Popular · Congresso" };
  const { parlamentar: p } = dados;
  return {
    title: `${p.nome_eleitoral ?? p.nome} — Controle Popular · Congresso`,
    description: `Presença em plenário, coerência de voto com direitos fundamentais e proposições de ${
      p.nome_eleitoral ?? p.nome
    }${p.partido ? ` (${p.partido}${p.uf ? `/${p.uf}` : ""})` : ""}.`,
  };
}

function formatarData(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { dateStyle: "medium" });
}

export default async function PerfilParlamentar({ params }: { params: Params }) {
  const { id } = await params;
  const dados = await obterParlamentar(id);
  if (!dados) notFound();

  const { parlamentar: p, presenca, coerencia, perfilAutoria, proposicoes } = dados;
  const nome = p.nome_eleitoral ?? p.nome;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <nav className="text-sm">
        <Link href="/proposicoes" className="underline">
          ← proposições
        </Link>
      </nav>

      <header className="flex flex-wrap items-center gap-4">
        {p.url_foto ? (
          <img
            src={p.url_foto}
            alt=""
            width={64}
            height={86}
            className="h-[86px] w-16 rounded object-cover"
          />
        ) : null}
        <div>
          <h1 className="font-display text-3xl font-bold">{nome}</h1>
          <p className="opacity-75">
            {p.partido ? `${p.partido}` : "—"}
            {p.uf ? `/${p.uf}` : ""}
            {p.legislatura ? ` · ${p.legislatura}ª legislatura` : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-3 text-sm">
            {p.email ? (
              <a href={`mailto:${p.email}`} className="underline">
                {p.email}
              </a>
            ) : null}
            {p.url_perfil ? (
              <a href={p.url_perfil} target="_blank" rel="noopener noreferrer" className="underline">
                Perfil na Câmara ↗
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <PainelPresenca presenca={presenca} coerencia={coerencia} />

      <section>
        <h2 className="font-display text-2xl font-semibold">
          Proposições de autoria{" "}
          <span className="font-tabular text-base font-normal opacity-70">
            ({proposicoes.length})
          </span>
        </h2>
        <div className="mt-4">
          <PerfilAgregadoView
            perfil={perfilAutoria}
            sujeito="de autoria própria"
            nota={
              "Conta proposição em que assina, sozinho ou junto com outros — assinar " +
              "não é o mesmo que ser o único autor."
            }
          />
        </div>

        {proposicoes.length === 0 ? (
          <p className="mt-4 opacity-75">Nenhuma proposição de autoria sincronizada.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {proposicoes.slice(0, 100).map((prop) => (
              <li key={prop.id} className="rounded-lg border border-[var(--cp-border)] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={`/proposicoes/${prop.id}`} className="font-semibold underline">
                    {prop.identificacao}
                  </Link>
                  <RotuloBadge rotulo={prop.rotulo} tamanho="sm" />
                  <span className="text-xs opacity-60">
                    {formatarData(prop.data_apresentacao)}
                  </span>
                </div>
                <p className="mt-2 text-sm opacity-85">{prop.ementa}</p>
              </li>
            ))}
          </ul>
        )}
        {proposicoes.length > 100 ? (
          <p className="mt-2 text-sm opacity-70">
            Mostrando as 100 mais recentes de {proposicoes.length}.
          </p>
        ) : null}
      </section>
    </div>
  );
}
