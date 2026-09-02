export interface DadosImpactoPovoGente {
  lugarNome: string;
  resumoImpacto?: string;
  saude: {
    indicador: string;
    descricao: string;
    fonte: string;
  };
  trabalhoERenda: {
    atividadePrincipal: string;
    vulnerabilidade: string;
    fonte: string;
  };
  moradia: {
    situacao: string;
    familiasRisco: string;
    fonte: string;
  };
  cultura: {
    manifestacao: string;
    ameacaOuPotencia: string;
    fonte: string;
  };
}

interface BlocoPovoGenteProps {
  dados: DadosImpactoPovoGente;
  variacao?: "povo" | "gente";
}

export default function BlocoPovoGente({ dados, variacao = "povo" }: BlocoPovoGenteProps) {
  const titulo = variacao === "gente" ? "E nossa gente?" : "E nosso povo?";

  return (
    <section aria-labelledby="titulo-bloco-povo-gente" className="mt-14 rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-primary">
            Impacto Social & Vida Real
          </span>
          <h2 id="titulo-bloco-povo-gente" className="mt-1 font-display text-[1.6rem] font-semibold tracking-tight text-text">
            {titulo}
          </h2>
        </div>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-text-soft border border-border">
          {dados.lugarNome}
        </span>
      </div>

      <p className="mt-3 text-[0.95rem] text-text-soft leading-relaxed max-w-3xl">
        {dados.resumoImpacto ??
          `Proteger a natureza é proteger quem vive nela. Veja como as decisões ambientais, a conservação das águas e o uso da terra impactam diretamente a saúde, a renda, a moradia e a cultura das pessoas que habitam ${dados.lugarNome}.`}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saúde & Água */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-2 p-5">
          <div>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <span className="text-lg">🩺</span>
              <h3 className="font-semibold text-[0.92rem]">Saúde & Água</h3>
            </div>
            <p className="mt-2 text-[0.82rem] font-semibold text-text">
              {dados.saude.indicador}
            </p>
            <p className="mt-1.5 text-[0.8rem] text-text-soft leading-snug">
              {dados.saude.descricao}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border text-[0.7rem] text-text-soft">
            Fonte: {dados.saude.fonte}
          </div>
        </div>

        {/* Trabalho & Renda */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-2 p-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="text-lg">🎣</span>
              <h3 className="font-semibold text-[0.92rem]">Trabalho & Renda</h3>
            </div>
            <p className="mt-2 text-[0.82rem] font-semibold text-text">
              {dados.trabalhoERenda.atividadePrincipal}
            </p>
            <p className="mt-1.5 text-[0.8rem] text-text-soft leading-snug">
              {dados.trabalhoERenda.vulnerabilidade}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border text-[0.7rem] text-text-soft">
            Fonte: {dados.trabalhoERenda.fonte}
          </div>
        </div>

        {/* Moradia & Risco */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-2 p-5">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="text-lg">🏡</span>
              <h3 className="font-semibold text-[0.92rem]">Moradia & Risco</h3>
            </div>
            <p className="mt-2 text-[0.82rem] font-semibold text-text">
              {dados.moradia.situacao}
            </p>
            <p className="mt-1.5 text-[0.8rem] text-text-soft leading-snug">
              {dados.moradia.familiasRisco}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border text-[0.7rem] text-text-soft">
            Fonte: {dados.moradia.fonte}
          </div>
        </div>

        {/* Cultura & Identidade */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-surface-2 p-5">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <span className="text-lg">🏺</span>
              <h3 className="font-semibold text-[0.92rem]">Cultura & Saber</h3>
            </div>
            <p className="mt-2 text-[0.82rem] font-semibold text-text">
              {dados.cultura.manifestacao}
            </p>
            <p className="mt-1.5 text-[0.8rem] text-text-soft leading-snug">
              {dados.cultura.ameacaOuPotencia}
            </p>
          </div>
          <div className="mt-4 pt-2 border-t border-border text-[0.7rem] text-text-soft">
            Fonte: {dados.cultura.fonte}
          </div>
        </div>
      </div>
    </section>
  );
}
