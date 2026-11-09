import NextLink from "next/link";
import type { ReactNode } from "react";

/**
 * Peças visuais compartilhadas pela análise integrada do Rio Doce.
 *
 * Tudo é componente de servidor e CSS/Tailwind puro: nenhuma biblioteca de
 * gráfico foi adicionada. As barras são `div` com largura proporcional e o
 * número sempre visível — o desenho não substitui o valor.
 */

export type TipoMarca = "medido" | "inferido" | "nao";

const ROTULO_MARCA: Record<TipoMarca, string> = {
  medido: "medido",
  inferido: "inferido",
  nao: "não dá para concluir",
};

/** Marca epistemológica colada ao fim de uma conclusão. */
export function Marca({ tipo }: { tipo: TipoMarca }) {
  return (
    <span className="ml-1 inline-block rounded border border-border bg-surface-2 px-1 align-baseline text-[12px] font-semibold leading-4 tracking-wide text-text-soft">
      [{ROTULO_MARCA[tipo]}]
    </span>
  );
}

export function CabecalhoSecao({
  id,
  titulo,
  descricao,
  numero,
}: {
  id: string;
  titulo: string;
  descricao: ReactNode;
  numero?: string;
}) {
  return (
    <header className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-text-soft">
        {numero ? `${numero} · ` : ""}Rio Doce
      </p>
      <h2
        id={id}
        className="mt-1 font-display text-[clamp(1.3em,3vw,1.7em)] font-bold leading-tight tracking-tight"
      >
        {titulo}
      </h2>
      <p className="mt-2 text-[.95em] leading-relaxed text-text-soft">
        {descricao}
      </p>
    </header>
  );
}

export function CartaoNumero({
  rotulo,
  valor,
  detalhe,
  fonte,
  href,
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  fonte: string;
  href?: string;
}) {
  const corpo = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
        {rotulo}
      </p>
      <p className="mt-2 font-tabular text-[clamp(1.45em,4vw,2em)] font-bold leading-none text-text">
        {valor}
      </p>
      <p className="mt-2 text-xs leading-snug text-text-soft">{detalhe}</p>
      <p className="mt-3 text-[12px] font-medium text-primary">
        {fonte}
        {href ? " →" : ""}
      </p>
    </>
  );

  const classe =
    "flex h-full flex-col rounded-xl border border-border bg-surface p-4 transition-colors";
  if (!href) {
    return <div className={classe}>{corpo}</div>;
  }
  return (
    <NextLink
      href={href}
      className={`${classe} hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
    >
      {corpo}
    </NextLink>
  );
}

export function Botao({
  href,
  children,
  variante = "primario",
}: {
  href: string;
  children: ReactNode;
  variante?: "primario" | "contorno";
}) {
  const classe =
    variante === "primario"
      ? "border-primary bg-primary text-[var(--cp-primary-ink)] hover:opacity-90"
      : "border-border bg-surface text-text hover:border-primary hover:text-primary";
  return (
    <NextLink
      href={href}
      className={`inline-flex min-h-10 items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${classe}`}
    >
      {children}
    </NextLink>
  );
}

export function BotaoExterno({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-text transition hover:border-primary hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      {children} ↗
    </a>
  );
}

/** Container de tabela: a rolagem fica DENTRO dele, nunca na página. */
export function TabelaRolavel({
  children,
  legenda,
}: {
  children: ReactNode;
  legenda: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full border-collapse text-xs sm:text-sm">
        <caption className="sr-only">{legenda}</caption>
        {children}
      </table>
    </div>
  );
}

export function BarraValor({
  rotulo,
  valor,
  percentual,
  larguraPercentual,
  detalhe,
  ariaRotulo,
}: {
  rotulo: string;
  valor: string;
  percentual: string;
  larguraPercentual: number;
  detalhe?: string;
  ariaRotulo: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-text">
          {rotulo}
        </p>
        <p className="font-tabular text-sm font-bold text-primary">
          {valor}{" "}
          <span className="text-xs font-normal text-text-soft">
            ({percentual})
          </span>
        </p>
      </div>
      <div
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={ariaRotulo}
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(1, Math.min(100, larguraPercentual))}%` }}
        />
      </div>
      {detalhe ? (
        <p className="mt-1 text-xs leading-snug text-text-soft">{detalhe}</p>
      ) : null}
    </div>
  );
}

export function Aviso({
  children,
  tom = "neutro",
}: {
  children: ReactNode;
  tom?: "neutro" | "atencao";
}) {
  const classe =
    tom === "atencao"
      ? "border-amber-500/40 bg-amber-500/5"
      : "border-border bg-surface-2";
  return (
    <div className={`rounded-xl border p-4 text-sm leading-relaxed ${classe}`}>
      {children}
    </div>
  );
}
