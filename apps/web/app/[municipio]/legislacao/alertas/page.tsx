import { paramsDasCidades } from "@/lib/betim/staticParams";
import Link from "@/lib/betim/link";
import CardLegislacao from "@/app/[municipio]/components/CardLegislacao";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { alertas, coberturaLegislacao } from "@/lib/betim/legislacao-garantista";
// Os quatro blocos de moldura viviam DENTRO deste page.tsx e eram importados
// daqui pela tela de bons-exemplos. Uma page só pode exportar o contrato do
// Next (`default`, `generateMetadata`, `generateStaticParams`, …) — o build
// com webpack reprova, o com Turbopack não. Ver o cabeçalho de `componentes.tsx`.
import {
  SemDado,
  Vazio,
  Contagem,
  CoberturaAviso,
} from "@/app/[municipio]/legislacao/componentes";

// `output: 'export'` exige a função DECLARADA aqui — re-export não é
// reconhecido pelo Turbopack. Ver `lib/betim/staticParams.ts`.
export async function generateStaticParams() {
  return paramsDasCidades();
}

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
        · <Link href="/camara/legislacao" className="hover:text-primary">
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
          <Contagem lista={lista.length} cobertura={cobertura} ordem="do mais grave para o menos" />
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
