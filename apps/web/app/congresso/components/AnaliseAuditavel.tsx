import Link from "@/lib/congresso/link";
import RotuloBadge from "@/app/congresso/components/RotuloBadge";
import { labelDoDireito, labelDoMecanismo, type AnaliseItem } from "@/lib/congresso/rubrica";
import type { Analise } from "@/lib/congresso/proposicoes";

/**
 * A tela que sustenta o produto inteiro.
 *
 * A promessa feita em /metodologia é "clique no score e chegue ao trecho
 * do projeto que o gerou". Este componente é onde ela é cumprida: cada
 * item mostra o peso que contribuiu, o dispositivo legal que o fundamenta
 * e a citação literal — nesta ordem, porque é a ordem em que alguém
 * audita ("quanto pesou? por quê? cadê a prova?").
 *
 * O que NÃO se faz aqui: esconder item de peso pequeno atrás de "ver
 * mais". Se a soma exibida não bate com os itens exibidos, a auditoria
 * quebra e o argumento do produto vai junto.
 */
export default function AnaliseAuditavel({
  analise,
  itens,
}: {
  analise: Analise | null;
  itens: AnaliseItem[];
}) {
  if (!analise) {
    return (
      <section className="rounded-lg border border-[var(--cp-border)] p-6">
        <h2 className="font-display text-xl font-semibold">Análise pendente</h2>
        <p className="mt-2 opacity-80">
          Esta proposição ainda não passou pela análise de direitos. A ficha técnica
          acima vem direto da fonte oficial e não depende disso.
        </p>
      </section>
    );
  }

  if (analise.status === "falhou") {
    return (
      <section className="rounded-lg border border-[var(--cp-border)] p-6">
        <h2 className="font-display text-xl font-semibold">Análise não concluída</h2>
        <p className="mt-2 opacity-80">
          A extração falhou para esta proposição. Preferimos deixar sem classificação a
          publicar um rótulo que não podemos fundamentar.
        </p>
      </section>
    );
  }

  const soma = itens.reduce((acc, i) => acc + (i.peso ?? 0), 0);
  // Se isto divergir, o problema é real e o leitor precisa ver — a alternativa
  // (mostrar o score gravado e fingir que os itens explicam) é exatamente o
  // tipo de opacidade que o produto existe para não ter.
  const divergente = Math.abs(soma - (analise.score ?? 0)) > 0.011;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold">Análise de direitos</h2>
        <RotuloBadge rotulo={analise.rotulo} score={analise.score} />
        {analise.status === "requer_revisao" ? (
          <span className="rounded-md border border-[var(--cp-border)] px-2 py-0.5 text-xs opacity-80">
            requer revisão humana
          </span>
        ) : null}
      </div>

      {(analise.clausula_petrea || analise.vedacao_retrocesso) && (
        <div className="rounded-lg border-2 border-[var(--cp-alert)] p-4">
          <p className="font-semibold text-[var(--cp-alert)]">
            {analise.clausula_petrea && analise.vedacao_retrocesso
              ? "Cláusula pétrea e vedação do retrocesso"
              : analise.clausula_petrea
                ? "Toca cláusula pétrea"
                : "Vedação do retrocesso"}
          </p>
          <p className="mt-1 text-sm opacity-80">
            {analise.clausula_petrea
              ? "A proposição afeta matéria protegida pelo art. 60, §4º da Constituição. "
              : ""}
            {analise.vedacao_retrocesso
              ? "Reduz patamar de direito social já conquistado. "
              : ""}
            Este selo <strong>não entra no score</strong> — é questão de
            constitucionalidade, não de grau.
          </p>
        </div>
      )}

      {analise.resumo_neutro ? (
        <div className="rounded-lg border border-[var(--cp-border)] p-5">
          <h3 className="font-semibold">Ficha técnica — o que muda, na letra</h3>
          <p className="mt-2 opacity-90">{analise.resumo_neutro}</p>
        </div>
      ) : null}

      <div>
        <h3 className="font-semibold">
          Como o score foi calculado{" "}
          <span className="font-normal opacity-70">({itens.length} itens)</span>
        </h3>

        {itens.length === 0 ? (
          <p className="mt-2 opacity-80">
            Nenhum direito identificado — a proposição foi lida como técnica,
            processual ou honorífica. Score {analise.score?.toFixed(2) ?? "0,00"}.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {itens.map((item, i) => {
              const peso = item.peso ?? 0;
              const positivo = peso > 0;
              const cor = positivo
                ? "var(--cp-accent)"
                : peso < 0
                  ? "var(--cp-alert)"
                  : "var(--cp-text-soft)";
              return (
                <li
                  key={i}
                  className="rounded-lg border border-[var(--cp-border)] border-l-4 p-4"
                  style={{ borderLeftColor: cor }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-tabular font-semibold" style={{ color: cor }}>
                      {positivo ? "+" : ""}
                      {peso.toFixed(2)}
                    </span>
                    <span className="font-semibold">{labelDoDireito(item.direito)}</span>
                    <span className="text-sm opacity-75">
                      {item.direcao === "amplia"
                        ? "↑ amplia"
                        : item.direcao === "restringe"
                          ? "↓ restringe"
                          : "→ neutro"}{" "}
                      · {item.grau} · confiança {(item.confianca ?? 0).toFixed(2)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm">
                    <span className="opacity-70">Fundamento: </span>
                    <span className="font-medium">{item.dispositivo}</span>
                    {item.mecanismo ? (
                      <>
                        <span className="opacity-70"> · Mecanismo: </span>
                        {labelDoMecanismo(item.mecanismo)}
                      </>
                    ) : null}
                  </p>

                  {item.titulares?.length ? (
                    <p className="mt-1 text-sm opacity-75">
                      Atinge: {item.titulares.join(", ")}
                    </p>
                  ) : null}

                  {item.trecho ? (
                    <blockquote className="mt-2 border-l-2 border-[var(--cp-border)] pl-3 text-sm italic opacity-85">
                      “{item.trecho}”
                    </blockquote>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-3 font-tabular text-sm opacity-80">
          Soma dos itens: {soma > 0 ? "+" : ""}
          {soma.toFixed(2)} · score gravado: {analise.score?.toFixed(2) ?? "—"}
        </p>
        {divergente ? (
          <p className="mt-1 text-sm text-[var(--cp-alert)]">
            Divergência entre a soma dos itens e o score gravado. Isso indica que a
            análise foi calculada com uma versão diferente da rubrica — vale reanalisar
            esta proposição.
          </p>
        ) : null}
      </div>

      {analise.legislacao_relacionada?.length ? (
        <div>
          <h3 className="font-semibold">Legislação que a proposição altera</h3>
          <p className="text-sm opacity-70">
            Extraído por regra determinística do texto, não por IA.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {analise.legislacao_relacionada.map((n) => (
              <li key={n.identificador}>
                <span className="font-medium">{n.trecho}</span>
                {n.artigos.length ? (
                  <span className="opacity-75"> — art. {n.artigos.join(", ")}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <footer className="border-t border-[var(--cp-border)] pt-4 text-sm opacity-70">
        <p>
          Extração feita por <strong>{analise.modelo ?? "modelo não registrado"}</strong>,
          rubrica v{analise.versao_rubrica ?? "?"}. O modelo preenche os itens; o score e
          o rótulo são calculados por regra fixa.
        </p>
        <p className="mt-1">
          Modelos diferentes concordam no rótulo mas divergem na intensidade — comparar
          score entre proposições analisadas por modelos diferentes não é válido.{" "}
          <Link href="/metodologia" className="underline">
            Ver metodologia
          </Link>
          .
        </p>
      </footer>
    </section>
  );
}
