import type { ReactElement } from "react";
import Link from "next/link";
import { meta } from "./dados";

/**
 * Rodapé da página de gastos de campanha 2026: as lacunas da coleta, a
 * metodologia e a fonte oficial do TSE.
 *
 * Extraído do `page.tsx` (pedido do dono de arquivo curto, 09/10/2026): são as
 * ressalvas que precisam ficar ao lado do número, nunca num rodapé escondido
 * (AGENTS.md § 7 — lacuna é informação; o selo de dado parcial acompanha a
 * página inteira).
 */
export default function SecaoLacunas(): ReactElement {
  return (
    <section aria-labelledby="lacunas" className="space-y-4">
      <h2 id="lacunas" className="font-display text-2xl font-bold">
        Lacunas desta coleta
      </h2>
      <ul className="list-disc space-y-1 pl-6 text-sm opacity-80">
        {meta.lacunas.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <h3 className="font-display text-xl font-bold">Metodologia</h3>
      <p className="max-w-3xl text-sm opacity-80">{meta.metodologia}</p>
      <h3 className="font-display text-xl font-bold">Fonte</h3>
      <p className="max-w-3xl text-sm opacity-80">
        {meta.fonte.nome}:{" "}
        <a
          href={meta.fonte.url_prestacao}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          prestação de contas eleitorais 2026 ↗
        </a>{" "}
        e{" "}
        <a
          href={meta.fonte.url_resultados}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          resultados 2026 ↗
        </a>
        . Conferir linha a linha é baixar o ZIP de cada arquivo oficial. Ver também:{" "}
        <Link href="/congresso/financiamento-eleitoral" className="underline">
          fornecedores de campanha de 2022
        </Link>
        .
      </p>
    </section>
  );
}
