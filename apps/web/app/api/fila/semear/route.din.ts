/**
 * POST /api/fila/semear — a NUVEM semeia a fila de coleta (Fase 1
 * "coletar na nuvem, digerir no PC").
 *
 * PAPEL NO PROJETO
 * ----------------
 * O cron worker do Guara (`cron-fila.yaml`, a cada 15 min) chama esta rota
 * sem corpo. Ela enfileira um lote `ALVOS_PADRAO` de tarefas `pendente` em
 * `fila_coleta`. O `home-pc` depois puxa as linhas, roda o Ollama local e
 * grava o resultado (`scripts/fila-coleta-puller.mts`). Esta rota NÃO
 * coleta nada: só escreve o pedido.
 *
 * SEGURANÇA
 * ---------
 * 1. FALHA FECHADA. O segredo vem no header `x-fila-segredo` e é comparado
 *    com `process.env.FILA_SEGREDO` em tempo constante. Se a env NÃO
 *    existir, ou o header não bater, a resposta é 401 e NADA é processado.
 *    Diferente do webhook do Telegram (que avisa e segue aberto), aqui a
 *    porta tranca por padrão — é uma rota de ESCRITA.
 * 2. ALLOWLIST DE HOSTS. Todo `alvo` que é URL passa por
 *    `validarItemFila()` (lib/fila/allowlist.ts). Host fora da lista derruba
 *    o lote inteiro com 400 — nunca criar um proxy SSRF genérico.
 * 3. SEM CORPO = lote padrão. O cron não manda body; nesse caso usamos os
 *    `ALVOS_PADRAO` (endpoints oficiais da allowlist). Com corpo, o lote é
 *    validado por inteiro ANTES de qualquer insert: um item inválido aborta
 *    tudo, para não gravar meia fila.
 *
 * IDEMPOTÊNCIA
 * ------------
 * O insert usa `onConflictDoNothing` contra o índice único parcial
 * `fila_coleta_pendente_unico_idx` (só `pendente`/`processando`): semear o
 * mesmo alvo já na fila não duplica; depois de processado ele pode voltar.
 * É o que permite o cron de 15 em 15 minutos sem inundar a fila.
 */

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { fila_coleta } from "@/lib/db/schema";
import { validarItemFila, type ItemFilaValidado } from "@/lib/fila/allowlist";

// Runtime Node (armadilha do repositório: edge está deprecado no Next 16) e
// dinâmico porque escreve no banco a cada POST.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Teto do lote: uma chamada não pode despejar milhares de linhas. */
const MAX_ITENS = 100;

/**
 * Lote padrão quando o cron chama sem corpo. São endpoints oficiais da
 * allowlist (todos batem com `HOSTS_PERMITIDOS`), usados como sementes
 * recorrentes do quadro. Query/recorte fino é responsabilidade do puller,
 * por `tipo` — aqui só apontamos a fonte.
 */
const ALVOS_PADRAO: ItemFilaValidado[] = [
  {
    tipo: "coletar",
    alvo: "https://servicodados.ibge.gov.br/api/v1/localidades/municipios",
    payload: { recorte: "mg" },
  },
  {
    tipo: "coletar",
    alvo: "https://dadosabertos.camara.leg.br/api/v2/proposicoes",
    payload: { casa: "camara" },
  },
  {
    tipo: "coletar",
    alvo: "https://legis.senado.leg.br/dadosabertos/senador/lista/atual",
    payload: { casa: "senado" },
  },
  {
    tipo: "coletar",
    alvo: "https://pncp.gov.br/api/consulta/v1/contratos",
    payload: { esfera: "federal" },
  },
  {
    tipo: "coletar",
    alvo: "https://dados.mg.gov.br/api/3/action/package_list",
    payload: { estado: "MG" },
  },
];

/**
 * Compara o segredo em tempo constante. `===` sai cedo no primeiro byte
 * diferente e vaza o segredo por timing; o tamanho não é segredo, então
 * conferi-lo antes é seguro (mesmo padrão de `/api/telegram`).
 */
function segredoConfere(header: string | null, secret: string): boolean {
  if (!header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  // (1) FALHA FECHADA: sem env configurada, NENHUMA requisição passa.
  const secret = process.env.FILA_SEGREDO;
  if (!secret) {
    return NextResponse.json(
      { erro: "Semeio indisponivel: segredo nao configurado." },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }
  const header = req.headers.get("x-fila-segredo");
  if (!segredoConfere(header, secret)) {
    return NextResponse.json(
      { erro: "Nao autorizado." },
      { status: 401, headers: { "cache-control": "no-store" } }
    );
  }

  // (3) Corpo opcional. Sem body (chamada do cron) → lote padrão.
  let corpo: { itens?: unknown } = {};
  const texto = await req.text();
  if (texto.trim()) {
    try {
      const parsed = JSON.parse(texto);
      if (typeof parsed === "object" && parsed !== null) corpo = parsed as { itens?: unknown };
    } catch {
      return NextResponse.json({ erro: "Corpo nao e JSON valido." }, { status: 400 });
    }
  }

  const brutos: unknown[] = Array.isArray(corpo.itens) ? corpo.itens : ALVOS_PADRAO;
  if (brutos.length === 0 || brutos.length > MAX_ITENS) {
    return NextResponse.json(
      { erro: `Lote deve ter entre 1 e ${MAX_ITENS} itens.` },
      { status: 400 }
    );
  }

  // (2) Valida o lote INTEIRO antes de gravar: item inválido aborta tudo.
  const validados: ItemFilaValidado[] = [];
  const invalidos: number[] = [];
  brutos.forEach((bruto, i) => {
    const ok = validarItemFila(bruto);
    if (ok) validados.push(ok);
    else invalidos.push(i);
  });
  if (invalidos.length > 0) {
    return NextResponse.json(
      {
        erro: "Itens invalidos (tipo fora do vocabulario ou host fora da allowlist).",
        indicesInvalidos: invalidos,
      },
      { status: 400 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { erro: "Banco de dados indisponivel." },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const inseridos = await db
      .insert(fila_coleta)
      .values(validados.map((v) => ({ tipo: v.tipo, alvo: v.alvo, payload: v.payload })))
      .onConflictDoNothing()
      .returning({ id: fila_coleta.id });

    return NextResponse.json(
      {
        ok: true,
        recebidos: validados.length,
        inseridos: inseridos.length,
        ignorados: validados.length - inseridos.length,
        ids: inseridos.map((r) => r.id),
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e) {
    console.error("[fila/semear] falha ao enfileirar:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { erro: "Falha ao gravar a fila." },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
