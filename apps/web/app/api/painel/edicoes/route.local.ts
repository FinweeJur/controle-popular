import { NextResponse } from "next/server";

import { listarEdicoes } from "@/lib/edicoes";
import {
  painelAutorizado,
  salvarEdicao,
  removerEdicao,
  lerEdicoes,
} from "@/lib/painel/edicoes-io";
import { lerEstadoDoRepo } from "@/lib/painel/git-estado";

/**
 * API do painel de edição — `GET`, `POST` e `DELETE` sobre `data/edicoes.json`.
 *
 * ═══ A EXTENSÃO `.local.ts` É O QUE MANTÉM ISTO FORA DA INTERNET ═══
 *
 * Esta rota escreve no disco do repositório e roda `git` na máquina. Ela NUNCA
 * pode existir no Worker publicado. A garantia não é lembrar de não publicar:
 * é `next.config.ts`, que só reconhece `.local.ts` quando `PAINEL_LOCAL=1` E
 * `NODE_ENV !== "production"` — e `next build` sempre define `production`. Ver
 * o bloco `painelLocalLigado` lá, que explica por que a segunda condição é a
 * que fecha a porta de verdade.
 *
 * ═══ SALVAR NÃO É PUBLICAR ═══
 *
 * `POST` grava o arquivo na hora e o site **não muda**. O site é estático:
 * `next build` imprime o HTML. Toda resposta devolve `pendentes`, e a tela usa
 * isso para dizer quantas edições esperam publicação — a assimetria que o
 * plano faz questão de deixar visível, porque um painel que finge o contrário
 * é pior que nenhum.
 */

/** Sem `force-static`: esta rota lê disco e git a cada chamada, de propósito. */
export const dynamic = "force-dynamic";

function negado() {
  return NextResponse.json(
    { erro: "Não autorizado. Defina PAINEL_TOKEN no .env.local e envie no header Authorization." },
    { status: 401 }
  );
}

export async function GET(request: Request) {
  if (!painelAutorizado(request)) return negado();

  return NextResponse.json({
    edicoes: lerEdicoes(),
    pendentes: listarEdicoes().length,
    repo: lerEstadoDoRepo(),
  });
}

export async function POST(request: Request) {
  if (!painelAutorizado(request)) return negado();

  /**
   * A trava otimista roda ANTES de gravar, não depois. Se `origin/main` andou,
   * a edição é recusada com o motivo em palavras — é o que o plano chama de
   * transformar "quem escreveu por último vence, sem avisar" em "quem tentar
   * escrever em cima do outro é bloqueado e avisado".
   */
  const repo = lerEstadoDoRepo();
  if (!repo.podeEditar) {
    return NextResponse.json({ erro: repo.aviso, repo }, { status: 409 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: "Corpo não é JSON válido." }, { status: 400 });
  }

  const rota = typeof corpo.rota === "string" ? corpo.rota : "";
  if (!rota) return NextResponse.json({ erro: "Rota é obrigatória." }, { status: 400 });

  const resultado = salvarEdicao({
    rota,
    titulo: typeof corpo.titulo === "string" ? corpo.titulo : undefined,
    descricao: typeof corpo.descricao === "string" ? corpo.descricao : undefined,
    por: typeof corpo.por === "string" ? corpo.por : "",
    motivo: typeof corpo.motivo === "string" ? corpo.motivo : "",
    // Carimbo do servidor, não do navegador: relógio de cliente é editável, e
    // esta data é trilha de auditoria.
    em: new Date().toISOString(),
  });

  if (!resultado.ok) return NextResponse.json({ erro: resultado.erro }, { status: 400 });

  return NextResponse.json({
    ok: true,
    edicoes: resultado.edicoes,
    pendentes: resultado.edicoes.length,
    repo,
  });
}

export async function DELETE(request: Request) {
  if (!painelAutorizado(request)) return negado();

  const repo = lerEstadoDoRepo();
  if (!repo.podeEditar) {
    return NextResponse.json({ erro: repo.aviso, repo }, { status: 409 });
  }

  const rota = new URL(request.url).searchParams.get("rota") ?? "";
  if (!rota) return NextResponse.json({ erro: "Rota é obrigatória." }, { status: 400 });

  const resultado = removerEdicao(rota);
  if (!resultado.ok) return NextResponse.json({ erro: resultado.erro }, { status: 404 });

  return NextResponse.json({
    ok: true,
    edicoes: resultado.edicoes,
    pendentes: resultado.edicoes.length,
    repo,
  });
}
