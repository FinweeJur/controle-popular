/**
 * Cadeia de reserva do Postgres — o banco que responde quando o principal
 * vem vazio ou falha.
 *
 * ═══ O PROBLEMA QUE ISTO RESOLVE ═══
 *
 * `getDb()` só troca de banco quando a CONEXÃO falha. O incidente medido é
 * o inverso: o Postgres do Guara **conecta, mas está vazio** (o ETL não
 * rodou contra ele) e a página mostra "ainda não rodou contra este banco"
 * embora a Neon tenha o dado. Aqui a troca acontece por CONSULTA: rodou no
 * banco principal, veio vazio ou deu erro → roda a MESMA consulta no
 * próximo banco da cadeia.
 *
 * ═══ OS PLANOS (decisão do dev, 30/09/2026) ═══
 *
 * - **A — principal:** `DATABASE_URL` (Postgres do Guara).
 * - **B — Neon:** `DATABASE_URL_NEON` (HTTP da Neon), o reserva nominal.
 * - **C — dinâmico (rota em runtime):** NÃO mora aqui. É o comportamento
 *   de página: quando nem A nem B têm o dado, a página cai no seu estado
 *   de degradação / rota dinâmica (`.din.ts`), que consulta no request.
 * - **D — home-pc:** `DATABASE_URL_HOMEPC` (ou `DATABASE_URL_RESERVA`),
 *   o Postgres local do home-pc, automático por último.
 *
 * A ordem é A → B → D, a primeira resposta NÃO VAZIA vence. O erro é
 * registrado, nunca engolido: fallback silencioso esconderia o Guara caído
 * e o site sairia com o dado de ontem sem ninguém saber (mesma disciplina
 * de `listarCidades()` em `queries/municipios.ts`).
 *
 * Só entram bancos com URL configurada e diferente do principal. Sem
 * reserva configurada, `comBancoReserva` se comporta como a consulta
 * direta de antes.
 */

import { criarConexao, getDb, type DB } from "./client";
import { registrarFalhaDeBanco } from "./erro-conexao";

/** Um banco de reserva, pelo nome (para o log) e a URL. */
export interface BancoReserva {
  nome: string;
  url: string;
}

/**
 * Os bancos de reserva disponíveis, na ordem de tentativa.
 * Filtra o que é igual ao principal (não faz sentido "cair" no mesmo banco).
 */
export function bancosReserva(): BancoReserva[] {
  const principal = process.env.DATABASE_URL;
  const vistos = new Set<string>(principal ? [principal] : []);
  const reservas: BancoReserva[] = [];

  const neon = process.env.DATABASE_URL_NEON;
  if (neon && !vistos.has(neon)) {
    vistos.add(neon);
    reservas.push({ nome: "neon", url: neon });
  }

  // D — home-pc: o Postgres local, automático por último.
  const home = process.env.DATABASE_URL_HOMEPC ?? process.env.DATABASE_URL_RESERVA;
  if (home && !vistos.has(home)) {
    vistos.add(home);
    reservas.push({ nome: "home-pc", url: home });
  }

  return reservas;
}

/** Conexão memoizada por URL — não recria a cada consulta. */
const conexoes = new Map<string, DB>();
function conexaoDe(url: string): DB {
  let db = conexoes.get(url);
  if (!db) {
    db = criarConexao(url);
    conexoes.set(url, db);
  }
  return db;
}

export interface OpcoesReserva<T> {
  /** O resultado é "vazio" (tenta o próximo banco)? */
  vazio: (r: T) => boolean;
  /** Valor devolvido quando TODOS os bancos vieram vazios ou falharam. */
  padrao: T;
  /** Rótulo curto para o log (ex.: "legislacao"). */
  rotulo: string;
}

/** Executa uma promessa com timeout limite em milissegundos para nao prender a requisicao. */
function comTimeout<T>(promessa: Promise<T>, ms: number, mensagem: string): Promise<T> {
  return Promise.race([
    promessa,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(mensagem)), ms)
    ),
  ]);
}

/**
 * Roda `consulta` no principal e, se vier vazia ou falhar, nos reservas —
 * devolve a primeira resposta não vazia. `padrao` quando nenhum responde.
 */
export async function comBancoReserva<T>(
  consulta: (db: DB) => Promise<T>,
  { vazio, padrao, rotulo }: OpcoesReserva<T>
): Promise<T> {
  const tentativas: { nome: string; db: DB }[] = [];

  const principal = getDb();
  if (principal) tentativas.push({ nome: "guara", db: principal });

  for (const b of bancosReserva()) {
    try {
      tentativas.push({ nome: b.nome, db: conexaoDe(b.url) });
    } catch (e) {
      // Mesma régua do `catch` de baixo: conexão que não abre, em dev, é
      // ambiente (não defeito) e não deve virar erro no overlay do Next.
      registrarFalhaDeBanco(
        `${rotulo} · reserva ${b.nome}`,
        e,
        `reserva ${b.nome} não conectou:`
      );
    }
  }

  for (const t of tentativas) {
    try {
      const timeoutMs = t.nome === "guara" ? 6_000 : 4_000;
      const r = await comTimeout(
        consulta(t.db),
        timeoutMs,
        `tempo limite de ${timeoutMs}ms excedido em ${t.nome}`
      );
      if (!vazio(r)) {
        if (t.nome !== "guara") {
          console.info(`[banco:${rotulo}] respondido pela reserva ${t.nome}`);
        }
        return r;
      }
      if (t.nome === "guara") {
        // Só diz "tentando reserva" quando HÁ reserva. No build do Guara,
        // `bancosReserva()` volta vazio (só `DATABASE_URL` é marcada para o
        // build) — o log antigo prometia uma segunda tentativa que nunca
        // acontecia e mandou a investigação de 01/10 atrás de um fantasma.
        const haReserva = tentativas.length > 1;
        console.warn(
          `[banco:${rotulo}] principal (Guara) vazio${haReserva ? "; tentando reserva" : ""}`
        );
      } else {
        console.warn(`[banco:${rotulo}] reserva ${t.nome} vazia`);
      }
    } catch (e) {
      // Sem Postgres local a consulta falha com ECONNREFUSED: em dev isso é
      // esperado (o `padrao` cobre a página) e vira `info`; erro de verdade —
      // ou qualquer falha em produção — continua `error`.
      registrarFalhaDeBanco(`${rotulo} · ${t.nome}`, e, "falhou:");
    }
  }

  return padrao;
}
