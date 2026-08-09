import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import PaginaEmBreve from "@/app/[municipio]/components/PaginaEmBreve";
import { getSocialData } from "@/lib/betim/social";
import { formatCurrencyBRL, formatDateBR, formatNumberBR } from "@/lib/betim/format";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Assistência Social — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) => `Benefícios sociais (Bolsa Família, BPC) pagos a moradores de ${c.nome}-${c.uf}.`
);

export default async function SocialPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const { configured, ok, programas } = await getSocialData(cidade.id_municipio);
  const temDados = configured && ok && programas.length > 0;

  if (!temDados) {
    return (
      <PaginaEmBreve
        titulo={`Assistência Social em ${cidade.nome}`}
        descricao={`Bolsa Família, BPC e outros benefícios sociais pagos a moradores de ${cidade.nome}.`}
        motivo={
          configured
            ? "Nenhum dado de benefício social encontrado no momento."
            : "Depende da API do Portal da Transparência federal, ainda não configurada neste ambiente."
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/dados" className="hover:text-primary">
          {cidade.nome} em Dados
        </Link>{" "}
        · <span className="text-text">Assistência Social</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Assistência Social em {cidade.nome}
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Quantas famílias recebem os principais benefícios federais e quanto
        isso representa em dinheiro público chegando à cidade, mês a mês.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {programas.map((p) => (
          <DataCard
            key={p.programa}
            title={p.programa}
            source={{
              label: "Portal da Transparência",
              url: "https://portaldatransparencia.gov.br/beneficios",
            }}
          >
            {p.ultimo ? (
              <>
                <p className="font-tabular text-2xl font-bold text-text">
                  {formatNumberBR(p.ultimo.beneficiarios ?? 0)}
                </p>
                <p className="text-xs">
                  pessoas/famílias beneficiadas em{" "}
                  {formatDateBR(p.ultimo.competencia).slice(3)} · total pago{" "}
                  <strong className="font-tabular text-text">
                    {formatCurrencyBRL(p.ultimo.valorTotal ?? 0)}
                  </strong>
                </p>
                {p.variacao12m !== null && (
                  <p className="mt-1 text-xs">
                    {p.variacao12m >= 0 ? "+" : ""}
                    {p.variacao12m.toFixed(0)}% de beneficiários vs. o mesmo mês do ano
                    anterior
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs">Sem dado recente.</p>
            )}
          </DataCard>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 px-6 py-5 text-sm text-text-soft">
        <h2 className="font-display text-base font-semibold text-text">
          O que este dado é — e o que não é
        </h2>
        <p className="mt-2">
          Vem do <strong className="font-semibold text-text">Portal da Transparência</strong>{" "}
          federal, já agregado por município e mês — não é uma lista de
          beneficiários individuais.
        </p>
        <p className="mt-2">
          <strong className="font-semibold text-text">
            A série do Bolsa Família começa em março de 2023
          </strong>
          , quando o programa foi relançado com esse nome. Antes disso ele se
          chamou Auxílio Brasil (2021-2022) e, antes ainda, Bolsa Família
          original (2004-2021) — a API do governo trata cada nome como um
          programa separado, sem unificar o histórico automaticamente. O que
          esta página mostra é só a fase atual, não a série completa desde
          2004.
        </p>
        <p className="mt-2">
          BPC (Benefício de Prestação Continuada) é pago a pessoas idosas ou
          com deficiência em situação de baixa renda, sem prazo definido —
          por isso o número de beneficiários costuma variar menos mês a mês
          que o Bolsa Família.
        </p>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent bg-accent/10 px-6 py-5">
        <div>
          <strong className="text-[1.05em]">Quer conferir na fonte?</strong>
          <p className="mt-1 text-sm text-text-soft">
            O Portal da Transparência publica os valores agregados por
            município mês a mês.
          </p>
        </div>
        <Link
          href="https://portaldatransparencia.gov.br/beneficios"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4.5 py-2.5 text-[.9em] font-semibold text-text"
        >
          Portal da Transparência ↗
        </Link>
      </div>
    </div>
  );
}
