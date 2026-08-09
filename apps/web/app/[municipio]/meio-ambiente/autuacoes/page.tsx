import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  CAP_URL_FONTE,
  ORGAO_AUTUANTE,
  capCobreCidade,
  getCapData,
} from "@/lib/betim/capAutos";
import {
  formatCurrencyBRL,
  formatDateBR,
  formatNumberBR,
} from "@/lib/betim/format";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Autuações ambientais — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) =>
    `Autos de infração ambiental do estado em ${c.nome}-${c.uf}: quantos, de que órgão, quanto foi multado e quanto continua em aberto — com a situação de cada processo.`
);

/**
 * Autuação ambiental estadual (CAP/SEMAD-MG).
 *
 * ═══ AS DUAS REGRAS EDITORIAIS DESTA TELA ═══
 *
 * 1. **O número grande é AUTO, não linha.** A tabela tem grão (auto ×
 *    dispositivo legal) e Betim tem 9.621 linhas para bem menos autos.
 *    A contagem de linhas aparece, mas explicada e em letra menor — nunca
 *    como manchete.
 * 2. **Valor nunca sai sozinho.** Auto lavrado não é dano provado nem multa
 *    paga: há multa de R$ 808 mil de 2013 ainda "Em Aberto". Toda cifra desta
 *    página vem colada à situação do débito e à situação do processo.
 */
export default async function AutuacoesAmbientaisPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);

  // Gate pela UF, não por `temFonte` — ver a nota em `lib/betim/capAutos.ts`.
  if (!capCobreCidade(cidade)) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
        <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
          Autuações ambientais
        </h1>
        <p className="mt-2 max-w-[60ch] text-text-soft">
          O sistema que reúne os autos de infração ambiental por município é
          estadual, da Secretaria de Meio Ambiente de <strong>Minas
          Gerais</strong> — não cobre {cidade.nome}-{cidade.uf}. Não é ausência
          de fiscalização na cidade: é um dado que o estado de {cidade.uf} não
          publica no mesmo formato.
        </p>
      </main>
    );
  }

  const { configurado, resumo, recentes } = await getCapData(cidade.id_municipio);
  const semDado = !configurado || resumo === null || resumo.total_autos === 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Autuações ambientais
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Autos de infração ambiental lavrados em {cidade.nome} pelos órgãos
        ambientais de Minas Gerais.{" "}
        <strong>Auto lavrado não é dano ambiental provado nem multa paga</strong>{" "}
        — o processo pode ser anulado no julgamento e o valor pode nunca ter
        sido cobrado. Por isso cada número aqui vem com a situação do processo
        ao lado.
      </p>

      {semDado ? (
        <p className="mt-8 rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          {configurado
            ? `Nenhum auto de infração ambiental estadual registrado para ${cidade.nome} na última carga.`
            : "Os dados desta seção ainda não foram carregados nesta instalação do portal."}
        </p>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-5">
            <DataCard
              title="Quantos autos"
              source={{ label: "Consulta pública da SEMAD-MG", url: CAP_URL_FONTE }}
            >
              <p className="font-tabular text-3xl font-bold text-text">
                {formatNumberBR(resumo.total_autos)}
                <span className="ml-2 text-sm font-normal text-text-soft">
                  auto(s) de infração
                </span>
              </p>
              <p className="mt-2 text-xs text-text-soft">
                Lavrados entre {formatDateBR(resumo.primeira_lavratura)} e{" "}
                {formatDateBR(resumo.ultima_lavratura)}. A fonte publica{" "}
                {formatNumberBR(resumo.total_linhas)} linhas para esses autos,
                porque <strong>cada dispositivo legal infringido vira uma
                linha</strong> — um mesmo auto pode citar o Decreto e a Lei
                separadamente. Contar linhas infla a conta; o número acima é de
                autos distintos.
              </p>
            </DataCard>

            <DataCard
              title="Quanto foi multado, quanto continua em aberto"
              source={{ label: "Consulta pública da SEMAD-MG", url: CAP_URL_FONTE }}
            >
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {formatCurrencyBRL(resumo.total_multa)}
                  </p>
                  <p className="mt-1 text-xs text-text-soft">
                    Soma das multas aplicadas
                  </p>
                </div>
                <div>
                  <p className="font-tabular text-2xl font-bold text-text">
                    {formatCurrencyBRL(resumo.total_remanescente)}
                  </p>
                  <p className="mt-1 text-xs text-text-soft">
                    Saldo remanescente em cobrança
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-text-soft">
                Valor aplicado não é valor arrecadado, e nenhum dos dois é
                receita do município — a multa ambiental estadual é do estado.
                A soma é feita por auto, não por linha, senão o mesmo valor
                seria contado uma vez por dispositivo citado.
              </p>
            </DataCard>

            {resumo.por_debito.length > 0 && (
              <DataCard
                title="Situação da cobrança"
                source={{ label: "Consulta pública da SEMAD-MG", url: CAP_URL_FONTE }}
              >
                <ul className="flex flex-col gap-2">
                  {resumo.por_debito.map((d) => (
                    <li
                      key={d.chave}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--cp-border)] pb-2 last:border-0"
                    >
                      <span className="text-sm text-text">{d.chave}</span>
                      <span className="font-tabular text-sm text-text-soft">
                        {formatNumberBR(d.autos)} auto(s)
                        {d.valor > 0 && ` · ${formatCurrencyBRL(d.valor)} em aberto`}
                      </span>
                    </li>
                  ))}
                </ul>
              </DataCard>
            )}

            {resumo.por_orgao.length > 0 && (
              <DataCard
                title="Quem autuou"
                source={{ label: "Consulta pública da SEMAD-MG", url: CAP_URL_FONTE }}
              >
                <ul className="flex flex-col gap-2">
                  {resumo.por_orgao.map((o) => (
                    <li
                      key={o.chave}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--cp-border)] pb-2 last:border-0"
                    >
                      <span className="text-sm text-text">
                        {o.chave}
                        {ORGAO_AUTUANTE[o.chave] && (
                          <span className="block text-xs text-text-soft">
                            {ORGAO_AUTUANTE[o.chave]}
                          </span>
                        )}
                      </span>
                      <span className="font-tabular text-sm text-text-soft">
                        {formatNumberBR(o.autos)} auto(s)
                      </span>
                    </li>
                  ))}
                </ul>
              </DataCard>
            )}

            {resumo.por_ano.length > 0 && (
              <DataCard
                title="Por ano de lavratura"
                source={{ label: "Consulta pública da SEMAD-MG", url: CAP_URL_FONTE }}
              >
                <ul className="flex flex-col gap-2">
                  {resumo.por_ano.map((a) => (
                    <li
                      key={a.ano}
                      className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--cp-border)] pb-2 last:border-0"
                    >
                      <span className="font-tabular text-sm text-text">{a.ano}</span>
                      <span className="font-tabular text-sm text-text-soft">
                        {formatNumberBR(a.autos)} auto(s)
                        {a.multa > 0 && ` · ${formatCurrencyBRL(a.multa)}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-text-soft">
                  Últimos {resumo.por_ano.length} anos com autuação. Queda num
                  ano pode ser menos infração ou menos fiscalização — esta tela
                  não distingue as duas coisas.
                </p>
              </DataCard>
            )}
          </div>

          {recentes.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-xl font-bold text-text">
                Autos mais recentes
              </h2>
              <p className="mt-1 max-w-[60ch] text-sm text-text-soft">
                Os {recentes.length} autos com lavratura mais recente. Para a
                consulta completa, com todos os filtros oficiais, use a{" "}
                <a
                  href={CAP_URL_FONTE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  consulta pública da SEMAD ↗
                </a>
                .
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {recentes.map((a) => (
                  <li
                    key={a.numero_ai}
                    className="rounded-2xl border border-border bg-surface p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-display font-semibold text-text">
                        AI {a.numero_ai}
                      </p>
                      <p className="font-tabular text-xs text-text-soft">
                        {formatDateBR(a.data_lavratura)}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-text">
                      {a.nome_autuado ?? "Autuado não informado"}
                      {a.cpf_cnpj && (
                        <span className="ml-2 font-tabular text-xs text-text-soft">
                          {a.cpf_cnpj}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-xs text-text-soft">
                      {a.orgao_autuante}
                      {a.unidade_atual && ` · ${a.unidade_atual}`}
                      {" · "}
                      {a.qtd_dispositivos} dispositivo(s) citado(s)
                      {a.dispositivos && `: ${a.dispositivos}`}
                    </p>
                    {(a.tem_embargo || a.tem_apreensao || a.tem_demolicao) && (
                      <p className="mt-2 flex flex-wrap gap-2 text-xs">
                        {a.tem_embargo && (
                          <span className="rounded-md border border-border px-2 py-0.5 text-text-soft">
                            embargo
                          </span>
                        )}
                        {a.tem_apreensao && (
                          <span className="rounded-md border border-border px-2 py-0.5 text-text-soft">
                            apreensão
                          </span>
                        )}
                        {a.tem_demolicao && (
                          <span className="rounded-md border border-border px-2 py-0.5 text-text-soft">
                            demolição
                          </span>
                        )}
                      </p>
                    )}
                    <p className="mt-2 font-tabular text-sm text-text">
                      {a.valor_multa && a.valor_multa > 0
                        ? formatCurrencyBRL(a.valor_multa)
                        : "Sem multa em dinheiro"}
                      <span className="ml-2 text-xs font-normal text-text-soft">
                        {[a.status_ai, a.status_processo, a.status_debito]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="mt-10 text-xs text-text-soft">
        Fonte: Consulta Geral de Autos de Infração e Arrecadação (CAP), da
        Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável de
        Minas Gerais —{" "}
        <a
          href={CAP_URL_FONTE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          ecosistemas.meioambiente.mg.gov.br/consulta-ai ↗
        </a>
        . O nome e o CPF/CNPJ do autuado são publicados pela própria fonte, que
        já mascara o CPF de pessoa física. Autuação{" "}
        <strong>federal</strong> (IBAMA) é outra jurisdição e não está nesta
        página.{" "}
        <Link href="/meio-ambiente" className="text-accent hover:underline">
          Voltar para Meio Ambiente
        </Link>
        .
      </p>
    </main>
  );
}
