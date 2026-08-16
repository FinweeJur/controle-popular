import type { Metadata } from "next";
// `next/link` DIRETO, e não o `<Link>` de zona: esta página mora na RAIZ do
// domínio, então todo caminho daqui já é absoluto — mesmo motivo escrito em
// `app/termos/page.tsx`. Passar pelo wrapper de zona geraria `/betim/dados/...`.
import Link from "next/link";

import { formatNumberBR } from "@/lib/betim/format";
import { RESSALVA_COMUNICABR } from "@/lib/comunicabr/indicadores";
import {
  coberturaComunicaBR,
  lacunasDaUF,
  metaComunicaBR,
  resumoDosMunicipios,
  tituloDaCategoria,
} from "@/lib/comunicabr/mg";
import BuscaCidade from "./BuscaCidade";
import { metadataEditavel } from "@/lib/edicoes";

/**
 * `/dados/comunicabr` — o que o governo federal DIZ ter feito em cada uma das
 * 853 cidades de Minas, com a lacuna medida ao lado.
 *
 * ═══ POR QUE PÁGINA PRÓPRIA, E NÃO UMA ABA NO EIXO CIDADES ═══
 *
 * O eixo Cidades (`app/[municipio]/`) seria o lugar natural, e três coisas
 * medidas empurraram para cá:
 *
 * 1. **Cobertura.** O acervo tem as 853 cidades de Minas; o eixo Cidades tem
 *    página para as que estão em `municipios` no Postgres (Betim, BH, SP,
 *    Contagem, Diamantina, Araçuaí…). Publicar só ali entregaria ~1% do que
 *    foi coletado, e São Paulo — que tem página — nem é de MG.
 * 2. **Chave.** Esta API usa código IBGE de **6 dígitos** (Betim é 310670), e
 *    o portal inteiro usa o de 7 (3106200). Um não sai do outro por
 *    truncamento, e casar por NOME é a armadilha que já pôs dado na cidade
 *    errada neste projeto. O casamento com o eixo Cidades precisa de uma
 *    coluna no banco — e a Neon está em 402.
 * 3. **Banco.** Toda página de `[municipio]` começa por `cidadeDaRota()`, que
 *    consulta o Postgres. Esta seção não precisa de banco nenhum: lê um
 *    arquivo versionado. Amarrá-la ao eixo Cidades a deixaria bloqueada pela
 *    mesma cota que já bloqueia o resto.
 *
 * Fica na RAIZ, ao lado de `/dados/populares`, pelo mesmo motivo de `/busca` e
 * `/sobre`: o assunto é o portal inteiro (um estado, não uma cidade). Quando a
 * chave de 6 dígitos entrar no banco, a ficha de cada cidade ganha um link
 * para cá — que é uma linha, não uma reescrita.
 *
 * ═══ O QUE ESTA TELA TEM DE DIZER, E É A RAZÃO DELA EXISTIR ═══
 *
 * **61% dos itens vieram vazios** (106.446 de 174.012). O número não é o "39%"
 * que `docs/COMUNICABR-COLETA-MG.md` escreve: 39% é a fatia COM valor
 * (67.566/174.012), e o docs trocou uma pela outra. A tela calcula a razão em
 * vez de imprimir a frase do documento, e foi o cálculo que apontou a troca.
 *
 * Uma tela que publicasse só os 67.566 com valor
 * mostraria um acervo completo e mentiria por omissão: quem olhasse "educação"
 * numa cidade não saberia se o programa não existe ali ou se o dado não foi
 * publicado. Por isso o número da lacuna vem ANTES da lista de cidades, e a
 * tabela de categorias diz em quantas cidades cada tema veio zerado — que é o
 * que separa lacuna do governo federal de lacuna daquela cidade.
 *
 * TODO NÚMERO DAQUI SAI DE `medirCoberturaUF()`. Nenhum é digitado: o dia em
 * que a coleta for refeita, a tela conta o acervo novo sozinha.
 */
export const metadata: Metadata = metadataEditavel("/dados/comunicabr", {
  title: "ComunicaBR nas 853 cidades de Minas — Controle Popular",
  description:
    "O que o governo federal publica sobre a própria atuação em cada município de Minas Gerais, com a lacuna medida: quantos indicadores vieram sem valor, em quais temas, e em quantas cidades. Cada número cita o ministério que o declarou.",
});

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="font-tabular text-[1.8em] leading-none font-bold text-text">
        {formatNumberBR(valor)}
      </p>
      <p className="mt-1.5 text-[.85em] text-text-soft">{rotulo}</p>
    </div>
  );
}

export default async function ComunicaBRIndex() {
  const [cobertura, meta, cidades] = await Promise.all([
    coberturaComunicaBR(),
    metaComunicaBR(),
    resumoDosMunicipios(),
  ]);

  if (!cobertura || !meta || cidades.length === 0) {
    return (
      <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="font-display text-3xl font-bold">ComunicaBR</h1>
        <p className="mt-3 text-text-soft">
          A coleta do ComunicaBR ainda não está neste build. O acervo é um arquivo versionado
          (<code>apps/web/public/data/comunicabr-31.json</code>); sem ele esta página não inventa número.
        </p>
      </main>
    );
  }

  const pctVazio = Math.round((cobertura.itensVazios / cobertura.itens) * 100);
  const lacunas = await lacunasDaUF();
  const semItem = lacunas.filter((l) => l.especie === "sem-item");
  const naUFInteira = lacunas.filter((l) => l.especie === "fonte-em-toda-uf");
  const comValor = lacunas.filter((l) => l.itens > 0);
  const geradoEm = new Date(meta.geradoEm).toLocaleDateString("pt-BR");

  return (
    // Sem `layout.tsx` próprio (esta rota está fora das zonas) — o `<main>`
    // explícito é o que o botão global "Ouvir esta página" procura, mesma nota
    // de `app/dados/populares/page.tsx`.
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <nav className="mb-4 text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
        · <span className="text-text">ComunicaBR em Minas Gerais</span>
      </nav>

      <header className="space-y-4">
        <p className="text-[.82em] font-semibold tracking-wide text-text-soft uppercase">
          Governo federal · Minas Gerais · {formatNumberBR(cobertura.municipiosComResposta)} cidades
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          O que o governo federal diz ter feito na sua cidade
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          O ComunicaBR, da Presidência da República, publica indicadores de programas federais
          município a município. Este portal coletou os de Minas Gerais inteira e mostra os dois
          lados do que veio: o que tem valor <strong className="text-text">e o que veio vazio</strong>,
          porque só o primeiro faria o acervo parecer completo.
        </p>
      </header>

      {/* A ressalva de conteúdo vem ANTES dos números, não em nota de rodapé.
          Ela está em `RESSALVA_COMUNICABR`, junto do parser, e não copiada à
          mão: texto que mora longe do dado é texto que a próxima tela esquece
          de copiar (a nota está no fim de `lib/comunicabr/indicadores.ts`). */}
      <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface-2 px-4 py-3 text-[.9em] text-text-soft">
        <strong className="text-text">Leia como comunicação de governo, não como conta paga.</strong>{" "}
        {RESSALVA_COMUNICABR}
      </p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold">O acervo, e o buraco dentro dele</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Numero valor={cobertura.municipiosComResposta} rotulo="cidades de Minas com resposta" />
          <Numero valor={cobertura.itens} rotulo="indicadores coletados" />
          <Numero valor={cobertura.itensComValor} rotulo="com valor publicado" />
          <Numero valor={cobertura.itensVazios} rotulo={`vieram vazios (${pctVazio}%)`} />
        </div>

        {/* O aviso vem antes de qualquer número por município, e não depois:
            depois dele o leitor já concluiu. Mesma regra que
            `[municipio]/clima/RiscoClimatico.tsx` aplica ao índice que zera. */}
        <div className="mt-4 rounded-2xl border border-alert/40 bg-surface p-4">
          <p className="font-semibold text-alert">Vazio não é zero. Em lugar nenhum deste portal.</p>
          <p className="mt-1.5 text-[.92em] text-text-soft">
            Onde a fonte não publicou valor, esta seção mostra <strong className="text-text">—</strong>,
            nunca &quot;R$ 0,00&quot;. Não é preciosismo: a API preenche o campo numérico com{" "}
            <code>0</code> justamente nos registros em que ela própria se recusa a exibir número, e
            em 660 itens conferidos ao vivo em cinco municípios{" "}
            <strong className="text-text">nenhum item exibiu um zero</strong>. Republicar aquele zero
            seria o portal afirmando que a cidade não recebeu nada onde o governo disse &quot;não se
            aplica&quot;.
          </p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">
          Duas espécies de vazio — e a diferença muda de quem é a falta
        </h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Um indicador sem valor pode ser <strong className="text-text">lacuna da fonte</strong> (o
          ComunicaBR publica a estrutura do tema e não publica valor para município nenhum) ou{" "}
          <strong className="text-text">ausência naquela cidade</strong>. Confundir as duas acusa a
          prefeitura de algo que é do governo federal. A coluna da direita é o que separa uma da
          outra, contada nas {formatNumberBR(cobertura.municipiosComResposta)} cidades — não por
          amostra.
        </p>

        {/* Tabela em contêiner com rolagem própria: tabela larga que empurra o
            corpo da página produz rolagem horizontal no celular. */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-[.92em]">
            <thead>
              <tr className="border-b border-border text-left text-text-soft">
                <th className="py-2 pr-3 font-medium">Tema</th>
                <th className="py-2 pr-3 text-right font-medium">Indicadores em MG</th>
                <th className="py-2 pr-3 text-right font-medium">Vazios</th>
                <th className="py-2 text-right font-medium">Cidades sem nenhum valor</th>
              </tr>
            </thead>
            <tbody>
              {comValor.map((l) => (
                <tr key={l.categoria} className="border-b border-border/60">
                  <td className="py-2 pr-3 text-text">{tituloDaCategoria(l.categoria)}</td>
                  <td className="py-2 pr-3 text-right font-tabular text-text-soft">
                    {formatNumberBR(l.itens)}
                  </td>
                  <td className="py-2 pr-3 text-right font-tabular text-text-soft">
                    {formatNumberBR(l.itensVazios)}
                  </td>
                  <td className="py-2 text-right font-tabular">
                    {l.cidadesZeradas === 0 ? (
                      <span className="text-text-soft">nenhuma</span>
                    ) : (
                      // Cor NUNCA sozinha — a palavra vai junto, para quem não
                      // distingue o vermelho (mesma nota de
                      // `judiciario/indicacoes/page.tsx`).
                      <span
                        className={
                          l.especie === "poucas-cidades" ? "text-text-soft" : "font-medium text-alert"
                        }
                      >
                        {formatNumberBR(l.cidadesZeradas)} de {formatNumberBR(l.cidades)}
                        {l.especie === "fonte-em-toda-uf" ? " · todas" : null}
                        {l.especie === "fonte-na-maioria" ? " · a maioria" : null}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {naUFInteira.length > 0 ? (
          <p className="mt-4 rounded-2xl border border-alert/40 bg-surface p-4 text-[.92em] text-text-soft">
            <strong className="text-alert">
              {naUFInteira.map((l) => tituloDaCategoria(l.categoria)).join(", ")}
            </strong>{" "}
            {naUFInteira.length === 1 ? "vem zerado" : "vêm zerados"} nas{" "}
            {formatNumberBR(cobertura.municipiosComResposta)} cidades de Minas.{" "}
            <strong className="text-text">Isso é afirmação sobre o portal federal</strong>, não sobre
            as prefeituras: a estrutura do tema é publicada e o valor municipal não. Nenhuma cidade
            deve ser lida como &quot;não fez&quot; por causa desta linha.
          </p>
        ) : null}

        {semItem.length > 0 ? (
          <p className="mt-3 text-[.92em] text-text-soft">
            Outros {semItem.length} temas —{" "}
            {semItem.map((l) => tituloDaCategoria(l.categoria)).join(", ")} — aparecem na resposta da
            API <strong className="text-text">sem nenhum indicador dentro</strong>, em toda Minas. Não
            entram na tabela porque não há o que contar: a fonte lista o tema e não publica item.
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Cada número tem dono declarado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          É a vantagem rara desta fonte, e o motivo de ela valer apesar de ser peça de comunicação:
          cada indicador diz qual ministério o declarou, e a que data ele se refere. São{" "}
          {cobertura.fontes.length} órgãos citados no acervo de Minas, e a ficha de cada cidade
          mostra a sigla ao lado de cada linha.
        </p>
        <p className="mt-3 flex flex-wrap gap-1.5">
          {cobertura.fontes.map((f) => (
            <span
              key={f}
              className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-soft"
            >
              {f}
            </span>
          ))}
        </p>
      </section>

      <section className="mt-10 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">Ver por cidade</h2>
        <p className="mt-1 text-[.92em] text-text-soft">
          A ficha traz os indicadores um a um, com o ministério e a data de referência de cada um — e
          os vazios listados junto, não escondidos. O número ao lado do nome é quantos indicadores
          daquela cidade vieram com valor, do total que a fonte publicou para ela.
        </p>
        <div className="mt-4">
          <BuscaCidade
            // Array de arrays, e não objetos: `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`
            // mede o que o formato custa — as normas passadas como objetos para
            // um componente de cliente geraram 35,5 MiB de `.cache` contra 4,7
            // MiB de texto real (7,5×), e o teto da Cloudflare é 25 MiB por
            // asset. Aqui são 4 campos × 853 cidades; repetir o NOME de cada
            // campo 853 vezes é pagar a mesma conta em escala menor sem
            // precisar. O acervo inteiro (174.012 itens) nunca chega ao
            // cliente: a ficha de cada cidade é renderizada no servidor.
            cidades={cidades.map((c) => [c.codigo, c.nome, c.comValor, c.itens] as const)}
          />
        </div>
      </section>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Coleta própria de {geradoEm} contra{" "}
          <a
            href="https://comunicabr.presidencia.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-accent"
          >
            comunicabr.presidencia.gov.br ↗
          </a>
          , uma requisição por município ({Math.round(meta.duracaoS / 60)} minutos de coleta), sem
          autenticação. As {formatNumberBR(cobertura.municipiosComResposta)} cidades responderam e{" "}
          {cobertura.municipiosRecusados === 0 ? "nenhuma foi recusada" : `${formatNumberBR(cobertura.municipiosRecusados)} foram recusadas`}.
          O portal reproduz o que a fonte publicou; não afirma que o programa chegou nem que o
          dinheiro foi executado —{" "}
          <a
            href="https://portaldatransparencia.gov.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-accent"
          >
            Portal da Transparência ↗
          </a>{" "}
          é onde a execução aparece.
        </p>
      </section>
    </main>
  );
}
