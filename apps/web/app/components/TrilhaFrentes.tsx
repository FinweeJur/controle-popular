import Link from "next/link";

/**
 * Trilha entre as frentes que tratam do mesmo assunto por ângulos diferentes.
 *
 * POR QUE EXISTE
 *
 * Legislação, direito comparado, direitos humanos e jurisprudência respondem à
 * mesma pergunta por caminhos distintos. Quem chega numa delas raramente sabe
 * que as outras existem. Aqui a página mostra as três irmãs, sem menu escondido.
 *
 * REGRA: link interno com `next/link` (AGENTS §5.13); texto de 12 px ou mais
 * (§5.16).
 */

interface Frente {
  rota: string;
  titulo: string;
  texto: string;
}

const FRENTES: Frente[] = [
  {
    rota: "/ambiental/legislacao",
    titulo: "Legislação",
    texto: "Normas federais, estaduais e acordos que regem o desastre e a reparação.",
  },
  {
    rota: "/direitos-comparados",
    titulo: "Direito comparado",
    texto: "Como outros países tratam reparação de desastre e direitos humanos.",
  },
  {
    rota: "/ambiental/direitos-humanos",
    titulo: "Direitos humanos",
    texto: "Relatórios internacionais e nacionais sobre as pessoas atingidas.",
  },
  {
    rota: "/jurisprudencia",
    titulo: "Jurisprudência",
    texto: "O que os tribunais decidem, tese por tese, com ementa e inteiro teor.",
  },
  {
    rota: "/europa/legislacao-transnacionais",
    titulo: "Direito global e transnacional",
    texto: "Normas e casos de outros países e de organismos internacionais.",
  },
];

export function TrilhaFrentes({ atual }: { atual: string }) {
  const outras = FRENTES.filter((frente) => frente.rota !== atual);
  if (outras.length === 0) return null;
  return (
    <nav aria-label="Outras frentes do mesmo assunto" className="space-y-2">
      <p className="text-xs uppercase tracking-wide opacity-60">Continue por aqui</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {outras.map((frente) => (
          <Link
            key={frente.rota}
            href={frente.rota}
            className="rounded-lg border border-[var(--cp-border)] p-3 transition-colors hover:border-[var(--cp-primary)]"
          >
            <span className="block text-sm font-semibold">{frente.titulo}</span>
            <span className="mt-1 block text-xs leading-relaxed opacity-70">
              {frente.texto}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
