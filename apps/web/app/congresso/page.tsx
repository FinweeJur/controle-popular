import type { Metadata } from "next";
import Link from "@/lib/congresso/link";
import OutrasFrentes from "@/app/components/OutrasFrentes";
import FotoBrasilComS from "@/app/components/FotoBrasilComS";
import CenasDoBrasil from "@/app/components/CenasDoBrasil";
import { totaisHome } from "@/lib/db/queries/congresso";

/**
 * Home. Renderiza normalmente mesmo sem Supabase configurado — é o que
 * permite este repo existir e buildar antes do banco existir, e é a mesma
 * regra que vale em produção: fonte de dados ausente vira estado vazio
 * honesto, nunca erro.
 */
export const metadata: Metadata = {
  title: "O que o Congresso Nacional está decidindo — Controle Popular",
  description:
    "Monitoramento de projetos de lei federais: proposições, votações, bancadas e análise de direitos. Acompanhe o Congresso Nacional com dados oficiais.",
};

export default async function Home() {
  const { proposicoes: totalProposicoes, analises: totalAnalises } = await totaisHome();

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 py-12">
      <section className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que o Congresso está decidindo sobre os seus direitos
        </h1>
        <p className="max-w-2xl text-lg opacity-80">
          Monitoramento de projetos de lei federais por tema, palavra-chave, bancada e
          comissão. Cada proposição recebe uma ficha técnica do que ela muda na letra da
          lei e uma análise de quais direitos ela amplia ou restringe — sempre com o
          dispositivo legal que fundamenta a leitura.
        </p>
        {/* ⟲ 02/09, copy v7.1 (docs/planos/PLANO-COPY-VOZ.md): as
            epígrafes da frente entram no hub — a escrevivência de
            Conceição Evaristo e a lição do Riobaldo de Guimarães Rosa —
            e a memória dos Malês (Salvador, 1835) vira o princípio da
            frente: a liberdade se organiza. Nenhum número mexido. */}
        <blockquote
          className="max-w-2xl space-y-3 border-l-2 pl-4 text-sm opacity-80"
          style={{ borderColor: "var(--cp-accent)" }}
        >
          <p>
            “A nossa escrevivência não pode ser lida como história de ninar os da
            casa-grande, mas sim para incomodá-los em seus sonhos injustos.”
            <br />
            <cite className="not-italic opacity-70">
              — Conceição Evaristo · Becos da Memória · 2006
            </cite>
          </p>
          <p>
            “Uma coisa é pôr ideias arranjadas, outra é lidar com país de pessoas, de
            carne e sangue, de mil-e-tantas misérias.”
            <br />
            <cite className="not-italic opacity-70">
              — João Guimarães Rosa · Grande Sertão: Veredas · 1956
            </cite>
          </p>
        </blockquote>
        <p className="max-w-2xl text-sm opacity-70">
          Na madrugada de 25 de janeiro de 1835, os Malês mostraram a Salvador — e ao
          país inteiro — do que é capaz um povo organizado. A lição ficou: ninguém
          conquista direito sozinho. Organização continua sendo o caminho — só que
          agora cabe no bolso.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/proposicoes"
            className="rounded-md bg-[var(--cp-primary)] px-4 py-2 font-medium text-[var(--cp-primary-ink)]"
          >
            Ver proposições
          </Link>
          <Link
            href="/metodologia"
            className="rounded-md border border-[var(--cp-border)] px-4 py-2 font-medium"
          >
            Como classificamos
          </Link>
        </div>
      </section>

      {/* Foto de abertura da zona — acervo Brasil com S, com crédito na
          legenda. Cartão emoldurado e não "fundo" de propósito: foto como
          fundo de texto furaria o contraste; sem corte (termos do acervo). */}
      <FotoBrasilComS
        id="00031"
        className="mx-auto max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      />

      {totalProposicoes === null ? (
        <section className="rounded-lg border border-[var(--cp-border)] p-6">
          <h2 className="font-display text-xl font-semibold">Fonte de dados não configurada</h2>
          <p className="mt-2 opacity-80">
            O banco ainda não está acessível — falta a variável{" "}
            <code>DATABASE_URL</code>. Veja <code>README.md</code> na raiz do repositório.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--cp-border)] p-6">
            <p className="font-tabular text-3xl font-semibold">
              {totalProposicoes?.toLocaleString("pt-BR") ?? "—"}
            </p>
            <p className="opacity-70">proposições acompanhadas</p>
          </div>
          <div className="rounded-lg border border-[var(--cp-border)] p-6">
            <p className="font-tabular text-3xl font-semibold">
              {totalAnalises?.toLocaleString("pt-BR") ?? "—"}
            </p>
            <p className="opacity-70">com análise de direitos concluída</p>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-2xl font-semibold">Régua declarada</h2>
        <p className="max-w-2xl opacity-80">
          Este portal assume abertamente uma régua pró-direitos: classificamos uma
          proposição como <strong>garantista</strong> quando ela amplia direitos
          fundamentais e como <strong>reducionista</strong> quando os restringe. O que
          torna isso verificável em vez de opinião solta é o método — o rótulo não é
          gerado por inteligência artificial, e sim calculado a partir de itens que citam,
          cada um, o artigo da Constituição ou da lei que fundamenta a leitura, com o
          trecho do projeto que a embasa. Você pode conferir item por item.
        </p>
        <Link href="/metodologia" className="inline-block underline">
          Ler a metodologia completa
        </Link>
      </section>

      <OutrasFrentes atual="congresso" />

      {/* Faixa decorativa com crédito — ver `CenasDoBrasil.tsx`. */}
      <CenasDoBrasil fotos={["00089", "00433", "00308", "00304", "00296"]} />
    </div>
  );
}
