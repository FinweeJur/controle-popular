import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import SpotlightCard from "@/app/components/react-bits/SpotlightCard";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { metadataEditavel } from "@/lib/edicoes";
import {
  acervoTransporte,
  formatarDataFonte,
  ROTULOS_STATUS,
  type StatusTre,
} from "@/lib/eleicoes/transporte-2026";
import TabelaTransporte from "./TabelaTransporte";

/**
 * `/eleicoes/2026/transporte-gratuito` - o que vale no transporte público
 * nos dois turnos das Eleições 2026.
 *
 * A página separa três coisas que costumam ser misturadas:
 * 1. a gratuidade universal determinada pelo STF (ADPF 1013) e pela
 *    Resolução TSE 23.751/2026, que vale em todo município;
 * 2. o transporte especial da Justiça Eleitoral (Lei 6.091/1974 e
 *    Resolução TSE 23.753/2026), que depende de pedido e logística;
 * 3. o que cada TRE e cada ente publicou, que é uma amostra verificada,
 *    não um censo nacional.
 *
 * Fonte versionada: `apps/web/data/eleicoes/2026/transporte-gratuito-2026.json`.
 * A página é estática; não há coleta em tempo de requisição.
 */

const SECOES = [
  { id: "resumo", titulo: "1. O essencial" },
  { id: "lei", titulo: "2. O que a lei obriga" },
  { id: "justica-eleitoral", titulo: "3. Transporte pela Justiça Eleitoral" },
  { id: "tres", titulo: "4. O que cada TRE publicou" },
  { id: "politicas", titulo: "5. Políticas confirmadas" },
  { id: "tensoes", titulo: "6. Tensões, denúncias e limites" },
  { id: "metodologia", titulo: "7. Metodologia e lacunas" },
  { id: "fontes", titulo: "8. Fontes" },
  { id: "correcoes", titulo: "9. Correções" },
];

export const metadata: Metadata = metadataEditavel(
  "/eleicoes/2026/transporte-gratuito",
  {
    title:
      "Transporte grátis nas Eleições 2026: o que cada estado e TRE publicou",
    description:
      "Gratuidade no transporte coletivo urbano nos dois turnos das Eleições 2026, o transporte especial da Justiça Eleitoral, o que os 27 TREs publicaram e as políticas e denúncias localizadas até 21/10/2026.",
  },
);

export const dynamic = "force-static";

const CONTAGEM_STATUS: Record<StatusTre, number> = acervoTransporte.tres.reduce(
  (contagem, tre) => ({
    ...contagem,
    [tre.status]: contagem[tre.status] + 1,
  }),
  { pagina: 0, noticia: 0, programa: 0, "sem-pagina": 0 },
);

const UFS_COM_POLITICA = new Set(
  acervoTransporte.politicas.map((politica) => politica.uf),
).size;

interface BaseLegal {
  titulo: string;
  orgao: string;
  texto: string;
  url: string;
  rotulo: string;
}

const BASES_LEGAIS: BaseLegal[] = [
  {
    titulo: "ADPF 1013",
    orgao: "STF · 2023",
    texto:
      "O Supremo reconheceu o dever do Poder Público de oferecer transporte coletivo urbano, intermunicipal e metropolitano gratuito nos dias de eleição, com frequência de dias úteis. A decisão vale para os dois turnos, nas zonas urbanas de todos os municípios.",
    url: "https://www.stf.jus.br/arquivo/cms/publicacaoBOInternet/anexo/link_download/casos_relevantes/pt/ADPF_1013.pdf",
    rotulo: "Ler o resumo oficial do caso (STF)",
  },
  {
    titulo: "Resolução TSE 23.751/2026",
    orgao: "TSE · art. 23",
    texto:
      "A resolução detalha a gratuidade nos dias de votação. O Poder Público deve informar itinerários, modalidades e horários. Redução injustificada da oferta pode configurar crime eleitoral.",
    url: "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026",
    rotulo: "Ler a resolução",
  },
  {
    titulo: "Lei 6.091/1974",
    orgao: "Congresso Nacional",
    texto:
      "Cria o transporte gratuito da Justiça Eleitoral para eleitores da zona rural, em regra dentro do município e quando a distância das zonas rurais ao local de votação for de pelo menos 2 km. Os veículos ficam à disposição da JE e recebem a identificação “A serviço da Justiça Eleitoral”.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l6091.htm",
    rotulo: "Ler a lei",
  },
  {
    titulo: "Resolução TSE 23.753/2026",
    orgao: "TSE · Seu Voto Importa",
    texto:
      "Cria o programa de transporte individual gratuito porta a porta para pessoas com deficiência ou mobilidade reduzida, executado pelos TREs, e também alcança populações indígenas, quilombolas e demais comunidades tradicionais.",
    url: "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-753-de-26-de-fevereiro-de-2026?texto=compilado",
    rotulo: "Ler a resolução",
  },
  {
    titulo: "Resolução TSE 23.780/2026",
    orgao: "TSE · 15/10/2026",
    texto:
      "Altera a Resolução 23.753/2026 e permite que os TREs analisem pedidos de transporte especial feitos com menos de 20 dias da eleição, considerando as peculiaridades locais e a viabilidade operacional. Não é garantia automática de atendimento.",
    url: "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-780-de-15-de-outubro-de-2026",
    rotulo: "Ler a resolução",
  },
];

const TENSOES = [
  {
    titulo: "A obrigação não depende de decreto municipal",
    texto:
      "Município que não publicou decreto não está automaticamente liberado. A decisão do STF e a resolução do TSE valem nas zonas urbanas de todo o país; o decreto organiza a operação, não cria o direito.",
    fonte: "ADPF 1013 e Res. TSE 23.751/2026",
    url: "https://www.stf.jus.br/arquivo/cms/publicacaoBOInternet/anexo/link_download/casos_relevantes/pt/ADPF_1013.pdf",
  },
  {
    titulo: "Candidato e partido não podem bancar o transporte",
    texto:
      "A Justiça Eleitoral alerta que transporte oferecido por candidato, partido ou coligação no dia da votação pode configurar crime eleitoral, nos termos do art. 11 da Lei 6.091/1974 e do art. 302 do Código Eleitoral. A redução injustificada da frota também pode ser crime eleitoral.",
    fonte: "TRE-AL e Res. TSE 23.751/2026",
    url: "https://www.tre-al.jus.br/comunicacao/noticias/2026/Outubro/tre-al-garante-transporte-gratuito-de-eleitores-em-todo-o-estado-e-alerta-para-proibicao-do-servico-por-candidatos-e-partidos",
  },
  {
    titulo: "Amazonas: pedido negado, logística limitada",
    texto:
      "O TRE-AM negou o pedido da UNIVAJA para transportar eleitores de 44 aldeias do Vale do Javari no 2º turno. A decisão reconheceu a legitimidade da entidade, mas apontou prazos vencidos, falta de dotação e inviabilidade logística. O tribunal informou que o Amazonas tem 116 locais de votação em comunidades indígenas.",
    fonte: "TRE-AM",
    url: "https://www.tre-am.jus.br/comunicacao/noticias/2026/Outubro/tre-am-esclarece-atuacao-no-transporte-de-eleitores-em-areas-indigenas-e-de-dificil-acesso",
  },
  {
    titulo: "A PEC de 21/10 não muda a regra deste domingo",
    texto:
      "O governo enviou ao Congresso uma PEC de tarifa zero em ônibus aos fins de semana. É proposta legislativa, não regra vigente para o segundo turno de 2026. A obrigação deste domingo continua sendo a do STF e da Resolução 23.751/2026.",
    fonte: "G1 · 21/10/2026",
    url: "https://g1.globo.com/politica/noticia/2026/10/21/lula-envia-ao-congresso-nesta-quarta-pec-que-preve-tarifa-zero-para-onibus-aos-finais-de-semana.ghtml",
  },
];

interface FonteAbnt {
  referencia: string;
  url?: string;
  rotulo?: string;
}

const FONTES: FonteAbnt[] = [
  {
    referencia:
      "BRASIL. Supremo Tribunal Federal. Arguição de Descumprimento de Preceito Fundamental 1013. Relator: Min. Luís Roberto Barroso. Brasília, 2023.",
    url: "https://www.stf.jus.br/arquivo/cms/publicacaoBOInternet/anexo/link_download/casos_relevantes/pt/ADPF_1013.pdf",
    rotulo: "Disponível no STF",
  },
  {
    referencia:
      "BRASIL. Tribunal Superior Eleitoral. Resolução nº 23.751, de 26 de fevereiro de 2026. Dispõe sobre os atos gerais do processo eleitoral para as Eleições 2026; o art. 23 trata da gratuidade do transporte nos dias de votação.",
    url: "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026",
    rotulo: "Disponível no TSE",
  },
  {
    referencia:
      "BRASIL. Lei nº 6.091, de 15 de agosto de 1974. Dispõe sobre o transporte gratuito de eleitores da zona rural.",
    url: "https://www.planalto.gov.br/ccivil_03/leis/l6091.htm",
    rotulo: "Disponível no Planalto",
  },
  {
    referencia:
      "BRASIL. Tribunal Superior Eleitoral. Resolução nº 23.753, de 26 de fevereiro de 2026. Institui o programa Seu Voto Importa.",
    url: "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-753-de-26-de-fevereiro-de-2026?texto=compilado",
    rotulo: "Disponível no TSE",
  },
  {
    referencia:
      "BRASIL. Tribunal Superior Eleitoral. Resolução nº 23.780, de 15 de outubro de 2026. Altera a Resolução nº 23.753/2026 e flexibiliza o prazo de pedidos de transporte especial.",
    url: "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-780-de-15-de-outubro-de-2026",
    rotulo: "Disponível no TSE",
  },
  {
    referencia:
      "BRASIL. Tribunal Superior Eleitoral. Eleições 2026: transporte e voto.",
    url: "https://www.tse.jus.br/eleicoes/eleicoes-2026",
    rotulo: "Disponível no TSE",
  },
  {
    referencia:
      "G1. Lula envia ao Congresso PEC que prevê tarifa zero para ônibus aos finais de semana. 21 out. 2026.",
    url: "https://g1.globo.com/politica/noticia/2026/10/21/lula-envia-ao-congresso-nesta-quarta-pec-que-preve-tarifa-zero-para-onibus-aos-finais-de-semana.ghtml",
    rotulo: "Disponível no G1",
  },
  {
    referencia:
      "GOVERNO DA BAHIA. Governo da Bahia amplia período de transporte gratuito para eleitores no segundo turno. 2026.",
    url: "https://www.ba.gov.br/comunicacao/noticias/2026-10/384592/governo-da-bahia-amplia-periodo-de-transporte-gratuito-para-eleitores-no",
    rotulo: "Disponível no governo da Bahia",
  },
  {
    referencia:
      "GOVERNO DO RIO GRANDE DO SUL. Segundo turno das eleições terá gratuidade no transporte intermunicipal de longo curso. 2026.",
    url: "https://www.estado.rs.gov.br/segundo-turno-das-eleicoes-tera-gratuidade-no-transporte-intermunicipal-de-longo-curso",
    rotulo: "Disponível no governo do RS",
  },
  {
    referencia:
      "AGÊNCIA PARÁ. Governo do Pará garante transporte intermunicipal gratuito no segundo turno das eleições. 2026.",
    url: "https://agenciapara.com.br/noticia/80132/governo-do-para-garante-transporte-intermunicipal-gratuito-no-segundo-turno-das-eleicoes",
    rotulo: "Disponível na Agência Pará",
  },
  {
    referencia:
      "GOVERNO DO PIAUÍ. Piauí assegura transporte intermunicipal gratuito para eleitores no 2º turno. 2026.",
    url: "https://www.pi.gov.br/piaui-assegura-transporte-intermunicipal-gratuito-para-eleitores-no-2o-turno-conforme-legislacao-eleitoral",
    rotulo: "Disponível no governo do Piauí",
  },
  {
    referencia:
      "SPTRANS. Domingão Tarifa Zero: transporte gratuito nos domingos e feriados. 2026.",
    url: "https://www.sptrans.com.br/domingao-tarifa-zero/",
    rotulo: "Disponível na SPTrans",
  },
];

function LinkFonte({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`font-medium text-primary underline underline-offset-2 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${className}`}
    >
      {children}
    </a>
  );
}

function CartaoResumo({
  valor,
  rotulo,
  detalhe,
}: {
  valor: string;
  rotulo: string;
  detalhe: string;
}) {
  return (
    <SpotlightCard
      className="rounded-xl border border-border bg-surface-2/60 p-3"
      ariaLabel={`${rotulo}: ${valor}`}
    >
      <p className="font-display text-2xl font-bold text-primary">{valor}</p>
      <p className="mt-1 text-sm font-semibold">{rotulo}</p>
      <p className="mt-1 text-xs leading-snug text-text-soft">{detalhe}</p>
    </SpotlightCard>
  );
}

function EtiquetaStatus({ status }: { status: StatusTre }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-soft">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      {ROTULOS_STATUS[status]}
    </span>
  );
}

function EtiquetaFontePublica() {
  return (
    <span className="inline-flex rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
      Fonte pública
    </span>
  );
}

function EtiquetaFonteDenuncia({ oficial }: { oficial: boolean }) {
  return oficial ? (
    <EtiquetaFontePublica />
  ) : (
    <span className="inline-flex rounded-full border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-text-soft">
      Imprensa
    </span>
  );
}

export default function Page() {
  const { eleicao, turnos, geradoEm, tres, politicas, denuncias } =
    acervoTransporte;
  const datasDosTurnos = turnos
    .map((turno) => formatarDataFonte(turno.data))
    .join(" e ");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <nav
        aria-label="Trilha de navegação"
        className="mb-6 flex flex-wrap items-center gap-2 text-sm text-text-soft"
      >
        <Link href="/" className="hover:text-primary">
          Início
        </Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Eleições 2026 · Transporte</span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          {eleicao} · 1º e 2º turnos
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Transporte grátis nas Eleições 2026
        </h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-text-soft"
          texto={`Nos dias ${datasDosTurnos}, o transporte coletivo urbano é gratuito por decisão do STF e pela Resolução 23.751/2026 do TSE. Esta página separa essa obrigação nacional do transporte especial da Justiça Eleitoral e reúne o que ${tres.length} TREs, ${politicas.length} políticas estaduais, distritais, municipais e de polos e ${denuncias.length} denúncias ou cobranças localizaram até ${formatarDataFonte(geradoEm)}. É amostra verificada, não censo.`}
        />
        <p className="mt-2 text-xs text-text-soft">
          Última verificação: {formatarDataFonte(geradoEm)} · Amostra declarada,
          não censo
        </p>
      </header>

      <IndiceWiki itens={SECOES} />

      <SecaoWiki id="resumo" titulo="1. O essencial">
        <div className="grid gap-3 sm:grid-cols-3">
          <CartaoResumo
            valor="2 turnos"
            rotulo="Obrigação nacional"
            detalhe={`${datasDosTurnos}: gratuidade nas zonas urbanas de todo o país, inclusive onde não há decreto.`}
          />
          <CartaoResumo
            valor={`${tres.length} TREs`}
            rotulo="Todas as UFs"
            detalhe="Página dedicada, notícia, programa Seu Voto Importa ou ausência declarada de página específica."
          />
          <CartaoResumo
            valor={String(politicas.length)}
            rotulo="Políticas confirmadas"
            detalhe={`${UFS_COM_POLITICA} UFs com política mapeada: estados, DF, Região Metropolitana de Goiânia, capitais e polos. Cinco são políticas permanentes de domingo que cobrem 25/10.`}
          />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-text-soft">
          As {denuncias.length} denúncias ou cobranças são uma lista separada
          das políticas confirmadas e estão na seção 6. Elas não entram na
          contagem das {politicas.length} políticas.
        </p>

        <div className="mt-5 space-y-3 text-sm leading-relaxed">
          <p>
            A gratuidade universal é a regra nas zonas urbanas: no dia da
            votação, o transporte coletivo deve funcionar com a frequência de
            um dia útil e sem cobrança. O que muda de lugar para lugar é a
            organização da operação, não o direito.
          </p>
          <p>
            O transporte da Justiça Eleitoral é outra coisa. Ele atende quem
            mora na zona rural ou tem mobilidade reduzida, depende de pedido e
            de logística, e não é porta a porta para toda a população.
          </p>
        </div>
      </SecaoWiki>

      <SecaoWiki id="lei" titulo="2. O que a lei obriga">
        <div className="grid gap-3 sm:grid-cols-2">
          {BASES_LEGAIS.map((base) => (
            <SpotlightCard
              key={base.titulo}
              className="rounded-xl border border-border bg-surface-2/40 p-3"
              ariaLabel={base.titulo}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {base.orgao}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold">
                {base.titulo}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-text-soft">
                {base.texto}
              </p>
              <LinkFonte href={base.url} className="mt-2 inline-block text-sm">
                {base.rotulo}
              </LinkFonte>
            </SpotlightCard>
          ))}
        </div>

        <div
          role="note"
          className="mt-5 rounded-xl border-2 p-3 text-sm leading-snug"
          style={{ borderColor: "var(--cp-alert)" }}
        >
          <p className="font-semibold">O ponto que mais gera confusão</p>
          <p className="mt-1">
            A ADPF 1013 não criou tarifa zero permanente. Ela garantiu
            transporte gratuito <strong>no dia da eleição</strong>. A PEC em
            discussão no Congresso trata de fins de semana e ainda não é regra
            vigente.
          </p>
        </div>
      </SecaoWiki>

      <SecaoWiki
        id="justica-eleitoral"
        titulo="3. Transporte pela Justiça Eleitoral"
      >
        <p className="text-sm leading-relaxed">
          O transporte da JE é supletivo e focalizado. Ele não substitui o
          transporte público gratuito e não atende automaticamente todo
          eleitor. A Lei 6.091/1974 e a Resolução 23.753/2026 definem dois
          caminhos principais.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SpotlightCard className="rounded-xl border border-border bg-surface-2/40 p-3" ariaLabel="Zona rural">
            <h3 className="font-display text-base font-semibold">
              Zona rural
            </h3>
            <p className="mt-1.5 text-sm leading-snug text-text-soft">
              Transporte gratuito em regra dentro do município e quando a
              distância das zonas rurais ao local de votação for de pelo menos
              2 km. Os veículos são identificados como “A serviço da Justiça
              Eleitoral”.
            </p>
          </SpotlightCard>
          <SpotlightCard className="rounded-xl border border-border bg-surface-2/40 p-3" ariaLabel="Seu Voto Importa">
            <h3 className="font-display text-base font-semibold">
              Seu Voto Importa
            </h3>
            <p className="mt-1.5 text-sm leading-snug text-text-soft">
              Transporte individual porta a porta para pessoas com deficiência
              ou mobilidade reduzida, executado pelo TRE, conforme pedido e
              disponibilidade.
            </p>
          </SpotlightCard>
          <SpotlightCard className="rounded-xl border border-border bg-surface-2/40 p-3" ariaLabel="Como pedir">
            <h3 className="font-display text-base font-semibold">
              Como pedir
            </h3>
            <p className="mt-1.5 text-sm leading-snug text-text-soft">
              Procure o TRE do seu estado ou o cartório eleitoral. Pedidos fora
              do prazo podem ser analisados conforme disponibilidade, mas não
              há garantia automática.
            </p>
          </SpotlightCard>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2/60 p-3">
          <h3 className="font-display text-base font-semibold">
            Não confunda os dois direitos
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">Tarifa zero no dia</p>
              <p className="mt-1 text-sm text-text-soft">
                Universal, coletiva, determinada pelo STF e pela Resolução
                23.751/2026. Vale para ônibus, metrô e demais modais coletivos
                urbanos e intermunicipais.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">Transporte da JE</p>
              <p className="mt-1 text-sm text-text-soft">
                Individual ou coletivo rural, sob demanda, para quem se
                enquadra. Depende de pedido, rota e disponibilidade do TRE ou
                do município.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm">
          Acompanhe as orientações oficiais na{" "}
          <LinkFonte href="https://www.tse.jus.br/eleicoes/eleicoes-2026">
            página de Eleições 2026 do TSE
          </LinkFonte>
          .
        </p>
      </SecaoWiki>

      <SecaoWiki id="tres" titulo="4. O que cada TRE publicou">
        <p className="text-sm leading-relaxed">
          A situação abaixo é a declarada por cada tribunal, não um ranking.{" "}
          <strong>Página dedicada</strong> é uma página do TRE sobre transporte;{" "}
          <strong>notícia</strong> é um comunicado; <strong>programa</strong> é o
          Seu Voto Importa; <strong>sem página</strong> significa que não foi
          localizada página específica, não que o direito não exista.
        </p>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-soft">
          <span className="rounded-full border border-border bg-surface px-2.5 py-1">
            {CONTAGEM_STATUS.pagina} páginas dedicadas
          </span>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1">
            {CONTAGEM_STATUS.noticia} notícias
          </span>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1">
            {CONTAGEM_STATUS.programa} programas
          </span>
          <span className="rounded-full border border-border bg-surface px-2.5 py-1">
            {CONTAGEM_STATUS["sem-pagina"]} sem página específica
          </span>
        </div>
        <p className="mt-2 text-xs text-text-soft">
          Todos os links desta seção são de tribunais regionais eleitorais:
          fonte pública.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tres.map((tre) => (
            <SpotlightCard
              key={tre.uf}
              className="flex h-full flex-col rounded-xl border border-border bg-surface-2/40 p-2.5"
              ariaLabel={`${tre.uf} — ${tre.nome}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
                    {tre.uf}
                  </p>
                  <h3 className="font-display text-sm font-semibold leading-snug">
                    {tre.nome}
                  </h3>
                </div>
                <EtiquetaStatus status={tre.status} />
              </div>
              <p className="mt-1 line-clamp-2 flex-1 text-xs leading-snug text-text-soft">
                {tre.resumo}
              </p>
              <p
                className="mt-0.5 line-clamp-1 text-xs leading-snug opacity-70"
                title={tre.observacao}
              >
                {tre.observacao}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <LinkFonte href={tre.fonteUrl} className="text-xs">
                  {tre.fonteNome}
                </LinkFonte>
                <EtiquetaFontePublica />
              </div>
              <p className="mt-1 text-xs opacity-60">
                {formatarDataFonte(tre.fonteData)}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </SecaoWiki>

      <SecaoWiki id="politicas" titulo="5. Políticas confirmadas">
        <p className="text-sm leading-relaxed">
          A tabela reúne gratuidade universal, isenções e programas
          municipais confirmados em fonte oficial ou de imprensa. Filtre por
          UF, tipo ou palavra-chave; o CSV baixa exatamente o que está na tela.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-soft">
          <span><strong>Fonte pública:</strong> gov.br, jus.br, leg.br, mp.br, def.br ou órgão oficial.</span>
          <span><strong>Imprensa:</strong> G1, Folha e veículos equivalentes.</span>
          <span><strong>Documento oficial:</strong> decreto em PDF hospedado fora do domínio do ente.</span>
          <span><strong>Permanente:</strong> política de domingo que também cobre 25/10.</span>
        </p>

        <div
          role="note"
          className="mt-3 rounded-xl border border-border bg-surface-2/60 p-3 text-sm leading-snug"
        >
          <p className="font-semibold">
            Esta tabela não é a lista do transporte da JE.
          </p>
          <p className="mt-1 text-text-soft">
            O transporte especial da Justiça Eleitoral está nos cartões da{" "}
            <a
              href="#justica-eleitoral"
              className="font-medium text-primary underline underline-offset-2 hover:text-accent"
            >
              seção 3
            </a>
            . São direitos diferentes, com critérios e canais de pedido
            diferentes.
          </p>
        </div>

        <div className="mt-4">
          <TabelaTransporte registros={politicas} />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-text-soft">
          Se o seu município não aparece, isso não significa que a gratuidade
          não valha: a obrigação é nacional. Significa que não foi localizada
          uma publicação específica até a data de corte. Procure a prefeitura e
          o TRE do seu estado.
        </p>
      </SecaoWiki>

      <SecaoWiki id="tensoes" titulo="6. Tensões, denúncias e limites">
        <div className="grid gap-3 sm:grid-cols-2">
          {TENSOES.map((tensao) => (
            <SpotlightCard
              key={tensao.titulo}
              className="rounded-xl border border-border bg-surface-2/40 p-3"
              ariaLabel={tensao.titulo}
            >
              <h3 className="font-display text-base font-semibold leading-snug">
                {tensao.titulo}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-text-soft">
                {tensao.texto}
              </p>
              <LinkFonte href={tensao.url} className="mt-2 inline-block text-xs">
                {tensao.fonte}
              </LinkFonte>
            </SpotlightCard>
          ))}
        </div>

        <h3 className="mt-8 font-display text-lg font-semibold">
          Denúncias e cobranças
        </h3>
        <p className="mt-1.5 text-sm leading-snug text-text-soft">
          Casos em que a falta ou a redução do transporte virou cobrança de
          órgão público, partido, entidade da sociedade civil ou denúncia de
          imprensa. A etiqueta diz se a fonte é oficial ou jornalística.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {denuncias.map((denuncia) => (
            <SpotlightCard
              key={denuncia.id}
              className="rounded-xl border border-border bg-surface-2/40 p-3"
              ariaLabel={denuncia.titulo}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-soft">
                    {denuncia.uf} · {denuncia.ente}
                  </p>
                  <h4 className="mt-1 font-display text-base font-semibold leading-snug">
                    {denuncia.titulo}
                  </h4>
                </div>
                <span className="shrink-0">
                  <EtiquetaFonteDenuncia oficial={denuncia.tipoFonte === "oficial"} />
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-snug text-text-soft">
                {denuncia.resumo}
              </p>
              <p className="mt-1 text-xs leading-snug opacity-70">
                {denuncia.observacao}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <LinkFonte href={denuncia.fonteUrl} className="text-xs">
                  {denuncia.fonteNome}
                </LinkFonte>
              </div>
              <p className="mt-1 text-xs opacity-60">
                {formatarDataFonte(denuncia.fonteData)}
              </p>
            </SpotlightCard>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface-2/60 p-3 text-sm leading-snug">
          <p className="font-semibold">Como denunciar</p>
          <p className="mt-1 text-text-soft">
            Redução de frota, linha parada ou falta de transporte no dia da
            votação deve ser comunicada ao Ministério Público Eleitoral ou à
            Defensoria Pública da União. Partidos, entidades da sociedade civil
            e cidadãos também podem representar ao TRE e ao MP. TRE-SC e TRE-RS
            publicam orientações oficiais sobre esses canais.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <LinkFonte href="https://www.tre-sc.jus.br/comunicacao/noticias/2026/Outubro/entenda-como-funcionara-o-transporte-publico-gratuito-no-dia-das-eleicoes-em-santa-catarina">
              Orientação do TRE-SC
            </LinkFonte>
            <LinkFonte href="https://www.tre-rs.jus.br/comunicacao/noticias/2026/Outubro/transporte-de-eleitores-saiba-o-que-e-permitido-e-o-que-e-proibido">
              Orientação do TRE-RS
            </LinkFonte>
          </p>
        </div>
      </SecaoWiki>

      <SecaoWiki id="metodologia" titulo="7. Metodologia e lacunas">
        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <h3 className="font-display text-base font-semibold">
              O que foi conferido
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-text-soft">
              <li>
                Os 27 TREs foram consultados em página oficial, notícia,
                programa ou ausência declarada de página específica.
              </li>
              <li>
                As políticas estaduais, distritais, metropolitanas e municipais
                foram confirmadas em atos oficiais ou imprensa, com link e data
                de cada fonte.
              </li>
              <li>
                A data de corte é {formatarDataFonte(geradoEm)}. Publicação
                posterior pode mudar rota, horário ou atendimento.
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold">
              O que esta página não é
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-text-soft">
              <li>
                Não é censo de todos os municípios brasileiros. É amostra
                verificada do que foi publicado.
              </li>
              <li>
                Não é garantia de vaga no transporte da JE. O atendimento
                depende de pedido, rota e disponibilidade.
              </li>
              <li>
                Não é orientação jurídica individual. Em caso de dúvida, procure
                o TRE e a prefeitura.
              </li>
            </ul>
          </div>

          <p>
            A lei vale em todo município, mesmo onde não há decreto ou notícia
            localizada. A ausência na tabela é lacuna de informação, não
            autorização para cobrar tarifa.
          </p>
        </div>
      </SecaoWiki>

      <SecaoWiki id="fontes" titulo="8. Fontes">
        <p className="text-sm leading-relaxed">
          Referências principais em ABNT. As fontes estaduais e municipais
          adicionais estão linkadas nos cartões dos TREs e na tabela.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {FONTES.map((fonte) => (
            <li key={fonte.referencia}>
              {fonte.referencia}{" "}
              {fonte.url ? (
                <LinkFonte href={fonte.url} className="text-xs">
                  {fonte.rotulo ?? "Acessar fonte"}
                </LinkFonte>
              ) : null}{" "}
              Acesso em: 21 out. 2026.
            </li>
          ))}
        </ol>
      </SecaoWiki>

      <SecaoWiki id="correcoes" titulo="9. Correções">
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Esta página foi gerada em {formatarDataFonte(geradoEm)}. Se um TRE
            ou uma prefeitura publicar mudança depois dessa data, a informação
            pode estar desatualizada.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-text-soft">
            <li>
              URLs antigas de PB, RN, Rio de Janeiro, DF, GO e PI retornavam
              404 e foram substituídas pelas fontes atuais.
            </li>
            <li>
              A Resolução TSE 23.780/2026 foi confirmada em 15/10/2026 e o link
              oficial foi incluído na seção 2. Ela permite analisar pedidos com
              menos de 20 dias, conforme viabilidade local.
            </li>
            <li>
              A lista é amostra, não censo. Município sem publicação localizada
              pode ter atendimento e continua sujeito à obrigação nacional.
            </li>
            <li>
              Revisão de 21/10 corrigiu o caso do Vale do Javari, o
              enquadramento de candidato/partido e fontes estaduais do Ceará e
              do Rio de Janeiro.
            </li>
          </ul>
          <p>
            Encontrou erro? Use os canais de contato do rodapé e informe a UF, o
            ente e o link da fonte. Não envie CPF nem outro dado pessoal.
          </p>
          <p>
            Veja também{" "}
            <Link href="/sobre" className="font-medium text-primary underline underline-offset-2">
              sobre o portal e seus critérios editoriais
            </Link>
            .
          </p>
        </div>
      </SecaoWiki>

      <LinksRelacionados
        links={[
          {
            href: "/eleicoes/2026/locais-votacao-alterados",
            titulo: "Locais de votação alterados",
            descricao: "Fontes oficiais do TSE e dos TREs para conferir onde votar.",
          },
          {
            href: "/eleicoes/2026/gastos-campanha",
            titulo: "Gastos de campanha 2026",
            descricao: "Receita, despesa, publicidade digital e custo por voto.",
          },
          {
            href: "/assistente",
            titulo: "Perguntar ao Seu Nonô",
            descricao: "Tire dúvidas sobre transporte, eleições e dados do portal.",
          },
          {
            href: "/sobre",
            titulo: "Critérios editoriais e fontes",
            descricao: "Como o portal separa fato, imprensa, lacuna e correção.",
          },
        ]}
      />
    </main>
  );
}
