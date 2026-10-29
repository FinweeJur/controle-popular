"use client";

import { formatCurrencyBRL, formatDateBR } from "@/lib/betim/format";
import type { AutoRecente } from "@/lib/ambiental/autos-recentes";

/**
 * Um auto na lista de busca, com o painel de detalhes aberto por "Ver mais".
 * Separado de `BuscaAutos.tsx` para manter cada módulo pequeno e testável.
 */
export default function ItemAuto({
  auto,
  aberto,
  fonteUrl,
  onToggle,
}: {
  auto: AutoRecente;
  aberto: boolean;
  fonteUrl: string;
  onToggle: () => void;
}) {
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-base font-semibold text-text">Auto {auto.a}</p>
        <p className="font-tabular text-sm text-text-soft">{formatDateBR(auto.d)}</p>
      </div>
      <p className="mt-1 text-base text-text">
        {auto.m || "Município não informado"} · {auto.o || "Órgão não informado"}
      </p>
      <p className="mt-1 text-sm text-text-soft">
        {formatCurrencyBRL(auto.v)} · {auto.s || "Situação não informada"}
      </p>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={aberto}
        className="mt-3 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:border-primary"
      >
        {aberto ? "Ocultar detalhes" : "Ver detalhes"}
      </button>

      {aberto && <DetalheAuto auto={auto} fonteUrl={fonteUrl} />}
    </li>
  );
}

function DetalheAuto({ auto, fonteUrl }: { auto: AutoRecente; fonteUrl: string }) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-soft">
      <dl className="grid gap-2 sm:grid-cols-2">
        <Campo rotulo="Número do auto" valor={auto.a} />
        <Campo rotulo="Data de lavratura" valor={formatDateBR(auto.d)} />
        <Campo rotulo="Órgão coordenador" valor={auto.o || "Não informado"} />
        <Campo rotulo="Unidade atual" valor={auto.u || "Não informada"} />
        <Campo rotulo="Município do autuado" valor={auto.m || "Não informado"} />
        <Campo rotulo="Valor do auto" valor={formatCurrencyBRL(auto.v)} />
        <Campo rotulo="Situação do processo" valor={auto.s || "Não informada"} />
        <Campo
          rotulo="Encerramento / dívida ativa"
          valor={auto.e ? formatDateBR(auto.e) : "Sem data"}
        />
      </dl>
      <p className="mt-3 text-sm">
        O painel público do Sisema não abre um auto específico por link.{" "}
        <a href={fonteUrl} target="_blank" rel="noopener noreferrer" className="underline">
          Abrir o painel e consultar este número ↗
        </a>
      </p>
      <p className="mt-2 text-sm">
        Valor é multa <strong>lavrada, não paga</strong>. O portal não publica nome, CPF nem
        CNPJ de autuado.
      </p>
    </div>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="font-semibold text-text">{rotulo}</dt>
      <dd className="font-tabular">{valor}</dd>
    </div>
  );
}
