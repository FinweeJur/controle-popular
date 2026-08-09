"use client";

import { useSearchParams } from "next/navigation";
import CardDestaque from "@/app/congresso/components/CardDestaque";
import type { Destaque } from "@/lib/congresso/destaques";
import { casaComTema, temaPorSlug } from "@/lib/congresso/temas";
import { FiltroTema, Vazio } from "./FiltroRodapeVazio";

/**
 * Lista de `/congresso/alertas`, com o filtro por `?tema=` movido do
 * SERVIDOR para o NAVEGADOR.
 *
 * ═══ POR QUE MUDOU ═══
 *
 * A página lia `tema` no servidor e chamava `alertas(60, tema)` — dinâmica
 * (`ƒ`), 500 em produção quando o Worker não alcança o Postgres local (ver
 * `docs/deploy-github-pages.md` §9.3).
 *
 * ═══ A ARMADILHA DO LIMIT 60 ═══
 *
 * `alertas(limite, tema)` filtra por tema NO CONJUNTO INTEIRO e só depois
 * corta em `limite` — nessa ordem, não ao contrário. Se o cliente filtrasse
 * por cima de um `alertas(60)` sem tema, o filtro operaria só sobre os 60
 * primeiros (por score) e mentiria: um alerta de um tema específico que
 * estivesse na posição 80 sumiria mesmo existindo. Por isso a página agora
 * pede `alertas()` SEM limite nem tema — o conjunto inteiro, já ordenado por
 * score — e este componente repete a mesma ordem de operações (filtra,
 * depois corta em 60).
 *
 * Medido em 2026-08-09: só **18 análises reducionistas** no banco local (16
 * `reducionista` + 2 `reducionista_forte`) — hoje o corte de 60 nem chega a
 * valer, mas a lógica precisa estar certa para quando crescer.
 *
 * `FiltroTema`/`Vazio` saíram de `page.tsx` para `FiltroRodapeVazio.tsx` —
 * ver o comentário lá para o porquê (importar de `page.tsx` arrastaria
 * `lib/congresso/destaques.ts` pro bundle do cliente). `page.tsx` re-exporta
 * as duas, então `congresso/bons-exemplos` continua importando sem mudança.
 * `casaComTema`/`temaPorSlug` vêm de `lib/congresso/temas.ts`, que só lê um
 * JSON estático — seguro de importar direto no cliente.
 */
export interface AlertasListaProps {
  todos: Destaque[];
  cobertura: { analisadas: number; total: number };
}

const LIMITE = 60;

function Conteudo({ todos, cobertura, temaSlug }: AlertasListaProps & { temaSlug?: string }) {
  const tema = temaSlug ? temaPorSlug(temaSlug) : undefined;
  const filtrados = tema ? todos.filter((d) => casaComTema(tema, d, d.direitos)) : todos;
  const lista = filtrados.slice(0, LIMITE);

  return (
    <>
      <FiltroTema atual={tema?.slug} base="/alertas" />

      {lista.length === 0 ? (
        <Vazio cobertura={cobertura} tema={tema?.nome} />
      ) : (
        <>
          <p className="text-sm opacity-70">
            {lista.length} {lista.length === 1 ? "proposição" : "proposições"}
            {tema ? ` em ${tema.nome}` : ""}, da mais grave para a menos.
          </p>
          <div className="space-y-4">
            {lista.map((d) => (
              <CardDestaque key={d.id} d={d} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

/**
 * Fallback do `<Suspense>`: sem filtro de tema, os 60 mais graves.
 *
 * Não pode chamar `useSearchParams()` — mesmo componente nos dois lados do
 * `<Suspense>` derruba o `next build` com "should be wrapped in a suspense
 * boundary", e só lá.
 */
export function AlertasListaCompleta(props: AlertasListaProps) {
  return <Conteudo {...props} temaSlug={undefined} />;
}

export default function AlertasLista(props: AlertasListaProps) {
  const sp = useSearchParams();
  return <Conteudo {...props} temaSlug={sp.get("tema") ?? undefined} />;
}
