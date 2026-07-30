import Link from "@/lib/judiciario/link";
import SairBotao from "./SairBotao";
import { sessaoAtual } from "@/lib/auth/guards";
import { monitoramentosDoUsuario, alertasDoUsuario } from "@/lib/db/queries/judiciario";
import { rotuloMotivoAlerta } from "@/lib/judiciario/rotulos";

/**
 * Painel do usuário logado. Server component (Fase 4): a sessão agora vive
 * num cookie HttpOnly (Better Auth), lido aqui com `sessaoAtual()` —
 * diferente do Supabase antigo (localStorage, exigia client component).
 *
 * A query já filtra por `userId` explicitamente (`monitoramentosDoUsuario`/
 * `alertasDoUsuario` em `lib/db/queries/judiciario.ts`) — não há RLS no
 * Neon para fazer esse recorte sozinha como o Supabase fazia.
 */
export default async function Painel() {
  const sessao = await sessaoAtual();

  if (!sessao?.user) {
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

  const [monitoramentos, alertas] = await Promise.all([
    monitoramentosDoUsuario(sessao.user.id),
    alertasDoUsuario(sessao.user.id, 20),
  ]);

  const naoLidos = alertas.filter((a) => !a.lido).length;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel</h1>
          <p className="opacity-70">{sessao.user.email}</p>
        </div>
        <SairBotao />
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
