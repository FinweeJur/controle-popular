"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import BotoesExportar from "@/app/components/BotoesExportar";
import Moeda from "@/app/components/Moeda";
import { formatarMoedaBR, formatarNumeroBR } from "@/lib/utilitarios/calculos";
import type { ColunaCsv } from "@/lib/tabela/csv";
import type { LinhaGasto } from "@/lib/eleicoes/gastos-2026";

/**
 * Tabela pública de gastos de campanha 2026 — mesma mecânica de
 * `congresso/votacoes/ListaVotacoes.tsx` (ver o porquê lá): índice estático
 * fatiado em `dados/[arquivo]/route.ts`, busca/ordenação/paginação no
 * navegador, CSV do que está filtrado na tela.
 *
 * Escopo medido (ETL de 09/10/2026): 1.823 linhas = todos os eleitos no 1º
 * turno + os 16 pendentes de 2º turno + top 50 por contratado e por receita
 * em cada cargo, de um total de 19.724 candidaturas declaradas (18.851 com
 * votação + 873 vedadas/retiradas). Custo por voto = pago / votos nominais;
 * ausente onde não há votação ("sem votação").
 *
 * Filtros: cargo, UF (MG entre elas), partido e resultado — o dono pediu
 * explicitamente filtrar candidato por partido e por MG (09/10/2026), não
 * só ler a soma das seções de análise.
 */

/** Interseção exigida por `TabelaEstatica` (`T extends Record<string, unknown>`). */
type Linha = LinhaGasto & Record<string, unknown>;

/** Os seis cargos concorridos em 2026, na ordem do TSE. */
const CARGOS = [
  "Presidente",
  "Governador",
  "Senador",
  "Deputado Federal",
  "Deputado Estadual",
  "Deputado Distrital",
] as const;

/** Situação vinda da fonte → rótulo de exibição (o dado bruto fica no CSV). */
const ROTULO_SITUACAO: Record<string, string> = {
  ELEITO: "Eleito",
  "ELEITO POR QP": "Eleito (QP)",
  "ELEITO POR MÉDIA": "Eleito (média)",
  "2º TURNO": "2º turno",
  SUPLENTE: "Suplente",
  "NÃO ELEITO": "Não eleito",
  "sem votação": "Sem votação",
};

const ROTULO_ELEITO: Record<string, string> = {
  todos: "Todos",
  eleitos: "Eleitos (1º turno)",
  "2t": "Pendentes de 2º turno",
  nao: "Não eleitos",
};

/** Selo da situação: cor por `eleito` (1 eleito, 2 pendente, 0 resto). */
function Selo({ linha }: { linha: Linha }) {
  const cor =
    linha.eleito === 1
      ? "var(--cp-accent)"
      : linha.eleito === 2
        ? "var(--cp-alert)"
        : "var(--cp-text-soft)";
  return (
    <span
      className="w-fit rounded-md border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: cor, color: cor }}
    >
      {ROTULO_SITUACAO[linha.situacao] ?? linha.situacao}
    </span>
  );
}

const COLUNAS: ColunaTabela<Linha>[] = [
  {
    chave: "nome",
    rotulo: "Candidato",
    ordenavel: true,
    formatar: (v) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{v.nome}</span>
        <span className="text-xs opacity-70">
          {v.partido}/{v.uf}
          {v.urna !== v.nome ? ` · urna: ${v.urna}` : ""}
        </span>
      </div>
    ),
  },
  { chave: "cargo", rotulo: "Cargo" },
  {
    chave: "votos",
    rotulo: "Votos",
    numerica: true,
    ordenavel: true,
    formatar: (v) => formatarNumeroBR(v.votos, 0),
  },
  { chave: "situacao", rotulo: "Situação", ordenavel: true, formatar: (v) => <Selo linha={v} /> },
  { chave: "receita", rotulo: "Receita", numerica: true, ordenavel: true, formatar: (v) => <Moeda value={v.receita} /> },
  { chave: "contratado", rotulo: "Contratado", numerica: true, ordenavel: true, formatar: (v) => <Moeda value={v.contratado} /> },
  { chave: "pago", rotulo: "Pago", numerica: true, ordenavel: true, formatar: (v) => <Moeda value={v.pago} /> },
  { chave: "digital", rotulo: "Digital", numerica: true, ordenavel: true, formatar: (v) => <Moeda value={v.digital} /> },
  { chave: "bigtech", rotulo: "Big tech", numerica: true, ordenavel: true, formatar: (v) => <Moeda value={v.bigtech} /> },
  {
    chave: "custoVoto",
    rotulo: "Custo por voto",
    numerica: true,
    ordenavel: true,
    formatar: (v) => (v.custoVoto == null ? "—" : formatarMoedaBR(v.custoVoto)),
  },
];

/**
 * Colunas do CSV: as dez da tela + urna, partido, UF, materiais e rua.
 * Dinheiro sai formatado em pt-BR com 2 casas ("1.234,56") porque o
 * separador do arquivo já é `;` e o Excel brasileiro lê vírgula decimal
 * (AGENTS.md § 8, qualidade 6: CSV com BOM e separador `;` — o BOM e o `;`
 * são automáticos em `lib/tabela/csv.ts`).
 */
const dinheiro = (valor: unknown) =>
  typeof valor === "number" ? formatarNumeroBR(valor, 2) : "";

const COLUNAS_CSV: ColunaCsv<Linha>[] = [
  { chave: "cargo", rotulo: "Cargo" },
  { chave: "nome", rotulo: "Candidato" },
  { chave: "urna", rotulo: "Nome de urna" },
  { chave: "partido", rotulo: "Partido" },
  { chave: "uf", rotulo: "UF" },
  { chave: "votos", rotulo: "Votos" },
  { chave: "situacao", rotulo: "Situação (fonte)" },
  { chave: "receita", rotulo: "Receita (R$)", formatar: dinheiro },
  { chave: "contratado", rotulo: "Contratado (R$)", formatar: dinheiro },
  { chave: "pago", rotulo: "Pago (R$)", formatar: dinheiro },
  { chave: "digital", rotulo: "Digital contratado (R$)", formatar: dinheiro },
  { chave: "materiais", rotulo: "Materiais contratados (R$)", formatar: dinheiro },
  { chave: "rua", rotulo: "Rua contratada (R$)", formatar: dinheiro },
  { chave: "bigtech", rotulo: "Big tech contratado (R$)", formatar: dinheiro },
  { chave: "custoVoto", rotulo: "Custo por voto (R$)", formatar: dinheiro },
];

export default function ListaGastos({
  base,
  ufs,
  partidos,
}: {
  base: string;
  ufs: string[];
  partidos: string[];
}) {
  const [cargo, setCargo] = useState("");
  const [uf, setUf] = useState("");
  const [partido, setPartido] = useState("");
  const [eleito, setEleito] = useState("todos");
  const primeiraRenderizacao = useRef(true);

  // Estado inicial vindo da URL (mesmo contrato de ListaVotacoes: a URL
  // copiada pelo leitor reabre com os mesmos filtros, sem useSearchParams —
  // que quebraria o output:'export').
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
    setCargo(sp.get("cargo") ?? "");
    setUf(sp.get("uf") ?? "");
    setPartido(sp.get("partido") ?? "");
    setEleito(sp.get("eleito") ?? "todos");
  }, []);

  // Espelha os quatro filtros de volta na URL. Lê a URL VIVA a cada efeito —
  // assim os parâmetros da TabelaEstatica (q, page, ordem) não se apagam
  // quando um filtro muda, e vice-versa.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    const sp = new URLSearchParams(window.location.search);
    if (cargo) sp.set("cargo", cargo);
    else sp.delete("cargo");
    if (uf) sp.set("uf", uf);
    else sp.delete("uf");
    if (partido) sp.set("partido", partido);
    else sp.delete("partido");
    if (eleito && eleito !== "todos") sp.set("eleito", eleito);
    else sp.delete("eleito");
    const qs = sp.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [cargo, uf, partido, eleito]);

  const filtrar = useCallback(
    (v: Linha) => {
      if (cargo && v.cargo !== cargo) return false;
      if (uf && v.uf !== uf) return false;
      if (partido && v.partido !== partido) return false;
      if (eleito === "eleitos" && v.eleito !== 1) return false;
      if (eleito === "2t" && v.eleito !== 2) return false;
      if (eleito === "nao" && v.eleito !== 0) return false;
      return true;
    },
    [cargo, uf, partido, eleito]
  );

  const limpar = () => {
    setCargo("");
    setUf("");
    setPartido("");
    setEleito("todos");
  };
  const algumFiltro = Boolean(cargo || uf || partido || eleito !== "todos");

  const controle =
    "rounded-md border border-[var(--cp-border)] bg-[var(--cp-surface)] px-3 py-1.5 text-sm";

  return (
    <TabelaEstatica<Linha>
      base={base}
      colunas={COLUNAS}
      camposBusca={["nome", "urna", "partido"]}
      vazio="Nenhuma candidatura publicada ainda."
      filtrar={filtrar}
      controles={({ filtradas }) => (
        <div className="space-y-3">
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--cp-border)] p-4">
            <label className="text-sm">
              <span className="mr-2 opacity-75">Cargo</span>
              <select value={cargo} onChange={(e) => setCargo(e.target.value)} className={controle}>
                <option value="">Todos</option>
                {CARGOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mr-2 opacity-75">UF</span>
              <select value={uf} onChange={(e) => setUf(e.target.value)} className={controle}>
                <option value="">Todas</option>
                {ufs.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mr-2 opacity-75">Partido</span>
              <select value={partido} onChange={(e) => setPartido(e.target.value)} className={controle}>
                <option value="">Todos</option>
                {partidos.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mr-2 opacity-75">Resultado</span>
              <select value={eleito} onChange={(e) => setEleito(e.target.value)} className={controle}>
                {Object.entries(ROTULO_ELEITO).map(([valor, rotulo]) => (
                  <option key={valor} value={valor}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </label>
            {algumFiltro && (
              <button type="button" onClick={limpar} className="text-sm underline">
                limpar
              </button>
            )}
          </div>
          <BotoesExportar
            dados={filtradas}
            colunas={COLUNAS_CSV}
            nomeArquivo="gastos-campanha-2026"
            textoClipboard={undefined}
          />
        </div>
      )}
    />
  );
}
