/**
 * Crédito de fonte no rodapé de cada página do eixo Judiciário.
 *
 * Existe porque TRÊS páginas prometiam procedência clicável e nenhuma
 * entregava: `/judiciario/sobre` ("com link para a fonte em cada página"),
 * a home do eixo ("com link para conferir na fonte em cada página") e a
 * `/metodologia` ("que qualquer pessoa pode conferir clicando"). O
 * componente que sustentaria a promessa — `components/DataCard.tsx`, com o
 * botão "Fonte: … ↗" — nunca foi importado por nenhuma tela do eixo, e era
 * cópia do card de Betim: o texto de compartilhamento ainda dizia
 * "Controle Popular Betim". Foi removido junto com esta entrega.
 *
 * O formato (um <p> pequeno, "Fonte: … ↗") é o mesmo que o eixo /congresso
 * já adotou ao aposentar a MESMA cópia do DataCard — ver o comentário em
 * `app/congresso/votacoes/page.tsx`. Não se inventa padrão novo para um que
 * a casa já tem.
 *
 * `url` opcional de propósito: nem toda fonte publica URL estável. O STJ,
 * por exemplo, publica a composição em PDF e o dado semeado guarda só a
 * descrição. Fonte sem link vira texto, nunca link inventado — num portal
 * que cobra procedência, apontar para uma URL que não é a origem é pior do
 * que não apontar para nenhuma.
 */
export interface Fonte {
  nome: string;
  url?: string | null;
}

export default function FonteRodape({
  fontes,
  nota,
}: {
  fontes: Fonte[];
  nota?: string;
}) {
  const lista = fontes.filter((f) => f.nome);
  if (lista.length === 0) return null;

  return (
    <footer className="border-t border-[var(--cp-border)] pt-3 text-xs opacity-70">
      <p>
        {lista.length === 1 ? "Fonte: " : "Fontes: "}
        {lista.map((f, i) => (
          <span key={`${f.nome}-${i}`}>
            {i > 0 ? " · " : ""}
            {f.url ? (
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {f.nome} ↗
              </a>
            ) : (
              f.nome
            )}
          </span>
        ))}
      </p>
      {nota ? <p className="mt-1">{nota}</p> : null}
    </footer>
  );
}

/** Fonte comum a quase toda página do eixo: os processos de indicação. */
export const FONTE_SENADO: Fonte = {
  nome: "Senado Federal — Dados Abertos",
  url: "https://legis.senado.leg.br/dadosabertos",
};

/**
 * A régua de composição não é raspada de lugar nenhum: é a Constituição e
 * as leis de organização, transcritas em `regras/regras.json` e citadas
 * dispositivo a dispositivo na tela. Sem URL porque a fonte é o texto
 * legal, já nomeado em cada card.
 */
export const FONTE_REGUA: Fonte = {
  nome: "Constituição Federal e leis de organização de cada tribunal",
};
