import Link from "@/lib/betim/link";
import CardLegislacao from "@/app/[municipio]/components/CardLegislacao";
import {
  SemDado,
  Vazio,
  Contagem,
  CoberturaAviso,
} from "@/app/[municipio]/legislacao/alertas/page";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { bonsExemplos, coberturaLegislacao } from "@/lib/betim/legislacao-garantista";

export const generateMetadata = metadataDaCidade(
  (c) => `Bons exemplos — normas que ampliam direitos — ${nomePortal(c)}`,
  (c) =>
    `Leis e projetos de lei de ${c.nome} que ampliam direitos, com o dispositivo legal e o trecho que fundamentam cada classificação.`
);

export default async function BonsExemplosLegislacao({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const [lista, cobertura] = await Promise.all([
    bonsExemplos(cidade.id_municipio),
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
        · <span className="text-text">Bons exemplos</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight text-text">
        Bons exemplos <span className="text-text-soft">· normas que ampliam direitos</span>
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Nem todo monitoramento precisa ser denúncia. Estas são as leis e projetos de{" "}
        {cidade.nome} que <strong className="text-text">ampliam</strong> direitos — úteis para
        apoiar publicamente, cobrar andamento de quem trava, e mostrar que a régua deste portal
        reconhece os dois lados com o mesmo critério.
      </p>

      {!cobertura.ok ? (
        <SemDado />
      ) : lista.length === 0 ? (
        <Vazio cobertura={cobertura} />
      ) : (
        <>
          <Contagem
            lista={lista.length}
            cobertura={cobertura}
            ordem="do mais expressivo para o menos"
          />
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
