"use client";

import { useMemo, useState } from "react";
import { baixarCsv, type ColunaCsv } from "@/lib/tabela/csv";
import { ordenarPor, type Direcao } from "@/lib/tabela/ordenar";
import { formatDateBR, formatCurrencyBRL } from "@/lib/betim/format";

export interface LicencaItem {
  id: string;
  numeroProcesso: string;
  numeroLicenca: string;
  tipoLicenca: string;
  empreendimento: string;
  municipio: string;
  dataEmissao: string;
  dataValidade: string | null;
  situacao: string;
  atividade: string;
}

export interface InfracaoItem {
  id: string;
  numeroAuto: string;
  infrator: string;
  municipio: string;
  dataLavratura: string;
  valorMulta: number | null;
  tipoInfracao: string;
  statusJulgamento: string;
}

interface Props {
  licencas: LicencaItem[];
  infracoes: InfracaoItem[];
}

export default function TabelaIbamaClient({ licencas, infracoes }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<"licencas" | "infracoes">("licencas");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroSituacao, setFiltroSituacao] = useState("todos");
  const [ordemChave, setOrdemChave] = useState<string>("empreendimento");
  const [ordemDir, setOrdemDir] = useState<Direcao>("asc");

  // Filtros e ordenação para Licenças
  const licencasFiltradas = useMemo(() => {
    let res = licencas;
    if (filtroTipo !== "todos") {
      res = res.filter((l) => l.tipoLicenca === filtroTipo);
    }
    if (filtroSituacao !== "todos") {
      res = res.filter((l) => l.situacao === filtroSituacao);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      res = res.filter(
        (l) =>
          l.empreendimento.toLowerCase().includes(q) ||
          l.municipio.toLowerCase().includes(q) ||
          l.numeroLicenca.toLowerCase().includes(q) ||
          l.atividade.toLowerCase().includes(q)
      );
    }
    return ordenarPor(res, ordemChave as keyof LicencaItem, ordemDir, "texto");
  }, [licencas, filtroTipo, filtroSituacao, busca, ordemChave, ordemDir]);

  // Filtros e ordenação para Infrações
  const infracoesFiltradas = useMemo(() => {
    let res = infracoes;
    if (filtroSituacao !== "todos") {
      res = res.filter((i) => i.statusJulgamento === filtroSituacao);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      res = res.filter(
        (i) =>
          i.infrator.toLowerCase().includes(q) ||
          i.municipio.toLowerCase().includes(q) ||
          i.numeroAuto.toLowerCase().includes(q) ||
          i.tipoInfracao.toLowerCase().includes(q)
      );
    }
    return ordenarPor(
      res,
      ordemChave as keyof InfracaoItem,
      ordemDir,
      ordemChave === "valorMulta" ? "numero" : "texto"
    );
  }, [infracoes, filtroSituacao, busca, ordemChave, ordemDir]);

  const alternarOrdem = (chave: string) => {
    if (ordemChave === chave) {
      setOrdemDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setOrdemChave(chave);
      setOrdemDir("asc");
    }
  };

  const exportarPlanilha = () => {
    if (abaAtiva === "licencas") {
      const colunas: ColunaCsv<LicencaItem>[] = [
        { chave: "numeroLicenca", rotulo: "Número da Licença" },
        { chave: "tipoLicenca", rotulo: "Tipo" },
        { chave: "empreendimento", rotulo: "Empreendimento" },
        { chave: "municipio", rotulo: "Município" },
        { chave: "dataEmissao", rotulo: "Emissão", formatar: (v) => formatDateBR(v) },
        { chave: "dataValidade", rotulo: "Validade", formatar: (v) => formatDateBR(v) },
        { chave: "situacao", rotulo: "Situação" },
        { chave: "atividade", rotulo: "Atividade" },
      ];
      baixarCsv(colunas, licencasFiltradas, "ibama-licencas-mg");
    } else {
      const colunas: ColunaCsv<InfracaoItem>[] = [
        { chave: "numeroAuto", rotulo: "Auto de Infração" },
        { chave: "infrator", rotulo: "Autuado" },
        { chave: "municipio", rotulo: "Município" },
        { chave: "dataLavratura", rotulo: "Data", formatar: (v) => formatDateBR(v) },
        { chave: "valorMulta", rotulo: "Valor da Multa (R$)", formatar: (v) => (v ? formatCurrencyBRL(v) : "—") },
        { chave: "tipoInfracao", rotulo: "Descrição da Infração" },
        { chave: "statusJulgamento", rotulo: "Julgamento" },
      ];
      baixarCsv(colunas, infracoesFiltradas, "ibama-infracoes-mg");
    }
  };

  const tiposLicenca = [...new Set(licencas.map((l) => l.tipoLicenca))];
  const situacoesLicenca = [...new Set(licencas.map((l) => l.situacao))];
  const statusInfracao = [...new Set(infracoes.map((i) => i.statusJulgamento))];

  return (
    <div className="space-y-6">
      {/* Abas */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setAbaAtiva("licencas");
              setOrdemChave("empreendimento");
              setFiltroTipo("todos");
              setFiltroSituacao("todos");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              abaAtiva === "licencas"
                ? "bg-primary text-white"
                : "border border-border bg-surface text-text-soft hover:text-text"
            }`}
          >
            📋 Licenças Ambientais Federais ({licencasFiltradas.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setAbaAtiva("infracoes");
              setOrdemChave("valorMulta");
              setOrdemDir("desc");
              setFiltroTipo("todos");
              setFiltroSituacao("todos");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              abaAtiva === "infracoes"
                ? "bg-primary text-white"
                : "border border-border bg-surface text-text-soft hover:text-text"
            }`}
          >
            ⚖️ Autos de Infração e Julgamentos ({infracoesFiltradas.length})
          </button>
        </div>

        {/* Botão de Exportação CSV com BOM UTF-8 */}
        <button
          type="button"
          onClick={exportarPlanilha}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent"
        >
          📥 Baixar Planilha (CSV Filtrado)
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="busca-ibama" className="mb-1 block text-xs text-text-soft">
            Buscar por texto
          </label>
          <input
            id="busca-ibama"
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={abaAtiva === "licencas" ? "Empreendimento, município..." : "Infrator, auto..."}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-soft"
          />
        </div>

        {abaAtiva === "licencas" ? (
          <>
            <div>
              <label htmlFor="filtro-tipo" className="mb-1 block text-xs text-text-soft">
                Tipo de Licença
              </label>
              <select
                id="filtro-tipo"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="todos">Todos os tipos</option>
                {tiposLicenca.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtro-sit" className="mb-1 block text-xs text-text-soft">
                Situação
              </label>
              <select
                id="filtro-sit"
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
              >
                <option value="todos">Todas as situações</option>
                {situacoesLicenca.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="filtro-status-inf" className="mb-1 block text-xs text-text-soft">
              Status do Julgamento
            </label>
            <select
              id="filtro-status-inf"
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text"
            >
              <option value="todos">Todos os status</option>
              {statusInfracao.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabela de Licenças */}
      {abaAtiva === "licencas" && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs text-text-soft">
              <tr>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("numeroLicenca")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Licença {ordemChave === "numeroLicenca" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("tipoLicenca")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Tipo {ordemChave === "tipoLicenca" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("empreendimento")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Empreendimento {ordemChave === "empreendimento" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("municipio")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Município {ordemChave === "municipio" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("dataValidade")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Validade {ordemChave === "dataValidade" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Situação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {licencasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-text-soft">
                    Nenhuma licença encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                licencasFiltradas.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-2/40">
                    <td className="px-4 py-3 font-medium text-accent">{l.numeroLicenca}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                        {l.tipoLicenca}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text">
                      <p className="font-medium">{l.empreendimento}</p>
                      <p className="text-xs text-text-soft">{l.atividade}</p>
                    </td>
                    <td className="px-4 py-3 text-text-soft">{l.municipio}</td>
                    <td className="px-4 py-3 font-tabular text-text-soft">
                      {l.dataValidade ? formatDateBR(l.dataValidade) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          l.situacao === "Vigente"
                            ? "bg-primary/10 text-primary"
                            : l.situacao === "Em Renovação"
                              ? "bg-warning/10 text-warning"
                              : "bg-alert/10 text-alert"
                        }`}
                      >
                        {l.situacao}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabela de Infrações */}
      {abaAtiva === "infracoes" && (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-2 text-xs text-text-soft">
              <tr>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("numeroAuto")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Auto {ordemChave === "numeroAuto" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("infrator")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Infrator {ordemChave === "infrator" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("municipio")}
                  className="cursor-pointer px-4 py-3 font-semibold hover:text-text"
                >
                  Município {ordemChave === "municipio" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th
                  scope="col"
                  onClick={() => alternarOrdem("valorMulta")}
                  className="cursor-pointer px-4 py-3 text-right font-semibold hover:text-text"
                >
                  Valor da Multa {ordemChave === "valorMulta" && (ordemDir === "asc" ? "▲" : "▼")}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status do Julgamento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {infracoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-text-soft">
                    Nenhuma autuação encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                infracoesFiltradas.map((inf) => (
                  <tr key={inf.id} className="hover:bg-surface-2/40">
                    <td className="px-4 py-3 font-medium text-accent">{inf.numeroAuto}</td>
                    <td className="px-4 py-3 text-text">
                      <p className="font-medium">{inf.infrator}</p>
                      <p className="text-xs text-text-soft">{inf.tipoInfracao}</p>
                    </td>
                    <td className="px-4 py-3 text-text-soft">{inf.municipio}</td>
                    <td className="px-4 py-3 text-right font-tabular font-bold text-text">
                      {inf.valorMulta ? formatCurrencyBRL(inf.valorMulta) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          inf.statusJulgamento === "Julgado Procedente"
                            ? "bg-primary/10 text-primary"
                            : inf.statusJulgamento === "Recurso Pendente"
                              ? "bg-warning/10 text-warning"
                              : "bg-surface-2 text-text-soft"
                        }`}
                      >
                        {inf.statusJulgamento}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
