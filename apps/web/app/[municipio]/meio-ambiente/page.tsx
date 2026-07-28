import Link from "@/lib/betim/link";

export const metadata = {
  title: "Meio Ambiente — Betim em Dados | Controle Popular Betim",
  description:
    "O que existe de fonte pública sobre meio ambiente na região de Betim-MG: barragens de mineração, compensação ambiental e TACs.",
};

// Nenhuma fonte encontrada tem API/dataset aberto por município --
// pesquisa completa em docs/ambiental-pecma-research.md (2026-07-21).
// Página informativa, sem ETL, seguindo o mesmo padrão de /defesa-civil:
// organizar os canais/fontes reais em vez de inventar indicador que essa
// pesquisa já confirmou não existir aberto.
const FONTES = [
  {
    nome: "Barragens a montante na região — MPMG",
    desc: '"Desativando Bombas-Relógio": 54 barragens erguidas pelo método mais arriscado (o mesmo de Mariana e Brumadinho), monitoradas em Minas Gerais. Nenhuma está dentro de Betim, mas 3 municípios que fazem fronteira direta com Betim aparecem na lista: Igarapé, Itatiaiuçu e Sarzedo — risco regional real (bacia hidrográfica compartilhada, rotas de evacuação).',
    href: "https://barragens.mpmg.mp.br/",
    cta: "Ver mapa de barragens",
  },
  {
    nome: "PECMA — Compensação de multas ambientais",
    desc: "Programa estadual que permite converter multa ambiental em investimento em projeto de recuperação. 9.712 adesões ativas e R$357,5 milhões envolvidos em todo o estado (dado agregado, não por município) — SEMAD ainda não publica esse número aberto por cidade.",
    href: "https://www.agenciaminas.mg.gov.br/",
    cta: "Sobre o programa (SEMAD)",
  },
  {
    nome: "TACs ambientais — Portal Ecosistemas (MPMG)",
    desc: "Termos de Ajustamento de Conduta ambientais do estado. O sistema de busca antigo foi descontinuado; o atual exige navegação própria e não expõe um endpoint público filtrável por município que já tenhamos confirmado.",
    href: "https://ecosistemas.meioambiente.mg.gov.br/gtac/acessoExterno",
    cta: "Consultar TACs",
  },
];

export default function MeioAmbientePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Meio Ambiente
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Betim não tem um indicador ambiental por município com fonte aberta
        confirmada ainda — o que existe de real e verificável está
        organizado abaixo, incluindo um risco regional que afeta Betim mesmo
        sem estar dentro do município.
      </p>

      <Link
        href="/meio-ambiente/paraopeba"
        className="cp-card-hover mt-6 flex flex-col gap-2 rounded-2xl border border-primary bg-primary/5 p-5 shadow-sm hover:border-primary"
      >
        <p className="font-display font-semibold text-text">
          Reparação do Rio Paraopeba em Betim
        </p>
        <p className="text-sm text-text-soft">
          Projetos ligados ao Acordo Geral pelo rompimento da barragem da
          Vale em Brumadinho (2019), com valor, status e link direto pra
          cada projeto — auditoria independente da FGV.
        </p>
        <span className="mt-1 inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
          Ver projetos →
        </span>
      </Link>

      <section className="mt-8 flex flex-col gap-3">
        {FONTES.map((f) => (
          <a
            key={f.href}
            href={f.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cp-card-hover flex flex-col gap-2 rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
          >
            <p className="font-display font-semibold text-text">{f.nome}</p>
            <p className="text-sm text-text-soft">{f.desc}</p>
            <span className="mt-1 inline-block w-fit rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink">
              {f.cta} ↗
            </span>
          </a>
        ))}
      </section>

      <p className="mt-8 text-xs text-text-soft">
        Pesquisado ao vivo em 2026-07-21 e conferido de novo em 2026-07-23.
        Se você conhece uma fonte com dado aberto por município que não está
        aqui,{" "}
        <Link href="/contatos" className="text-accent hover:underline">
          avise a gente
        </Link>
        .
      </p>
    </main>
  );
}
