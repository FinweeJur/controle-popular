import type { Metadata } from "next";
import Link from "next/link";
import { metadataEditavel } from "@/lib/edicoes";
import FooterGlobal from "@/app/components/FooterGlobal";

export const metadata: Metadata = metadataEditavel("/documentacao/fontes-e-coletas", {
  title: "Fontes e Coletas — Documentacao Controle Popular",
  description:
    "Quais APIs, portais e diarios oficiais sao raspados, com que frequencia, e qual a politica de User-Agent e checkpoint.",
});

const FONTES = [
  {
    nome: "IBGE — Municipios MG",
    url: "https://servicodados.ibge.gov.br/api/v1/localidades/estados/MG/municipios",
    freq: "Semestral",
    dado: "853 codigos e nomes de municipios de MG",
    arquivo: "apps/web/data/municipios-mg.json",
  },
  {
    nome: "ComunicaBR — Diario Oficial MG",
    url: "https://comunicabr.com.br",
    freq: "Diario (robo)",
    dado: "Editais, portarias, contratos no DO de MG",
    arquivo: "apps/web/data/editais-consolidado.json",
  },
  {
    nome: "IBAMA — TACs ambientais",
    url: "https://servicos.ibama.gov.br",
    freq: "Mensal",
    dado: "Termos de Ajuste de Conduta (ambiental)",
    arquivo: "etl/betim/dados/tac-mma.json",
  },
  {
    nome: "Fundação Renova — Paraopeba",
    url: "https://www.fundacaorenova.org",
    freq: "Mensal",
    dado: "Execucao financeira do Acordo de Brumadinho",
    arquivo: "apps/web/data/paraopeba-execucao.json",
  },
  {
    nome: "Lei Rouanet (SALIC)",
    url: "https://api.salic.cultura.gov.br",
    freq: "Trimestral",
    dado: "Incentivadores e projetos culturais aprovados",
    arquivo: "apps/web/data/rouanet-consolidado.json",
  },
  {
    nome: "CNUC/MMA — Unidades de Conservacao",
    url: "https://www.gov.br/mma",
    freq: "Semestral",
    dado: "387 UCs para o mapa 3D de funcao social da terra",
    arquivo: "apps/web/data/unidades-conservacao.json",
  },
];

export default function FontesEColetasPage() {
  return (
    <>
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
      >
        <nav className="text-sm text-text-soft">
          <Link href="/" className="hover:text-primary">Inicio</Link>{" "}·{" "}
          <Link href="/documentacao" className="hover:text-primary">Documentacao</Link>{" "}·{" "}
          <span className="text-text">Fontes e coletas</span>
        </nav>

        <header className="space-y-3">
          <p className="font-mono text-xs text-text-soft">02 / fontes-e-coletas</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">
            Fontes e coleta de dados
          </h1>
          <p className="text-text-soft">
            Cada dado publicado tem origem oficial declarada. A coleta usa
            User-Agent que identifica o portal honestamente, pausa entre
            requisicoes e checkpoint para retomada. Nenhum coletor roda na CI.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Politica de coleta</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-text-soft">
            <li><strong>User-Agent honesto:</strong> <code className="text-xs">ControlePop/1.0 (+https://controlepopular.com.br)</code></li>
            <li><strong>Pausa entre requisicoes:</strong> minimo 1,5 s, configuravel por coletor</li>
            <li><strong>Checkpoint:</strong> cada coletor salva progresso em arquivo JSON incremental — retomada sem reprocessar tudo</li>
            <li><strong>Robots.txt:</strong> verificado antes de cada coletor novo; decisao de coletar mesmo com Disallow e registrada no cabecalho do script</li>
            <li><strong>Dado pessoal:</strong> varrido antes de cada commit por <code className="text-xs">scripts/checar-dado-pessoal.py</code></li>
            <li><strong>Coleta fora da CI:</strong> coletores nao rodam em ambiente de integracao continua — so na maquina local do publicador</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Principais fontes</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-2/60 text-xs font-semibold uppercase text-text-soft">
                <tr>
                  <th className="px-4 py-3">Fonte</th>
                  <th className="px-4 py-3">Frequencia</th>
                  <th className="px-4 py-3">O que coleta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FONTES.map((f) => (
                  <tr key={f.nome} className="odd:bg-surface-2/20">
                    <td className="px-4 py-3 font-medium">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">
                        {f.nome}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-text-soft">{f.freq}</td>
                    <td className="px-4 py-3 text-text-soft">{f.dado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <nav className="flex justify-between text-sm">
          <Link href="/documentacao/arquitetura" className="text-text-soft hover:text-primary">
            ← Arquitetura
          </Link>
          <Link href="/documentacao/api-publica" className="text-text-soft hover:text-primary">
            API pública →
          </Link>
        </nav>
      </main>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 pb-12">
        <FooterGlobal />
      </div>
    </>
  );
}
