import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import path from "node:path";

import { NextResponse } from "next/server";

import { painelAutorizado, lerEdicoes } from "@/lib/painel/edicoes-io";
import { lerEstadoDoRepo } from "@/lib/painel/git-estado";

/**
 * O botão "publicar" — pedido de build para a máquina que tem o banco.
 *
 * ═══ POR QUE UM ARQUIVO NO GIT, E NÃO UMA CHAMADA HTTP ═══
 *
 * A máquina de build é o `home-pc`. Medido em 15/08/2026: ele responde
 * `tailscale ping` em 4 ms, mas **nenhuma porta de serviço responde** — 22,
 * 445, 3389 e 5432 todas fechadas. Dá para falar com a máquina, não dá para
 * mandar nela.
 *
 * Então o pedido viaja pelo único canal que já existe e já é confiável: o
 * próprio repositório. Este endpoint grava `data/pedido-build.json`, commita e
 * dá push; `scripts/vigia-build.mts`, rodando no `home-pc`, puxa, vê o pedido
 * e roda a rotina. Nenhuma porta aberta, funciona atrás de NAT, e a trilha
 * fica no git como todo o resto — quem pediu, quando e por quê.
 *
 * A alternativa (abrir uma porta na tailnet) começa o build na hora, sem
 * esperar o intervalo do vigia. Ficou registrada no plano como a segunda
 * opção; esta foi escolhida por não exigir infraestrutura nova.
 *
 * ═══ ISTO NÃO PUBLICA NADA SOZINHO ═══
 *
 * Devolve `enfileirado`, não "publicado". O build leva de 15 a 20 minutos no
 * tamanho atual do site (3.850 páginas, medido em `docs/PLANO-PAINEL-EDICAO.md`),
 * e ainda depende do vigia acordar. A tela tem que dizer isso — prometer
 * "publicado" aqui seria a mesma mentira que "salvar = publicar".
 */

export const dynamic = "force-dynamic";

const RAIZ = path.resolve(process.cwd(), "..", "..");
const PEDIDO = path.join(process.cwd(), "data", "pedido-build.json");

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: RAIZ, encoding: "utf-8", timeout: 60_000 }).trim();
}

export interface PedidoDeBuild {
  solicitadoPor: string;
  motivo: string;
  em: string;
  /** Quantas edições estavam à espera quando o pedido foi feito. */
  edicoesPendentes: number;
  /** Commit em que o pedido nasceu — o vigia registra o que de fato buildou. */
  commitDoPedido: string;
}

export async function POST(request: Request) {
  if (!painelAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  const repo = lerEstadoDoRepo();
  if (!repo.podeEditar) {
    return NextResponse.json({ erro: repo.aviso, repo }, { status: 409 });
  }

  let corpo: Record<string, unknown> = {};
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    // Corpo vazio é aceitável: o pedido tem padrão para os dois campos.
  }

  const solicitadoPor = (typeof corpo.por === "string" ? corpo.por : "").trim();
  if (!solicitadoPor) {
    return NextResponse.json({ erro: "Quem pediu é obrigatório." }, { status: 400 });
  }

  const pedido: PedidoDeBuild = {
    solicitadoPor,
    motivo: (typeof corpo.motivo === "string" ? corpo.motivo : "").trim() || "publicação manual",
    em: new Date().toISOString(),
    edicoesPendentes: lerEdicoes().length,
    commitDoPedido: git("rev-parse", "HEAD"),
  };

  mkdirSync(path.dirname(PEDIDO), { recursive: true });
  writeFileSync(PEDIDO, `${JSON.stringify(pedido, null, 2)}\n`, "utf-8");

  /**
   * Commita SÓ os dois arquivos do painel, por pathspec.
   *
   * `git commit` sem pathspec leva tudo que estiver em staging — inclusive o
   * de outra sessão trabalhando no mesmo checkout. Isso já aconteceu neste
   * repositório e engoliu arquivos alheios num commit com a mensagem errada.
   */
  try {
    git(
      "commit",
      "--only",
      "apps/web/data/pedido-build.json",
      "apps/web/data/edicoes.json",
      "-m",
      `Pedido de build pelo painel: ${pedido.motivo}\n\nPedido por ${pedido.solicitadoPor}, com ${pedido.edicoesPendentes} edicao(oes) pendente(s).`
    );
  } catch (e) {
    return NextResponse.json(
      { erro: `Não consegui commitar o pedido: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  try {
    git("push", "origin", "HEAD:main");
  } catch (e) {
    /**
     * Push falhou, mas o commit existe. Não desfaço: desfazer aqui apagaria a
     * edição junto. A tela avisa para dar `git push` à mão — estado explícito
     * é melhor que rollback silencioso.
     */
    return NextResponse.json(
      {
        erro: `Pedido commitado, mas o push falhou: ${(e as Error).message}. Rode "git push origin HEAD:main" à mão — o vigia só enxerga o que está no origin.`,
        commitado: true,
        enfileirado: false,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    enfileirado: true,
    pedido,
    aviso:
      "Pedido enviado. O build roda na máquina que tem o banco e leva de 15 a 20 minutos, mais o intervalo do vigia. Nada está no ar ainda.",
  });
}

/** Estado do último pedido e do último build, para a tela mostrar. */
export async function GET(request: Request) {
  if (!painelAutorizado(request)) {
    return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
  }

  function ler<T>(arquivo: string): T | null {
    try {
      return JSON.parse(readFileSync(path.join(process.cwd(), "data", arquivo), "utf-8")) as T;
    } catch {
      return null;
    }
  }

  return NextResponse.json({
    pedido: ler<PedidoDeBuild>("pedido-build.json"),
    ultimoBuild: ler<Record<string, unknown>>("ultimo-build.json"),
    pendentes: lerEdicoes().length,
  });
}
