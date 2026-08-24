"use client";

import { useEffect, useState, useCallback } from "react";
import { ANUNCIO_PLANOS, ANUNCIO_PRECOS } from "@/lib/betim/anuncios";
import { useCaminhoDaCidade } from "@/lib/betim/basePath";
import { useCidade } from "@/lib/betim/cidade-cliente";

interface PendingZap {
  id: string;
  nome: string;
  whatsapp: string;
  categoria: string | null;
  descricao: string | null;
  bairro: string | null;
}

interface PendingClassificado {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: string | null;
  preco: number | null;
  contato_whatsapp: string | null;
}

interface AnuncioRow {
  id: string;
  nome_comercio: string;
  plano: string | null;
  banner_url: string | null;
  link: string | null;
  ativo: boolean;
  data_inicio: string | null;
  data_fim: string | null;
}

export default function PainelAdmin() {
  const cidade = useCidade();
  const caminho = useCaminhoDaCidade();
  const [token, setToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zap, setZap] = useState<PendingZap[]>([]);
  const [classificados, setClassificados] = useState<PendingClassificado[]>([]);
  const [anuncios, setAnuncios] = useState<AnuncioRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem("cp-admin-token");
    if (saved) {
// eslint-disable-next-line react-hooks/set-state-in-effect -- leitura pos-hidratacao de window.location/sessionStorage: useSearchParams quebra o output:'export' (padrao documentado em TabelaEstatica.tsx)
      setToken(saved);
      setTokenInput(saved);
    }
  }, []);

  const authHeaders = useCallback(
    (t: string) => ({ Authorization: `Bearer ${t}`, "Content-Type": "application/json" }),
    []
  );

  const loadAll = useCallback(
    async (t: string) => {
      setLoading(true);
      setError(null);
      try {
        const [modRes, adsRes] = await Promise.all([
          fetch(caminho("/api/admin/moderacao"), { headers: authHeaders(t) }),
          fetch(caminho("/api/admin/anuncios"), { headers: authHeaders(t) }),
        ]);
        if (modRes.status === 401 || adsRes.status === 401) {
          setError("Token inválido.");
          setToken("");
          sessionStorage.removeItem("cp-admin-token");
          return;
        }
        const mod = await modRes.json();
        const ads = await adsRes.json();
        setZap(mod.zap_estabelecimentos ?? []);
        setClassificados(mod.classificados ?? []);
        setAnuncios(ads.rows ?? []);
      } catch {
        setError("Erro de conexão.");
      } finally {
        setLoading(false);
      }
    },
    [authHeaders]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAll alimenta estados a partir do token restaurado; efeito intencional de sincronizacao com sessionStorage
    if (token) loadAll(token);
  }, [token, loadAll]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem("cp-admin-token", tokenInput);
    setToken(tokenInput);
  }

  async function handleModerar(tabela: string, id: string, aprovado: boolean) {
    await fetch(caminho("/api/admin/moderacao"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ tabela, id, aprovado }),
    });
    loadAll(token);
  }

  async function handleCriarAnuncio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    await fetch(caminho("/api/admin/anuncios"), {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        nome_comercio: form.get("nome_comercio"),
        plano: form.get("plano"),
        banner_url: form.get("banner_url") || null,
        link: form.get("link") || null,
        data_inicio: form.get("data_inicio") || null,
        data_fim: form.get("data_fim") || null,
      }),
    });
    e.currentTarget.reset();
    loadAll(token);
  }

  async function handleToggleAtivo(id: string, ativo: boolean) {
    await fetch(caminho(`/api/admin/anuncios/${id}`), {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ ativo: !ativo }),
    });
    loadAll(token);
  }

  async function handleDeleteAnuncio(id: string) {
    await fetch(caminho(`/api/admin/anuncios/${id}`), {
      method: "DELETE",
      headers: authHeaders(token),
    });
    loadAll(token);
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-sm px-4 py-24 sm:px-8">
        <h1 className="font-display text-xl font-bold text-text">Admin</h1>
        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Token de admin"
            className="rounded-xl border border-border bg-surface px-4 py-3 text-text"
          />
          <button
            type="submit"
            className="cursor-pointer rounded-xl border border-primary bg-primary px-5 py-3 font-semibold text-primary-ink"
          >
            Entrar
          </button>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-text">Admin</h1>
        {loading ? <span className="text-xs text-text-soft">Atualizando…</span> : null}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-display text-lg font-semibold">
          Moderação — Zap {cidade.nome} ({zap.length})
        </h2>
        <div className="flex flex-col gap-2">
          {zap.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="text-sm">
                <p className="font-semibold text-text">{item.nome}</p>
                <p className="text-text-soft">
                  {item.whatsapp} · {item.categoria}
                  {item.bairro ? ` · ${item.bairro}` : ""}
                </p>
                {item.descricao ? <p className="text-text-soft">{item.descricao}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModerar("zap_estabelecimentos", item.id, true)}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-ink"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => handleModerar("zap_estabelecimentos", item.id, false)}
                  className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-text-soft"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
          {zap.length === 0 ? <p className="text-sm text-text-soft">Nada pendente.</p> : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold">
          Moderação — Compra e Venda ({classificados.length})
        </h2>
        <div className="flex flex-col gap-2">
          {classificados.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="text-sm">
                <p className="font-semibold text-text">{item.titulo}</p>
                <p className="text-text-soft">
                  {item.categoria} · {item.contato_whatsapp}
                  {item.preco ? ` · R$ ${item.preco}` : ""}
                </p>
                {item.descricao ? <p className="text-text-soft">{item.descricao}</p> : null}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleModerar("classificados", item.id, true)}
                  className="cursor-pointer rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-ink"
                >
                  Aprovar
                </button>
                <button
                  onClick={() => handleModerar("classificados", item.id, false)}
                  className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-text-soft"
                >
                  Rejeitar
                </button>
              </div>
            </div>
          ))}
          {classificados.length === 0 ? (
            <p className="text-sm text-text-soft">Nada pendente.</p>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-lg font-semibold">Anúncios</h2>
        <div className="flex flex-col gap-2">
          {anuncios.map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
            >
              <div className="text-sm">
                <p className="font-semibold text-text">
                  {a.nome_comercio} <span className="text-text-soft">({a.plano})</span>
                </p>
                <p className="text-text-soft">
                  {a.data_inicio} → {a.data_fim ?? "sem prazo"} ·{" "}
                  {a.ativo ? "ativo" : "inativo"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleAtivo(a.id, a.ativo)}
                  className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-text-soft"
                >
                  {a.ativo ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => handleDeleteAnuncio(a.id)}
                  className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleCriarAnuncio}
          className="mt-4 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
        >
          <h3 className="col-span-full text-sm font-semibold">Novo anúncio</h3>
          <input
            name="nome_comercio"
            required
            placeholder="Nome do comércio"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <select
            name="plano"
            required
            defaultValue=""
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Plano…
            </option>
            {ANUNCIO_PLANOS.map((p) => (
              <option key={p} value={p}>
                {p} — R$ {ANUNCIO_PRECOS[p]} (pagamento único)
              </option>
            ))}
          </select>
          <input
            name="banner_url"
            placeholder="URL do banner"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <input
            name="link"
            placeholder="Link de destino"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
          <label className="text-xs text-text-soft">
            Início
            <input
              name="data_inicio"
              type="date"
              required
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs text-text-soft">
            Fim (opcional — deixe em branco = sem prazo, enquanto o site
            existir)
            <input
              name="data_fim"
              type="date"
              className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="col-span-full cursor-pointer rounded-lg border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-ink"
          >
            Criar (inativo até revisão)
          </button>
        </form>
      </section>
    </main>
  );
}
