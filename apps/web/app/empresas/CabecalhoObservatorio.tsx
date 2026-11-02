import Link from "next/link";

/**
 * @file Cabeçalho do Observatório de Empresas & Fundos (`/empresas`).
 *
 * O QUE É: trilha de navegação, título e as quatro portas para os acervos
 * irmãos — fortunas, conglomerados, executivos e documentos. Extraído da
 * `page.tsx` para a página caber no limite de tamanho de função do CodeScene,
 * sem tirar um caractere do que o leitor vê.
 *
 * POR QUE AS PORTAS FICAM AQUI: elas são `next/link` (AGENTS §5.13) e levam a
 * páginas que NÃO são recorte desta listagem — cada uma tem acervo próprio.
 * Ficarem no topo evita que a faixa de facetas seja confundida com o acervo
 * inteiro do eixo.
 *
 * FONTE: nenhuma. Só navegação; nenhum número é impresso aqui.
 */

const PORTAS = [
  {
    href: "/empresas/fortunas",
    rotulo: "💰 1.000 Maiores Fortunas",
    classe:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
  },
  {
    href: "/empresas/conglomerados",
    rotulo: "🕸️ Monopólios & Holdings",
    classe:
      "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20",
  },
  {
    href: "/empresas/executivos",
    rotulo: "👔 CEOs & Conselhos",
    classe:
      "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20",
  },
  {
    href: "/empresas/documentos",
    rotulo: "📚 520 Relatórios ESG & CVM",
    classe: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20",
  },
] as const;

export default function CabecalhoObservatorio() {
  return (
    <>
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/" className="hover:text-primary transition">
          Início
        </Link>{" "}
        ·{" "}
        <Link href="/estado-e-economia" className="hover:text-primary transition">
          Estado & Economia
        </Link>{" "}
        · <span className="text-foreground font-semibold">Grandes Empresas & Fundos</span>
      </nav>

      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <span>🏛️ Setores Estratégicos & Mercado de Capitais</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Observatório de Grandes Empresas & Fundos
        </h1>
        <p className="max-w-4xl text-sm sm:text-base text-muted leading-relaxed">
          Acompanhamento cívico e vigilância cidadã sobre as 130 maiores corporações e fundos de
          investimento atuantes no Brasil. Cruze cotações na B3 e NYSE com licenciamentos ambientais
          da FEAM e IBAMA, processos minerários na ANM, contratos públicos no PNCP, auditorias do
          Tribunal de Contas e TACs do Ministério Público.
        </p>
        <div className="pt-2 flex flex-wrap gap-2.5">
          {PORTAS.map((porta) => (
            <Link
              key={porta.href}
              href={porta.href}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-semibold transition shadow-2xs ${porta.classe}`}
            >
              <span>{porta.rotulo}</span>
              <span>→</span>
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}
