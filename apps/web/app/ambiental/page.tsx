import Link from "@/lib/ambiental/link";
import { ZONAS } from "@/lib/zonas";
import { formatNumberBR } from "@/lib/betim/format";
import { contarReunioesCopam } from "@/lib/db/queries/copam";
import { contarBarragensMg } from "@/lib/db/queries/barragens";

/**
 * Home da zona /ambiental.
 *
 * Os números dos blocos NÃO são estimativa nem promessa: saíram do censo
 * das fontes feito na F0 e estão registrados em
 * `docs/ambiental/F0-discovery.md` com a data da medição. Página em
 * construção que inventa número é como gráfico sem cobertura declarada —
 * a regra do projeto vale aqui também.
 *
 * ═══ F3 (COPAM) SAIU DE "EM BREVE" PARA TELA REAL ═══
 *
 * Até aqui o bloco de reuniões do COPAM anunciava "454 reuniões" como
 * texto fixo — o número que a FONTE publica, não o que este portal tinha
 * coletado (zero). Isso deixou de ser honesto no instante em que a coleta
 * ficou real (`etl.apis.copam_reunioes`, migration `0058`): agora o número
 * vem do banco, com o verbo no passado ("coletadas"), e o bloco é um link
 * de verdade para `/ambiental/copam` — não mais só uma promessa de fase.
 *
 * ═══ F5 (BARRAGENS) MESMA CORREÇÃO, 2026-08-11 ═══
 *
 * O bloco dizia "A fonte publica 249 barragens em Minas" com `href: null` —
 * desatualizado (a coleta rodou: FEAM 249 + SNISB ~2.212, não só a FEAM) E
 * incompleto (sem link). Corrigido pro mesmo padrão do COPAM acima.
 */

const ZONA = ZONAS.find((z) => z.id === "ambiental")!;

export default async function AmbientalHome() {
  const [{ reunioes, itens }, barragens] = await Promise.all([
    contarReunioesCopam(),
    contarBarragensMg(),
  ]);
  const temBarragens = barragens.totalFeam > 0 || barragens.totalSnisb > 0;

  const BLOCOS = [
    {
      titulo: "Reuniões do COPAM",
      linha:
        reunioes > 0
          ? `${formatNumberBR(reunioes)} reuniões coletadas, ${formatNumberBR(itens)} itens de pauta`
          : "A fonte publica 454 reuniões — coleta ainda não rodou",
      texto:
        "O Conselho Estadual de Política Ambiental publica as reuniões com antecedência. Aqui já dá para ver a pauta item a item, com o município que cada processo trata, antes da decisão sair.",
      fase: "F3",
      href: "/copam",
      pronta: reunioes > 0,
      linkTexto: "Ver a pauta →",
    },
    {
      titulo: "Licenciamento",
      linha: "A fonte publica 19.162 licenças emitidas",
      texto:
        "Filtro por município, empresa, setor do empreendimento, modalidade, classe, potencial poluidor e período. O setor vem da própria Deliberação Normativa Copam 217/2017, não de uma classificação inventada aqui.",
      fase: "F4",
      href: null,
      pronta: false,
      linkTexto: "",
    },
    {
      titulo: "Barragens",
      linha: temBarragens
        ? `${formatNumberBR(barragens.totalFeam)} da FEAM + ${formatNumberBR(barragens.totalSnisb)} do SNISB, coletadas`
        : "A fonte publica 249 barragens em Minas — coleta ainda não rodou",
      texto:
        "Condição de estabilidade, nível de emergência, método construtivo e categoria de risco, do inventário da FEAM (mineração e indústria) ao lado do cadastro nacional do SNISB (todos os usos) — as duas fontes lado a lado, nunca somadas.",
      fase: "F5",
      href: "/barragens",
      pronta: temBarragens,
      linkTexto: "Ver as barragens →",
    },
    {
      titulo: "Legislação ambiental",
      linha: "Federal e estadual no mesmo lugar",
      texto:
        "Hoje a norma que interessa está partida entre cinco sistemas que não conversam: MMA, Conama, ALMG, Siam e o banco da Semad. Aqui vira uma busca só.",
      fase: "F6",
      href: null,
      pronta: false,
      linkTexto: "",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: ZONA.cor }}
        >
          {ZONA.etiqueta}
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{ZONA.titulo}</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">{ZONA.descricao}</p>

        <p
          className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
          style={{ borderColor: ZONA.cor }}
        >
          <strong>Seção em construção, por fase.</strong> A pauta do COPAM (F3) e as barragens de
          Minas (F5) já têm tela real, abaixo. Licenciamento e legislação seguem com fonte
          verificada e documentada, tela ainda não.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {BLOCOS.map((b) => {
          const conteudo = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">{b.titulo}</h2>
                <span className="shrink-0 text-[.75em] font-medium text-text-soft">
                  {b.fase}
                </span>
              </div>
              <p className="mt-1 font-medium" style={{ color: ZONA.cor }}>
                {b.linha}
              </p>
              <p className="mt-2 flex-1 text-[.92em] text-text-soft">{b.texto}</p>
              {b.pronta && b.href ? (
                <p className="mt-3 text-[.85em] font-semibold" style={{ color: ZONA.cor }}>
                  {b.linkTexto}
                </p>
              ) : null}
            </>
          );
          return b.pronta && b.href ? (
            <Link
              key={b.titulo}
              href={b.href}
              className="flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-current"
            >
              {conteudo}
            </Link>
          ) : (
            <section
              key={b.titulo}
              className="flex flex-col rounded-lg border border-border bg-surface p-5"
            >
              {conteudo}
            </section>
          );
        })}
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Portal EcoSistemas e IDE-Sisema (Semad), inventário de barragens da FEAM, cadastro
          nacional de barragens SNISB (ANA), dados abertos da ALMG, Siam, banco de legislação
          da Semad, CKAN do MMA e Conama. Cada fonte tem data de verificação e licença
          registradas — nenhuma delas veda uso comercial, e é por isso que estão aqui.
        </p>
      </section>
    </div>
  );
}
