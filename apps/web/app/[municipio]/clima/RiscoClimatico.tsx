import { riscoDoMunicipio, coberturaRisco, INDICES } from "@/lib/clima/risco";

/**
 * Risco climático do município, pelo AdaptaBrasil — e **nunca só o índice**.
 *
 * ═══ POR QUE ESTE COMPONENTE MOSTRA AS COMPONENTES ═══
 *
 * O AdaptaBrasil publica dois índices de manchete (deslizamento e inundação) e
 * as três parcelas de cada um: Ameaça, Exposição e Vulnerabilidade. O índice é
 * o PRODUTO das três — e produto zera com um fator zero.
 *
 * Belo Horizonte é o caso que obrigou este desenho: índice **0,00, "Muito
 * baixo"** nos dois, com Ameaça 0,86, Exposição 0,91 e domicílios em área de
 * risco 1,00. A Vulnerabilidade 0,00 zera tudo. Só BH e Funilândia zeram entre
 * os 853 municípios de Minas.
 *
 * Um cartão que mostrasse "Muito baixo" e parasse ali diria a uma cidade com
 * 389.218 pessoas em área de risco que ela não tem problema. Ninguém que lê um
 * mapa suspeita de um zero: ele parece medição, não artefato de fórmula.
 *
 * Daí a regra desta tela: **o índice nunca aparece sozinho**, e quando ele zera
 * com componente alta, o aviso vem antes do número — não depois, em nota de
 * rodapé que ninguém lê.
 */
export default async function RiscoClimatico({ idIbge }: { idIbge: string }) {
  const cobertura = await coberturaRisco();
  if (!cobertura.municipios) return null;

  const blocos = (
    await Promise.all(
      (["deslizamento", "inundacao"] as const).map(async (qual) => ({
        qual,
        dados: await riscoDoMunicipio(idIbge, qual),
      }))
    )
  ).filter((b) => b.dados);

  if (!blocos.length) return null;

  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold">Risco climático</h2>
      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        Índices do AdaptaBrasil (MCTI), ano-base {cobertura.ano}. São{" "}
        <strong className="text-text">índices de 0 a 1</strong>, não contagem de
        pessoas: dizem o quanto o município está exposto em relação aos outros, não
        quantas casas estão em risco.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {blocos.map(({ qual, dados }) => {
          const d = dados!;
          return (
            <div key={qual} className="rounded-lg border border-border p-4">
              <h3 className="font-medium text-text">{INDICES[qual].nome}</h3>

              {/* O aviso vem ANTES do número. Depois dele, o leitor já
                  concluiu — e a conclusão errada é justamente a que o número
                  sozinho produz. */}
              {d.zeroPorVulnerabilidade ? (
                <p
                  className="mt-2 rounded border-l-[3px] px-3 py-2 text-[.88em]"
                  style={{ borderColor: "var(--cp-caution, #e2a138)" }}
                >
                  ⚠️ O índice geral dá <strong className="text-text">zero</strong>, mas
                  isso é a fórmula, não a ausência de risco: o índice é o produto das
                  três parcelas abaixo, e basta uma delas ser zero para o resultado
                  zerar. Leia as parcelas, não o total.
                </p>
              ) : null}

              <p className="mt-2 text-2xl font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                {d.indice === null ? "—" : d.indice.toFixed(2)}
                {d.faixa ? (
                  <span className="ml-2 align-middle text-[.5em] font-normal text-text-soft">
                    {d.faixa}
                  </span>
                ) : null}
              </p>

              <dl className="mt-3 space-y-1 text-[.88em]">
                {d.componentes.map((c) => (
                  <div key={c.id} className="flex justify-between gap-3">
                    <dt className="text-text-soft">{c.nome}</dt>
                    <dd className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {c.valor === null ? "—" : c.valor.toFixed(2)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <p className="mt-3 max-w-2xl text-[.88em] text-text-soft">
        Fonte: AdaptaBrasil / MCTI, licença CC-BY-SA. Cobre {cobertura.municipios} municípios
        de Minas Gerais.
      </p>
    </section>
  );
}
