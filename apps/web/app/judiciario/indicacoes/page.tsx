import type { Metadata } from "next";
import { listarNomeacoes } from "@/lib/judiciario/tribunais";
import { rotuloResultado } from "@/lib/judiciario/rotulos";
import FonteRodape, { FONTE_SENADO } from "@/app/judiciario/components/FonteRodape";
import { resumoProcedencia } from "@/lib/judiciario/procedencia";

export const metadata: Metadata = {
  title: "Indicações — Controle Popular · Judiciário",
  description:
    "Toda indicação enviada pelo Presidente ao Senado para STF, STJ, TST e STM, com data, resultado e a cadeira que ela preenche.",
};

const fmtData = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

export default async function Indicacoes() {
  const nomeacoes = await listarNomeacoes();

  // COBERTURA sempre exposta, e DERIVADA — as duas regras da casa, a
  // primeira de `lib/judiciario/agregado.ts`. A frase mora em
  // `lib/judiciario/procedencia.ts` para ficar ao alcance do vitest.
  const procedencia = resumoProcedencia(nomeacoes);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Indicações</h1>
        <p className="max-w-3xl opacity-80">
          Antes de assumir uma cadeira no STF, STJ, TST ou STM, todo indicado passa pelo
          Senado: o Presidente envia o nome, uma comissão de senadores faz uma entrevista
          pública (a &quot;sabatina&quot;), e depois o plenário vota se aprova ou não. O TSE
          não passa por aqui — seus membros são escolhidos pelos próprios tribunais, não
          pelo Senado.
        </p>
      </header>

      {nomeacoes === null || nomeacoes.length === 0 ? (
        <p className="rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Nenhuma indicação disponível no momento.
        </p>
      ) : (
        <ul className="space-y-3 text-sm">
          {nomeacoes.map((n) => (
            <li key={n.id} className="rounded-lg border border-[var(--cp-border)] p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-display font-semibold">{n.senado_identificacao}</span>
                <span className="font-tabular text-xs opacity-60">
                  {n.tribunal_id?.toUpperCase()} · votado em {fmtData(n.data_deliberacao)}
                </span>
              </div>
              {n.senado_ementa && <p className="mt-1 opacity-80">{n.senado_ementa}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs">
                {n.resultado && (
                  // Era `var(--cp-danger, #b91c1c)` -- nunca definida em
                  // globals.css, caía sempre no fallback: cor fixa em todo
                  // tema e fora do alcance da paleta segura para
                  // daltônicos. `text-alert` é o token que existe.
                  <span
                    className={
                      n.resultado === "rejeitado_plenario"
                        ? "font-medium text-alert"
                        : "opacity-60"
                    }
                  >
                    {rotuloResultado(n.resultado)}
                  </span>
                )}
                {n.dispositivo_vaga && <span className="opacity-60">{n.dispositivo_vaga}</span>}
                {n.antecessor_nome && (
                  <span className="opacity-60">vaga de {n.antecessor_nome}</span>
                )}
                {/* A procedência clicável de cada indicação. `url_fonte` já
                    vinha do ETL (`url_documento` do processo do Senado) e já
                    estava no tipo `Nomeacao` desde a F2 — só nunca havia sido
                    renderizado, aqui nem na página do tribunal. */}
                {n.url_fonte && (
                  <a
                    href={n.url_fonte}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline"
                  >
                    documento no Senado ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm opacity-70">
        O voto de cada senador na sabatina é secreto por regra do próprio Senado — só o
        resultado final (aprovado ou rejeitado) é público, e é isso que o app mostra.
      </p>

      <FonteRodape fontes={[FONTE_SENADO]} nota={procedencia.frase ?? undefined} />
    </div>
  );
}
