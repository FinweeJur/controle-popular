import { formatNumberBR } from "@/lib/betim/format";
import { BIBLIOTECA, JURIS, MAB, NOTICIAS } from "./dados";
import { Botao, CabecalhoSecao, Marca } from "./Componentes";

function CartaoAcervo({
  titulo,
  total,
  recorte,
  medicao,
  ressalva,
  botoes,
}: {
  titulo: string;
  total: string;
  recorte: string;
  medicao: string;
  ressalva: string;
  botoes: { href: string; rotulo: string; contorno?: boolean }[];
}) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-border bg-surface p-5">
      <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      <p className="mt-2 font-tabular text-3xl font-bold text-primary">{total}</p>
      <p className="mt-1 text-sm text-text">{recorte}</p>
      <p className="mt-2 text-xs text-text-soft">{medicao}</p>
      <p className="mt-3 flex-1 text-xs leading-relaxed text-text-soft">
        {ressalva}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {botoes.map((botao) => (
          <Botao
            key={botao.href}
            href={botao.href}
            variante={botao.contorno ? "contorno" : "primario"}
          >
            {botao.rotulo}
          </Botao>
        ))}
      </div>
    </article>
  );
}

/**
 * "Documentos, notícias e MAB": os acervos que alimentam a análise. Cada
 * cartão mostra o total e o recorte de Mariana, a data da medição e uma
 * ressalva sobre o que aquela fonte é — e o que ela não é.
 */
export function SecaoAcervos() {
  return (
    <section
      id="acervos"
      aria-labelledby="titulo-acervos"
      className="mt-12 scroll-mt-24 border-t border-border pt-8"
    >
      <CabecalhoSecao
        id="titulo-acervos"
        numero="07"
        titulo="Documentos, notícias e MAB"
        descricao="Quatro acervos sustentam a leitura do caso. Eles não têm o mesmo estatuto: documento oficial, notícia de radar e publicação de movimento social não valem a mesma coisa na hora de concluir."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <CartaoAcervo
          titulo="Biblioteca dos desastres"
          total={formatNumberBR(BIBLIOTECA.total)}
          recorte={`${formatNumberBR(BIBLIOTECA.mariana)} itens ligados a Mariana / Rio Doce`}
          medicao={`Medição do acervo em ${BIBLIOTECA.medidoEm.split("-").reverse().join("/")}.`}
          ressalva="Reúne documentos das assessorias técnicas, do comitê de bacia e de órgãos públicos, com link para a fonte original. Item sem data ou sem vínculo claro fica declarado como lacuna, não é preenchido por chute."
          botoes={[
            {
              href: "/ambiental/crimes-socioambientais",
              rotulo: "Ver a biblioteca",
            },
            {
              href: "/paraopeba/biblioteca",
              rotulo: "Biblioteca das assessorias",
              contorno: true,
            },
          ]}
        />
        <CartaoAcervo
          titulo="Radar de notícias"
          total={formatNumberBR(NOTICIAS.total)}
          recorte={`${formatNumberBR(NOTICIAS.mariana)} notícias ligadas a Mariana`}
          medicao={`Coleta gerada em ${NOTICIAS.geradoEm.split("-").reverse().join("/")}.`}
          ressalva="É um radar, não um acervo: título, veículo, data, microresumo publicado pela fonte e link. Notícia diz que algo foi noticiado naquela data; não é fato oficial."
          botoes={[
            { href: "/riodoce/clipping", rotulo: "Abrir o clipping" },
          ]}
        />
        <CartaoAcervo
          titulo="Publicações do MAB"
          total={formatNumberBR(MAB.total)}
          recorte={`${formatNumberBR(MAB.mariana)} publicações sobre Mariana / Rio Doce`}
          medicao={`Coleta gerada em ${MAB.geradoEm.split("-").reverse().join("/")}.`}
          ressalva="O MAB é parte interessada no caso: a página guarda título, resumo do próprio site, data e link, e diz isso em cada cartão. É fonte para entender a pauta do movimento, não laudo neutro."
          botoes={[
            { href: "/paraopeba/mab", rotulo: "Notícias e notas do MAB" },
          ]}
        />
        <CartaoAcervo
          titulo="Jurisprudência"
          total={formatNumberBR(JURIS.tjes + JURIS.tjmg)}
          recorte={`${formatNumberBR(JURIS.tjes)} decisões do TJES e ${formatNumberBR(JURIS.tjmg)} do TJMG`}
          medicao={`Acervo gerado em ${JURIS.geradoEm.split("-").reverse().join("/")}.`}
          ressalva="O buscador cobre os dois desastres e o período de 2008 a 2026. A tabela de teses desta página usa a rubrica fechada de 22 temas e 79 teses aplicada ao TJMG."
          botoes={[
            {
              href: "/jurisprudencia?tribunal=TJES&estado=ES#lista",
              rotulo: "Acórdãos do TJES",
            },
            {
              href: "/jurisprudencia?frente=riodoce&tribunal=TJMG#lista",
              rotulo: "Acórdãos do TJMG",
              contorno: true,
            },
          ]}
        />
      </div>

      <p className="mt-3 max-w-3xl text-xs leading-relaxed text-text-soft">
        As contagens de cada acervo são medidas no dado versionado; a data
        entre parênteses é a da coleta, não a de hoje.{" "}
        <Marca tipo="medido" />
      </p>
    </section>
  );
}
