"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { TRIBUNAIS } from "@/lib/judiciario/regras";
import { rotuloCota } from "@/lib/judiciario/rotulos";
import { criarMonitoramentoAction } from "./actions";

// BUG REAL corrigido na revisão de 2026-07-25: esta lista tinha "carreira",
// "quinto_oab" e "quinto_mp" — valores que NUNCA existiram em
// `cadeiras.cota` (os reais são `carreira_trt`, `terco_oab`, `terco_mp`
// etc., ver regras.json). Quem marcasse um desses filtros no formulário
// nunca teria um alerta disparado — silenciosamente, sem erro nenhum,
// porque a condição simplesmente nunca casava com nada no banco. A lista
// abaixo é a mesma que `cadeiras.cota` de fato usa (conferida ao vivo).
const COTAS = [
  "livre",
  "terco_trf", "terco_tj", "terco_oab", "terco_mp",
  "quinto_oab_mpt", "carreira_trt",
  "militar_marinha", "militar_exercito", "militar_aeronautica", "civil_stm",
  "eletiva_stf", "eletiva_stj", "advogado_lista_stf",
];

export default function NovoMonitoramento() {
  const { data: sessao, isPending } = authClient.useSession();
  const [nome, setNome] = useState("");
  const [tribunais, setTribunais] = useState<string[]>([]);
  const [cotas, setCotas] = useState<string[]>([]);
  const [horizonte, setHorizonte] = useState(24);
  const [frequencia, setFrequencia] = useState("semanal");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function alternar(lista: string[], setLista: (v: string[]) => void, valor: string) {
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      // A Server Action lê o usuário da sessão no servidor
      // (`requireUser()`) — nada aqui manda `user_id`, ver
      // `app/judiciario/monitoramentos/novo/actions.ts`.
      await criarMonitoramentoAction({
        nome,
        tribunais,
        cotas,
        horizonteMeses: horizonte,
        frequencia,
      });
    } catch (e) {
      // `redirect()` dentro da Server Action propaga como um throw especial
      // (`NEXT_REDIRECT`) — deixar passar em vez de tratar como erro.
      if ((e as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) throw e;
      setSalvando(false);
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }

  if (isPending) {
    return <div className="mx-auto max-w-2xl px-4 py-16 opacity-60">Carregando...</div>;
  }
  if (!sessao?.user) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-16">
        <h1 className="font-display text-2xl font-bold">Você não está logado(a)</h1>
        <p className="opacity-80">
          <a href="/login" className="underline">
            Entre
          </a>{" "}
          para criar um monitoramento.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Novo monitoramento</h1>
        <p className="opacity-80">
          Escolha o que te interessa. Deixe tudo desmarcado para acompanhar todos os
          tribunais e cotas.
        </p>
      </header>

      <form onSubmit={salvar} className="space-y-6">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nome (opcional)</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="ex.: Vagas do STJ e STF"
            className="w-full rounded-md border border-[var(--cp-border)] bg-transparent px-3 py-2"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Tribunais</legend>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TRIBUNAIS).map(([id, t]) => (
              <label
                key={id}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${
                  tribunais.includes(id) ? "border-[var(--cp-primary)] bg-[var(--cp-primary)]/10" : "border-[var(--cp-border)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={tribunais.includes(id)}
                  onChange={() => alternar(tribunais, setTribunais, id)}
                />
                {id.toUpperCase()} — {t.nome}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Cotas de origem</legend>
          <div className="flex flex-wrap gap-2">
            {COTAS.map((c) => (
              <label
                key={c}
                className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${
                  cotas.includes(c) ? "border-[var(--cp-primary)] bg-[var(--cp-primary)]/10" : "border-[var(--cp-border)]"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={cotas.includes(c)}
                  onChange={() => alternar(cotas, setCotas, c)}
                />
                {rotuloCota(c)}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Horizonte (meses)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={horizonte}
              onChange={(e) => setHorizonte(Number(e.target.value))}
              className="w-full rounded-md border border-[var(--cp-border)] bg-transparent px-3 py-2"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Frequência</span>
            <select
              value={frequencia}
              onChange={(e) => setFrequencia(e.target.value)}
              className="w-full rounded-md border border-[var(--cp-border)] bg-transparent px-3 py-2"
            >
              <option value="imediata">Imediata</option>
              <option value="diaria">Diária</option>
              <option value="semanal">Semanal</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-white disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Criar monitoramento"}
        </button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </form>
    </div>
  );
}
