import Link from "@/lib/betim/link";
import CardLegislacao from "@/app/[municipio]/components/CardLegislacao";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import {
  alertas,
  coberturaLegislacao,
  percentualAnalisado,
  type CoberturaLegislacao,
} from "@/lib/betim/legislacao-garantista";
import { formatNumberBR } from "@/lib/betim/format";

export const generateMetadata = metadataDaCidade(
  (c) => `Alertas — normas que restringem direitos — ${nomePortal(c)}`,
  (c) =>
    `Leis e projetos de lei de ${c.nome} que restringem direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.`
);

export default async function AlertasLegislacao({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const [lista, cobertura] = await Promise.all([
    alertas(cidade.id_municipio),
    coberturaLegislacao(cidade.id_municipio),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <Link href="/prefeitura/legislacao" className="hover:text-primary">
          Legislação
        </Link>{" "}
        · <span className="text-text">Alertas</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight text-text">
        Alertas <span className="text-text-soft">· normas que restringem direitos</span>
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Leis já sancionadas e projetos em tramitação na Câmara de {cidade.nome} que{" "}
        <strong className="text-text">restringem</strong> direitos segundo a régua declarada
        deste portal. Cada item mostra o direito atingido, o dispositivo legal que fundamenta a
        leitura e o trecho da própria norma — para você conferir em vez de acreditar.
      </p>

      {!cobertura.ok ? (
        <SemDado />
      ) : lista.length === 0 ? (
        <Vazio cobertura={cobertura} />
      ) : (
        <>
          <p className="mt-6 mb-4 text-sm text-text-soft">
            {lista.length} {lista.length === 1 ? "item" : "itens"}, do mais grave para o menos.
          </p>
          <div className="space-y-4">
            {lista.map((d) => (
              <CardLegislacao key={d.id} d={d} />
            ))}
          </div>
        </>
      )}

      <div className="mt-8">
        <CoberturaAviso cobertura={cobertura} />
      </div>
    </div>
  );
}

export function SemDado() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
      <p className="font-medium text-text">Em breve</p>
      <p className="mt-2">A análise garantista desta cidade ainda não está disponível.</p>
    </div>
  );
}

export function Vazio({ cobertura }: { cobertura: CoberturaLegislacao }) {
  const nadaAnalisado = cobertura.atosAnalisados === 0 && cobertura.proposicoesAnalisadas === 0;
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
      {nadaAnalisado ? (
        <>
          <p className="font-medium text-text">Nenhuma norma analisada ainda</p>
          <p className="mt-2">
            A análise garantista roda em fila e esta página se enche sozinha conforme avança.
          </p>
        </>
      ) : (
        <p>
          Nenhuma lei ou projeto foi classificado assim entre{" "}
          {formatNumberBR(cobertura.atosAnalisados + cobertura.proposicoesAnalisadas)} já
          analisados. Isso não significa que não exista — significa que a fila de análise ainda
          não chegou lá.
        </p>
      )}
    </div>
  );
}

export function CoberturaAviso({ cobertura }: { cobertura: CoberturaLegislacao }) {
  if (!cobertura.ok) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
      <p>
        <strong className="text-text">
          {formatNumberBR(cobertura.atosAnalisados)} de {formatNumberBR(cobertura.totalAtos)} leis
          e decretos analisados (
          {percentualAnalisado(cobertura.atosAnalisados, cobertura.totalAtos)})
        </strong>{" "}
        e{" "}
        <strong className="text-text">
          {formatNumberBR(cobertura.proposicoesAnalisadas)} de{" "}
          {formatNumberBR(cobertura.totalProposicoes)} projetos em tramitação analisados (
          {percentualAnalisado(cobertura.proposicoesAnalisadas, cobertura.totalProposicoes)})
        </strong>
        . É uma amostra, não um censo — o que não aparece aqui ainda não foi lido pela análise,
        não é veredito de “neutro” sobre a Câmara ou a Prefeitura.
      </p>
    </section>
  );
}
