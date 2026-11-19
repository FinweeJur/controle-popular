import NextLink from "next/link";

import atosJson from "@/data/querido-diario/atos.json";
import { formatNumberBR } from "@/lib/betim/format";
import {
  atosDaCidade,
  diarioDaCidade,
  formatarDataBR,
  rotuloTipo,
  type DadosDiarios,
} from "@/lib/fontes-externas/paginas";

/**
 * ═══ DIÁRIO OFICIAL DO MUNICÍPIO — SEÇÃO DO HUB DA CIDADE ═══
 *
 * O que é:
 *   Bloco que mostra, no hub de `/[municipio]`, o que o Querido Diário mediu
 *   no diário oficial daquela cidade: contagem por termo, últimos atos com
 *   trecho e link para o PDF, e a ressalva de método.
 *
 * Fonte oficial:
 *   API pública https://api.queridodiario.org.br, do Open Knowledge Brasil.
 *   Dado versionado em `apps/web/data/querido-diario/atos.json`.
 *
 * Por que foi feito assim:
 *   - O tema é CIDADE; o diário oficial pertence ao hub, não a uma rota nova.
 *     A seção só aparece quando o IBGE da cidade existe no JSON — lista vazia
 *     em cidade sem cobertura viraria "não publica", que é falso. Mariana e
 *     Brumadinho estão em `/cidades/diarios`, com o motivo declarado.
 *   - A contagem é de MENÇÃO ao radical no texto do diário, não de ato
 *     classificado. A nota abaixo do bloco repete isso em uma frase.
 *   - Server Component: importa o JSON e não manda o arquivo ao navegador.
 */

const dados = atosJson as unknown as DadosDiarios;

export default function DiarioOficialMunicipio({ ibge }: { ibge: string }) {
  const cidade = diarioDaCidade(dados, ibge);
  if (!cidade) return null;

  const ultimos = atosDaCidade(cidade, 4);
  const totalMencoes = Object.values(cidade.porTipo).reduce(
    (soma, item) => soma + item.ocorrencias,
    0
  );

  return (
    <section aria-labelledby="diario-oficial-titulo" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2
          id="diario-oficial-titulo"
          className="font-display text-[1.7em] font-semibold tracking-tight"
        >
          Diário oficial do município
        </h2>
        <NextLink
          href="/cidades/diarios"
          className="inline-flex min-h-9 items-center text-sm font-medium text-accent hover:underline"
        >
          Cobertura dos diários →
        </NextLink>
      </div>

      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-text-soft">
        O Querido Diário reúne o diário oficial de {cidade.nome}. Na janela de{" "}
        {formatarDataBR(dados.janela.de)} a {formatarDataBR(dados.janela.ate)}, foram{" "}
        {formatNumberBR(cidade.diariosContados)}{" "}
        {cidade.diariosContados === 1 ? "diário contado" : "diários contados"} e{" "}
        {formatNumberBR(totalMencoes)} menções aos termos abaixo.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {dados.termos.map((termo) => (
          <div
            key={termo}
            className="min-w-0 rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-4"
          >
            <p className="text-xs font-semibold text-text-soft uppercase">{rotuloTipo(termo)}</p>
            <p className="mt-1 font-display text-xl font-extrabold text-text sm:text-2xl">
              {formatNumberBR(cidade.porTipo[termo]?.ocorrencias ?? 0)}
            </p>
            <p className="mt-0.5 text-xs text-text-soft">
              em {formatNumberBR(cidade.porTipo[termo]?.diarios ?? 0)}{" "}
              {(cidade.porTipo[termo]?.diarios ?? 0) === 1 ? "diário" : "diários"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
        <h3 className="font-display text-base font-semibold text-text">
          Últimos atos com menção
        </h3>
        <ul className="mt-3 space-y-3">
          {ultimos.map((ato) => (
            <li
              key={`${ato.data}-${ato.edicao}-${ato.tipo}`}
              className="min-w-0 border-b border-border pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-soft">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                  {rotuloTipo(ato.tipo)}
                </span>
                <time dateTime={ato.data}>{formatarDataBR(ato.data)}</time>
                <span aria-hidden="true">·</span>
                <span>edição {ato.edicao}</span>
                <span className="font-tabular">
                  {formatNumberBR(ato.ocorrencias)}{" "}
                  {ato.ocorrencias === 1 ? "menção" : "menções"}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 break-words text-sm leading-relaxed text-text">
                “{ato.trecho}”
              </p>
              <a
                href={ato.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex min-h-9 items-center text-sm font-semibold text-primary hover:underline"
              >
                Abrir o diário oficial (PDF) ↗
              </a>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-text-soft">
        Contagem de menção ao termo no texto do diário, não classificação editorial do ato. “Portaria
        do condomínio”, citada dentro de um decreto, conta como menção a portaria. Coleta em{" "}
        {formatarDataBR(dados.coletadoEm)}, fonte {dados.fonte.nome}.
      </p>
    </section>
  );
}
