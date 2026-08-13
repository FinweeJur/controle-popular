import Link from "@/lib/betim/link";
import {
  percentualAnalisado,
  type CoberturaLegislacao,
} from "@/lib/betim/legislacao-garantista";
import { formatNumberBR } from "@/lib/betim/format";

/**
 * Os blocos compartilhados pelas duas telas de legislação garantista —
 * `/legislacao/alertas` (o que restringe) e `/legislacao/bons-exemplos` (o que
 * amplia). As duas mostram a mesma moldura em volta de listas opostas, e a
 * moldura precisa dizer a MESMA coisa nas duas: mesma contagem, mesmo aviso de
 * cobertura, mesmo texto de vazio.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE, E POR QUE ELE NASCEU TARDE ═══
 *
 * Os quatro componentes moravam dentro de `alertas/page.tsx`, exportados de
 * lá, e `bons-exemplos/page.tsx` os importava de uma PÁGINA. Funcionava, e
 * mesmo assim era bug: o Next impõe um contrato ao arquivo `page.tsx` — ele só
 * pode exportar `default`, `metadata`, `generateMetadata`,
 * `generateStaticParams`, `dynamic`, `revalidate` e a lista fechada de irmãos.
 * Qualquer outro export viola o contrato.
 *
 * O build com Turbopack NÃO checa isso e passava verde. O build com webpack
 * checa, e o erro que ele dá é o oposto de legível:
 *
 *     Type 'OmitWithTag<typeof import(".../alertas/page"), ...>' does not
 *     satisfy the constraint '{ [x: string]: never; }'.
 *       Property 'SemDado' is incompatible with index signature.
 *
 * Isto é: "a sua página exporta SemDado e não deveria", dito em dialeto de
 * inferência de tipo. O defeito é antigo; o que mudou foi o bundler que o
 * enxerga. Fica registrado porque a próxima pessoa que exportar um componente
 * de dentro de uma page vai receber essa mesma mensagem e não vai reconhecê-la.
 *
 * (Por que o bundler mudou: o Turbopack emitia o chunk do Drizzle SETE vezes —
 * 626 KiB gzip contra 127 KiB do webpack — e o Worker da Cloudflare tem teto de
 * 3 MiB gzip. A troca foi medida, não é preferência.)
 */

/** A cidade não tem análise garantista nenhuma ainda. */
export function SemDado() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-sm text-text-soft">
      <p className="font-medium text-text">Em breve</p>
      <p className="mt-2">A análise garantista desta cidade ainda não está disponível.</p>
    </div>
  );
}

/**
 * Tem análise, mas nada caiu nesta classificação.
 *
 * Distingue de propósito dois vazios que a tela confundiria: "ninguém analisou
 * nada ainda" e "analisamos e não achamos". O segundo é resultado; o primeiro
 * não é.
 */
export function Vazio({ cobertura }: { cobertura: CoberturaLegislacao }) {
  const nadaAnalisado = cobertura.atosAnalisados === 0 && cobertura.proposicoesAnalisadas === 0;
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-2 p-6 text-sm text-text-soft">
      {nadaAnalisado ? (
        <>
          <p className="font-medium text-text">Nenhuma norma analisada ainda</p>
          <p className="mt-2">
            A análise garantista roda em fila e esta página se enche sozinha conforme avança.
          </p>
        </>
      ) : (
        <p>
          Nenhuma lei ou projeto foi classificado assim entre{" "}
          {formatNumberBR(cobertura.atosAnalisados + cobertura.proposicoesAnalisadas)} já
          analisados. Isso não significa que não exista — significa que a fila de análise ainda
          não chegou lá.
        </p>
      )}
    </div>
  );
}

/**
 * A contagem da lista COM o universo, na mesma linha.
 *
 * O aviso de cobertura no rodapé é completo, mas fica depois de 44 cards em
 * São Paulo — quem lê o ranking e para no meio nunca chega nele. A exigência
 * é que toda tela que rankeia diga sobre quantos itens fala, e o lugar onde
 * isso é lido é junto do "44 itens", não no fim da página.
 */
export function Contagem({
  lista,
  cobertura,
  ordem,
}: {
  lista: number;
  cobertura: CoberturaLegislacao;
  ordem: string;
}) {
  const analisados = cobertura.atosAnalisados + cobertura.proposicoesAnalisadas;
  const acervo = cobertura.totalAtos + cobertura.totalProposicoes;
  return (
    <p className="mt-6 mb-4 text-sm text-text-soft">
      {lista} {lista === 1 ? "item" : "itens"}, {ordem} —{" "}
      <strong className="text-text">
        entre as {formatNumberBR(analisados)} normas e projetos já analisados
      </strong>{" "}
      de {formatNumberBR(acervo)} que {cobertura.totalAtos > 0 ? "a cidade tem" : "existem"}{" "}
      ({percentualAnalisado(analisados, acervo)}).
    </p>
  );
}

export function CoberturaAviso({ cobertura }: { cobertura: CoberturaLegislacao }) {
  if (!cobertura.ok) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-5 text-sm text-text-soft">
      <p>
        <strong className="text-text">
          {formatNumberBR(cobertura.atosAnalisados)} de {formatNumberBR(cobertura.totalAtos)} leis
          e decretos analisados (
          {percentualAnalisado(cobertura.atosAnalisados, cobertura.totalAtos)})
        </strong>{" "}
        e{" "}
        <strong className="text-text">
          {formatNumberBR(cobertura.proposicoesAnalisadas)} de{" "}
          {formatNumberBR(cobertura.totalProposicoes)} projetos em tramitação analisados (
          {percentualAnalisado(cobertura.proposicoesAnalisadas, cobertura.totalProposicoes)})
        </strong>
        . É uma amostra, não um censo — o que não aparece aqui ainda não foi lido pela análise,
        não é veredito de “neutro” sobre a Câmara ou a Prefeitura.
      </p>
      {/* A régua é invocada no texto das duas telas ("segundo a régua
          declarada deste portal"). Sem link, "declarada" é promessa não
          cumprida: o leitor não tem como conferir o critério.
          "se a extração erra, o rótulo erra": o parágrafo dizia só a
          metade boa da doutrina (rótulo é conta, não opinião do modelo) e
          deixava de fora que a conta depende do que o modelo extraiu — a
          mesma lacuna corrigida em `/sobre` e em `/congresso/metodologia`
          em 13/08. `<a>` cru, não o `Link` de zona: `/metodologia` aqui
          dentro é sobre alertas de CONTRATO
          (`[municipio]/metodologia/page.tsx`), não sobre a régua
          garantista — apontava pro assunto errado. */}
      <p className="mt-2">
        O rótulo não é escrito por inteligência artificial — sai de uma soma sobre itens
        que citam, cada um, o dispositivo legal que fundamenta a leitura. Mas o modelo
        extrai os itens que entram nessa soma: se a extração erra, o rótulo calculado a
        partir dela também erra.{" "}
        <a href="/sobre#metodologia" className="text-accent hover:underline">
          Ver a metodologia
        </a>{" "}
        ·{" "}
        <Link href="/camara/legislacao" className="text-accent hover:underline">
          ver todas as normas publicadas
        </Link>
      </p>
    </section>
  );
}
