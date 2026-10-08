"use client";

import { useMemo, useState } from "react";
import { filtrarPaginas, type PaginaCatalogo } from "@/lib/indice/catalogo";
import CatalogoControles from "./CatalogoControles";
import CatalogoCartao from "./CatalogoCartao";

/**
 * @file Catalogo100PaginasClient.tsx — seção "As 100 Principais Páginas" de
 * `/indice`.
 *
 * O QUE É: componente de cliente que recebe a lista versionada em
 * `apps/web/data/top-100-paginas.json` (montada no `page.tsx` da rota),
 * guarda o estado dos três filtros (busca, eixo, apenas-destaques) e
 * desenha a grade de cartões. É o hotspot de saúde 2,17 da leitura do
 * CodeScene de 07/10/2026 (`docs/planos/PENDENCIAS-07-10.md`).
 *
 * POR QUE ENXUTO: até 08/10/2026 este arquivo tinha 505 linhas com a cadeia
 * de ~16 ramos que escolhia o ícone (195 linhas), o `if-chain` de estilos do
 * eixo e o cartão inteiro embutido no JSX. A lógica pura foi para
 * `lib/indice/catalogo.ts` (com teste em `catalogo.test.ts`), e o desenho
 * para `CatalogoControles.tsx` (cabeçalho + filtros) e `CatalogoCartao.tsx`
 * (um cartão). Aqui ficou só o que precisa de estado React.
 *
 * O QUE NÃO MUDOU: mesmas classes Tailwind, mesmos textos, mesma ordem de
 * filtragem, mesmos `aria-label`/`role`/`aria-selected` e a mesma regra de
 * link — rota interna em `next/link`, externa em `<a target="_blank">`
 * (AGENTS §5.13; ver `CatalogoCartao.tsx`).
 */

// O tipo continua saindo DAQUI de propósito: `page.tsx` e qualquer outro
// importador não mudam de endereço por causa desta refatoração.
export type { PaginaCatalogo };

interface Props {
  paginas: PaginaCatalogo[];
}

/**
 * Seção do catálogo das 100 páginas com busca, abas de eixo e destaque.
 *
 * @param props.paginas lista completa das páginas (JSON versionado), já na
 * ordem de exibição.
 */
export default function Catalogo100PaginasClient({ paginas }: Props) {
  const [busca, setBusca] = useState("");
  const [eixoAtivo, setEixoAtivo] = useState<string>("Todos");
  const [apenasDestaques, setApenasDestaques] = useState(false);

  // Memo porque o filtro varre os 100 registros a cada tecla digitada; a
  // regra em si mora em lib/indice/catalogo.ts (e é testada lá).
  const paginasFiltradas = useMemo(
    () => filtrarPaginas(paginas, { termo: busca, eixoAtivo, apenasDestaques }),
    [paginas, busca, eixoAtivo, apenasDestaques]
  );

  return (
    <section id="catalogo-100-paginas" className="space-y-6 scroll-mt-20">
      <CatalogoControles
        busca={busca}
        onBusca={setBusca}
        eixoAtivo={eixoAtivo}
        onEixoAtivo={setEixoAtivo}
        apenasDestaques={apenasDestaques}
        onAlternarDestaques={() => setApenasDestaques(!apenasDestaques)}
        totalPaginas={paginas.length}
        totalFiltradas={paginasFiltradas.length}
      />

      {/* Grid de Páginas — Design 25% mais compacto, estreito e 100% clicável */}
      {paginasFiltradas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-text-soft">
          <p className="text-base font-medium text-text">Nenhuma página encontrada para esta busca.</p>
          <p className="mt-1 text-xs">Tente buscar por termos mais genéricos ou selecionar &quot;Todos&quot; os eixos.</p>
          <button
            type="button"
            onClick={() => { setBusca(""); setEixoAtivo("Todos"); }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {paginasFiltradas.map((p) => (
            <CatalogoCartao key={p.numero} pagina={p} />
          ))}
        </div>
      )}
    </section>
  );
}
