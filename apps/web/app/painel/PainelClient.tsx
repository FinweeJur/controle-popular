"use client";

import { useMemo, useState } from "react";

import type { Edicao } from "@/lib/edicoes";
import type { EstadoDoRepo } from "@/lib/painel/git-estado";
import type { RotaEditavel } from "@/lib/painel/rotas-editaveis";
import type { UltimoBuild } from "@/lib/painel/ultimo-build";

/**
 * A tela do painel de edição.
 *
 * ═══ O TOKEN FICA NO `localStorage` DESTA MÁQUINA ═══
 *
 * O painel só existe localmente (`PAINEL_LOCAL=1` + dev server, ver
 * `next.config.ts`) e nunca é publicado — a proteção real é a rede, não o
 * token. Guardar o token no `localStorage` é escolha do dono (2026-08-15):
 * redigitar a cada aba era o custo de uma defesa que a arquitetura já não
 * precisa. Quem quiser a versão rígida usa o botão "Esquecer token".
 *
 * ═══ TODA RESPOSTA DIZ QUANTAS EDIÇÕES ESPERAM PUBLICAÇÃO ═══
 *
 * O plano é explícito: a tela mostra sempre "N edições pendentes, ainda não
 * publicadas" e **nunca finge que salvar é publicar**. É a razão de `pendentes`
 * voltar em toda resposta da API em vez de ser calculado aqui.
 */

const TOKEN_LOCAL = "cp-painel-token";

/** ISO -> "15/08/2026 às 20:04" no fuso da máquina. */
function formatarData(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dia = d.toLocaleDateString("pt-BR");
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return `em ${dia} às ${hora}`;
}

/** SHA completo -> 7 primeiros caracteres. */
function curto(sha: string): string {
  return sha.length > 7 ? sha.slice(0, 7) : sha;
}

interface Props {
  rotasEditaveis: RotaEditavel[];
  edicoesIniciais: Edicao[];
  repoInicial: EstadoDoRepo;
  ultimoBuildInicial: UltimoBuild | null;
}

type Aviso = { tipo: "ok" | "erro"; texto: string } | null;

/** Texto atual da página, lido do código pela API (`lib/painel/texto-atual.ts`). */
interface TextoAtual {
  rota: string;
  titulo: string | null;
  descricao: string | null;
  calculado: boolean;
}

export default function PainelClient({
  rotasEditaveis,
  edicoesIniciais,
  repoInicial,
  ultimoBuildInicial,
}: Props) {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return window.localStorage.getItem(TOKEN_LOCAL) ?? "";
    } catch {
      return "";
    }
  });
  const [edicoes, setEdicoes] = useState<Edicao[]>(edicoesIniciais);
  const [repo, setRepo] = useState<EstadoDoRepo>(repoInicial);
  const [ultimoBuild, setUltimoBuild] = useState<UltimoBuild | null>(ultimoBuildInicial);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState(false);

  const [rota, setRota] = useState(rotasEditaveis[0]?.rota ?? "");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [por, setPor] = useState("");
  const [motivo, setMotivo] = useState("");
  const [textoAtual, setTextoAtual] = useState<TextoAtual | null>(null);

  /** Persiste o token no `localStorage` enquanto a pessoa digita. */
  function aoMudarToken(novo: string) {
    setToken(novo);
    try {
      if (novo) window.localStorage.setItem(TOKEN_LOCAL, novo);
      else window.localStorage.removeItem(TOKEN_LOCAL);
    } catch {
      // Sem storage, segue só na memória da aba.
    }
  }

  const edicaoDaRota = useMemo(
    () => edicoes.find((e) => e.rota === rota),
    [edicoes, rota]
  );

  const bloqueado = !repo.podeEditar;

  /** O que a API devolve; campos opcionais porque cada rota preenche os seus. */
  type RespostaDoPainel = {
    erro?: string;
    ok?: boolean;
    edicoes?: Edicao[];
    pendentes?: number;
    repo?: EstadoDoRepo;
    ultimoBuild?: UltimoBuild | null;
    aviso?: string;
  };

  async function chamar(caminho: string, init: RequestInit): Promise<RespostaDoPainel | null> {
    if (!token) {
      setAviso({ tipo: "erro", texto: "Informe o token do painel antes." });
      return null;
    }
    setOcupado(true);
    setAviso(null);
    try {
      const r = await fetch(caminho, {
        ...init,
        headers: {
          ...(init.headers ?? {}),
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const corpo = (await r.json()) as RespostaDoPainel;
      if (!r.ok) {
        setAviso({ tipo: "erro", texto: corpo.erro ?? `Falhou (HTTP ${r.status}).` });
        if (corpo.repo) setRepo(corpo.repo);
        return null;
      }
      if (Array.isArray(corpo.edicoes)) setEdicoes(corpo.edicoes);
      if (corpo.repo) setRepo(corpo.repo);
      if (corpo.ultimoBuild !== undefined) setUltimoBuild(corpo.ultimoBuild);
      return corpo;
    } catch (e) {
      setAviso({ tipo: "erro", texto: `Erro de rede: ${(e as Error).message}` });
      return null;
    } finally {
      setOcupado(false);
    }
  }

  async function salvar() {
    const corpo = await chamar("/api/painel/edicoes", {
      method: "POST",
      body: JSON.stringify({ rota, titulo, descricao, por, motivo }),
    });
    if (corpo) {
      setAviso({
        tipo: "ok",
        texto: `Gravado. ${corpo.pendentes ?? 0} edição(ões) esperando publicação — o site ainda não mudou.`,
      });
      setMotivo("");
    }
  }

  async function remover() {
    const corpo = await chamar(`/api/painel/edicoes?rota=${encodeURIComponent(rota)}`, {
      method: "DELETE",
    });
    if (corpo) {
      setTitulo("");
      setDescricao("");
      setAviso({ tipo: "ok", texto: "Edição removida — a página volta ao texto do código." });
    }
  }

  /** Lê o texto atual (do código) da rota, para mostrar o que será substituído. */
  async function carregarTextoAtual(rotaNova: string) {
    setTextoAtual(null);
    if (!token || !rotaNova) return;
    try {
      const r = await fetch(`/api/painel/texto-atual?rota=${encodeURIComponent(rotaNova)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setTextoAtual((await r.json()) as TextoAtual);
    } catch {
      setTextoAtual(null);
    }
  }

  /** Grava o token para a próxima visita; "Esquecer token" apaga. */
  function esquecerToken() {
    try {
      window.localStorage.removeItem(TOKEN_LOCAL);
    } catch {
      // Sem storage (modo privado), o token vive só na memória — igual antes.
    }
    setToken("");
    setAviso({ tipo: "ok", texto: "Token esquecido — esta aba continua autenticada até fechar." });
  }

  async function publicar() {
    if (!por.trim()) {
      setAviso({ tipo: "erro", texto: "Preencha 'quem' antes de pedir a publicação." });
      return;
    }
    const corpo = await chamar("/api/painel/publicar", {
      method: "POST",
      body: JSON.stringify({ por, motivo: motivo || "publicação pelo painel" }),
    });
    if (corpo) setAviso({ tipo: "ok", texto: corpo.aviso ?? "Pedido enviado." });
  }

  async function sincronizar() {
    const corpo = await chamar("/api/painel/sincronizar", { method: "POST" });
    if (corpo) {
      setAviso({
        tipo: corpo.ok ? "ok" : "erro",
        texto: corpo.ok
          ? "Local atualizado com a main do GitHub."
          : (corpo.erro ?? "Não consegui sincronizar."),
      });
    }
  }

  const campo =
    "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:border-primary focus:outline-none";
  const rotulo = "mb-1 block text-xs font-medium text-text-soft";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <p className="mb-2 inline-block rounded-full bg-alert/10 px-3 py-1 text-xs font-medium text-alert">
        Ferramenta local — esta página não existe no site publicado
      </p>

      <h1 className="font-display text-[clamp(1.6em,4vw,2.2em)] leading-tight font-bold tracking-tight">
        Painel de edição
      </h1>
      <p className="mt-2 max-w-2xl text-[.98em] text-text-soft">
        Corrige título e descrição de uma página sem mexer em código.{" "}
        <strong className="text-text">Salvar não publica.</strong> O site é estático: o texto
        gravado aqui aparece no próximo build, que leva de 15 a 20 minutos e roda na máquina que
        tem o banco.
      </p>

      {bloqueado && (
        <p className="mt-4 rounded-2xl border border-alert bg-alert/5 p-4 text-sm text-text">
          <strong className="text-alert">Edição bloqueada.</strong> {repo.aviso}
        </p>
      )}

      {!repo.sincronizado && (
        <p className="mt-3 rounded-2xl border border-border bg-surface-2 p-3 text-xs text-text-soft">
          Não consegui falar com o <code>origin</code> agora, então a comparação abaixo é contra a
          última informação conhecida, não contra o estado atual da outra máquina.
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-text">Último deploy</h2>
        {ultimoBuild ? (
          <div className="mt-3 space-y-2 text-sm text-text-soft">
            <p>
              <strong className="text-text">
                {ultimoBuild.publicou ? "Publicou" : "Falhou"}
              </strong>{" "}
              {formatarData(ultimoBuild.terminouEm)}
              {ultimoBuild.erro && (
                <span className="mt-1 block text-xs text-alert">{ultimoBuild.erro}</span>
              )}
            </p>
            <p>
              Commit no ar: <code className="text-text">{curto(ultimoBuild.commitBuildado)}</code>
            </p>
            {repo.head !== curto(ultimoBuild.commitBuildado) && (
              <p className="rounded-lg bg-surface-2 p-3 text-xs text-text-soft">
                Esta máquina está no <code>{repo.head}</code>, diferente do que está no ar. O que
                você fez depois disso ainda não foi publicado — veja abaixo se precisa pedir
                publicação.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-text-soft">
            Nenhum build registrado ainda nesta máquina. O primeiro deploy registra a data aqui.
          </p>
        )}
      </section>

      <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
        <label className={rotulo} htmlFor="token">
          Token do painel (<code>PAINEL_TOKEN</code> do <code>.env.local</code>)
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => aoMudarToken(e.target.value)}
          placeholder="cole aqui — fica salvo nesta máquina até você esquecer"
          className={campo}
          suppressHydrationWarning
        />
        <button
          type="button"
          onClick={esquecerToken}
          className="mt-2 text-xs text-text-soft underline decoration-dotted hover:text-text"
        >
          Esquecer token
        </button>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-text">Editar uma página</h2>

        <div className="mt-4">
          <label className={rotulo} htmlFor="rota">
            Página ({rotasEditaveis.length} ligada{rotasEditaveis.length === 1 ? "" : "s"} para
            edição)
          </label>
          <select
            id="rota"
            value={rota}
            onChange={(e) => {
              setRota(e.target.value);
              const j = edicoes.find((x) => x.rota === e.target.value);
              setTitulo(j?.titulo ?? "");
              setDescricao(j?.descricao ?? "");
              carregarTextoAtual(e.target.value);
            }}
            className={campo}
          >
            {rotasEditaveis.map((r) => (
              <option key={r.rota} value={r.rota}>
                {r.rota}
              </option>
            ))}
          </select>
          {rotasEditaveis.length === 0 && (
            <p className="mt-2 text-xs text-text-soft">
              Nenhuma página ligada ainda. Para ligar uma, troque o <code>metadata</code> dela por{" "}
              <code>metadataEditavel(&quot;/a/rota&quot;, {"{ … }"})</code>.
            </p>
          )}
        </div>

        {edicaoDaRota && (
          <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-text-soft">
            Já existe edição gravada aqui, por <strong className="text-text">{edicaoDaRota.por}</strong>{" "}
            em {edicaoDaRota.em.slice(0, 10).split("-").reverse().join("/")} — motivo:{" "}
            {edicaoDaRota.motivo}
          </p>
        )}

        {textoAtual && (
          <div className="mt-3 rounded-lg border border-border bg-surface-2 p-3 text-xs text-text-soft">
            <p className="font-medium text-text">
              Texto atual no código — é isso que uma edição salva vai substituir
            </p>
            <dl className="mt-2 space-y-2">
              <div>
                <dt className="font-medium text-text-soft">Título</dt>
                <dd className="mt-0.5 text-text">
                  {textoAtual.titulo ??
                    (textoAtual.calculado
                      ? "Calculado no código (contém conta) — confira a página."
                      : "Nenhum título no código.")}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-text-soft">Descrição</dt>
                <dd className="mt-0.5 text-text">
                  {textoAtual.descricao ??
                    (textoAtual.calculado
                      ? "Calculada no código (contém conta) — confira a página."
                      : "Nenhuma descrição no código.")}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <div className="mt-4">
          <label className={rotulo} htmlFor="titulo">
            Título
          </label>
          <input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className={campo}
            disabled={bloqueado}
          />
        </div>

        <div className="mt-4">
          <label className={rotulo} htmlFor="descricao">
            Descrição
          </label>
          <textarea
            id="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className={campo}
            disabled={bloqueado}
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={rotulo} htmlFor="por">
              Quem está editando
            </label>
            <input
              id="por"
              value={por}
              onChange={(e) => setPor(e.target.value)}
              className={campo}
              disabled={bloqueado}
            />
          </div>
          <div>
            <label className={rotulo} htmlFor="motivo">
              Motivo (obrigatório)
            </label>
            <input
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="ex.: faltava o nome da cidade"
              className={campo}
              disabled={bloqueado}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={salvar}
            disabled={ocupado || bloqueado}
            className="cp-btn-anim rounded-full border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={remover}
            disabled={ocupado || bloqueado || !edicaoDaRota}
            className="cp-btn-anim rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-soft disabled:cursor-not-allowed disabled:opacity-45"
          >
            Remover edição
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-text">Publicar</h2>
        <p className="mt-2 text-sm text-text-soft">
          Há{" "}
          <strong className="text-text">
            {edicoes.length} edição(ões) gravada(s) e ainda não publicada(s)
          </strong>
          . Pedir a publicação grava um pedido no repositório e o envia; a máquina que tem o banco
          o encontra e roda o build. <strong className="text-text">Não é instantâneo</strong> — são
          15 a 20 minutos de build, mais o intervalo do vigia.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={publicar}
            disabled={ocupado || bloqueado}
            className="cp-btn-anim rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:cursor-not-allowed disabled:opacity-45"
          >
            Pedir publicação
          </button>
          <button
            type="button"
            onClick={sincronizar}
            disabled={ocupado}
            className="cp-btn-anim rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-soft disabled:cursor-not-allowed disabled:opacity-45"
            title="git fetch + git pull --ff-only origin main"
          >
            Sincronizar com o GitHub
          </button>
        </div>
        <p className="mt-3 text-xs text-text-soft">
          Sincronizar puxa os commits da main do GitHub para esta máquina — inclusive o resultado
          do último build (home-pc). Se houver divergência ou arquivo local modificado, ele recusa
          e avisa o que fazer no terminal.
        </p>
      </section>

      {aviso && (
        <p
          aria-live="polite"
          className={`mt-5 rounded-2xl border p-4 text-sm ${
            aviso.tipo === "ok"
              ? "border-border bg-surface-2 text-text"
              : "border-alert bg-alert/5 text-text"
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
