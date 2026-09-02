import type { PonteEntreFrentes } from "@/lib/lugares";

const CORES_FRENTE: Record<string, { bg: string; text: string; label: string }> = {
  cidades: { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200", text: "text-emerald-700", label: "Cidades" },
  congresso: { bg: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200", text: "text-blue-700", label: "Congresso" },
  judiciario: { bg: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200", text: "text-amber-700", label: "Judiciário" },
  ambiental: { bg: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200", text: "text-teal-700", label: "ONSA · Meio Ambiente & Terras" },
  paraopeba: { bg: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200", text: "text-purple-700", label: "Paraopeba" },
  executivo_estadual: { bg: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200", text: "text-sky-700", label: "Executivo Estadual" },
  terras: { bg: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200", text: "text-orange-700", label: "Terras & Quilombos" },
};

export default function CartaoPonteSanfona({ ponte }: { ponte: PonteEntreFrentes }) {
  const estiloFrente = CORES_FRENTE[ponte.frenteDestino] ?? {
    bg: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    text: "text-primary",
    label: ponte.frenteDestino,
  };

  const badgeConfianca =
    ponte.nivelConfianca === "fato_documentado" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[0.72rem] font-semibold text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
        Fato documentado
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[0.72rem] font-semibold text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
        Sinal de investigação
      </span>
    );

  return (
    <article className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`rounded-md px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wider ${estiloFrente.bg}`}>
            {estiloFrente.label}
          </span>
          {badgeConfianca}
        </div>

        <h3 className="mt-2.5 font-display text-[1rem] font-semibold leading-snug text-text">
          {ponte.rotuloAmigavel}
        </h3>

        <div className="mt-2 text-[0.84rem] text-text-soft">
          <strong className="font-medium text-text">Por que mostramos isso: </strong>
          {ponte.razaoEditorial}
        </div>

        {ponte.ressalva && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-[0.78rem] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <span className="font-semibold">📌 Ressalva: </span>
            {ponte.ressalva}
          </div>
        )}

        {ponte.fonteOficial && (
          <div className="mt-2 text-[0.72rem] text-text-soft opacity-80">
            Fonte do vínculo: {ponte.fonteOficial}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <a
          href={ponte.rotaDestino}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          Acessar dado na outra frente →
        </a>
      </div>
    </article>
  );
}
