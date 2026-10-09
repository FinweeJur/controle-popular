import Moeda from "@/app/components/Moeda";
import { formatarMoedaBR, formatarNumeroBR } from "@/lib/utilitarios/calculos";
import type { ColunaResumo } from "./TabelaResumo";
import type {
  BigTechDados,
  FornecedorGasto,
  MetaGastos,
  PartidoAnalise,
  PartidoGasto,
} from "@/lib/eleicoes/gastos-2026";

/**
 * Definição das colunas de todas as tabelas-resumo da página de gastos de
 * campanha 2026 — separada do `page.tsx` para que a composição da página
 * fique curta e cada coluna seja revisada num lugar só (pedido do dono,
 * 09/10/2026).
 *
 * Padrão de cada coluna: rótulo legível, `numerica` para alinhar dinheiro e
 * contagem à direita com numerais tabulares, e `Moeda`/formatadores do
 * `lib/` — nunca número cru na tela (AGENTS.md § 8, qualidade 4).
 */

export type Natureza = MetaGastos["naturezas"][number];
export type PorCargo = MetaGastos["porCargo"][number];
export type PorUf = MetaGastos["porUf"][number];
export type ReceitaFonte = MetaGastos["receitaPorFonte"][number];
export type EmpresaBigTech = BigTechDados["empresas"][number];
export type CandidatoBigTech = BigTechDados["topCandidatos"][number];
export type PartidoBigTech = BigTechDados["partidos"][number];
export type MencaoPlataforma = [string, { linhas: number; total: number }];

export const COLUNAS_RECEITA: ColunaResumo<ReceitaFonte>[] = [
  { rotulo: "Fonte do dinheiro", valor: (r) => r.fonte },
  { rotulo: "Total recebido", numerica: true, valor: (r) => <Moeda value={r.total} /> },
];

export const COLUNAS_NATUREZA: ColunaResumo<Natureza>[] = [
  { rotulo: "Natureza da despesa", valor: (n) => n.ds || "sem natureza na fonte" },
  { rotulo: "Contratado", numerica: true, valor: (n) => <Moeda value={n.contratado} /> },
  { rotulo: "Pago", numerica: true, valor: (n) => <Moeda value={n.pago} /> },
  { rotulo: "Despesas", numerica: true, valor: (n) => formatarNumeroBR(n.linhas, 0) },
];

export const COLUNAS_CARGO: ColunaResumo<PorCargo>[] = [
  { rotulo: "Cargo", valor: (c) => c.cargo },
  { rotulo: "Candidaturas", numerica: true, valor: (c) => formatarNumeroBR(c.candidaturas, 0) },
  { rotulo: "Eleitos", numerica: true, valor: (c) => formatarNumeroBR(c.eleitos, 0) },
  { rotulo: "Receita", numerica: true, valor: (c) => <Moeda value={c.receita} /> },
  { rotulo: "Contratado", numerica: true, valor: (c) => <Moeda value={c.contratado} /> },
  { rotulo: "Pago", numerica: true, valor: (c) => <Moeda value={c.pago} /> },
  { rotulo: "Digital", numerica: true, valor: (c) => <Moeda value={c.digital} /> },
  {
    rotulo: "Custo por voto (mediano, eleitos)",
    numerica: true,
    valor: (c) => (c.custoVotoMedianoEleitos == null ? "—" : formatarMoedaBR(c.custoVotoMedianoEleitos)),
  },
];

export const COLUNAS_UF: ColunaResumo<PorUf>[] = [
  { rotulo: "UF", valor: (u) => u.uf },
  { rotulo: "Candidaturas", numerica: true, valor: (u) => formatarNumeroBR(u.candidaturas, 0) },
  { rotulo: "Eleitos", numerica: true, valor: (u) => formatarNumeroBR(u.eleitos, 0) },
  { rotulo: "Receita", numerica: true, valor: (u) => <Moeda value={u.receita} /> },
  { rotulo: "Contratado", numerica: true, valor: (u) => <Moeda value={u.contratado} /> },
  { rotulo: "Pago", numerica: true, valor: (u) => <Moeda value={u.pago} /> },
  { rotulo: "Digital", numerica: true, valor: (u) => <Moeda value={u.digital} /> },
];

export const COLUNAS_FONECEDOR: ColunaResumo<FornecedorGasto>[] = [
  {
    rotulo: "Fornecedor",
    valor: (f) => (
      <span className="inline-flex flex-wrap items-center gap-2">
        {f.nome}
        {f.bigtech && (
          <span
            className="rounded-md border px-1.5 py-0.5 text-[11px] font-semibold"
            style={{ borderColor: "var(--cp-alert)", color: "var(--cp-alert)" }}
          >
            big tech
          </span>
        )}
      </span>
    ),
  },
  { rotulo: "CNPJ", valor: (f) => f.cnpj || "—" },
  { rotulo: "Contratado", numerica: true, valor: (f) => <Moeda value={f.total} /> },
  { rotulo: "Despesas", numerica: true, valor: (f) => formatarNumeroBR(f.linhas, 0) },
];

export const COLUNAS_PARTIDO: ColunaResumo<PartidoGasto>[] = [
  {
    rotulo: "Partido",
    valor: (p) => (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{p.partido}</span>
        <span className="text-xs opacity-70">{p.nome}</span>
      </span>
    ),
  },
  { rotulo: "Receita", numerica: true, valor: (p) => <Moeda value={p.receita} /> },
  { rotulo: "Contratado", numerica: true, valor: (p) => <Moeda value={p.contratado} /> },
  { rotulo: "Pago", numerica: true, valor: (p) => <Moeda value={p.pago} /> },
];

/** Colunas da análise por partido (candidatos do universo completo). */
export const COLUNAS_PARTIDO_ANALISE: ColunaResumo<PartidoAnalise>[] = [
  {
    rotulo: "Partido",
    valor: (p) => (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{p.partido}</span>
        <span className="text-xs opacity-70">{p.nome}</span>
      </span>
    ),
  },
  { rotulo: "Candidaturas", numerica: true, valor: (p) => formatarNumeroBR(p.candidaturas, 0) },
  { rotulo: "Eleitos", numerica: true, valor: (p) => formatarNumeroBR(p.eleitos, 0) },
  { rotulo: "Receita", numerica: true, valor: (p) => <Moeda value={p.receita} /> },
  { rotulo: "Contratado", numerica: true, valor: (p) => <Moeda value={p.contratado} /> },
  { rotulo: "Pago", numerica: true, valor: (p) => <Moeda value={p.pago} /> },
  { rotulo: "Digital", numerica: true, valor: (p) => <Moeda value={p.digital} /> },
  { rotulo: "Big tech", numerica: true, valor: (p) => <Moeda value={p.bigtech} /> },
  {
    rotulo: "Custo por voto (mediano, eleitos)",
    numerica: true,
    valor: (p) => (p.custoVotoMedianoEleitos == null ? "—" : formatarMoedaBR(p.custoVotoMedianoEleitos)),
  },
];

/** Colunas do desdobramento da Meta por plataforma (heurística da descrição). */
export const COLUNAS_META_PLATAFORMA: ColunaResumo<{
  plataforma: string;
  total: number;
  linhas: number;
}>[] = [
  { rotulo: "Plataforma", valor: (p) => <span className="font-medium">{p.plataforma}</span> },
  { rotulo: "Despesas", numerica: true, valor: (p) => formatarNumeroBR(p.linhas, 0) },
  { rotulo: "Contratado", numerica: true, valor: (p) => <Moeda value={p.total} /> },
];

export const COLUNAS_EMPRESA_BIGTECH: ColunaResumo<EmpresaBigTech>[] = [
  { rotulo: "Empresa", valor: (e) => e.empresa },
  { rotulo: "CNPJ", valor: (e) => e.cnpj || "sem CNPJ na fonte" },
  { rotulo: "Grupo", valor: (e) => e.grupo },
  { rotulo: "Contratado", numerica: true, valor: (e) => <Moeda value={e.total} /> },
  { rotulo: "Despesas", numerica: true, valor: (e) => formatarNumeroBR(e.linhas, 0) },
  { rotulo: "Candidatos", numerica: true, valor: (e) => formatarNumeroBR(e.candidatos, 0) },
];

export const COLUNAS_CANDIDATO_BIGTECH: ColunaResumo<CandidatoBigTech>[] = [
  {
    rotulo: "Candidato",
    valor: (c) => (
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{c.urna}</span>
        <span className="text-xs opacity-70">{c.nome}</span>
      </span>
    ),
  },
  { rotulo: "Cargo", valor: (c) => `${c.cargo}/${c.uf}` },
  { rotulo: "Partido", valor: (c) => c.partido },
  { rotulo: "Big tech", numerica: true, valor: (c) => <Moeda value={c.bigtech} /> },
  { rotulo: "Digital total", numerica: true, valor: (c) => <Moeda value={c.digital} /> },
];

export const COLUNAS_PARTIDO_BIGTECH: ColunaResumo<PartidoBigTech>[] = [
  { rotulo: "Partido", valor: (p) => p.partido },
  { rotulo: "Big tech", numerica: true, valor: (p) => <Moeda value={p.total} /> },
];

export const COLUNAS_MENCAO: ColunaResumo<MencaoPlataforma>[] = [
  { rotulo: "Rede citada na despesa", valor: ([nome]) => nome },
  { rotulo: "Despesas", numerica: true, valor: ([, v]) => formatarNumeroBR(v.linhas, 0) },
  { rotulo: "Contratado", numerica: true, valor: ([, v]) => <Moeda value={v.total} /> },
];
