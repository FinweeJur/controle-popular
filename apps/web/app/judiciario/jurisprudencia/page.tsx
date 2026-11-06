import type { Metadata } from "next";
import NextLink from "next/link";
import { formatNumberBR } from "@/lib/betim/format";
import FonteRodape from "@/app/judiciario/components/FonteRodape";
import FooterGlobal from "@/app/components/FooterGlobal";
import resumo from "@/data/jurisprudencia-buscador-resumo.json";

/**
 * `/judiciario/jurisprudencia` — o buscador de decisões sobre barragens,
 * mineração e direitos humanos.
 *
 * O acervo vem dos repositórios de coleta do dono: acórdãos do TJMG
 * (Brumadinho, Rio Doce, direitos humanos, atingidos) e do TJES (Fundão e
 * Rio Doce), com ementa de todas as decisões e inteiro teor onde a captura
 * o trouxe. Os números da tela vêm de `data/jurisprudencia-resumo.json`,
 * gerado do MESMO dado que o buscador carrega — nunca escritos à mão.
 *
 * O buscador em si é estático (`public/jurisprudencia/index.html`): é a
 * ferramenta já validada no repositório de origem, que carrega uma base por
 * vez sob demanda. Embarcá-la em React só criaria uma segunda cópia da mesma
 * lógica de busca para divergir da primeira.
 */

export const metadata: Metadata = {
  title: "Jurisprudência de barragens e direitos humanos — TJMG e TJES | Controle Popular",
  description:
    "Busque decisões do TJMG e do TJES sobre Brumadinho, Rio Doce, Fundão, mineração e direitos humanos: ementa, inteiro teor, polo e categoria.",
};

const CATEGORIAS = [
  { chave: "A" as const, rotulo: "A — barragens e mineração" },
  { chave: "B" as const, rotulo: "B — direitos humanos" },
  { chave: "C" as const, rotulo: "C — ambiental" },
];

export default function JurisprudenciaPage() {
  return (
    <div className="w-full">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs opacity-70">
          <NextLink href="/" className="hover:underline">Início</NextLink>
          <span>/</span>
          <NextLink href="/judiciario" className="hover:underline">Judiciário</NextLink>
          <span>/</span>
          <span className="font-semibold">Jurisprudência</span>
        </nav>

        <header className="space-y-3">
          <h1 className="font-display text-3xl font-bold">Jurisprudência de barragens e direitos humanos</h1>
          <p className="text-base opacity-80">
            São <strong>{formatNumberBR(resumo.total)} decisões</strong> do TJMG e do TJES
            sobre rompimento de barragens, mineração e direitos dos atingidos, de{" "}
            {resumo.periodo.de} a {resumo.periodo.ate}. Todas têm ementa;{" "}
            {formatNumberBR(resumo.comInteiroTeor)} têm inteiro teor capturado.
          </p>
          <p className="text-sm opacity-70">
            Busque por palavras (todas precisam aparecer), escolha entre ementa, inteiro teor
            ou ambos, e filtre por base, categoria e polo vencedor. Cada decisão guarda o
            número do processo, com botão de copiar, e o link para conferir no tribunal.
          </p>
        </header>

        <section aria-label="Acervo em números" className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="font-tabular text-2xl font-semibold">{formatNumberBR(resumo.porTribunal.TJMG)}</p>
            <p className="mt-1 text-sm opacity-80">TJMG</p>
          </div>
          <div className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="font-tabular text-2xl font-semibold">{formatNumberBR(resumo.porTribunal.TJES)}</p>
            <p className="mt-1 text-sm opacity-80">TJES</p>
          </div>
          <div className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="font-tabular text-2xl font-semibold">{formatNumberBR(resumo.comInteiroTeor)}</p>
            <p className="mt-1 text-sm opacity-80">com inteiro teor</p>
          </div>
          <div className="rounded-lg border border-[var(--cp-border)] p-4">
            <p className="font-tabular text-2xl font-semibold">{resumo.fontes.length}</p>
            <p className="mt-1 text-sm opacity-80">bases temáticas</p>
          </div>
        </section>

        <section aria-label="Categorias" className="mt-4 flex flex-wrap gap-2 text-sm">
          {CATEGORIAS.map((c) => (
            <span key={c.chave} className="rounded-full border border-[var(--cp-border)] px-3 py-1">
              {c.rotulo}: <strong>{formatNumberBR(resumo.categorias[c.chave])}</strong>
            </span>
          ))}
        </section>

        <section aria-label="Buscador de jurisprudência" className="mt-10">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">Buscar nas decisões</h2>
            <a
              href="/jurisprudencia/index.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
            >
              Abrir em tela cheia ↗
            </a>
          </div>
          <iframe
            src="/jurisprudencia/index.html"
            title="Buscador de jurisprudência do TJMG e do TJES"
            loading="lazy"
            className="h-[80vh] min-h-[600px] w-full rounded-lg border border-[var(--cp-border)]"
          />
          <p className="mt-2 text-xs opacity-70">
            A base escolhida é carregada na hora; a primeira busca em uma base grande pode
            levar alguns segundos.
          </p>
        </section>

        <div className="mt-10">
          <FonteRodape
            fontes={[
              { nome: "TJMG — jurisprudência", url: "https://www5.tjmg.jus.br/jurisprudencia/" },
              { nome: "TJES — jurisprudência", url: "https://sistemas.tjes.jus.br/consulta-jurisprudencia/" },
            ]}
            nota="Decisões coletadas dos portais oficiais dos tribunais; os números da página são contados do próprio acervo."
          />
        </div>
      </div>
      <FooterGlobal />
    </div>
  );
}
