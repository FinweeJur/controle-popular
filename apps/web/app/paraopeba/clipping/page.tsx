import type { Metadata } from "next";
import FooterGlobal from "@/app/components/FooterGlobal";
import {
  PERIODO_CLIPPING,
  CLIPPING_PARAOPEBA,
  CLIPPING_ATI,
  PERIODO_CLIPPING_IJ,
  CLIPPING_IJ,
} from "@/lib/paraopeba";
import { formatDateBR, formatNumberBR } from "@/lib/betim/format";
import ClippingClient from "./ClippingClient";

/**
 * `/paraopeba/clipping` — clipping de imprensa sobre a reparação de
 * Brumadinho.
 *
 * ═══ POR QUE O TÍTULO CITA O PERÍODO, NUNCA "NOTÍCIAS DE HOJE" ═══
 *
 * `docs/PLANO-INGESTAO-PARAOPEBA.md` (seção 1.3): é um snapshot manual, sem
 * atualização automática. Rotular pelo período real (`PERIODO_CLIPPING`) é
 * o que separa "acervo histórico honesto" de "página que mente a partir de
 * amanhã".
 *
 * São TRÊS acervos com períodos diferentes, e a página diz os três: o das
 * instituições de justiça começa em 2019 (`PERIODO_CLIPPING_IJ`), o das ATIs
 * em 2021 (`PERIODO_CLIPPING_ATI`), o geral só em 2024. Um período único no
 * cabeçalho esconderia cinco anos de material.
 *
 * A abertura tem que anunciar a data MAIS ANTIGA dos três, senão a página
 * declara um começo em 2021 e entrega material de 2019 — inclusive o Termo de
 * Compromisso que a DPMG firmou com a Vale menos de três meses depois do
 * rompimento.
 */
export const metadata: Metadata = {
  title: `Clipping — Paraopeba | Controle Popular`,
  description: `${formatNumberBR(CLIPPING_ATI.length)} materiais das assessorias técnicas independentes, ${formatNumberBR(CLIPPING_IJ.length)} publicações do MPMG, MPF e DPMG e ${formatNumberBR(CLIPPING_PARAOPEBA.length)} notícias sobre a reparação do rompimento da barragem da Vale em Brumadinho, de ${formatDateBR(PERIODO_CLIPPING_IJ.de)} a ${formatDateBR(PERIODO_CLIPPING.ate)}.`,
};

export default function ClippingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft">
        <a href="/paraopeba" className="hover:text-primary">
          Paraopeba
        </a>{" "}
        · <span className="text-text">Clipping</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Cobertura midiática da reparação
      </h1>
      <p className="mt-2 max-w-2xl text-[1.02em] text-text-soft">
        Acervo de{" "}
        <strong className="text-text">
          {formatDateBR(PERIODO_CLIPPING_IJ.de)} a {formatDateBR(PERIODO_CLIPPING.ate)}
        </strong>{" "}
        — não é notícia do dia. É um retrato datado, reunido à mão, que não se atualiza
        sozinho. São três acervos: {formatNumberBR(CLIPPING_ATI.length)} materiais das
        assessorias técnicas independentes, classificados por eixo da reparação;{" "}
        {formatNumberBR(CLIPPING_IJ.length)} publicações das três instituições de justiça que
        assinaram o Acordo — MPMG, MPF e DPMG —, que é o que alcança 2019 e 2021; e{" "}
        {formatNumberBR(CLIPPING_PARAOPEBA.length)} notícias do clipping geral.
      </p>
      {/* O ponteiro para o Guaicuy saiu da hero em 15/08/2026. Ele dava crédito
          errado logo na abertura: o acervo das assessorias é de TRÊS ATIs
          (Guaicuy 22, NACAB 12, AEDAS 12), e nomear uma delas no primeiro
          parágrafo faz o conjunto parecer obra de uma só. O crédito por item
          continua onde ele é exato — no `source`/`ati` de cada material. */}

      <ClippingClient />

      <footer className="mt-16 border-t border-border pt-8 text-sm">
        <FooterGlobal />
      </footer>
    </div>
  );
}
