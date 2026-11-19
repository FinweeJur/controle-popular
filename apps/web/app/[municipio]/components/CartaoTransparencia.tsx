import NextLink from "next/link";

import avaliacoesJson from "@/data/pntp/avaliacoes-mg.json";
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";
import {
  entesDaCidade,
  formatarItp,
  formatarPct,
  type AcervoPntp,
} from "@/lib/pntp/pagina";

/**
 * ═══ TRANSPARÊNCIA DO PORTAL (PNTP) — CARTÃO DO HUB DA CIDADE ═══
 *
 * O que é:
 *   Bloco que mostra, no hub de `/[municipio]`, a nota que a Atricon deu ao
 *   portal de transparência da prefeitura e o da câmara no ciclo 2025 do PNTP,
 *   com o nível e o link para a página do tema em `/cidades/transparencia`.
 *
 * Fonte oficial:
 *   Atricon — PNTP, https://pntp.atricon.org.br/dados-abertos/. Dado versionado
 *   em `apps/web/data/pntp/avaliacoes-mg.json`.
 *
 * Por que foi feito assim:
 *   - O índice é dado da CIDADE: mora no hub, como o diário oficial, e não numa
 *     rota nova para cada município.
 *   - Só ente **municipal** entra aqui (`entesDaCidade`): os seis entes
 *     estaduais de MG têm “Belo Horizonte” no campo município da planilha e não
 *     podem aparecer como portal da capital.
 *   - Cidade sem avaliação não renderiza o cartão — bloco vazio viraria “não
 *     tem portal”.
 *   - ITP nulo sai “Não avaliado”, nunca zero. Nível é selo da fonte, não
 *     cálculo. Server Component: importa o JSON e não manda os 5.286 entes ao
 *     navegador.
 */

const acervo = avaliacoesJson as unknown as AcervoPntp;
const ANO = 2025;

export default function CartaoTransparencia({ municipio }: { municipio: string }) {
  const entes = entesDaCidade(acervo.entes, municipio, ANO).filter((ente) => ente.itp !== null);
  if (entes.length === 0) return null;

  const rotuloPoder = (poder: string) => {
    if (poder === "Executivo") return "Prefeitura";
    if (poder === "Legislativo") return "Câmara";
    return poder;
  };

  return (
    <section aria-labelledby="pntp-titulo" className="min-w-0">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <h2 id="pntp-titulo" className="font-display text-[1.7em] font-semibold tracking-tight">
          Transparência do portal público
        </h2>
        <NextLink
          href="/cidades/transparencia"
          className="inline-flex min-h-9 items-center text-sm font-medium text-accent hover:underline"
        >
          PNTP em Minas Gerais →
        </NextLink>
      </div>

      <p className="mb-4 max-w-2xl text-sm leading-relaxed text-text-soft">
        Nota do Programa Nacional de Transparência Pública (Atricon) para o portal de{" "}
        {municipio} no ciclo {ANO}: o que o órgão publica, atualizado e acessível, conferido por
        auditor do Tribunal de Contas. Mede o portal, não a gestão.
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {entes.map((ente) => (
          <li
            key={ente.orgao}
            className="min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
          >
            <p className="text-xs font-semibold text-text-soft uppercase">
              {rotuloPoder(ente.poder)} · {ente.esfera}
            </p>
            <p className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-text">
                {formatarItp(ente.itp)}
              </span>
              <span className="text-sm text-text-soft">de 100 no ITP</span>
            </p>
            <p className="mt-1 text-sm text-text-soft">
              Nível <strong className="text-text">{ente.nivel}</strong> · essenciais{" "}
              {formatarPct(ente.pctEssenciais)} · avaliação{" "}
              {ente.validada === null ? "sem marca" : ente.validada ? "validada" : "não validada"}
            </p>
            <p className="mt-2 line-clamp-2 break-words text-xs text-text-soft">{ente.orgao}</p>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs leading-relaxed text-text-soft">
        Autoavaliação do órgão com evidência conferida pelo Tribunal de Contas — não é auditoria de
        gasto. Coleta em {formatarDataBR(acervo.coletadoEm)}; fonte:{" "}
        <a
          href={acervo.fonteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary hover:underline"
        >
          Atricon — PNTP ↗
        </a>
        .
      </p>
    </section>
  );
}
