import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import DataCard from "@/app/[municipio]/components/DataCard";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  FONTE_FEAM,
  FONTE_SNISB,
  METODO_MONTANTE,
  feamCobreCidade,
  getBarragensData,
  type BarragemUnificada,
} from "@/lib/betim/barragens";
import { formatNumberBR } from "@/lib/betim/format";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Barragens — ${c.nome} em Dados | ${nomePortal(c)}`,
  (c) =>
    `Barragens em ${c.nome}-${c.uf}: quantas, de quem, condição de estabilidade, nível de emergência e quais foram erguidas a montante — o método de Mariana e Brumadinho.`
);

/**
 * Duas fontes, uma tela — e a junção é o assunto, não um detalhe de
 * implementação. Ver `lib/betim/barragens.ts`: FEAM e SNISB não têm chave
 * comum, o casamento é por nome e é falível. A tela nunca publica o total como
 * fato exato, e diz de que fonte veio cada linha.
 */
function Etiqueta({ children, tom }: { children: React.ReactNode; tom?: "alerta" | "neutro" }) {
  const cor =
    tom === "alerta"
      ? "border-[var(--cp-danger,#b3261e)] text-[var(--cp-danger,#b3261e)]"
      : "border-border text-text-soft";
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs ${cor}`}>{children}</span>
  );
}

function LinhaBarragem({ b }: { b: BarragemUnificada }) {
  const emergencia = b.nivelEmergencia ?? 0;
  return (
    <li className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display font-semibold text-text">{b.nome}</p>
        <p className="font-tabular text-xs text-text-soft">{b.fontes.join(" + ")}</p>
      </div>
      {b.empreendedor && <p className="mt-1 text-sm text-text">{b.empreendedor}</p>}

      <p className="mt-2 flex flex-wrap gap-2">
        {emergencia > 0 && (
          <Etiqueta tom="alerta">nível de emergência {emergencia}</Etiqueta>
        )}
        {b.metodoConstrutivo === METODO_MONTANTE && (
          <Etiqueta tom="alerta">alteamento a montante</Etiqueta>
        )}
        {b.condicaoEstabilidade && b.condicaoEstabilidade !== "Atestada" && (
          <Etiqueta tom="alerta">estabilidade: {b.condicaoEstabilidade.toLowerCase()}</Etiqueta>
        )}
        {b.condicaoEstabilidade === "Atestada" && (
          <Etiqueta>estabilidade atestada</Etiqueta>
        )}
        {b.suspensao === "Sim" && <Etiqueta tom="alerta">operação suspensa</Etiqueta>}
        {b.possuiPae && <Etiqueta>PAE: {b.possuiPae.toLowerCase()}</Etiqueta>}
        {b.metodoConstrutivo && b.metodoConstrutivo !== METODO_MONTANTE && (
          <Etiqueta>{b.metodoConstrutivo.toLowerCase()}</Etiqueta>
        )}
      </p>

      <p className="mt-2 text-xs text-text-soft">
        {[
          b.uso,
          b.situacao,
          b.categoriaRisco && `risco ${b.categoriaRisco.toLowerCase()}`,
          b.danoPotencial && `dano potencial ${b.danoPotencial.toLowerCase()}`,
          b.alturaM && `${formatNumberBR(b.alturaM)} m de altura`,
          b.cursoDagua,
          b.orgaoFiscalizador,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </li>
  );
}

export default async function BarragensPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const dados = await getBarragensData(cidade.id_municipio);
  const { configurado, barragens } = dados;
  const temFeam = feamCobreCidade(cidade);

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-8">
      <h1 className="font-display text-[2em] font-bold tracking-tight text-text">
        Barragens
      </h1>
      <p className="mt-2 max-w-[60ch] text-text-soft">
        Barragens registradas em {cidade.nome} nos cadastros públicos.{" "}
        {temFeam ? (
          <>
            Duas fontes: o inventário estadual da <strong>FEAM</strong>, que só
            cobre mineração e indústria mas diz se a estabilidade foi atestada,
            e o cadastro nacional do <strong>SNISB</strong>, que cobre todos os
            usos mas quase nunca preenche o nível de perigo.
          </>
        ) : (
          <>
            Fonte: o cadastro nacional do <strong>SNISB</strong>. O inventário
            da FEAM, que traz condição de estabilidade e nível de emergência, é
            estadual de Minas Gerais e não cobre {cidade.uf}.
          </>
        )}
      </p>

      {!configurado ? (
        <p className="mt-8 rounded-lg border border-[var(--cp-border)] p-5 opacity-80">
          Os dados desta seção ainda não foram carregados nesta instalação do
          portal.
        </p>
      ) : barragens.length === 0 ? (
        <div className="mt-8 rounded-lg border border-[var(--cp-border)] p-5">
          <p>
            Nenhuma barragem registrada em {cidade.nome} nos cadastros
            consultados.
          </p>
          <p className="mt-2 text-sm text-text-soft">
            Isso não é o mesmo que "não existe barragem na cidade": os dois
            cadastros só listam barragens acima de porte definido em lei, e o
            SNISB casa município por nome, não por código do IBGE — uma grafia
            fora do previsto some da conta.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-5">
            <DataCard
              title="Quantas barragens"
              source={{ label: FONTE_SNISB.nome, url: FONTE_SNISB.url }}
            >
              <p className="font-tabular text-3xl font-bold text-text">
                {formatNumberBR(barragens.length)}
                <span className="ml-2 text-sm font-normal text-text-soft">
                  barragem(ns)
                </span>
              </p>
              <p className="mt-2 text-xs text-text-soft">
                {dados.totalFeam > 0 && `${dados.totalFeam} no inventário da FEAM · `}
                {dados.totalSnisb} no cadastro nacional
                {dados.emAmbas > 0 && ` · ${dados.emAmbas} nas duas listas`}.{" "}
                <strong>O total é estimado, não exato.</strong> As duas fontes
                não têm identificador comum: o cruzamento é feito pelo nome da
                barragem, então grafias diferentes da mesma represa podem contar
                duas vezes, e duas represas de mesmo nome contam como uma.
              </p>
            </DataCard>

            {dados.emEmergencia.length > 0 && (
              <DataCard
                title="Em nível de emergência"
                source={{ label: FONTE_FEAM.nome, url: FONTE_FEAM.url }}
              >
                <p className="font-tabular text-2xl font-bold text-text">
                  {dados.emEmergencia.length}
                </p>
                <p className="mt-2 text-xs text-text-soft">
                  Nível 1 é o alerta mais baixo e nível 3 é o mais grave, com
                  acionamento do plano de emergência. Quem declara é o próprio
                  empreendedor, auditado pela FEAM.
                </p>
              </DataCard>
            )}

            {dados.aMontante.length > 0 && (
              <DataCard
                title="Erguidas a montante"
                source={{ label: FONTE_FEAM.nome, url: FONTE_FEAM.url }}
              >
                <p className="font-tabular text-2xl font-bold text-text">
                  {dados.aMontante.length}
                </p>
                <p className="mt-2 text-xs text-text-soft">
                  É a técnica das barragens que romperam em Mariana (2015) e
                  Brumadinho (2019), proibida para barragens novas desde a Lei
                  14.066/2020. Estar nesta lista não significa risco iminente —
                  significa o método construtivo que a lei passou a vedar.
                </p>
              </DataCard>
            )}

            {dados.semEstabilidadeAtestada.length > 0 && (
              <DataCard
                title="Sem estabilidade atestada"
                source={{ label: FONTE_FEAM.nome, url: FONTE_FEAM.url }}
              >
                <p className="font-tabular text-2xl font-bold text-text">
                  {dados.semEstabilidadeAtestada.length}
                </p>
                <p className="mt-2 text-xs text-text-soft">
                  A DCE (Declaração de Condição de Estabilidade) é entregue
                  periodicamente por auditor externo. "Não atestada" e "não
                  apresentou" são coisas diferentes: a primeira é um laudo que
                  não confirmou a estabilidade, a segunda é a ausência do laudo.
                </p>
              </DataCard>
            )}

            {dados.semPae.length > 0 && (
              <DataCard
                title="Sem Plano de Ação de Emergência"
                source={{ label: FONTE_SNISB.nome, url: FONTE_SNISB.url }}
              >
                <p className="font-tabular text-2xl font-bold text-text">
                  {dados.semPae.length}
                </p>
                <p className="mt-2 text-xs text-text-soft">
                  O PAE é o documento que define o que fazer, e quem avisa quem,
                  se a barragem romper. A contagem inclui só as que declaram
                  "não" no cadastro — campo em branco não entra aqui.
                </p>
              </DataCard>
            )}
          </div>

          <section className="mt-10">
            <h2 className="font-display text-xl font-bold text-text">
              Uma a uma
            </h2>
            <p className="mt-1 max-w-[60ch] text-sm text-text-soft">
              Em ordem de atenção: nível de emergência, depois método a
              montante, depois estabilidade não atestada. A etiqueta da direita
              diz em que cadastro a barragem aparece.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {barragens.map((b) => (
                <LinhaBarragem key={b.chave} b={b} />
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="mt-10 text-xs text-text-soft">
        Fontes:{" "}
        <a
          href={FONTE_FEAM.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {FONTE_FEAM.nome} ↗
        </a>{" "}
        (anual, base 2024, só Minas Gerais) e{" "}
        <a
          href={FONTE_SNISB.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          {FONTE_SNISB.nome} ↗
        </a>{" "}
        (nacional). Barragem de mineração ausente da FEAM e presente só no
        SNISB fica sem condição de estabilidade nesta tela — é lacuna da fonte,
        não segurança confirmada.{" "}
        <Link href="/meio-ambiente" className="text-accent hover:underline">
          Voltar para Meio Ambiente
        </Link>
        .
      </p>
    </main>
  );
}
