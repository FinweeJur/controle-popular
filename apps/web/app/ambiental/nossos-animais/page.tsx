import Link from "next/link";
import PainelDialogo from "@/app/components/PainelDialogo";
import BlocoPovoGente from "@/app/ambiental/components/BlocoPovoGente";

interface EspecieFauna {
  id: string;
  nomePopular: string;
  nomeCientifico: string;
  bioma: string;
  categoriaAmeaca: "Criticamente em Perigo (CR)" | "Em Perigo (EN)" | "Vulnerável (VU)";
  corredorPrincipal: string;
  principaisAmeacas: string;
}

const ESPECIES_CATALOGO: EspecieFauna[] = [
  {
    id: "lobo-guara",
    nomePopular: "Lobo-guará",
    nomeCientifico: "Chrysocyon brachyurus",
    bioma: "Cerrado",
    categoriaAmeaca: "Vulnerável (VU)",
    corredorPrincipal: "Corredor Cerrado Mineiro / Canastra",
    principaisAmeacas: "Atropelamentos em rodovias, perda de habitat e fogo",
  },
  {
    id: "muriqui-do-norte",
    nomePopular: "Muriqui-do-norte",
    nomeCientifico: "Brachyteles hypoxanthus",
    bioma: "Mata Atlântica",
    categoriaAmeaca: "Criticamente em Perigo (CR)",
    corredorPrincipal: "Maciço do Caparaó e Serra do Brigadeiro",
    principaisAmeacas: "Fragmentação extrema da floresta nativa",
  },
  {
    id: "onca-pintada",
    nomePopular: "Onça-pintada",
    nomeCientifico: "Panthera onca",
    bioma: "Mata Atlântica / Cerrado",
    categoriaAmeaca: "Criticamente em Perigo (CR)",
    corredorPrincipal: "Parque Estadual do Rio Doce / Peruaçu",
    principaisAmeacas: "Conflitos com pecuária e caça retaliatória",
  },
  {
    id: "surubim-do-jequitinhonha",
    nomePopular: "Surubim-do-jequitinhonha",
    nomeCientifico: "Steindachneridion amblyrhynchus",
    bioma: "Cerrado / Caatinga",
    categoriaAmeaca: "Criticamente em Perigo (CR)",
    corredorPrincipal: "Calha do Médio e Alto Rio Jequitinhonha",
    principaisAmeacas: "Barragens de hidrelétricas e assoreamento por mineração",
  },
  {
    id: "tamandua-bandeira",
    nomePopular: "Tamanduá-bandeira",
    nomeCientifico: "Myrmecophaga tridactyla",
    bioma: "Cerrado",
    categoriaAmeaca: "Vulnerável (VU)",
    corredorPrincipal: "Cerrado do Alto Paranaíba e Espinhaço",
    principaisAmeacas: "Incêndios em pastagens e colisões veiculares",
  },
  {
    id: "bicudo",
    nomePopular: "Bicudo",
    nomeCientifico: "Sporophila maximiliani",
    bioma: "Cerrado / Pantanal",
    categoriaAmeaca: "Criticamente em Perigo (CR)",
    corredorPrincipal: "Veredas do Norte de Minas",
    principaisAmeacas: "Tráfico ilegal de animais silvestres e drenagem de veredas",
  },
];

export const metadata = {
  title: "Nossos Animais — Fauna, Corredores Ecológicos e Proteção da Vida Silvestre | ONSA",
  description:
    "Monitoramento cívico de espécies ameaçadas, corredores de fauna, atropelamentos e fiscalização no Observatório Nacional Socioambiental.",
};

export default function PaginaNossosAnimais() {
  const gerarCsv = () => {
    const cabecalho = "Nome Popular;Nome Científico;Bioma;Categoria de Ameaça;Corredor Ecológico;Principais Ameaças\n";
    const linhas = ESPECIES_CATALOGO.map(
      (e) =>
        `"${e.nomePopular}";"${e.nomeCientifico}";"${e.bioma}";"${e.categoriaAmeaca}";"${e.corredorPrincipal}";"${e.principaisAmeacas}"`
    ).join("\n");
    return "\uFEFF" + cabecalho + linhas;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* NAVEGAÇÃO BREADCRUMB */}
      <nav aria-label="Navegação estrutural" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:underline">Início</Link>
        <span>/</span>
        <Link href="/ambiental" className="hover:underline">ONSA</Link>
        <span>/</span>
        <Link href="/ambiental/nossos" className="hover:underline">Coleção Nossos</Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Nossos Animais</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            #natureza
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            #ecossistema
          </span>
          <span className="rounded-full bg-surface-3 px-3 py-0.5 text-xs text-muted">
            Fauna Silvestre & Corredores
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Nossos Animais
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          Acompanhamento da fauna silvestre nativa, espécies sob ameaça de extinção e
          conectividade entre unidades de conservação e bacias hidrográficas.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          [Espaço para epígrafe/verso da equipe editorial sobre a liberdade das aves e a proteção das matas]
        </div>
      </header>

      {/* CARTÕES DE STATUS DE TOPO */}
      <section aria-label="Indicadores da fauna" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Espécies Ameaçadas Monitoradas</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">1.051</p>
          <span className="mt-1 block text-xs text-muted">Fonte: ICMBio / Livro Vermelho da Fauna Brasileira</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Corredores Prioritários</span>
          <p className="mt-2 font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">4 grandes eixos</p>
          <span className="mt-1 block text-xs text-muted">Espinhaço, Rio Doce, Serra do Mar e Canastra</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Resgates & Apreensões</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">28.410</p>
          <span className="mt-1 block text-xs text-muted">Registros anuais de fiscalização (IBAMA / PMMA)</span>
        </div>
      </section>

      {/* GRÁFICO SVG NATIVO (Distribuição de grupos taxonômicos ameaçados) */}
      <section aria-label="Gráfico de distribuição da fauna" className="mb-12 rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-foreground">
          Distribuição de Espécies Ameaçadas por Grupo no Sudeste
        </h2>
        <p className="mt-1 text-xs text-muted">
          Proporção aproximada de espécies catalogadas com algum grau de ameaça nos biomas da região (Fonte: ICMBio).
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {[
            { grupo: "Aves (passeriformes, rapinantes e brejos)", pct: 36, valor: "380 espécies" },
            { grupo: "Peixes Continentais (bacias São Francisco e Doce)", pct: 26, valor: "275 espécies" },
            { grupo: "Mamíferos (primatas, carnívoros e roedores)", pct: 18, valor: "192 espécies" },
            { grupo: "Invertebrados Terrestres e Aquáticos", pct: 12, valor: "128 espécies" },
            { grupo: "Répteis e Anfíbios de Encosta", pct: 8, valor: "76 espécies" },
          ].map((item) => (
            <div key={item.grupo}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-foreground">{item.grupo}</span>
                <span className="text-muted">{item.valor} ({item.pct}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <span className="mt-4 block text-[11px] text-muted">
          * A perda e fragmentação de florestas nativas e a poluição de cursos d’água são os principais fatores de pressão.
        </span>
      </section>

      {/* TABELA DE ESPÉCIES EMBLEMÁTICAS */}
      <section aria-label="Espécies emblemáticas monitoradas" className="mb-12">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Espécies Monitoradas nos Biomas Locais
            </h2>
            <p className="text-xs text-muted">
              Animais-símbolo que funcionam como termômetros do equilíbrio dos nossos rios, serras e matas.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(gerarCsv())}`}
            download="fauna-especies-ameacadas-onsa.csv"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors sm:self-auto"
          >
            📥 Baixar Planilha (CSV)
          </a>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-3 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Espécie</th>
                <th className="px-4 py-3">Bioma</th>
                <th className="px-4 py-3">Grau de Ameaça</th>
                <th className="px-4 py-3">Corredor Principal</th>
                <th className="px-4 py-3">Principal Pressão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ESPECIES_CATALOGO.map((e) => (
                <tr key={e.id} className="hover:bg-surface-1/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {e.nomePopular}
                    <span className="block text-xs italic font-normal text-muted">{e.nomeCientifico}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{e.bioma}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                      {e.categoriaAmeaca}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{e.corredorPrincipal}</td>
                  <td className="px-4 py-3 text-xs text-muted">{e.principaisAmeacas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DIÁLOGO ENTRE FRENTES (Sanfona) */}
      <PainelDialogo
        origemRota="/ambiental/nossos-animais"
        origemTitulo="Fauna e Corredores Ecológicos"
      />

      {/* BLOCO OBRIGATÓRIO: E NOSSA GENTE? */}
      <BlocoPovoGente
        variacao="gente"
        territorioNome="as áreas de convivência com a fauna silvestre"
      />
    </div>
  );
}
