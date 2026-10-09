import type { ReactElement } from "react";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import TabelaResumo from "./TabelaResumo";
import { COLUNAS_META_AMOSTRA_RESUMO, COLUNAS_META_ANUNCIO } from "./colunas";
import { metaAmostra } from "./dados";
import { formatarNumeroBR } from "@/lib/utilitarios/calculos";

/**
 * Seção "Biblioteca de Anúncios da Meta" da página de gastos de campanha:
 * a amostra dos anúncios dos 10 candidatos que mais receberam de big tech,
 * coletada de forma manual na Meta Ads Library (sem API pública).
 *
 * Por que separado do `SecaoBigTech.tsx`: aqui o dado NÃO vem do TSE, vem de
 * outra fonte (a própria Meta), com regras próprias — é a verificação cruzada
 * do gasto declarado contra o anúncio que a plataforma exibe. Misturar as duas
 * fontes numa tabela só faria o leitor comparar o que não é comparável
 * (AGENTS.md § 7: dois dados verdadeiros lado a lado pedem ressalva ao lado).
 *
 * Honestidade: é AMOSTRA, não inventário. A faixa de gasto é a que a Meta
 * exibe; ausente = não exibida na captura, nunca estimativa do portal.
 */
export default function SecaoMetaAds(): ReactElement {
  const resumo = metaAmostra.candidatos.map((c) => ({
    ...c,
    comFaixa: c.anuncios.filter((a) => a.faixaGastoBRL).length,
  }));
  const anuncios = metaAmostra.candidatos.flatMap((c) =>
    c.anuncios.map((a) => ({ ...a, candidato: c.urna, cargo: c.cargo, uf: c.uf }))
  );
  const totalFaixas = resumo.reduce((soma, c) => soma + c.comFaixa, 0);
  const notas = resumo.filter((c) => c.nota);
  const capturadoEm = metaAmostra.geradoEm.slice(0, 10).split("-").reverse().join("/");

  return (
    <section aria-labelledby="meta-ads" className="space-y-4">
      <h2 id="meta-ads" className="font-display text-2xl font-bold">
        Biblioteca de Anúncios da Meta: a amostra dos maior gasto
      </h2>
      <ResumoExpandivel
        className="max-w-3xl opacity-80"
        texto={`O TSE diz quanto cada campanha declarou pagar; a Biblioteca de Anúncios da Meta mostra o anúncio de fato. Esta é uma AMOSTRA de ${formatarNumeroBR(anuncios.length, 0)} anúncios dos ${metaAmostra.candidatos.length} candidatos que mais receberam de big tech, capturada em ${capturadoEm}. Em ${formatarNumeroBR(totalFaixas, 0)} deles a Meta exibiu a faixa de valor gasto. A faixa não é o total da campanha: é o recorte do anúncio, como a própria plataforma publica.`}
      />
      <p className="max-w-3xl text-sm opacity-80">{metaAmostra.metodo}</p>
      <TabelaResumo
        colunas={COLUNAS_META_AMOSTRA_RESUMO}
        linhas={resumo}
        chave={(c) => c.urna}
        legenda="Os 10 candidatos que mais contrataram big tech no TSE, com o tamanho da amostra recolhida na Meta Ads Library"
      />
      {notas.length > 0 && (
        <ul className="list-disc space-y-1 pl-6 text-xs opacity-70">
          {notas.map((c) => (
            <li key={c.urna}>
              <span className="font-semibold">{c.urna}:</span> {c.nota}
            </li>
          ))}
        </ul>
      )}
      <TabelaResumo
        colunas={COLUNAS_META_ANUNCIO}
        linhas={anuncios}
        chave={(a) => `${a.candidato}-${a.id}`}
        legenda="Cada anúncio da amostra; “não divulgado” é faixa que a Meta não exibiu nesta captura, não valor zero"
      />
      <p className="text-xs opacity-70">
        Fonte: <a
          href={metaAmostra.fonte}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          Biblioteca de Anúncios da Meta ↗
        </a>
        . Coleta manual (sem API pública para este recorte), amostra — não é o total
        de anúncios nem de gasto. Idade, período e faixa são como a plataforma exibe.
      </p>
    </section>
  );
}
