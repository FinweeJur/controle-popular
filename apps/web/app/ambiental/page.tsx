import { ZONAS } from "@/lib/zonas";
import { listarCidades } from "@/lib/db/queries/municipios";

/**
 * Home da zona /ambiental — andaime da F1.
 *
 * Os números abaixo NÃO são estimativa nem promessa: saíram do censo das
 * fontes feito na F0 e estão registrados em `docs/ambiental/F0-discovery.md`
 * com a data da medição. Página em construção que inventa número é como
 * gráfico sem cobertura declarada — a regra do projeto vale aqui também.
 *
 * ═══ POR QUE O BLOCO "BARRAGENS" GANHOU LINKS POR CIDADE (2026-08-09) ═══
 *
 * Os coletores de barragens (FEAM + SNISB) já rodaram contra o banco e as
 * telas por município (`/[cidade]/meio-ambiente/barragens`) já leem esse
 * dado real — não é mais só o censo estadual da F0, é o que está gravado
 * agora. Os outros três blocos (COPAM, Licenciamento, Legislação) continuam
 * sem coletor e sem tela, por isso continuam sem link: a zona acabou de
 * entrar na home com a cópia cortada para o que existe, e reintroduzir um
 * link morto seria prometer de novo o que ainda não tem dado.
 *
 * A lista de cidades vem de `listarCidades()`, a mesma fonte que gera as
 * rotas — cidade nova aparece aqui sozinha, sem editar esta página.
 */

const ZONA = ZONAS.find((z) => z.id === "ambiental")!;

const BLOCOS = [
  {
    titulo: "Reuniões do COPAM",
    linha: "454 reuniões, com a pauta item a item",
    texto:
      "O Conselho Estadual de Política Ambiental publica as reuniões com antecedência, mas não dá para filtrar por município nem saber o que será julgado sem abrir PDF por PDF. É a única parte que age antes da decisão.",
    fase: "F3",
  },
  {
    titulo: "Licenciamento",
    linha: "19.162 licenças emitidas",
    texto:
      "Filtro por município, empresa, setor do empreendimento, modalidade, classe, potencial poluidor e período. O setor vem da própria Deliberação Normativa Copam 217/2017, não de uma classificação inventada aqui.",
    fase: "F4",
  },
  {
    titulo: "Barragens",
    linha: "249 em Minas · 31 sem estabilidade atestada",
    texto:
      "Condição de estabilidade, nível de emergência, método construtivo e categoria de risco, do inventário da Feam cruzado com o registro nacional da ANM.",
    fase: "F5",
  },
  {
    titulo: "Legislação ambiental",
    linha: "Federal e estadual no mesmo lugar",
    texto:
      "Hoje a norma que interessa está partida entre cinco sistemas que não conversam: MMA, Conama, ALMG, Siam e o banco da Semad. Aqui vira uma busca só.",
    fase: "F6",
  },
];

export default async function AmbientalHome() {
  const cidades = await listarCidades();
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <header className="space-y-4">
        <p
          className="text-[.82em] font-semibold uppercase tracking-wide"
          style={{ color: ZONA.cor }}
        >
          {ZONA.etiqueta}
        </p>
        <h1 className="font-display text-3xl font-bold sm:text-4xl">{ZONA.titulo}</h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">{ZONA.descricao}</p>

        <p
          className="max-w-2xl rounded-lg border px-4 py-3 text-[.95em]"
          style={{ borderColor: ZONA.cor }}
        >
          <strong>Seção em construção.</strong> As fontes já foram verificadas e estão
          documentadas; as telas entram por fase. Enquanto isso, o que está no ar são as
          outras frentes do Controle Popular, nos botões acima.
        </p>
      </header>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {BLOCOS.map((b) => (
          <section
            key={b.titulo}
            className="flex flex-col rounded-lg border border-border bg-surface p-5"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">{b.titulo}</h2>
              <span className="shrink-0 text-[.75em] font-medium text-text-soft">
                {b.fase}
              </span>
            </div>
            <p className="mt-1 font-medium" style={{ color: ZONA.cor }}>
              {b.linha}
            </p>
            <p className="mt-2 flex-1 text-[.92em] text-text-soft">{b.texto}</p>

            {b.titulo === "Barragens" && cidades.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-[.8em] font-medium text-text-soft">
                  Já dá pra ver por cidade:
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {cidades.map((c) => (
                    <li key={c.slug}>
                      <a
                        href={`/${c.slug}/meio-ambiente/barragens`}
                        className="inline-block rounded-md border border-border px-2.5 py-1 text-[.8em] font-medium transition-colors hover:border-primary hover:text-primary"
                      >
                        {c.nome} →
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>

      <section className="mt-12 border-t border-border pt-8">
        <h2 className="font-display text-xl font-semibold">De onde vem o dado</h2>
        <p className="mt-2 max-w-2xl text-[.95em] text-text-soft">
          Portal EcoSistemas e IDE-Sisema (Semad), inventário de barragens da Feam,
          registro nacional de barragens da ANM, dados abertos da ALMG, Siam, banco de
          legislação da Semad, CKAN do MMA e Conama. Cada fonte tem data de verificação e
          licença registradas — nenhuma delas veda uso comercial, e é por isso que estão
          aqui.
        </p>
      </section>
    </div>
  );
}
