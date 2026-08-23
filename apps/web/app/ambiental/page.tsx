import type { Metadata } from "next";
import Link from "@/lib/ambiental/link";
import { ZONAS } from "@/lib/zonas";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import FotoBrasilComS from "@/app/components/FotoBrasilComS";
import CenasDoBrasil from "@/app/components/CenasDoBrasil";
import { formatNumberBR } from "@/lib/betim/format";
import { contarReunioesCopam } from "@/lib/db/queries/copam";
import { contarBarragensMg } from "@/lib/db/queries/barragens";
import { contarLicenciamento } from "@/lib/db/queries/ambiental-licenciamento";
import { COBERTURA_DECISOES_LICENCIAMENTO } from "@/lib/ambiental/decisoes-licenciamento";
import { contarLegislacaoAmbiental } from "@/lib/db/queries/legislacao-ambiental";
import { contarDireitoCritico } from "@/lib/db/queries/direito-critico";
import { contarPatrimonioTombado } from "@/lib/db/queries/patrimonio-tombado";
import { lerEstudos } from "@/lib/ambiental/estudos";

/**
 * Home da zona /ambiental.
 *
 * Os números dos blocos NÃO são estimativa nem promessa: saíram do censo
 * das fontes feito na F0 e estão registrados em
 * `docs/ambiental/F0-discovery.md` com a data da medição. Página em
 * construção que inventa número é como gráfico sem cobertura declarada —
 * a regra do projeto vale aqui também.
 *
 * ═══ AS QUATRO FASES SAÍRAM DE "EM BREVE" PARA TELA REAL, 2026-08-11 ═══
 *
 * COPAM, Licenciamento, Barragens e Legislação anunciavam número fixo (o
 * que a FONTE publica) com `href: null` — nenhum coletor tinha rodado de
 * verdade ainda. Com os quatro rodando, cada bloco mostra o total real do
 * banco, com o verbo no passado ("coletadas"), e é link de verdade pra
 * tela própria — não mais promessa de fase.
 */

const ZONA = ZONAS.find((z) => z.id === "ambiental")!;

export const metadata: Metadata = {
  title: "Meio ambiente de Minas Gerais: COPAM, licenciamento e barragens — Controle Popular",
  description:
    "Dados ambientais de Minas Gerais: reuniões do COPAM, licenciamentos, barragens, legislação, patrimônio cultural e estudos de impacto ambiental.",
};

export default async function AmbientalHome() {
  const [{ reunioes, itens }, barragens, { total: totalLicencas }, legislacao, direitoCritico, totalPatrimonio] =
    await Promise.all([
      contarReunioesCopam(),
      contarBarragensMg(),
      contarLicenciamento(),
      contarLegislacaoAmbiental(),
      contarDireitoCritico(),
      contarPatrimonioTombado(),
    ]);
  const temBarragens = barragens.totalFeam > 0 || barragens.totalSnisb > 0;
  const { resumo: resumoEstudos } = lerEstudos();

  const BLOCOS = [
    {
      titulo: "Reuniões do COPAM",
      linha:
        reunioes > 0
          ? `${formatNumberBR(reunioes)} reuniões coletadas, ${formatNumberBR(itens)} itens de pauta`
          : "A fonte publica 454 reuniões — coleta ainda não rodou",
      texto:
        "O Conselho Estadual de Política Ambiental publica as reuniões com antecedência. Aqui já dá para ver a pauta item a item, com o município que cada processo trata, antes da decisão sair.",
      fase: "F3",
      href: "/copam",
      pronta: reunioes > 0,
      linkTexto: "Ver a pauta →",
    },
    {
      titulo: "Licenciamento",
      linha:
        totalLicencas > 0
          ? `${formatNumberBR(totalLicencas)} licenças deferidas coletadas`
          : "A fonte publica 19.713 licenças deferidas — coleta ainda não rodou",
      texto:
        "Filtro por município, setor do empreendimento, modalidade e classe de risco. O setor vem da própria Deliberação Normativa Copam 217/2017, não de uma classificação inventada aqui.",
      fase: "F4",
      href: "/licenciamento",
      pronta: totalLicencas > 0,
      linkTexto: "Ver as licenças →",
    },
    {
      // Vizinho de "Licenciamento" de propósito: é a mesma fila vista pelo
      // outro lado. Aquela mostra quem RECEBEU licença; esta mostra a DECISÃO,
      // e por isso mostra a recusa — que não existe num acervo de licenças
      // concedidas.
      titulo: "Decisões de licenciamento",
      linha: `${formatNumberBR(COBERTURA_DECISOES_LICENCIAMENTO.total)} decisões, das quais ${formatNumberBR(COBERTURA_DECISOES_LICENCIAMENTO.totalNegativas)} negativas (${COBERTURA_DECISOES_LICENCIAMENTO.percentualNegativas}%)`,
      texto:
        "Indeferimento, arquivamento e cancelamento — as decisões que somem quando se olha só o acervo de licenças concedidas. As negativas vêm uma a uma, com município, atividade e classe; as deferidas vêm agregadas. Indeferimento não é irregularidade do empreendedor.",
      fase: "F4",
      href: "/decisoes",
      pronta: true,
      linkTexto: "Ver as decisões →",
    },
    {
      titulo: "Barragens",
      linha: temBarragens
        ? `${formatNumberBR(barragens.totalFeam)} da FEAM + ${formatNumberBR(barragens.totalSnisb)} do SNISB, coletadas`
        : "A fonte publica 249 barragens em Minas — coleta ainda não rodou",
      texto:
        "Condição de estabilidade, nível de emergência, método construtivo e categoria de risco, do inventário da FEAM (mineração e indústria) ao lado do cadastro nacional do SNISB (todos os usos) — as duas fontes lado a lado, nunca somadas.",
      fase: "F5",
      href: "/barragens",
      pronta: temBarragens,
      linkTexto: "Ver as barragens →",
    },
    {
      // Unificação de 13/08/2026: era dois blocos (F6 "Legislação
      // ambiental" e F7 "Legislação e precedentes por tema") apontando
      // para duas páginas que respondiam à mesma pergunta. Agora é uma
      // página só (`/legislacao`, com `/direito-critico` redirecionando
      // pra lá) — o bloco também virou um só, somando as duas contagens.
      titulo: "Legislação e precedentes por tema",
      linha:
        legislacao.total + direitoCritico.normas + direitoCritico.precedentes > 0
          ? `${formatNumberBR(legislacao.total)} normas estaduais + ${formatNumberBR(direitoCritico.normas)} nacionais/internacionais + ${formatNumberBR(direitoCritico.precedentes)} precedentes`
          : "ALMG, Semad, Siam e curadoria nacional/internacional — fontes que hoje não conversam",
      texto:
        "Leis, decretos, deliberações e portarias de Minas Gerais ao lado de tratados e decisões de tribunais nacionais e internacionais, numa busca só — filtrável por esfera (estadual/nacional/internacional) e por tema: mineração, recursos hídricos, serras, indígena, quilombola, comunidades tradicionais e direitos humanos.",
      fase: "F6+F7",
      href: "/legislacao",
      pronta: legislacao.total + direitoCritico.normas + direitoCritico.precedentes > 0,
      linkTexto: "Buscar legislação e precedentes →",
    },
    {
      // Nova em 13/08/2026 (Tarefa 2b da mesma unificação): tombamento
      // restringe território como área protegida ambiental restringe, mas
      // não é norma — acervo próprio, ligado ao de legislação por texto,
      // não pelo mesmo filtro de tema.
      titulo: "Patrimônio cultural tombado",
      linha:
        totalPatrimonio > 0
          ? `${formatNumberBR(totalPatrimonio)} bens tombados pelo IEPHA-MG`
          : "IEPHA-MG — coleta ainda não rodou",
      texto:
        "Imóveis, conjuntos paisagísticos e centros históricos protegidos pelo Estado — o mesmo tipo de restrição territorial que a legislação ambiental impõe, pela via do valor histórico e cultural, não do ecológico.",
      fase: "F8",
      href: "/patrimonio-cultural",
      pronta: totalPatrimonio > 0,
      linkTexto: "Ver o patrimônio tombado →",
    },
    {
      titulo: "Estudos de impacto",
      linha:
        resumoEstudos.linhas > 0
          ? `${formatNumberBR(resumoEstudos.audiencias)} audiências, ${formatNumberBR(resumoEstudos.linhas)} links de estudo coletados`
          : "Audiências públicas de EIA/RIMA — coleta ainda não rodou",
      texto:
        "O Estado não hospeda o EIA/RIMA: publica um link para a nuvem do empreendedor. Aqui está a distribuição por repositório e o porquê disso importar — link de estudo que embasou licença já responde 404.",
      fase: "F9",
      href: "/estudos",
      pronta: resumoEstudos.linhas > 0,
      linkTexto: "Ver os estudos de impacto →",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: ZONA.cor }}
        >
          {ZONA.etiqueta}
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{ZONA.titulo}</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">{ZONA.descricao}</p>

        <p
          className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
          style={{ borderColor: ZONA.cor }}
        >
          <strong>As cinco frentes têm tela real agora.</strong> COPAM (F3), licenciamento
          (F4), barragens (F5), legislação e precedentes por tema (F6+F7, unificados em
          13/08/2026) e patrimônio cultural tombado (F8, novo) — todos com dado coletado,
          abaixo.
        </p>
      </header>

      {/* Foto de abertura da zona — acervo Brasil com S (Lab 678), com
          crédito na legenda. O "fundo de página" pedido pelo dono virou
          cartão emoldurado de propósito: foto como fundo de texto furaria o
          contraste dos temas; em cartão, nenhum número fica por cima dela.
          Sem corte (termos do acervo) — ver `FotoBrasilComS.tsx`. */}
      <FotoBrasilComS
        id="00036"
        className="mt-10 mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      />

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {BLOCOS.map((b) => {
          const conteudo = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-semibold">{b.titulo}</h2>
                <span className="shrink-0 text-[.75em] font-medium text-text-soft">
                  {b.fase}
                </span>
              </div>
              <p className="mt-1 font-medium" style={{ color: ZONA.cor }}>
                {b.linha}
              </p>
              <p className="mt-2 flex-1 text-[.92em] text-text-soft">{b.texto}</p>
              {b.pronta && b.href ? (
                <p className="mt-3 text-[.85em] font-semibold" style={{ color: ZONA.cor }}>
                  {b.linkTexto}
                </p>
              ) : null}
            </>
          );
          return b.pronta && b.href ? (
            <Link
              key={b.titulo}
              href={b.href}
              className="flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-current"
            >
              {conteudo}
            </Link>
          ) : (
            <section
              key={b.titulo}
              className="flex flex-col rounded-lg border border-border bg-surface p-5"
            >
              {conteudo}
            </section>
          );
        })}
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Portal EcoSistemas e IDE-Sisema (Semad), inventário de barragens da FEAM, cadastro
          nacional de barragens SNISB (ANA), dados abertos da ALMG, Siam, banco de legislação
          da Semad, CKAN do MMA e Conama. Cada fonte tem data de verificação e licença
          registradas — nenhuma delas veda uso comercial, e é por isso que estão aqui.
        </p>
      </section>

      {/* ⟲ 13/08, revisão de onboarding: faltava aqui — Cidades, Congresso
          e Judiciário já mostravam a remissão cruzada na própria home,
          e /ambiental publicou sem ganhar a mesma. Mesmo componente que
          as outras três, mesma régua (`outrasZonas` filtra a própria
          zona e só lista `publicada: true`). */}
      <OutrasFrentes atual="ambiental" />

      {/* Faixa decorativa com crédito — ver `CenasDoBrasil.tsx`. */}
      <CenasDoBrasil fotos={["00483", "00500", "00503", "00517"]} />
    </div>
  );
}
