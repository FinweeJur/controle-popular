import type { Metadata } from "next";
import NextLink from "next/link";

/**
 * `/riodoce/processos` — processos-chave da reparação do Rio Doce.
 *
 * ═══ O QUE ESTA PÁGINA FAZ E O QUE ELA NÃO FAZ ═══
 *
 * A plataforma Brumadinho UFMG (modelo deste caso) espelha metadado dos
 * autos do PJe. NÓS NÃO ESPELHAMOS NADA: o Termo de Uso da API Pública do
 * DataJud (CNJ), cláusulas 3.8/3.9, veda republicar derivado do acervo —
 * regra já gravada no cabeçalho de `lib/judiciario/datajud.ts` e na rota
 * `app/api/datajud/route.din.ts`. O papel deste portal é consultar AO VIVO,
 * catalogar as fontes oficiais e linkar.
 *
 * ═══ ESTADO DESTA PÁGINA (esqueleto da Fase 1) ═══
 *
 * A Fase 0 do plano (`docs/planos/PLANO-PLATAFORMA-RIO-DOCE.md`, medido
 * em 12/10/2026) ainda NÃO levantou os números CNJ dos processos-chave
 * (TTAC de 02/03/2016, Novo Acordo homologado em 06/11/2024, ACPs). Este
 * arquivo é o andaime: explica como a consulta funciona e declara a
 * lacuna. NENHUM número de processo é inventado — processo que não foi
 * checado no DataJud não entra na tela (§7: lacuna é informação).
 *
 * A medição de 12/10 mostrou ainda um cuidado que a Fase 1b tem de
 * respeitar: filtrar o DataJud por `orgaoJulgador.codigoMunicipioIBGE`
 * (3144805 = Mariana) devolveu a "3ª Câmara Cível" como primeiro hit —
 * código de município NÃO equivale a vara do caso.
 */
export const metadata: Metadata = {
  title: "Processos do caso Rio Doce — consulta ao vivo no DataJud | Controle Popular",
  description:
    "Os processos-chave da reparação do Rio Doce, com a movimentação consultada ao vivo na API pública do DataJud (CNJ). O portal não arquiva nem republica autos.",
};

export default function RioDoceProcessos() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8">
      <nav className="mb-4 text-[.82em] text-text-soft" aria-label="Trilha">
        <NextLink href="/riodoce" className="hover:text-primary">
          Plataforma Rio Doce
        </NextLink>{" "}
        · <span className="text-text">Processos</span>
      </nav>

      <h1 className="font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight">
        Processos do caso Rio Doce
      </h1>
      <p className="mt-2 max-w-3xl text-[1.02em] text-text-soft">
        Os processos judiciais da reparação — o TTAC de 2016, o Novo Acordo
        homologado pelo STF em 06/11/2024 e as Ações Civis Públicas — com a
        movimentação consultada <strong>ao vivo</strong> na API pública do
        DataJud (CNJ). Este portal <strong>não arquiva nem republica</strong>{" "}
        os autos: cada consulta vai ao CNJ na hora, porque o Termo de Uso da
        API veda distribuir derivado do acervo (cláusulas 3.8 e 3.9).
      </p>

      {/* ═══ LACUNA DECLARADA ═══
          A Fase 0 do plano ainda não levantou os números CNJ destes
          processos. Em vez de publicar lista vazia como se não houvesse
          nada, dizemos o que falta e por quê — lacuna é informação
          (regra editorial, §7). */}
      <section
        aria-labelledby="lacuna"
        className="mt-8 rounded-lg border border-dashed border-border bg-surface/50 p-5"
      >
        <h2 id="lacuna" className="font-display text-lg font-semibold">
          Lista de processos-chave — em levantamento
        </h2>
        <p className="mt-2 max-w-3xl text-[.95em] text-text-soft">
          Os números de processo (CNJ de 20 dígitos) do caso ainda estão sendo
          checados um a um na API pública, porque número que não foi confirmado
          no DataJud não pode virar link na tela. Enquanto isso, a consulta ao
          vivo já funciona: basta o número, e o portal pergunta ao CNJ na hora.
          A primeira medição (12/10/2026) levou 38,7 segundos para uma consulta
          por município de Mariana — a espera é do CNJ, não deste site.
        </p>
      </section>

      <section aria-labelledby="como-consultar" className="mt-10">
        <h2 id="como-consultar" className="font-display text-xl font-semibold">
          Como a consulta funciona
        </h2>
        <ol className="mt-3 max-w-3xl list-decimal space-y-2 pl-5 text-[.95em] text-text-soft">
          <li>
            A página pede ao servidor do portal (rota{" "}
            <code>/api/datajud</code>) o número do processo ou um filtro com
            critério — classe, órgão julgador ou município.
          </li>
          <li>
            O servidor consulta a API Pública do DataJud do CNJ em nome do
            portal, com a chave pública do CNJ.
          </li>
          <li>
            O resultado volta para a tela <strong>sem ser gravado</strong> em
            arquivo, tabela ou cache em disco — nem o servidor guarda cópia.
          </li>
          <li>
            A tela mostra número, classe, órgão e a data da última
            movimentação que o CNJ devolveu, com o aviso de que a fonte é o
            DataJud e não este portal.
          </li>
        </ol>
        <p className="mt-4 max-w-3xl text-[.95em] text-text-soft">
          O CNJ exige sempre um critério de busca (nunca varredura geral) e a
          API devolve no máximo 20 resultados por página. É consulta pontual,
          não exportação em massa — e é assim de propósito.
        </p>
      </section>

      <section aria-labelledby="fontes" className="mt-10 border-t border-border pt-8">
        <h2 id="fontes" className="font-display text-xl font-semibold">
          Fontes oficiais
        </h2>
        <ul className="mt-3 max-w-3xl list-disc space-y-2 pl-5 text-[.95em] text-text-soft">
          <li>
            <a
              href="https://datajud-wiki.cnj.jus.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-accent hover:underline"
            >
              API Pública do DataJud — documentação e Termo de Uso (CNJ) ↗
            </a>
          </li>
          <li>
            <NextLink href="/ambiental/mariana" className="font-medium text-primary hover:underline">
              Execução do Acordo em MG (CKAN do Governo de Minas)
            </NextLink>{" "}
            — o lado orçamentário da reparação, com empenho por empenho.
          </li>
          <li>
            <NextLink href="/riodoce" className="font-medium text-primary hover:underline">
              Plataforma Rio Doce
            </NextLink>{" "}
            — o hub do caso, com as demais frentes.
          </li>
        </ul>
      </section>
    </div>
  );
}
