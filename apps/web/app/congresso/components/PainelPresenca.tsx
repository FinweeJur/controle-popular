import type { Coerencia, PresencaDias } from "@/lib/atuacao-parlamentar";

/**
 * Presença em plenário e coerência de voto — o painel que faltava no
 * Congresso (o eixo Cidades já tem o equivalente em `PainelAtuacao.tsx`).
 *
 * ═══ FRAÇÃO EM DESTAQUE, NÃO SÓ PERCENTUAL ═══
 *
 * "88% de presença" esconde o tamanho da amostra atrás de um número redondo.
 * "88 de 100 dias" deixa claro que são 100 oportunidades reais, não uma
 * conta arredondada sobre 6. É por isso que o número aqui é a FRAÇÃO
 * (`X/Y`), com o percentual como reforço ao lado — não o contrário.
 *
 * ═══ DOIS NÍVEIS, PORQUE A FONTE TEM DOIS NÍVEIS ═══
 *
 * "Dias trabalhados" e "sessões" não são a mesma pergunta com casas
 * decimais diferentes. Um deputado pode constar como presente no DIA
 * (esteve na sessão principal) e ainda faltar a uma extraordinária do
 * mesmo dia — é essa nuance que "sessões" mostra e "dias" não. O desconto na
 * pontuação (quando existir) usa só dias; sessões aqui é informação, não
 * uma segunda punição pelo mesmo fato.
 */
export default function PainelPresenca({
  presenca,
  coerencia,
}: {
  presenca: PresencaDias;
  coerencia: Coerencia;
}) {
  return (
    <div className="space-y-5 rounded-lg border border-[var(--cp-border)] p-5">
      <div>
        <h3 className="font-display text-lg font-semibold">Presença em plenário</h3>
        {presenca.medido ? (
          <>
            <p className="mt-2 text-2xl font-bold font-tabular">
              {presenca.diasPresente}/{presenca.base}{" "}
              <span className="text-base font-normal opacity-70">dias trabalhados</span>
            </p>
            <p className="text-sm opacity-70">
              {Math.round((presenca.taxa ?? 0) * 100)}% de presença
              {presenca.diasFalta > 0
                ? ` · ${presenca.diasFalta} ${presenca.diasFalta === 1 ? "falta" : "faltas"}`
                : ""}
              {presenca.diasJustificada > 0
                ? ` · ${presenca.diasJustificada} ${
                    presenca.diasJustificada === 1
                      ? "dia de licença/missão"
                      : "dias de licença/missão"
                  } (não contam como falta)`
                : ""}
            </p>
            {presenca.sessoesTotal > 0 ? (
              <p className="mt-1 text-sm">
                Presente em apenas{" "}
                <strong className="font-tabular font-semibold">
                  {presenca.sessoesPresente}/{presenca.sessoesTotal}
                </strong>{" "}
                sessões — ordinárias e extraordinárias somadas, mais fino que o dia:
                dá para faltar a uma extraordinária num dia em que já esteve presente.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 opacity-75">
            <strong className="font-medium">Não medida.</strong> {presenca.motivo}
          </p>
        )}
        <p className="mt-3 text-xs opacity-60">
          Fonte: relatório de presença em plenário da Câmara dos Deputados, por
          deputado e por ano.
        </p>
      </div>

      <div className="border-t border-[var(--cp-border)] pt-4">
        <h3 className="font-display text-lg font-semibold">Coerência com direitos</h3>
        {coerencia.medido ? (
          <>
            <p className="mt-2 text-2xl font-bold font-tabular">
              {coerencia.coerentes}/{coerencia.base}{" "}
              <span className="text-base font-normal opacity-70">votos coerentes</span>
            </p>
            <p className="text-sm opacity-70">
              Vota a favor do que a análise deste portal classifica como garantista
              e contra o que classifica como reducionista.
              {coerencia.semDirecao > 0
                ? ` Outras ${coerencia.semDirecao} matérias analisadas em que votou não tinham direção de direitos, e ficam fora da conta.`
                : ""}
            </p>
            {coerencia.contradizPropriaAutoria ? (
              <p className="mt-2 text-sm">
                <strong className="font-medium">Vota contra o que propõe.</strong> O
                perfil das proposições que assina aponta para um lado e o dos votos
                para o outro — contradição consigo mesmo, não com o partido.
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-2 opacity-75">
            <strong className="font-medium">Não medida.</strong> {coerencia.motivo} Hoje
            isso é verdade para quase todo o plenário: a maioria das votações do
            Congresso é aprovada sem placar nominal registrado, e a coerência só se
            mede sobre a fração que tem os dois — voto nominal E proposição já
            analisada.
          </p>
        )}
      </div>

      <p className="text-xs opacity-60">
        Este perfil não inclui gasto de verba de gabinete (CEAP) — fora do escopo da
        coleta atual deste portal. Fidelidade ao próprio partido também não entra
        aqui: premiá-la rebaixaria quem rompe com a bancada para defender um direito.
      </p>
    </div>
  );
}
