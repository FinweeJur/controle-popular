import type { Metadata } from "next";
import Link from "@/lib/judiciario/link";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import FotoBrasilComS from "@/app/components/FotoBrasilComS";
import CenasDoBrasil from "@/app/components/CenasDoBrasil";
import { listarTribunais, proximasVacancias, listarNomeacoes } from "@/lib/judiciario/tribunais";
import { rotuloResultado } from "@/lib/judiciario/rotulos";
import FonteRodape, { FONTE_SENADO, FONTE_REGUA } from "@/app/judiciario/components/FonteRodape";

export const metadata: Metadata = {
  title: "Judiciário brasileiro: ministros, indicações e próximas vagas — Controle Popular",
  description:
    "Acompanhe quem ocupa cada tribunal, quem indicou cada ministro, quando vaga cada cadeira e como o Judiciário é fiscalizado.",
};

const fmtData = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "—";

const fmtAno = (d: string | null) => {
  if (!d) return null;
  const anos = new Date(d).getFullYear() - new Date().getFullYear();
  if (anos <= 0) return "este ano";
  if (anos === 1) return "em 1 ano";
  return `em ${anos} anos`;
};

export default async function Home() {
  const [tribunais, proximas, nomeacoes] = await Promise.all([
    listarTribunais(),
    proximasVacancias(3),
    listarNomeacoes(),
  ]);
  const totalCadeiras = tribunais.reduce((s, t) => s + (t.n_cadeiras ?? 0), 0);
  const ultimaIndicacao = (nomeacoes ?? [])[0];
  // Gerado da mesma lista que preenche `tribunais.length` acima — nunca
  // hardcoded ao lado de uma contagem dinâmica, senão os dois divergem
  // silenciosamente assim que um tribunal novo entrar no banco.
  const siglas = tribunais.map((t) => t.sigla ?? t.id);
  const listaSiglas =
    siglas.length <= 1
      ? siglas.join("")
      : `${siglas.slice(0, -1).join(", ")} e ${siglas[siglas.length - 1]}`;

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Quem ocupa, quem indicou, quando vaga
        </h1>
        <p className="max-w-2xl text-lg opacity-80">
          O Judiciário é o único Poder da República cujos membros não passam por eleição em
          nenhum grau. Este site acompanha, cadeira por cadeira, quem ocupa cada tribunal,
          quem indicou cada ministro e quando cada um deles vai completar 75 anos — a idade
          em que a lei obriga todo magistrado a se aposentar.
        </p>
        <p className="max-w-2xl text-sm opacity-70">
          Nenhum número desta página é opinião ou estimativa: todos vêm direto de fontes
          oficiais — o Senado Federal e os próprios tribunais —, creditadas no rodapé de cada
          página que os exibe. O documento de origem aparece na linha de cada indicação
          quando o Senado o publica.
        </p>
      </section>

      {/* Foto de abertura da zona — acervo Brasil com S, com crédito na
          legenda. Cartão emoldurado e não "fundo" de propósito: foto como
          fundo de texto furaria o contraste; sem corte (termos do acervo). */}
      <FotoBrasilComS
        id="00033"
        className="mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="font-tabular text-3xl font-semibold">{tribunais.length}</p>
          <p className="mt-1 font-medium">Tribunais acompanhados</p>
          <p className="mt-1 text-sm opacity-70">
            {totalCadeiras} cadeiras ao todo — {listaSiglas}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="font-tabular text-3xl font-semibold">
            {proximas[0] ? fmtData(proximas[0].vacancia_projetada) : "—"}
          </p>
          <p className="mt-1 font-medium">Próxima aposentadoria prevista</p>
          <p className="mt-1 text-sm opacity-70">
            {proximas[0]
              ? `${proximas[0].magistrado_nome} (${proximas[0].tribunal_id?.toUpperCase()}), ${fmtAno(proximas[0].vacancia_projetada)}`
              : "ainda não calculada para este tribunal"}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--cp-border)] p-4">
          <p className="font-tabular text-3xl font-semibold">
            {ultimaIndicacao?.senado_identificacao ?? "—"}
          </p>
          <p className="mt-1 font-medium">Indicação mais recente</p>
          <p className="mt-1 text-sm opacity-70">
            {ultimaIndicacao
              ? `${ultimaIndicacao.tribunal_id?.toUpperCase()} — ${rotuloResultado(ultimaIndicacao.resultado)}`
              : "nenhuma registrada ainda"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/tribunais"
          className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
        >
          <h2 className="font-display text-lg font-semibold">Ver os tribunais</h2>
          <p className="mt-1 text-sm opacity-70">
            Quem ocupa cada cadeira hoje, e quem indicou.
          </p>
        </Link>
        <Link
          href="/vagas"
          className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
        >
          <h2 className="font-display text-lg font-semibold">Próximas vagas</h2>
          <p className="mt-1 text-sm opacity-70">
            Quando cada ministro atinge a idade de aposentadoria obrigatória.
          </p>
        </Link>
        <Link
          href="/indicacoes"
          className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
        >
          <h2 className="font-display text-lg font-semibold">Indicações ao Senado</h2>
          <p className="mt-1 text-sm opacity-70">
            Todo nome enviado pelo Presidente, aprovado ou rejeitado.
          </p>
        </Link>
      </section>

      {/* ═══ A OUTRA METADE DO EIXO ═══
          As três telas acima respondem QUEM OCUPA A CADEIRA. Estas quatro
          respondem SE A INSTITUIÇÃO ESTÁ FUNCIONANDO — que é a pergunta de
          quem tem processo parado, parente preso ou nenhum defensor na
          comarca. Ficam num bloco próprio porque são de outra natureza:
          composição contra fiscalização. */}
      <section aria-labelledby="fiscalizacao" className="mt-2">
        <h2 id="fiscalizacao" className="font-display text-lg font-semibold">
          E se a instituição está funcionando
        </h2>
        <p className="mt-1 text-sm opacity-70">
          Saber quem ocupa a cadeira é metade. A outra é o que acontece — ou não acontece — no
          dia a dia do tribunal, da Defensoria e da prisão.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            {
              href: "/instituicoes",
              titulo: "Quem fiscaliza a Justiça",
              texto:
                "Em que ponto do caminho do seu processo alguém de fora ainda olha — e onde a fiscalização externa acaba.",
            },
            {
              href: "/inspecoes",
              titulo: "O que o CNJ encontrou no TJMG",
              texto:
                "13 relatórios de inspeção, de 2012 a 2026, unidade por unidade — inclusive os gabinetes, com nome.",
            },
            {
              href: "/defensoria",
              titulo: "Tem Defensoria na sua comarca?",
              texto:
                "Das 298 comarcas de Minas, 176 não têm defensor público nenhum. Busque a sua.",
            },
            {
              href: "/presidios",
              titulo: "Quem fiscaliza a prisão",
              texto:
                "285 estabelecimentos penais e 2.252 inspeções judiciais desde 2025 — e onde a fiscalização não chega.",
            },
            {
              href: "/numeros",
              titulo: "Quanto demora um processo",
              texto:
                "De cada 10 processos que o TJMG tinha para resolver em 2025, 7 continuaram parados.",
            },
            {
              href: "/correicoes-trabalhistas",
              titulo: "A Justiça do Trabalho em Minas",
              texto:
                "18 atas de correição no TRT-3, de 1991 a 2024 — e quem as faz não é o CNJ.",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-lg border border-[var(--cp-border)] p-5 hover:border-[var(--cp-primary)]"
            >
              <h3 className="font-display text-lg font-semibold">{c.titulo}</h3>
              <p className="mt-1 text-sm opacity-70">{c.texto}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[var(--cp-border)] p-5 text-sm">
        <p className="opacity-80">
          Quer entender como cada número é calculado — sem chute, sem opinião escondida?
        </p>
        <p className="mt-2">
          <Link href="/metodologia" className="underline">
            Veja a metodologia completa
          </Link>
        </p>
      </section>

      <FonteRodape
        fontes={[FONTE_REGUA, FONTE_SENADO]}
        nota="A composição de cada tribunal é copiada da página oficial do próprio tribunal, creditada com o link na página dele."
      />

      <OutrasFrentes atual="judiciario" />

      {/* Faixa decorativa com crédito — ver `CenasDoBrasil.tsx`. */}
      <CenasDoBrasil fotos={["00414", "00416", "00417"]} />
    </div>
  );
}
