"use client";

import { useEffect, useState } from "react";
import Link from "@/lib/judiciario/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/judiciario/supabaseBrowser";
import { rotuloMotivoAlerta } from "@/lib/judiciario/rotulos";

interface Monitoramento {
  id: string;
  nome: string | null;
  tribunais: string[] | null;
  cotas: string[] | null;
  horizonte_meses: number | null;
  frequencia: string | null;
  ativo: boolean | null;
}

interface Alerta {
  id: string;
  motivo: string | null;
  lido: boolean | null;
  criado_em: string | null;
}

/**
 * Painel do usuário logado. Client component: a sessão vive no
 * localStorage do browser (`lib/supabaseBrowser.ts`), então checar sessão
 * em server component exigiria trocar toda a stack de Auth por cookies
 * (`@supabase/ssr`) — desnecessário para um painel simples que só lista
 * dado do próprio usuário sob RLS.
 *
 * RLS já faz o trabalho pesado: a query roda com o token do usuário
 * logado, e as policies de `monitoramentos`/`alertas`
 * (`user_id = auth.uid()`) garantem que só vêm linhas dele — não é
 * preciso filtrar `.eq("user_id", ...)` manualmente aqui, embora fazer
 * isso também não seja incorreto.
 */
export default function Painel() {
  const [sessao, setSessao] = useState<Session | null | "carregando">("carregando");
  const [monitoramentos, setMonitoramentos] = useState<Monitoramento[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);

  useEffect(() => {
    const sb = getSupabaseBrowserClient();
    if (!sb) {
      setSessao(null);
      return;
    }
    sb.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_evento, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessao || sessao === "carregando") return;
    const sb = getSupabaseBrowserClient();
    if (!sb) return;
    sb.from("monitoramentos")
      .select("id,nome,tribunais,cotas,horizonte_meses,frequencia,ativo")
      .then(({ data }) => setMonitoramentos((data as Monitoramento[]) ?? []));
    sb.from("alertas")
      .select("id,motivo,lido,criado_em")
      .order("criado_em", { ascending: false })
      .limit(20)
      .then(({ data }) => setAlertas((data as Alerta[]) ?? []));
  }, [sessao]);

  async function sair() {
    const sb = getSupabaseBrowserClient();
    await sb?.auth.signOut();
  }

  if (sessao === "carregando") {
    return <div className="mx-auto max-w-3xl px-4 py-16 opacity-60">Carregando...</div>;
  }

  if (!sessao) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16">
        <h1 className="font-display text-2xl font-bold">Você não está logado(a)</h1>
        <p className="opacity-80">Entre para ver seus monitoramentos e alertas.</p>
        <Link href="/login" className="inline-block rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-white">
          Ir para o login
        </Link>
      </div>
    );
  }

  const naoLidos = alertas.filter((a) => !a.lido).length;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel</h1>
          <p className="opacity-70">{sessao.user.email}</p>
        </div>
        <button onClick={sair} className="rounded-md border border-[var(--cp-border)] px-3 py-1.5 text-sm">
          Sair
        </button>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Meus monitoramentos</h2>
          <Link href="/monitoramentos/novo" className="text-sm underline">
            + novo
          </Link>
        </div>
        {monitoramentos.length === 0 ? (
          <p className="rounded-lg border border-[var(--cp-border)] p-5 text-sm opacity-70">
            Nenhum monitoramento ainda. Crie um para receber alerta quando uma vaga abrir ou
            uma indicação avançar nos tribunais/cotas que te interessam.
          </p>
        ) : (
          <ul className="space-y-2">
            {monitoramentos.map((m) => (
              <li key={m.id} className="rounded-lg border border-[var(--cp-border)] p-4 text-sm">
                <p className="font-medium">{m.nome || "(sem nome)"}</p>
                <p className="opacity-70">
                  {(m.tribunais ?? []).join(", ") || "todos os tribunais"}
                  {m.cotas?.length ? ` · cotas: ${m.cotas.join(", ")}` : ""} · horizonte{" "}
                  {m.horizonte_meses ?? 24} meses · {m.frequencia ?? "semanal"}
                  {m.ativo === false ? " · inativo" : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">
          Alertas {naoLidos > 0 && <span className="text-sm font-normal opacity-70">({naoLidos} não lidos)</span>}
        </h2>
        {alertas.length === 0 ? (
          <p className="rounded-lg border border-[var(--cp-border)] p-5 text-sm opacity-70">
            Nenhum alerta ainda.
          </p>
        ) : (
          <ul className="space-y-2">
            {alertas.map((a) => (
              <li
                key={a.id}
                className={`rounded-lg border border-[var(--cp-border)] p-3 text-sm ${a.lido ? "opacity-60" : ""}`}
              >
                {rotuloMotivoAlerta(a.motivo)}
                {a.criado_em ? ` — ${new Date(a.criado_em).toLocaleDateString("pt-BR")}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
