import type { ServicoEssencial } from "@/lib/direitos/servicos";

/**
 * @file Aviso de procedência dos números de referência do painel de serviços.
 *
 * POR QUE EXISTE: os quatro cartões de cada recorte são valores nacionais
 * divulgados pelo órgão da fonte, fixados no código — não são medição deste
 * portal, não são do município do leitor e não são do dia. Publicar isso sem
 * dizer é o jeito mais fácil de um número plausível virar afirmação falsa.
 *
 * O aviso fica ANTES do primeiro cartão, não no rodapé: quem chega pelo celular
 * e rola rápido precisa ver a ressalva antes de ler o número.
 *
 * FONTE: a URL em `servico.fonte.url` é a página oficial onde qualquer pessoa
 * confere o dado. Não é link genérico de ministério: é a área de estatística
 * que publica a série.
 */

export default function AvisoReferencia({ servico }: { servico: ServicoEssencial }) {
  return (
    <aside
      aria-label="Procedência dos números de referência"
      className="rounded-2xl border border-alert/40 bg-alert/10 p-4 text-sm sm:p-5"
    >
      <p className="font-semibold text-foreground">
        Os cartões abaixo são referência nacional — não medição deste portal.
      </p>
      <p className="mt-1.5 text-text-soft">
        Os valores vêm de {servico.fonte.orgao} e servem de régua para ler o dado local. O portal
        não os recalculou nem os atualizou no build. {servico.ressalva}
      </p>
      <p className="mt-2 text-xs">
        <a
          href={servico.fonte.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium underline"
        >
          Conferir na fonte oficial
        </a>{" "}
        <span className="text-text-soft">
          — o que o portal mede, cidade a cidade, está nas fichas e nos painéis municipais.
        </span>
      </p>
    </aside>
  );
}
