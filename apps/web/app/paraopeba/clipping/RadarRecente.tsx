import { carregarRadarParaopeba } from "@/lib/paraopeba/radar";
import { formatDateBR } from "@/lib/betim/format";

/**
 * O que saiu DEPOIS dos acervos — varredura automática, sem curadoria.
 *
 * ## Por que fica no fim da página, e separado
 *
 * Os três acervos acima são seleção com autoria: alguém leu, resumiu e
 * classificou. Este bloco é o contrário — um robô lê feeds e guarda título,
 * veículo, data e link. Misturar os dois daria falsa curadoria a este e
 * apagaria a autoria daqueles.
 *
 * Fica no fim porque responde a pergunta menos importante das duas. "O que
 * aconteceu no caso" é o acervo; "o que saiu esta semana" é o radar — útil
 * para quem acompanha, dispensável para quem chega.
 *
 * ## O carimbo de data não é enfeite
 *
 * O site é estático: este bloco é lido no BUILD. Um site publicado há uma
 * semana mostra notícia de uma semana atrás, e sem dizer a data da coleta
 * isso vira falsa impressão de tempo real. Por isso a data aparece antes da
 * lista, não depois.
 */
export default function RadarRecente() {
  const radar = carregarRadarParaopeba();

  if (!radar.itens.length) {
    return (
      <section className="mt-14 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">O que saiu recentemente</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          A varredura automática ainda não rodou nesta instalação — o que não diz nada
          sobre o caso, só sobre esta cópia do site.
        </p>
      </section>
    );
  }

  const atos = radar.itens.filter((i) => i.ato_de_autoridade).length;

  /**
   * Quais fontes configuradas realmente entregaram algo nesta coleta.
   *
   * Medido, não suposto, e por isso calculado aqui em vez de escrito à mão:
   * na coleta de 15/08/2026 os 14 itens vieram TODOS do agregador — MAB e
   * Agência Brasil voltaram vazias. Sem dizer isso, quem lê um radar que
   * declara o MAB entre as fontes conclui que a perspectiva das atingidas
   * está representada nesta lista, e nesta rodada ela não está.
   */
  const idsQueEntregaram = new Set(radar.itens.map((i) => i.fonte_id));
  const fontesVazias = radar.fontes.filter((f) => !idsQueEntregaram.has(f.id));

  return (
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold">O que saiu recentemente</h2>

      <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
        Varredura automática de feeds públicos, <strong className="text-text">sem curadoria</strong> —
        diferente dos três acervos acima, aqui ninguém leu, resumiu nem classificou. São{" "}
        {radar.itens.length} itens dos últimos {radar.janela_dias} dias
        {atos > 0 ? `, ${atos} deles com sinal de decisão de autoridade` : ""}. Coleta de{" "}
        <strong className="text-text">{formatDateBR(radar.gerado_em.slice(0, 10))}</strong>.
      </p>

      {radar.lacuna_conhecida ? (
        <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">⚠️ {radar.lacuna_conhecida}</p>
      ) : null}

      {fontesVazias.length > 0 ? (
        <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">
          ⚠️ Nesta coleta,{" "}
          <strong className="text-text">{fontesVazias.map((f) => f.veiculo).join(" e ")}</strong>{" "}
          {fontesVazias.length > 1 ? "não retornaram" : "não retornou"} nenhum item. A lista de
          fontes configuradas não é a lista de fontes que entregaram.
        </p>
      ) : null}

      {atos > 0 ? (
        <p className="mt-2 max-w-2xl text-[.9em] text-text-soft">
          A marca <span className="font-mono uppercase">ato</span> é palpite do coletor a partir
          do <strong className="text-text">título</strong>, não leitura da matéria — serve para
          olhar primeiro, não para citar. Nesta coleta ela já pegou ao menos um explicador
          (&ldquo;Entenda o Acordo Judicial…&rdquo;), que não é decisão de ninguém.
        </p>
      ) : null}

      <ul className="mt-5 space-y-2">
        {radar.itens.map((item) => (
          <li key={item.link}>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`block rounded-lg border px-4 py-3 transition-colors hover:border-current ${
                item.ato_de_autoridade ? "border-l-[3px] border-l-alert" : ""
              }`}
            >
              {/* A marca de "ato" é PALAVRA, não só cor: cor sozinha não
                  sobrevive a daltonismo, impressão em preto e branco nem
                  leitor de tela — e esta página vira anexo de ofício.

                  A cor vem de `text-alert`/`border-alert`, NÃO de um
                  `var(--cp-caution, #e2a138)`: esse token não existe em
                  `globals.css` (só no `colors.css` do globo, que é outro app
                  e não carrega aqui), então o hex fixo valia sempre. Âmbar
                  cravado ignora os três temas do portal — inclusive o de alto
                  contraste, onde `--cp-alert` é medido em 8,11:1. */}
              {item.ato_de_autoridade ? (
                <span
                  className="mr-2 rounded border border-alert px-1 text-[.7em] font-mono uppercase tracking-wide text-alert"
                  title="O título indica decisão de autoridade — o tipo de notícia que muda a situação de alguém."
                >
                  ato
                </span>
              ) : null}
              <span className="text-text">{item.titulo}</span>
              <span className="mt-1 block font-mono text-[.78em] text-text-soft">
                {item.veiculo}
                {item.data ? ` · ${formatDateBR(item.data.slice(0, 10))}` : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-2xl text-[.9em] text-text-soft">
        Guardamos título, veículo, data e link — nunca o texto da matéria. Ler a
        reportagem é no site de quem a publicou.
      </p>
    </section>
  );
}
