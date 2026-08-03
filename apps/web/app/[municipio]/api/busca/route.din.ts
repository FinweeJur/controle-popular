import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { obterCidadePorSlug } from "@/lib/db/queries/municipios";

/**
 * Sugestões da barra de busca da zona de cidades (autocomplete).
 *
 * Mesma forma dos endpoints das zonas irmãs (`congresso/api/busca`), com a
 * diferença que aqui TUDO é recortado por `id_municipio`. Esse recorte não é
 * detalhe: o banco é multi-cidade e uma sugestão sem filtro mostraria
 * contrato de outra cidade dentro do portal desta — o mesmo risco que o
 * `montarContexto` do chat já trata passando o `id_municipio`.
 *
 * `union all` numa consulta só, pelo teto de subrequests do Worker.
 */
export const runtime = "nodejs";

type Sugestao = {
  tipo: string;
  titulo: string;
  subtitulo: string | null;
  href: string;
  peso: number;
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ municipio: string }> }
) {
  const { municipio } = await params;
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ sugestoes: [], perguntas: [] });

  const cidade = await obterCidadePorSlug(municipio);
  if (!cidade) return NextResponse.json({ erro: "Cidade não encontrada." }, { status: 404 });

  const db = getDb();
  if (!db) {
    return NextResponse.json({ sugestoes: [], perguntas: [`O que o portal tem sobre ${q}?`] });
  }

  const like = `%${q}%`;
  const id = cidade.id_municipio;
  const base = `/${municipio}`;

  let sugestoes: Sugestao[] = [];
  try {
    const linhas = await db.execute<Sugestao>(sql`
      (select 'vereador' as tipo, v.nome as titulo,
              coalesce(v.partido, '') as subtitulo,
              ${base} || '/vereadores/' || v.slug as href, 1 as peso
         from vereadores v
        where v.id_municipio = ${id} and v.ativo
          and (v.nome ilike ${like} or v.nome_urna ilike ${like})
        limit 5)
      union all
      (select 'proposição', p.tipo || ' ' || coalesce(p.numero::text,'?') || '/' || coalesce(p.ano::text,'?'),
              left(p.ementa, 110),
              ${base} || '/camara/proposicoes', 2
         from proposicoes p
        where p.id_municipio = ${id} and p.ementa ilike ${like}
        order by p.ano desc nulls last, p.numero desc nulls last
        limit 5)
      union all
      (select 'contrato', coalesce(c.fornecedor_nome, 'fornecedor n/d'),
              left(c.objeto, 110),
              ${base} || '/prefeitura/contratos', 3
         from contratos c
        where c.id_municipio = ${id}
          and (c.objeto ilike ${like} or c.fornecedor_nome ilike ${like})
        order by c.valor_global desc nulls last
        limit 5)
      order by peso
      limit 8
    `);
    sugestoes = linhas.rows ?? [];
  } catch (e) {
    if ((e as { code?: string }).code !== "42P01") {
      return NextResponse.json({ erro: "Busca indisponível." }, { status: 500 });
    }
  }

  return NextResponse.json({
    sugestoes: sugestoes.map(({ tipo, titulo, subtitulo, href }) => ({
      tipo,
      titulo,
      subtitulo,
      href,
    })),
    perguntas: [
      `O que o portal tem sobre ${q}?`,
      `Quanto a Prefeitura de ${cidade.nome} gasta em ${q}?`,
      "Quais os maiores contratos da Prefeitura?",
    ].slice(0, 3),
  });
}
