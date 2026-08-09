import { Suspense } from "react";
import type { Metadata } from "next";
import { alertas, coberturaAnalise } from "@/lib/congresso/destaques";
import AlertasLista, { AlertasListaCompleta } from "./AlertasLista";
import { FiltroTema, Rodape, Vazio } from "./FiltroRodapeVazio";

// Re-exportadas para `congresso/bons-exemplos/page.tsx` continuar
// importando de `alertas/page.tsx` sem mudança — ver o porquê da mudança de
// lugar em `FiltroRodapeVazio.tsx`.
export { FiltroTema, Rodape, Vazio };

export const metadata: Metadata = {
  title: "Alertas — projetos que retiram direitos — Controle Popular · Congresso",
  description:
    "Projetos de lei federais que restringem direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.",
};

/**
 * Filtro por `?tema=` foi para o cliente — ver `AlertasLista.tsx` para o
 * porquê e para a nota sobre a ordem "filtra tudo, corta em 60 depois"
 * (a mesma armadilha documentada em `congresso/destaques.ts`).
 */
// Sem `searchParams`, mas com `force-static` mesmo assim: sem ele
// `output: export` trata a rota como dinâmica e aborta com "missing
// generateStaticParams()" — mensagem que não descreve a causa real.
export const dynamic = "force-static";

export default async function Alertas() {
  // SEM tema, SEM limite: o conjunto reducionista inteiro, já ordenado por
  // score (mais grave primeiro). `AlertasLista` filtra por tema e corta em
  // 60 no cliente, na mesma ordem que `lib/congresso/destaques.ts` usava.
  const [todos, cobertura] = await Promise.all([alertas(), coberturaAnalise()]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-bold">
          Alertas <span className="opacity-60">· projetos que retiram direitos</span>
        </h1>
        <p className="max-w-3xl opacity-80">
          Proposições em tramitação que <strong>restringem</strong> direitos segundo a
          régua declarada deste portal. Cada uma mostra qual direito é atingido, o
          dispositivo legal que fundamenta a leitura e o trecho do próprio projeto —
          para você conferir em vez de acreditar.
        </p>
      </header>

      {/* Fallback: sem filtro de tema, os 60 mais graves — o que o servidor
          tem antes de o navegador ler a query, e o conteúdo certo pra quem
          chega sem filtro. */}
      <Suspense fallback={<AlertasListaCompleta todos={todos} cobertura={cobertura} />}>
        <AlertasLista todos={todos} cobertura={cobertura} />
      </Suspense>

      <Rodape cobertura={cobertura} />
    </div>
  );
}
