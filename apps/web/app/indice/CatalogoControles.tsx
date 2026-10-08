"use client";

import { Search, Filter, Sparkles } from "lucide-react";

/**
 * Cabeçalho e controles do Catálogo das 100 Páginas (`/indice`): título da
 * seção, contador "Exibindo X de Y", busca instantânea, abas de eixo e o
 * botão "Apenas Destaques".
 *
 * O QUE É: extraído de `Catalogo100PaginasClient.tsx` em 08/10/2026 para
 * enxugar o hotspot de saúde 2,17 (CodeScene, leitura de 07/10 em
 * `docs/planos/PENDENCIAS-07-10.md`). As classes, os textos e os atributos de
 * acessibilidade são os MESMOS de antes — `role="tablist"` na lista de eixos,
 * `role="tab"` + `aria-selected` em cada aba e `aria-label` no campo de busca
 * continuam onde estavam.
 *
 * O componente NÃO guarda estado: busca, eixo e destaque vivem no pai
 * (que também faz o `useMemo` do filtro), e este pedaço só desenha e
 * devolve o que o leitor clicou. Sem estado próprio, o contador sempre
 * enxerga a lista já filtrada.
 *
 * @param props estado dos controles (só leitura) + callbacks de mudança +
 * contadores da seção.
 */
interface Props {
  busca: string;
  onBusca: (valor: string) => void;
  eixoAtivo: string;
  onEixoAtivo: (eixo: string) => void;
  apenasDestaques: boolean;
  onAlternarDestaques: () => void;
  /** Total de páginas do catálogo (denominador do contador). */
  totalPaginas: number;
  /** Total de páginas que passaram no filtro (numerador do contador). */
  totalFiltradas: number;
}

/** Abas de filtro, na ordem em que aparecem na tela. "Todos" é o padrão. */
const EIXOS = [
  "Todos",
  "Eixo 1: Terra e Território",
  "Eixo 2: Direitos em Movimento",
  "Eixo 3: Estado e Economia",
  "Central ONSA & Ferramentas",
] as const;

export default function CatalogoControles({
  busca,
  onBusca,
  eixoAtivo,
  onEixoAtivo,
  apenasDestaques,
  onAlternarDestaques,
  totalPaginas,
  totalFiltradas,
}: Props) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
            As 100 Principais Páginas do Portal
          </h2>
          <p className="mt-1 text-sm text-text-soft">
            Catálogo completo e auditado de rotas com potencial de interesse social, microresumos e fontes oficiais.
          </p>
        </div>
        <div className="text-xs font-mono text-text-soft bg-surface-2 px-3 py-1.5 rounded-lg self-start sm:self-auto border border-border">
          Exibindo <span className="font-bold text-primary">{totalFiltradas}</span> de {totalPaginas}
        </div>
      </div>

      {/* Controles: Busca e Filtro de Eixo */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-soft" aria-hidden="true" />
          <input
            type="search"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder="Filtrar por título, assunto, rota ou município (ex: SUS, Mariana, Betim, Editais, CAR)..."
            aria-label="Filtrar catálogo das 100 páginas"
            className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-10 pr-4 text-sm text-text outline-none transition placeholder:text-text-soft focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Filtrar por eixo">
            <span className="flex items-center gap-1 text-xs font-semibold text-text-soft mr-1">
              <Filter className="h-3 w-3" /> Eixos:
            </span>
            {EIXOS.map((e) => {
              const ativo = eixoAtivo === e;
              const rotuloCurto = e.replace("Eixo 1: ", "").replace("Eixo 2: ", "").replace("Eixo 3: ", "");
              return (
                <button
                  key={e}
                  type="button"
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => onEixoAtivo(e)}
                  className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    ativo
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border border-border bg-surface-2/60 text-text-soft hover:bg-surface-2 hover:text-text"
                  }`}
                >
                  {rotuloCurto}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onAlternarDestaques}
            className={`cursor-pointer inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border ${
              apenasDestaques
                ? "border-primary bg-primary/20 text-primary shadow-xs ring-1 ring-primary"
                : "border-border bg-surface-2/60 text-text-soft hover:border-primary/50 hover:text-primary"
            }`}
          >
            <span>✦</span>
            <span>Apenas Destaques</span>
          </button>
        </div>
      </div>
    </>
  );
}
