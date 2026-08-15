import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import { listarOrgaos } from "@/lib/congresso/orgaos";
import { metadataEditavel } from "@/lib/edicoes";

export const metadata: Metadata = metadataEditavel("/congresso/comissoes", {
  title: "Comissões — Controle Popular · Congresso",
  description:
    "Comissões da Câmara dos Deputados, com quantas proposições estão paradas em cada uma e o que elas ampliam ou restringem em direitos.",
});

export default async function Comissoes() {
  const orgaos = await listarOrgaos();

  const permanentes = (orgaos ?? []).filter((o) => (o.tipo ?? "").includes("Permanente"));
  const outras = (orgaos ?? []).filter((o) => !(o.tipo ?? "").includes("Permanente"));

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Comissões</h1>
        <p className="max-w-3xl opacity-80">
          É na comissão que um projeto de lei passa a maior parte da vida — e é lá que
          relator e presidente decidem se ele anda. Quem quer influenciar uma proposição
          precisa saber onde ela está parada agora.
        </p>
      </header>

      {orgaos === null ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Fonte de dados não configurada.
        </p>
      ) : orgaos.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma comissão sincronizada ainda. Rode <code>python -m etl.camara.orgaos</code>.
        </p>
      ) : (
        <>
          <Secao titulo="Comissões permanentes" orgaos={permanentes} />
          {outras.length > 0 ? (
            <Secao
              titulo="Comissões temporárias e especiais"
              orgaos={outras}
              descricao="Criadas para uma matéria específica ou por prazo determinado."
            />
          ) : null}
        </>
      )}
    </div>
  );
}

function Secao({
  titulo,
  descricao,
  orgaos,
}: {
  titulo: string;
  descricao?: string;
  orgaos: Awaited<ReturnType<typeof listarOrgaos>> extends (infer T)[] | null ? T[] : never;
}) {
  if (orgaos.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-semibold">{titulo}</h2>
      {descricao ? <p className="opacity-75">{descricao}</p> : null}
      <ul className="grid gap-3 sm:grid-cols-2">
        {orgaos.map((o) => (
          <li key={o.id}>
            <Link
              href={`/comissoes/${encodeURIComponent(o.sigla ?? o.id_externo)}`}
              className="block h-full rounded-lg border border-[var(--cp-border)] p-4 hover:border-[var(--cp-primary)]"
            >
              <p className="font-semibold">
                {o.sigla}
                {o.nome && o.nome !== o.sigla ? (
                  <span className="ml-2 font-normal opacity-75">{o.nome}</span>
                ) : null}
              </p>
              <p className="mt-1 text-sm opacity-70">
                {o.perfil.total === 0 ? (
                  "nenhuma proposição parada aqui"
                ) : (
                  <>
                    <span className="font-tabular">{o.perfil.total}</span>{" "}
                    {o.perfil.total === 1 ? "proposição" : "proposições"} em tramitação
                    {o.perfil.analisadas > 0 ? (
                      <>
                        {" "}
                        · <span className="font-tabular">{o.perfil.reducionistas}</span>{" "}
                        restringem ·{" "}
                        <span className="font-tabular">{o.perfil.garantistas}</span> ampliam
                      </>
                    ) : null}
                  </>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
