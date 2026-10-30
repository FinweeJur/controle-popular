"use client";

import { useMemo, useState } from "react";
import { CheckCircle, XCircle, FileText, HelpCircle, ArrowUpDown } from "lucide-react";
import { semAcento } from "@/lib/busca/normalizar";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { PaisAfricano } from "@/lib/direitos-globais/africa/paises";
import { ADESAO_UA } from "@/lib/direitos-globais/africa/tratados-ua";
import ExportarCsvDireitos from "./ExportarCsvDireitos";

interface LinhaTabelaAfrica {
  nome: string;
  codigo: string;
  subRegiao: string;
  cartaAfricana: string;
  corteAfricana: string;
  maputo: string;
  kampala: string;
  artigo34: string;
}

const COLUNAS_CSV_AFRICA: ColunaCsv<LinhaTabelaAfrica>[] = [
  { chave: "nome", rotulo: "País" },
  { chave: "codigo", rotulo: "Código ISO" },
  { chave: "subRegiao", rotulo: "Sub-Região" },
  { chave: "cartaAfricana", rotulo: "Carta Africana (ACHPR)" },
  { chave: "corteAfricana", rotulo: "Protocolo da Corte" },
  { chave: "maputo", rotulo: "Protocolo de Maputo (Mulheres)" },
  { chave: "kampala", rotulo: "Convenção de Kampala (Deslocados)" },
  { chave: "artigo34", rotulo: "Declaração Art. 34(6)" },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "ratificado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="h-3 w-3" />
        Ratificado
      </span>
    );
  }
  if (status === "assinado") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
        <FileText className="h-3 w-3" />
        Assinado
      </span>
    );
  }
  if (status === "nao") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="h-3 w-3" />
        Não
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-text-soft">
      <HelpCircle className="h-3 w-3" />
      Desconhecido
    </span>
  );
}

function CelulaArt34({ valor }: { valor: string }) {
  if (valor === "Revogou") {
    return <span className="text-rose-600 dark:text-rose-400 font-medium">Revogou</span>;
  }
  if (valor === "Ativo") {
    return <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ativo</span>;
  }
  return <span className="text-text-soft">Não</span>;
}

function calcularArt34(p: PaisAfricano): string {
  if (p.revogouArt34) return "Revogou";
  if (p.declarouArt34) return "Ativo";
  return "Não";
}

function obterStatusTratado(chave: string, paisNome: string): string {
  const registro = ADESAO_UA[chave]?.[paisNome];
  return registro ? registro.status : "desconhecido";
}

function extrairLinhas(paises: readonly PaisAfricano[]): LinhaTabelaAfrica[] {
  return paises.map((p) => ({
    nome: p.nome,
    codigo: p.codigo,
    subRegiao: p.subRegiao,
    cartaAfricana: obterStatusTratado("achpr", p.nome),
    corteAfricana: obterStatusTratado("corte-protocolo", p.nome),
    maputo: obterStatusTratado("maputo", p.nome),
    kampala: obterStatusTratado("kampala", p.nome),
    artigo34: calcularArt34(p),
  }));
}

function filtrarLinhaAfrica(
  linha: LinhaTabelaAfrica,
  subRegiao: string,
  art34: string,
  buscaNorm: string
): boolean {
  if (subRegiao !== "Todas" && linha.subRegiao !== subRegiao) return false;
  if (art34 !== "Todos" && linha.artigo34 !== art34) return false;
  if (buscaNorm.length === 0) return true;
  const texto = semAcento(`${linha.nome} ${linha.codigo}`.toLowerCase());
  return texto.includes(buscaNorm);
}

interface BarraFiltrosProps {
  termoBusca: string;
  setTermoBusca: (v: string) => void;
  subRegiaoFiltro: string;
  setSubRegiaoFiltro: (v: string) => void;
  art34Filtro: string;
  setArt34Filtro: (v: string) => void;
  linhasFiltradas: LinhaTabelaAfrica[];
}

function BarraFiltros({
  termoBusca,
  setTermoBusca,
  subRegiaoFiltro,
  setSubRegiaoFiltro,
  art34Filtro,
  setArt34Filtro,
  linhasFiltradas,
}: BarraFiltrosProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px]">
          <input
            type="search"
            role="search"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar país ou código..."
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-text placeholder-text-soft focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={subRegiaoFiltro}
          onChange={(e) => setSubRegiaoFiltro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por sub-região"
        >
          <option value="Todas">Todas as Sub-Regiões</option>
          <option value="Norte">Norte</option>
          <option value="Ocidental">Ocidental</option>
          <option value="Central">Central</option>
          <option value="Oriental">Oriental</option>
          <option value="Austral">Austral</option>
        </select>

        <select
          value={art34Filtro}
          onChange={(e) => setArt34Filtro(e.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text focus:border-primary focus:outline-none"
          aria-label="Filtrar por Artigo 34(6)"
        >
          <option value="Todos">Art. 34(6): Todos</option>
          <option value="Ativo">Art. 34(6): Ativo</option>
          <option value="Revogou">Art. 34(6): Revogou</option>
          <option value="Não">Art. 34(6): Não declarou</option>
        </select>
      </div>

      <ExportarCsvDireitos
        dados={linhasFiltradas}
        colunas={COLUNAS_CSV_AFRICA}
        nomeArquivoBase="adesao-tratados-uniao-africana"
      />
    </div>
  );
}

interface TabelaGradeProps {
  linhas: LinhaTabelaAfrica[];
  ordenarPor: keyof LinhaTabelaAfrica;
  direcao: "asc" | "desc";
  onAlternarOrdem: (col: keyof LinhaTabelaAfrica) => void;
}

function TabelaGrade({ linhas, ordenarPor, direcao, onAlternarOrdem }: TabelaGradeProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-border bg-surface-2 text-text font-semibold">
          <tr>
            <th
              scope="col"
              className="px-3 py-2.5"
              aria-sort={ordenarPor === "nome" ? (direcao === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                onClick={() => onAlternarOrdem("nome")}
                className="inline-flex items-center gap-1 font-semibold hover:text-primary"
              >
                País <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th
              scope="col"
              className="px-2 py-2.5"
              aria-sort={ordenarPor === "subRegiao" ? (direcao === "asc" ? "ascending" : "descending") : "none"}
            >
              <button
                type="button"
                onClick={() => onAlternarOrdem("subRegiao")}
                className="inline-flex items-center gap-1 font-semibold hover:text-primary"
              >
                Sub-Região <ArrowUpDown className="h-3 w-3" />
              </button>
            </th>
            <th scope="col" className="px-2 py-2.5">Carta Africana</th>
            <th scope="col" className="px-2 py-2.5">Corte Africana</th>
            <th scope="col" className="px-2 py-2.5">Protocolo Maputo</th>
            <th scope="col" className="px-2 py-2.5">Convenção Kampala</th>
            <th scope="col" className="px-2 py-2.5">Art. 34(6)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-xs text-text-soft">
                Nenhum país encontrado com os filtros selecionados.
              </td>
            </tr>
          ) : (
            linhas.map((linha) => (
              <tr key={linha.codigo} className="hover:bg-surface-2/50">
                <td className="px-3 py-2 font-medium text-text">
                  {linha.nome} <span className="font-mono text-text-soft">({linha.codigo})</span>
                </td>
                <td className="px-2 py-2 text-text-soft">{linha.subRegiao}</td>
                <td className="px-2 py-2"><StatusBadge status={linha.cartaAfricana} /></td>
                <td className="px-2 py-2"><StatusBadge status={linha.corteAfricana} /></td>
                <td className="px-2 py-2"><StatusBadge status={linha.maputo} /></td>
                <td className="px-2 py-2"><StatusBadge status={linha.kampala} /></td>
                <td className="px-2 py-2"><CelulaArt34 valor={linha.artigo34} /></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function TabelaAfricaInterativa({ paises }: { paises: readonly PaisAfricano[] }) {
  const [termoBusca, setTermoBusca] = useState("");
  const [subRegiaoFiltro, setSubRegiaoFiltro] = useState("Todas");
  const [art34Filtro, setArt34Filtro] = useState("Todos");
  const [ordenarPor, setOrdenarPor] = useState<keyof LinhaTabelaAfrica>("nome");
  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const todasLinhas = useMemo(() => extrairLinhas(paises), [paises]);

  const linhasFiltradas = useMemo(() => {
    const buscaNorm = semAcento(termoBusca.trim().toLowerCase());

    return todasLinhas
      .filter((l) => filtrarLinhaAfrica(l, subRegiaoFiltro, art34Filtro, buscaNorm))
      .sort((a, b) => {
        const cmp = a[ordenarPor].localeCompare(b[ordenarPor], "pt-BR");
        return direcao === "asc" ? cmp : -cmp;
      });
  }, [todasLinhas, termoBusca, subRegiaoFiltro, art34Filtro, ordenarPor, direcao]);

  function alternarOrdem(coluna: keyof LinhaTabelaAfrica) {
    if (ordenarPor === coluna) {
      setDirecao((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrdenarPor(coluna);
      setDirecao("asc");
    }
  }

  return (
    <div className="space-y-4">
      <BarraFiltros
        termoBusca={termoBusca}
        setTermoBusca={setTermoBusca}
        subRegiaoFiltro={subRegiaoFiltro}
        setSubRegiaoFiltro={setSubRegiaoFiltro}
        art34Filtro={art34Filtro}
        setArt34Filtro={setArt34Filtro}
        linhasFiltradas={linhasFiltradas}
      />
      <TabelaGrade
        linhas={linhasFiltradas}
        ordenarPor={ordenarPor}
        direcao={direcao}
        onAlternarOrdem={alternarOrdem}
      />
    </div>
  );
}
