import type { Metadata } from "next";
import { formatNumberBR } from "@/lib/betim/format";
import { lerEstudos, REPOSITORIO_LABEL, CLASSE_ESTUDO_LABEL } from "@/lib/ambiental/estudos";
import { metadataEditavel } from "@/lib/edicoes";
import BuscaEstudos from "./BuscaEstudos";

export const metadata: Metadata = metadataEditavel("/ambiental/estudos", {
  title: "Estudos de impacto ambiental — Controle Popular · Ambiental",
  description:
    "Todo estudo de impacto ambiental (EIA/RIMA) ligado a audiência pública em Minas Gerais, com o link que o Estado publicou para ele — e por que muitos já respondem 404.",
});

/**
 * `/ambiental/estudos` — lê `lib/ambiental/estudos.ts` (`lerEstudos()`),
 * dado de arquivo (`etl/betim/dados/ambiental-estudos.json`), sem banco de
 * propósito: a Neon está em HTTP 402 até 01/09 e `next build` precisaria de
 * banco para pré-renderizar se esta frente dependesse dele.
 *
 * Molde estrutural: `ambiental/licenciamento/page.tsx` (cabeçalho, blocos de
 * contagem, rodapé de proveniência). A tabela filtrável (`BuscaEstudos.tsx`)
 * lê o índice fatiado de `dados/[arquivo]/route.ts` — mesmo mecanismo de
 * `congresso/proposicoes`, dono do `baseDados` abaixo.
 */
// Sem `searchParams`, mas com `force-static` mesmo assim: sem ele
// `output: export` trata a rota como dinâmica e aborta com "missing
// generateStaticParams()" — mensagem que não descreve a causa real (mesma
// nota de `congresso/proposicoes/page.tsx`).
export const dynamic = "force-static";

export default function EstudosIndex() {
  const { geradoEm, fonte, resumo } = lerEstudos();

  // `process.env.PAGES_BASE_PATH` é o mesmo sinal que `next.config.ts` usa
  // para saber se está exportando estático. O `fetch()` cru de
  // `TabelaEstatica` não passa por `next/link`, que é quem normalmente
  // prefixa isso sozinho — precisa ir pronto aqui.
  const prefixoExport = process.env.PAGES_BASE_PATH ?? "";
  const baseDados = `${prefixoExport}/ambiental/estudos/dados`;

  const porRepositorio = Object.entries(resumo.por_repositorio).sort((a, b) => b[1] - a[1]);
  const porClasseEstudo = Object.entries(resumo.por_classe_estudo).sort((a, b) => b[1] - a[1]);

  const dataGeracao = new Date(geradoEm).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: "var(--cp-tertiary)" }}
        >
          Ambiental · Estadual · Estudos de impacto
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Estudos de impacto ambiental por trás de cada audiência pública
        </h1>
        <p className="max-w-2xl text-[1.05em] opacity-85">
          EIA (Estudo de Impacto Ambiental) e RIMA (Relatório de Impacto Ambiental) são os
          documentos que um empreendedor precisa apresentar antes de uma licença ambiental de
          maior porte — o EIA é técnico e detalhado, o RIMA é a versão que qualquer pessoa
          consegue ler. Quando o impacto é grande, a Semad marca uma audiência pública para
          discutir o processo, e é aí que o link para esses estudos é publicado.
        </p>

        <p
          className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
          style={{ borderColor: "var(--cp-tertiary)" }}
        >
          <strong className="font-tabular">{formatNumberBR(resumo.audiencias)}</strong>{" "}
          audiências públicas coletadas, com{" "}
          <strong className="font-tabular">{formatNumberBR(resumo.linhas)}</strong> links de
          estudo (uma audiência pode ter mais de um), em{" "}
          <strong className="font-tabular">{formatNumberBR(resumo.municipios_distintos)}</strong>{" "}
          municípios de Minas Gerais.
        </p>
      </header>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          O Estado não hospeda o EIA/RIMA — só aponta para ele
        </h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          Quando a Semad publica uma audiência pública, ela não guarda uma cópia do estudo no
          próprio site: publica um link para a nuvem do empreendedor — Google Drive, OneDrive,
          Dropbox, MEGA, o site da consultoria contratada. Isso significa que a permanência do
          documento depende de terceiro, não do órgão público.
        </p>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          Só{" "}
          <strong className="font-tabular">{formatNumberBR(resumo.com_arquivo_enumeravel)}</strong>{" "}
          dos {formatNumberBR(resumo.linhas)} links dão para enumerar por scraping (repositório
          que lista arquivo sem exigir sessão ou JavaScript) — os demais existem, mas o portal não
          consegue listar o nome do arquivo dentro deles. Na prática, o link de um estudo que
          embasou uma licença já responde <strong>404</strong> quando alguém tenta abrir meses
          depois: por isso este portal guarda cópia do que consegue.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--cp-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--cp-border)] text-left opacity-70">
                <th className="px-4 py-2 font-medium">Repositório</th>
                <th className="px-4 py-2 text-right font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {porRepositorio.map(([chave, total]) => (
                <tr key={chave} className="border-b border-[var(--cp-border)] last:border-0">
                  <td className="px-4 py-2">{REPOSITORIO_LABEL[chave] ?? chave}</td>
                  <td className="px-4 py-2 text-right font-tabular">{formatNumberBR(total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Os outros documentos do processo</h2>
        <p className="mt-1 text-sm opacity-75">
          Nem todo link é um EIA ou um RIMA — o processo de licenciamento reúne outros
          documentos técnicos, e o portal classifica cada um pelo que a fonte descreve.
        </p>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {porClasseEstudo.map(([chave, total]) => (
            <li
              key={chave}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--cp-border)] px-4 py-2.5 text-sm"
            >
              <span>{CLASSE_ESTUDO_LABEL[chave] ?? "Sem classificação"}</span>
              <span className="shrink-0 font-tabular text-xs opacity-70">
                {formatNumberBR(total)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-2xl text-[.85em] opacity-70">
          <strong>EIA</strong> — Estudo de Impacto Ambiental, o documento técnico completo.{" "}
          <strong>RIMA</strong> — Relatório de Impacto Ambiental, a versão em linguagem acessível
          do EIA. <strong>PCA</strong> — Plano de Controle Ambiental, para empreendimentos de
          impacto menor. <strong>RCA</strong> — Relatório de Controle Ambiental, o relatório que
          acompanha o PCA. <strong>ART</strong> — Anotação de Responsabilidade Técnica, o
          registro de quem assina tecnicamente pelo estudo. <strong>Outro</strong> — documento do
          processo que não se encaixou nas categorias acima.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Buscar estudos e audiências</h2>
        <div className="mt-4">
          <BuscaEstudos base={baseDados} />
        </div>
      </section>

      <section className="mt-12 border-t border-[var(--cp-border)] pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] opacity-80">
          Coletado em {dataGeracao}, da{" "}
          <a href={fonte} target="_blank" rel="noopener noreferrer" className="underline">
            página oficial de audiências públicas da Semad ↗
          </a>
          . A coleta é uma foto periódica, não tempo real — audiências novas e links trocados
          pelo empreendedor podem não estar refletidos aqui até a próxima rodada.
        </p>
      </section>
    </div>
  );
}
