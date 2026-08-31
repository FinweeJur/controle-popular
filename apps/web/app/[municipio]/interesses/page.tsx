import { paramsDasCidades } from "@/lib/betim/staticParams";
import { cidadeDaRota, metadataDaCidade, nomePortal } from "@/lib/betim/cidade";
import { gerarRelatorioCidadao } from "@/lib/teia-interesses";
import type { FichaMunicipioRelatorio, SecaoComDado } from "@/lib/teia-interesses";
import { Download } from "lucide-react";
import Link from "@/lib/betim/link";

export async function generateStaticParams() {
  return paramsDasCidades();
}

export const generateMetadata = metadataDaCidade(
  (c) => `Teia de Interesses — ${c.nome} | ${nomePortal(c)}`,
  (c) =>
    `Como o portal cruza mandato político, contratos, empresas e território em ${c.nome}-${c.uf}: metodologia, fontes previstas e lacunas declaradas.`
);

/** Páginas que já têm dado coletado de verdade — o relatório só aponta para elas. */
const SECOES_COM_DADO: SecaoComDado[] = [
  { nome: "Saúde", href: "/saude", desc: "Internações, arboviroses e óbitos" },
  { nome: "Câmara Municipal", href: "/camara", desc: "Vereadores, proposições e verbas" },
  { nome: "Contratos da Prefeitura", href: "/prefeitura/contratos", desc: "Contratos ativos e fornecedores (PNCP)" },
  { nome: "Meio Ambiente", href: "/meio-ambiente", desc: "Autuações ambientais e licenciamento" },
  { nome: "Terras", href: "/terras", desc: "Vazio cadastral e sobreposições" },
];

/** Fontes que alimentarão o grafo quando a coleta rodar — o vínculo só entra com comprovação. */
const FONTES_PREVISTAS: { rotulo: string; url: string; oQue: string }[] = [
  { rotulo: "PNCP", url: "https://pncp.gov.br/", oQue: "contratos e licitações municipais" },
  { rotulo: "TSE — DivulgaCandContas", url: "https://divulgacandcontas.tse.jus.br/", oQue: "doações de campanha eleitoral" },
  { rotulo: "SICAR", url: "https://www.car.gov.br/", oQue: "imóveis rurais e sobreposições de polígono" },
  { rotulo: "SIGBM / ANM", url: "https://dadosabertos.anm.gov.br/", oQue: "barragens de mineração" },
  { rotulo: "SIRENEJud / CNJ", url: "https://sirenejud.cnj.jus.br/", oQue: "processos judiciais ambientais" },
  { rotulo: "DATASUS (SIH/SIM/Sinan)", url: "https://datasus.saude.gov.br/", oQue: "internações e óbitos por CID-10" },
];

export default async function InteressesPage({
  params,
}: {
  params: Promise<{ municipio: string }>;
}) {
  const cidade = await cidadeDaRota(params);
  const fontes = cidade.fontes ?? {};

  const linksOficiais = [
    typeof fontes.prefeitura_host === "string" && fontes.prefeitura_host
      ? { rotulo: "Prefeitura Municipal", url: fontes.prefeitura_host }
      : null,
    typeof fontes.camara_host === "string" && fontes.camara_host
      ? { rotulo: "Câmara Municipal", url: fontes.camara_host }
      : null,
  ].filter((l): l is { rotulo: string; url: string } => l !== null);

  const ficha: FichaMunicipioRelatorio = {
    idMunicipio: cidade.id_municipio,
    nome: cidade.nome,
    uf: cidade.uf,
    cnpjPrefeitura: cidade.cnpj_prefeitura,
    dominio: cidade.dominio,
    linksOficiais,
  };

  const relatorio = gerarRelatorioCidadao(ficha, SECOES_COM_DADO);

  return (
    <main className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Cruzamento de dados
          </span>
          <h1 className="mt-1 font-display text-[2em] font-bold tracking-tight text-text">
            Teia de Interesses — {cidade.nome}
          </h1>
          <p className="mt-1 max-w-[70ch] text-sm text-text-soft">
            Esta página vai conectar poder político, fornecedores públicos, imóveis
            rurais e processos judiciais de {cidade.nome}. Enquanto a coleta não
            termina, ela mostra a metodologia e as lacunas — nenhum vínculo é
            exibido antes de ter comprovação em fonte oficial.
          </p>
        </div>

        <a
          href={`data:application/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(relatorio, null, 2)
          )}`}
          download={`relatorio_teia_${cidade.slug}.json`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-ink shadow-sm transition hover:opacity-90"
        >
          <Download size={14} aria-hidden="true" />
          Salvar Dados em Relatório
        </a>
      </div>

      <section className="mt-10 rounded-xl border border-border/70 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-xl font-bold text-text">
          O que será cruzado aqui
        </h2>
        <p className="mt-2 max-w-[70ch] text-sm text-text-soft">
          A Teia de Interesses vai juntar, em um grafo, os vínculos entre quem
          governa, quem é contratado, quem detém terras e quem responde a
          processos. Cada vínculo virá de uma base oficial, com o documento
          que o comprova.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {FONTES_PREVISTAS.map((f) => (
            <li
              key={f.url}
              className="rounded-lg border border-border/50 bg-surface-raised p-3.5 text-xs"
            >
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                {f.rotulo} ↗
              </a>
              <p className="mt-1 text-text-soft">{f.oQue}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-lg border-l-4 border-l-primary bg-primary/5 px-4 py-3 text-xs text-text-soft">
          Regra editorial do portal: <strong>número não coletado não é estimado.</strong>{" "}
          Enquanto uma fonte não for lida, a lacuna é declarada — nada aqui é
          preenchido com exemplos ou suposições.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold text-text">
          Os dados reais já disponíveis hoje
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECOES_COM_DADO.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="cp-card-hover flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm hover:border-primary"
            >
              <p className="font-display font-semibold text-text">{s.nome}</p>
              <p className="mt-1 text-sm text-text-soft">{s.desc}</p>
              <span className="mt-auto pt-3 text-xs font-medium text-accent">Abrir →</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
