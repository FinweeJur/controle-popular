import { NextResponse } from "next/server";
import { comBancoReserva } from "@/lib/db/reserva";
import {
  contratos,
  despesas,
  licitacoes,
  ambiental_licenciamento,
} from "@/lib/db/schema";
import { sql, desc, count } from "drizzle-orm";

interface DadoResumido {
  total?: number;
  valor?: string;
  top?: { nome: string; valor?: number; total?: number }[];
  texto?: string;
}

const INDISPONIVEL: DadoResumido = { texto: "Banco de dados indisponível" };

async function buscarContratos(): Promise<DadoResumido> {
  return comBancoReserva<DadoResumido>(
    async (db) => {
      const [total] = await db.select({ n: count() }).from(contratos);

      const top = await db
        .select({
          nome: contratos.fornecedor_nome,
          valor: sql<number>`sum(${contratos.valor_global})::int`,
        })
        .from(contratos)
        .where(sql`${contratos.valor_global} > 0`)
        .groupBy(contratos.fornecedor_nome)
        .orderBy(desc(sql`sum(${contratos.valor_global})`))
        .limit(3);

      return {
        total: Number(total?.n ?? 0),
        top: top.map((t) => ({ nome: t.nome ?? "—", valor: Number(t.valor ?? 0) })),
      };
    },
    { vazio: (r) => (r.total ?? 0) === 0, padrao: INDISPONIVEL, rotulo: "dados-resumidos" }
  );
}

async function buscarDespesas(): Promise<DadoResumido> {
  return comBancoReserva<DadoResumido>(
    async (db) => {
      const [total] = await db.select({ n: count() }).from(despesas);
      const [valor] = await db
        .select({ total: sql<number>`coalesce(sum(${despesas.valor}), 0)::int` })
        .from(despesas);

      return {
        total: Number(total?.n ?? 0),
        valor: Number(valor?.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      };
    },
    { vazio: (r) => (r.total ?? 0) === 0, padrao: INDISPONIVEL, rotulo: "dados-resumidos" }
  );
}

async function buscarLicitacoes(): Promise<DadoResumido> {
  return comBancoReserva<DadoResumido>(
    async (db) => {
      const [total] = await db.select({ n: count() }).from(licitacoes);
      const [valor] = await db
        .select({ total: sql<number>`coalesce(sum(${licitacoes.valor_estimado}), 0)::int` })
        .from(licitacoes);

      return {
        total: Number(total?.n ?? 0),
        valor: Number(valor?.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      };
    },
    { vazio: (r) => (r.total ?? 0) === 0, padrao: INDISPONIVEL, rotulo: "dados-resumidos" }
  );
}

async function buscarLicenciamento(): Promise<DadoResumido> {
  return comBancoReserva<DadoResumido>(
    async (db) => {
      const [total] = await db.select({ n: count() }).from(ambiental_licenciamento);
      return { total: Number(total?.n ?? 0) };
    },
    { vazio: (r) => (r.total ?? 0) === 0, padrao: INDISPONIVEL, rotulo: "dados-resumidos" }
  );
}

const ROTAS_BUSCA: Record<string, () => Promise<DadoResumido>> = {
  contratos: buscarContratos,
  despesas: buscarDespesas,
  licitacoes: buscarLicitacoes,
  licenciamento: buscarLicenciamento,
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "";

  const buscar = ROTAS_BUSCA[tipo];
  if (!buscar) {
    return NextResponse.json(
      { erro: `Tipo '${tipo}' não suportado. Tipos: ${Object.keys(ROTAS_BUSCA).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const dados = await buscar();
    return NextResponse.json(dados);
  } catch (e) {
    // Log no servidor; resposta pública genérica (não vaza detalhe interno).
    console.error("[dados-resumidos] falha ao consultar:", e instanceof Error ? e.message : e);
    return NextResponse.json({ erro: "Erro ao consultar os dados." }, { status: 500 });
  }
}
