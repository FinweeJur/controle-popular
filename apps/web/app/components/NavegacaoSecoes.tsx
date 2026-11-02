import Link from "next/link";

/**
 * @file Navegação de página reunida: subir, descer e ir para a irmã.
 *
 * O QUE É: a faixa que aparece no topo de um painel que juntou várias seções.
 * Ela resolve o problema criado pela própria fusão: antes cada recorte era uma
 * página curta; agora é uma página longa, e o leitor precisa saber onde está e
 * como sair sem rolar tudo de volta.
 *
 * POR QUE TUDO É LINK: "subir" e "descer" são âncoras (`#id`), e "anterior" e
 * "próxima" são páginas de verdade. Nada aqui depende de JavaScript, nada
 * desmonta a casca (AGENTS §5.13), e cada destino pode ser copiado da barra de
 * endereço.
 *
 * POR QUE SEM "POSIÇÃO ATUAL": saber em que seção o leitor está exigiria
 * JavaScript de scroll. A faixa prefere listar os destinos a fingir precisão —
 * e a lista é curta o bastante para caber numa linha no celular.
 *
 * ACESSIBILIDADE: `<nav>` rotulado, alvos de 40 px (`min-h-10`), texto de 12 px
 * no mínimo, e a ordem dos links segue a ordem das seções na página.
 */

export interface SecaoNavegavel {
  /** `id` do elemento de destino, sem o `#`. */
  id: string;
  /** Rótulo curto do botão. */
  rotulo: string;
}

const BOTAO =
  "inline-flex min-h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary";

export default function NavegacaoSecoes({
  secoes,
  anterior,
  proxima,
  rotulo = "Navegação da página",
}: {
  secoes: SecaoNavegavel[];
  anterior?: { href: string; rotulo: string };
  proxima?: { href: string; rotulo: string };
  rotulo?: string;
}) {
  if (secoes.length === 0 && !anterior && !proxima) return null;

  return (
    <nav
      aria-label={rotulo}
      className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur-sm"
    >
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          <a className={BOTAO} href="#conteudo-principal">
            <span aria-hidden="true">↑</span> Subir
          </a>
        </li>
        {secoes.map((secao) => (
          <li key={secao.id}>
            <a className={BOTAO} href={`#${secao.id}`}>
              <span aria-hidden="true">↓</span> {secao.rotulo}
            </a>
          </li>
        ))}
        {anterior ? (
          <li className="ml-auto">
            <Link className={BOTAO} href={anterior.href} rel="prev">
              <span aria-hidden="true">←</span> {anterior.rotulo}
            </Link>
          </li>
        ) : null}
        {proxima ? (
          <li className={anterior ? undefined : "ml-auto"}>
            <Link className={BOTAO} href={proxima.href} rel="next">
              {proxima.rotulo} <span aria-hidden="true">→</span>
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
