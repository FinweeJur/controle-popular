import type { SubfrenteId } from "@/lib/eixos/types";
import FichaCard from "@/app/components/eixos/FichaCard";
import RelacaoSuggestions from "@/app/components/eixos/RelacaoSuggestions";
import { listarFichasPorSubfrente } from "@/lib/eixos/fichas";

/**
 * @file Lista de fichas de uma subfrente, dentro do painel de serviços.
 *
 * O QUE É: o bloco que fecha cada recorte — as fichas catalogadas do eixo e as
 * sugestões cruzadas. Era repetido três vezes, uma por rota; agora é um só.
 *
 * FONTE: `data/fichas/catalogo.json`, via `lib/eixos/fichas`. O N exibido é a
 * contagem real do catálogo para aquela subfrente — é o mesmo N do botão da
 * faceta, e por isso os dois não podem discordar.
 *
 * O catálogo é pequeno de propósito: ficha entra só com diagnóstico fechado e
 * fonte. Contagem baixa aqui é o estado do acervo, não erro de tela.
 */

export default function FichasDaSubfrente({
  subfrente,
  titulo,
  descricao,
}: {
  subfrente: SubfrenteId;
  titulo: string;
  descricao: string;
}) {
  const fichas = listarFichasPorSubfrente(subfrente);
  const destaque = fichas[0];

  return (
    <section aria-labelledby={`titulo-fichas-${subfrente}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2
            id={`titulo-fichas-${subfrente}`}
            className="font-display text-xl sm:text-2xl font-bold text-foreground"
          >
            {titulo}
          </h2>
          <p className="text-sm text-muted">{descricao}</p>
        </div>
        <span className="rounded-full bg-surface-2 border border-border px-3 py-1 text-xs font-semibold text-muted">
          {fichas.length} {fichas.length === 1 ? "ficha catalogada" : "fichas catalogadas"}
        </span>
      </div>

      {fichas.length ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {fichas.map((ficha) => (
            <FichaCard key={ficha.id} ficha={ficha} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted">
          Nenhuma ficha catalogada nesta subfrente até agora. O painel não inventa
          diagnóstico para preencher a lista.
        </p>
      )}

      {destaque ? <RelacaoSuggestions fichaAtual={destaque} /> : null}
    </section>
  );
}
