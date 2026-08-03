import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { getComissoesAtuais } from "@/lib/betim/comissoes";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import type { Cidade } from "@/lib/db/queries/municipios";

/** Ver `fonteDaCamara` em `camara/page.tsx`: o crédito era "Câmara de Betim"
 *  fixo, inclusive nas páginas de BH e São Paulo. */
function fonteDaCamara(cidade: Cidade) {
  const host =
    typeof cidade.fontes?.camara_host === "string" ? cidade.fontes.camara_host : undefined;
  return { label: `Câmara de ${cidade.nome}`, url: host };
}

export const generateMetadata = metadataDaCidade(
  (c) => `Comissões — Câmara Municipal de ${c.nome} | ${nomePortal(c)}`,
  (c) => `Composição atual das comissões permanentes da Câmara Municipal de ${c.nome}.`
);

export default async function ComissoesPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const fonteCamara = fonteDaCamara(cidade);
  const { rows, ok } = await getComissoesAtuais(cidade.id_municipio);
  const permanentes = rows.filter((c) => !c.especial);
  const especiais = rows.filter((c) => c.especial);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/camara" className="hover:text-primary">
          Câmara
        </Link>{" "}
        · <span className="text-text">Comissões</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Comissões da Câmara
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Cada comissão examina e emite parecer sobre os projetos de sua área
        antes de irem a votação em plenário — é onde boa parte do trabalho
        legislativo de fato acontece.
      </p>

      {!ok || rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-text-soft">
          Nenhuma comissão encontrada no momento.
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            {permanentes.map((c) => (
              <ComissaoCard fonteCamara={fonteCamara} key={c.id} comissao={c} />
            ))}
          </div>

          {especiais.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-1 font-display text-lg font-bold text-text">
                Comissões especiais
              </h2>
              <p className="mb-4 text-sm text-text-soft">
                Criadas para um propósito específico e temporário — não fazem
                parte da estrutura permanente da Câmara.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {especiais.map((c) => (
                  <ComissaoCard fonteCamara={fonteCamara} key={c.id} comissao={c} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComissaoCard({
  comissao,
  fonteCamara,
}: {
  comissao: Awaited<ReturnType<typeof getComissoesAtuais>>["rows"][number];
  fonteCamara: ReturnType<typeof fonteDaCamara>;
}) {
  return (
    <DataCard
      title={comissao.nome}
      source={fonteCamara}
    >
      <ul className="flex flex-col gap-1.5">
        {comissao.presidente && (
          <li className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Presidente
            </span>
            <Link
              href={`/vereadores/${comissao.presidente.slug}`}
              className="font-medium text-primary hover:underline"
            >
              {comissao.presidente.nomeUrna}
            </Link>
          </li>
        )}
        {comissao.relator && (
          <li className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Relator
            </span>
            <Link
              href={`/vereadores/${comissao.relator.slug}`}
              className="font-medium text-primary hover:underline"
            >
              {comissao.relator.nomeUrna}
            </Link>
          </li>
        )}
        {comissao.membros.map((m) => (
          <li key={m.slug} className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wide text-text-soft uppercase">
              Membro
            </span>
            <Link href={`/vereadores/${m.slug}`} className="text-text hover:text-primary hover:underline">
              {m.nomeUrna}
            </Link>
          </li>
        ))}
        {!comissao.presidente && !comissao.relator && comissao.membros.length === 0 && (
          <li className="text-text-soft">Nenhum membro registrado.</li>
        )}
      </ul>
    </DataCard>
  );
}
