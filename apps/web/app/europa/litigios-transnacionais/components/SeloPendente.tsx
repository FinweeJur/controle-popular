/**
 * Selo de pendência da subfrente de litígios transnacionais.
 *
 * Papel no portal: marcar visualmente o que ainda não foi conferido em
 * fonte oficial, para o leitor não confundir informação confirmada com
 * informação a confirmar. O piso de fonte é `text-xs` (12 px), conforme a
 * regra 5.16 do AGENTS.md.
 */

export default function SeloPendente({ texto = "a conferir" }: { texto?: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
      {texto}
    </span>
  );
}
