import FotoBrasilComS from "@/app/components/FotoBrasilComS";

export interface HeaderFrenteBrasilComSProps {
  etiqueta?: string;
  titulo: string;
  descricao: string;
  idFotoBrasilComS: string;
  cor?: string;
  acoes?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Cabeçalho de frente temática com foto do acervo Brasil com S.
 *
 * Conforme especificação do projeto:
 * - A foto do Brasil com S vem menor e posicionada no canto direito;
 * - O título fica ajustado na mesma altura, centralizado à esquerda;
 * - O título tem alto contraste e cor dinâmica que muda com o tema (var(--cp-primary));
 * - Crédito oficial do acervo preservado na legenda.
 */
export default function HeaderFrenteBrasilComS({
  etiqueta,
  titulo,
  descricao,
  idFotoBrasilComS,
  cor,
  acoes,
  children,
}: HeaderFrenteBrasilComSProps) {
  return (
    <header className="relative mb-8 rounded-2xl border border-border/80 bg-surface/60 p-5 sm:p-7 shadow-xs backdrop-blur-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Lado Esquerdo: Título e textos alinhados à esquerda na mesma altura */}
        <div className="flex-1 space-y-3">
          {etiqueta && (
            <p
              className="text-[.82em] font-semibold uppercase tracking-wider text-text-soft"
              style={cor ? { color: cor } : undefined}
            >
              {etiqueta}
            </p>
          )}

          <h1
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight"
            style={{
              color: "var(--cp-primary)",
              textShadow: "0 1px 2px rgba(0,0,0,0.15)",
            }}
          >
            {titulo}
          </h1>

          <p className="max-w-2xl text-[1.05em] text-text-soft leading-relaxed">
            {descricao}
          </p>

          {acoes && <div className="pt-2">{acoes}</div>}
          {children}
        </div>

        {/* Canto Direito: Foto Brasil com S menor e emoldurada */}
        <div className="w-full md:w-60 lg:w-72 shrink-0 self-center md:self-start">
          <FotoBrasilComS
            id={idFotoBrasilComS}
            className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
          />
        </div>
      </div>
    </header>
  );
}
