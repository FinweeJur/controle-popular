import type { Metadata } from "next";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import CartoesResumo from "@/app/components/CartoesResumo";
import {
  ESTACOES,
  RADIO_VERIFICADO_EM,
  resumirEstacoes,
} from "@/lib/radio/estacoes";
import PainelRadio from "./PainelRadio";

/**
 * `/radio` — o diretório de estações do portal.
 *
 * O recorte é deliberado (ordem do dono): menos grande mídia comercial, mais
 * rádio pública federal, universitária, comunitária e do Sul Global — com
 * programação musical. Cada estação tem fonte oficial linkável e stream HTTPS
 * conferido; o player persistente do layout raiz toca sem tirar o leitor da
 * página.
 *
 * O que esta página NÃO diz: não mede audiência, alcance nem relevância. É
 * catálogo com procedência, não ranking.
 */

const RESUMO = resumirEstacoes();

export const metadata: Metadata = {
  title: "Rádios do Brasil e do mundo (públicas, universitárias e comunitárias) - Controle Popular",
  description:
    `Diretório de ${RESUMO.total} estações de rádio de ${RESUMO.paises} países — federais, universitárias, ` +
    `comunitárias e populares do Sul Global — com transmissão direta, fonte oficial e filtro por país.`,
};

const fmt = (n: number) => n.toLocaleString("pt-BR");

export default function PaginaRadio() {
  const hoje = RADIO_VERIFICADO_EM.split("-").reverse().join("/");

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Rádio · Comunicação popular · Brasil e Sul Global · streams de {hoje}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Rádios do Brasil e do mundo
        </h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `Este diretório reúne ${fmt(RESUMO.total)} estações de rádio de ${fmt(RESUMO.paises)} países, ` +
            `com peso na rádio pública, universitária, comunitária e do Sul Global — e não na grande mídia ` +
            `comercial. Cada estação traz a programação musical, o stream direto e o link para a fonte oficial. ` +
            `Aperte "Ouvir" e a rádio toca sem fechar a página. Stream em HTTP não entrou: a página é HTTPS e o ` +
            `navegador bloquearia o áudio.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="mb-6">
        <CartoesResumo
          colunas={4}
          itens={[
            { rotulo: "Estações no diretório", valor: RESUMO.total, destaque: true },
            { rotulo: "Países", valor: RESUMO.paises },
            { rotulo: "Públicas federais", valor: RESUMO.federais, detalhe: "EBC, Câmara e Senado" },
            { rotulo: "Universitárias", valor: RESUMO.universitarias, detalhe: "UFMG, UFRJ, USP" },
            {
              rotulo: "Comunitárias",
              valor: RESUMO.comunitarias,
              detalhe: "inclui Rádio Favela e Brasil de Fato",
            },
            { rotulo: "Populares e independentes", valor: RESUMO.popularres },
            {
              rotulo: "Com transcrição local",
              valor: RESUMO.transcreviveis,
              detalhe: "federais de fala, no navegador",
            },
            {
              rotulo: "Brasil × resto do mundo",
              valor: `${RESUMO.porRegiao[0].total} × ${RESUMO.total - RESUMO.porRegiao[0].total}`,
            },
          ]}
        />
      </section>

      <PainelRadio estacoes={ESTACOES} />

      <section
        aria-label="Fonte e método"
        className="mt-8 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed"
      >
        <h2 className="text-xl font-semibold">De onde vem este dado</h2>
        <p className="mt-2">
          A lista de partida veio de agregadores públicos que conectam rádios
          (<code>radio-browser.info</code> e <code>radio.garden</code>); o{" "}
          <code>site</code> de cada linha é a página oficial da emissora. Os streams foram
          conferidos por requisição HTTP em <strong>{hoje}</strong>, respondendo áudio ou
          playlist — não basta o status 200 (um endereço pode responder 200 e não servir som).
        </p>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Sobre tocar no navegador:</strong> streams <code>.mp3</code> e{" "}
          <code>aac</code> tocam em qualquer navegador. As federais usam <code>HLS</code> (
          <code>.m3u8</code>): o portal carrega a biblioteca <code>hls.js</code> sob demanda
          para que toquem também no Chrome e no Firefox — no Safari já tocam nativos.
        </p>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Sobre a transcrição ao vivo:</strong> só as federais de fala são
          transcritas, e no <em>próprio navegador</em> (modelo Whisper local, sem enviar o
          áudio para fora). Isso exige que o stream envie CORS — as federais enviam; as
          demais não, por isso a transcrição não é oferecida nelas. A transcrição é de
          máquina: pode errar, e por isso vem marcada como tal.
        </p>
        <p className="mt-3 text-text-soft">
          Registro da coleta e das fontes:{" "}
          <code>docs/06-fontes/FONTES.md</code> (seção Rádios).
        </p>
      </section>
    </main>
  );
}
