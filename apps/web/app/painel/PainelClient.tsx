"use client";

import { useMemo, useState } from "react";

import type { Edicao } from "@/lib/edicoes";
import type { EstadoDoRepo } from "@/lib/painel/git-estado";
import type { RotaEditavel } from "@/lib/painel/rotas-editaveis";

/**
 * A tela do painel de edição.
 *
 * ═══ O TOKEN FICA NA MEMÓRIA DA ABA, NUNCA EM DISCO ═══
 *
 * Nada de `localStorage`: token em `localStorage` sobrevive a fechar o
 * navegador e a qualquer script que rode na página depois. Aqui ele vive em
 * `useState` — fechou a aba, sumiu. O incômodo de redigitar é pequeno para
 * uma ferramenta usada por duas pessoas em duas máquinas conhecidas.
 *
 * ═══ TODA RESPOSTA DIZ QUANTAS EDIÇÕES ESPERAM PUBLICAÇÃO ═══
 *
 * O plano é explícito: a tela mostra sempre "N edições pendentes, ainda não
 * publicadas" e **nunca finge que salvar é publicar**. É a razão de `pendentes`
 * voltar em toda resposta da API em vez de ser calculado aqui.
 */

interface Props {
  rotasEditaveis: RotaEditavel[];
  edicoesIniciais: Edicao[];
  repoInicial: EstadoDoRepo;
}

type Aviso = { tipo: "ok" | "erro"; texto: string } | null;

export default function PainelClient({ rotasEditaveis, edicoesIniciais, repoInicial }: Props) {
  const [token, setToken] = useState("");
  const [edicoes, setEdicoes] = useState<Edicao[]>(edicoesIniciais);
  const [repo, setRepo] = useState<EstadoDoRepo>(repoInicial);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [ocupado, setOcupado] = useState(false);

  const [rota, setRota] = useState(rotasEditaveis[0]?.rota ?? "");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [por, setPor] = useState("");
  const [motivo, setMotivo] = useState("");

  const edicaoDaRota = useMemo(
    () => edicoes.find((e) => e.rota === rota),
    [edicoes, rota]
  );

  const bloqueado = !repo.podeEditar;

  /** O que a API devolve; campos opcionais porque cada rota preenche os seus. */
  type RespostaDoPainel = {
    erro?: string;
    edicoes?: Edicao[];
    pendentes?: number;
    repo?: EstadoDoRepo;
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

      <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4">
        <label className={rotulo} htmlFor="token">
          Token do painel (<code>PAINEL_TOKEN</code> do <code>.env.local</code>)
        </label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="cole aqui — fica só na memória desta aba"
          className={campo}
        />
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
        <button
          type="button"
          onClick={publicar}
          disabled={ocupado || bloqueado}
          className="cp-btn-anim mt-4 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-ink disabled:cursor-not-allowed disabled:opacity-45"
        >
          Pedir publicação
        </button>
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
