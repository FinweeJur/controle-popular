"use client";

/**
 * Painel interativo de concessões e PPPs de Minas Gerais.
 *
 * Implementa as seis qualidades do padrão do Controle Popular:
 * 1. Link direto e verificado à fonte oficial em cada contrato;
 * 2. Busca em tempo real (tolerante a acento) e filtros por natureza/setor/situação;
 * 3. Ordenação crescente/decrescente por contrato, ano, concessionária e valores;
 * 4. Cartões de topo e microresumo cívico com números medidos do recorte;
 * 5. Linguagem acessível (Seu Nonô), com a ressalva editorial sobre natureza;
 * 6. Exportação CSV (BOM UTF-8, `;`), gráfico nativo em texto/barra e `@media print`.
 *
 * Componente de CLIENTE: recebe o array de 20 contratos do servidor e faz a
 * interação no navegador. São 20 registros — pequeno o bastante para não exigir
 * paginação no servidor (ver AGENTS §5.1 para o limite que exige).
 */

import React, { useMemo, useState } from "react";
import {
  type ContratoPpp,
  type MetadadosPpp,
  type MetricasPpp,
  filtrarPpps,
  calcularMetricasPpp,
  gerarCsvPpp,
  gerarMicroresumoPpp,
  rotuloNatureza,
  rotuloSetor,
} from "@/lib/ambiental/ppp";
import { formatCNPJ, formatCurrencyBRL, formatCurrencyCompactaBR, formatDateBR, formatNumberBR } from "@/lib/betim/format";

interface Props {
  metadados: MetadadosPpp;
  contratos: ContratoPpp[];
}

type CampoOrdenacao =
  | "numeroContrato"
  | "ano"
  | "concessionaria"
  | "valorInicial"
  | "valorAtual"
  | "dataInicio";

/** Classe da tarja de cada natureza — a cor nunca é o único canal (há o texto). */
const CLASSE_NATUREZA: Record<string, string> = {
  instrumento_concessao: "bg-accent/10 text-accent border-accent/30",
  supervisao_verificacao: "bg-primary/10 text-primary border-primary/30",
  estruturacao_estudos: "bg-surface-2 text-text-soft border-border",
};

/** Valor em reais legível de relance, com o número cheio no `title`. */
function Valor({ numero, className }: { numero: number; className?: string }) {
  return (
    <span className={className} title={formatCurrencyBRL(numero)}>
      {formatCurrencyCompactaBR(numero)}
    </span>
  );
}

/** Barra horizontal de contagem — usada para natureza e setor. */
function BarraContagem({
  rotulo,
  quantidade,
  maximo,
}: {
  rotulo: string;
  quantidade: number;
  maximo: number;
}) {
  const pct = maximo > 0 ? (quantidade / maximo) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-text">{rotulo}</span>
        <span className="text-text-soft tabular-nums">{formatNumberBR(quantidade)} contratos</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-3 rounded-full bg-accent"
          style={{ width: `${Math.max(pct, 2)}%` }}
          role="progressbar"
          aria-valuenow={quantidade}
          aria-valuemin={0}
          aria-valuemax={maximo}
        />
      </div>
    </div>
  );
}

export default function PppClient({ metadados, contratos }: Props) {
  const [busca, setBusca] = useState("");
  const [naturezaFiltro, setNaturezaFiltro] = useState("todas");
  const [setorFiltro, setSetorFiltro] = useState("todos");
  const [situacaoFiltro, setSituacaoFiltro] = useState("todas");
  const [coluna, setColuna] = useState<CampoOrdenacao>("valorInicial");
  const [crescente, setCrescente] = useState(false);

  const naturezasDisponiveis = useMemo(
    () => Array.from(new Set(contratos.map((c) => c.natureza))),
    [contratos]
  );
  const setoresDisponiveis = useMemo(
    () => Array.from(new Set(contratos.map((c) => c.setor))).sort(),
    [contratos]
  );
  const situacoesDisponiveis = useMemo(
    () => Array.from(new Set(contratos.map((c) => c.situacao))).sort(),
    [contratos]
  );

  const filtrados = useMemo(
    () =>
      filtrarPpps(contratos, {
        busca,
        natureza: naturezaFiltro,
        setor: setorFiltro,
        situacao: situacaoFiltro,
      }),
    [contratos, busca, naturezaFiltro, setorFiltro, situacaoFiltro]
  );

  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      const va = a[coluna];
      const vb = b[coluna];
      const comp =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "pt-BR");
      return crescente ? comp : -comp;
    });
  }, [filtrados, coluna, crescente]);

  const metricas: MetricasPpp = useMemo(() => calcularMetricasPpp(filtrados), [filtrados]);
  const microresumos = useMemo(() => gerarMicroresumoPpp(metricas), [metricas]);

  function alternarOrdenacao(nova: CampoOrdenacao) {
    if (coluna === nova) {
      setCrescente((v) => !v);
    } else {
      setColuna(nova);
      setCrescente(false);
    }
  }

  function baixarCsv() {
    const csv = gerarCsvPpp(ordenados);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `concessoes-e-ppp-mg-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const seta = (campo: CampoOrdenacao) =>
    coluna === campo ? (crescente ? " ↑" : " ↓") : "";

  const maxNatureza = Math.max(1, ...Object.values(metricas.porNatureza));
  const maxSetor = Math.max(1, ...Object.values(metricas.porSetor));

  return (
    <div className="space-y-6">
      {/* Regras de impressão: some o que é controle, a tabela e cartões ficam. */}
      <style>{`
        @media print {
          .ppp-sem-impressao { display: none !important; }
          .ppp-card { break-inside: avoid; border: 1px solid #999 !important; }
          .ppp-tabela { font-size: 10px !important; }
          .ppp-tabela a { color: #000 !important; }
        }
      `}</style>

      {/* ═══ 4. Cartões de topo — sempre do recorte filtrado ═══ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="ppp-card rounded-xl border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Contratos</span>
          <p className="mt-1 font-display text-2xl font-bold text-text">{formatNumberBR(metricas.total)}</p>
          <p className="mt-1 text-xs text-text-soft">
            {formatNumberBR(metricas.vigentes)} vigentes na base
          </p>
        </div>
        <div className="ppp-card rounded-xl border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Valor inicial total</span>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            <Valor numero={metricas.valorInicialTotal} />
          </p>
          <p className="mt-1 text-xs text-text-soft">Soma dos contratos do recorte</p>
        </div>
        <div className="ppp-card rounded-xl border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Valor atual total</span>
          <p className="mt-1 font-display text-2xl font-bold text-text">
            <Valor numero={metricas.valorAtualTotal} />
          </p>
          <p className="mt-1 text-xs text-text-soft">Como a fonte declara hoje</p>
        </div>
        <div className="ppp-card rounded-xl border border-border bg-surface p-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-soft">Órgãos</span>
          <p className="mt-1 font-display text-2xl font-bold text-text">{formatNumberBR(metricas.orgaos)}</p>
          <p className="mt-1 text-xs text-text-soft">Unidades que assinam os contratos</p>
        </div>
      </div>

      {/* ═══ Ressalva + microresumo cívico ═══ */}
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm">
        <h2 className="flex items-center gap-2 font-bold text-text">
          <span aria-hidden>⚠️</span> O que estes números são — e o que não são
        </h2>
        <p className="mt-2 leading-relaxed text-text-soft">{metadados.ressalva}</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-text-soft">
          {microresumos.map((frase, i) => (
            <li key={i}>{frase}</li>
          ))}
        </ul>
      </div>

      {/* ═══ 6. Distribuição por natureza (a chave da ressalva) ═══ */}
      <div className="ppp-card rounded-xl border border-border bg-surface p-5">
        <h3 className="font-display text-base font-bold text-text">
          Contratos por natureza <span className="text-sm font-normal text-text-soft">(contagem, não dinheiro)</span>
        </h3>
        <p className="mt-1 text-xs text-text-soft">
          Só &ldquo;Instrumento de concessão&rdquo; é a PPP. Os demais são contratos de apoio.
        </p>
        <div className="mt-4 space-y-3">
          {Object.entries(metricas.porNatureza)
            .sort((a, b) => b[1] - a[1])
            .map(([chave, quantidade]) => (
              <BarraContagem
                key={chave}
                rotulo={rotuloNatureza(chave)}
                quantidade={quantidade}
                maximo={maxNatureza}
              />
            ))}
        </div>
      </div>

      {/* ═══ Por setor ═══ */}
      <div className="ppp-card rounded-xl border border-border bg-surface p-5">
        <h3 className="font-display text-base font-bold text-text">Contratos por setor</h3>
        <div className="mt-4 space-y-3">
          {Object.entries(metricas.porSetor)
            .sort((a, b) => b[1] - a[1])
            .map(([chave, quantidade]) => (
              <BarraContagem
                key={chave}
                rotulo={rotuloSetor(chave)}
                quantidade={quantidade}
                maximo={maxSetor}
              />
            ))}
        </div>
      </div>

      {/* ═══ 2. Busca, filtros e exportação ═══ */}
      <div className="ppp-sem-impressao flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="ppp-busca">
            Buscar por objeto, concessionária, contrato, processo ou órgão
          </label>
          <input
            id="ppp-busca"
            type="search"
            placeholder="Buscar por objeto, concessionária, contrato, processo ou órgão..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focus"
          />
          <select
            aria-label="Filtrar por natureza"
            value={naturezaFiltro}
            onChange={(e) => setNaturezaFiltro(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="todas">Todas as naturezas</option>
            {naturezasDisponiveis.map((n) => (
              <option key={n} value={n}>
                {rotuloNatureza(n)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por setor"
            value={setorFiltro}
            onChange={(e) => setSetorFiltro(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="todos">Todos os setores</option>
            {setoresDisponiveis.map((s) => (
              <option key={s} value={s}>
                {rotuloSetor(s)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por situação"
            value={situacaoFiltro}
            onChange={(e) => setSituacaoFiltro(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-focus"
          >
            <option value="todas">Todas as situações</option>
            {situacoesDisponiveis.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={baixarCsv}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            <span aria-hidden>📥</span> Baixar CSV
          </button>
          <button
            onClick={() => window.print()}
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-soft hover:text-text sm:inline-flex"
            title="Imprimir relatório"
          >
            <span aria-hidden>🖨️</span> Imprimir
          </button>
        </div>
      </div>

      <p className="text-xs text-text-soft" role="status">
        Mostrando {formatNumberBR(ordenados.length)} de {formatNumberBR(contratos.length)} contratos.
      </p>

      {/* ═══ 3. Tabela ordenável ═══ */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="ppp-tabela w-full border-collapse text-left text-sm">
            <caption className="sr-only">
              Contratos de concessão e PPP do Estado de Minas Gerais, com fonte oficial por linha.
            </caption>
            <thead>
              <tr className="border-b border-border bg-surface-2 text-xs font-semibold text-text-soft">
                <th className="p-3">
                  <button className="hover:text-text" onClick={() => alternarOrdenacao("numeroContrato")}>
                    Contrato{seta("numeroContrato")}
                  </button>
                </th>
                <th className="p-3">Objeto</th>
                <th className="p-3">Natureza</th>
                <th className="p-3">Setor</th>
                <th className="p-3">
                  <button className="hover:text-text" onClick={() => alternarOrdenacao("concessionaria")}>
                    Concessionária{seta("concessionaria")}
                  </button>
                </th>
                <th className="p-3 text-right">
                  <button className="hover:text-text" onClick={() => alternarOrdenacao("ano")}>
                    Ano{seta("ano")}
                  </button>
                </th>
                <th className="p-3 text-right">
                  <button className="hover:text-text" onClick={() => alternarOrdenacao("valorInicial")}>
                    Valor inicial{seta("valorInicial")}
                  </button>
                </th>
                <th className="p-3 text-right">
                  <button className="hover:text-text" onClick={() => alternarOrdenacao("valorAtual")}>
                    Valor atual{seta("valorAtual")}
                  </button>
                </th>
                <th className="p-3">
                  <button className="hover:text-text" onClick={() => alternarOrdenacao("dataInicio")}>
                    Vigência{seta("dataInicio")}
                  </button>
                </th>
                <th className="p-3 text-right">Fonte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ordenados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-text-soft">
                    Nenhum contrato encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                ordenados.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-surface-2/60">
                    <td className="p-3">
                      <span className="block font-mono text-xs font-semibold text-accent">
                        {item.numeroContrato}
                      </span>
                      <span className="text-xs text-text-soft">{item.situacao}</span>
                    </td>
                    <td className="max-w-xs p-3">
                      <p className="line-clamp-3 text-xs text-text-soft" title={item.objeto}>
                        {item.objeto}
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-medium ${
                          CLASSE_NATUREZA[item.natureza] ?? "border-border bg-surface-2 text-text-soft"
                        }`}
                      >
                        {rotuloNatureza(item.natureza)}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-text-soft">{rotuloSetor(item.setor)}</td>
                    <td className="p-3 text-xs">
                      <span className="block font-semibold text-text">{item.concessionaria}</span>
                      <span className="font-mono text-[11px] text-text-soft">
                        {/^\d{14}$/.test(item.cnpjConcessionaria)
                          ? formatCNPJ(item.cnpjConcessionaria)
                          : item.cnpjConcessionaria}
                      </span>
                    </td>
                    <td className="p-3 text-right text-xs tabular-nums text-text">{item.ano}</td>
                    <td className="p-3 text-right text-xs tabular-nums">
                      <Valor numero={item.valorInicial} />
                    </td>
                    <td className="p-3 text-right text-xs tabular-nums text-text-soft">
                      <Valor numero={item.valorAtual} />
                    </td>
                    <td className="p-3 text-xs text-text-soft">
                      {formatDateBR(item.dataInicio)} – {formatDateBR(item.dataFim)}
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={item.fonteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-border px-2.5 py-1 text-xs font-medium hover:border-accent hover:text-accent"
                      >
                        Fonte <span aria-hidden>↗</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fonte e nota de rodapé — visíveis também na impressão. */}
      <div className="rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-text-soft">
        <p>
          <strong className="text-text">Fonte:</strong> {metadados.fonte}. Gerado em{" "}
          {formatDateBR(metadados.geradoEm.slice(0, 10))}.{" "}
          <a
            href={metadados.fonteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-accent"
          >
            Consultar no Portal da Transparência MG ↗
          </a>
        </p>
        <p className="mt-2">
          O valor <strong className="text-text">atual</strong> pode ser menor que o inicial porque a
          fonte registra o saldo/executado do contrato, não o valor reajustado. Somar valores de anos
          diferentes dá ordem de grandeza, não valor comparável.
        </p>
      </div>
    </div>
  );
}
