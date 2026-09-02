import Link from "next/link";
import PainelDialogo from "@/app/components/PainelDialogo";
import BlocoPovoGente from "@/app/ambiental/components/BlocoPovoGente";

interface ComunidadeGrupo {
  id: string;
  nomeGrupo: string;
  identidade: string;
  regiao: string;
  municipios: string;
  pautaCentral: string;
  fonteOficial: string;
}

const COMUNIDADES_CATALOGO: ComunidadeGrupo[] = [
  {
    id: "ceramistas-jequitinhonha",
    nomeGrupo: "Artesãs e Ceramistas do Vale do Jequitinhonha",
    identidade: "Artesanato Tradicional de Barro e Mestras de Ofício",
    regiao: "Médio Jequitinhonha (MG)",
    municipios: "Araçuaí, Itinga, Turmalina, Berilo",
    pautaCentral: "Reconhecimento do barro como patrimônio imaterial e água potável",
    fonteOficial: "IEPHA-MG e Associações Locais de Artesãs",
  },
  {
    id: "pescadores-paraopeba",
    nomeGrupo: "Colônias e Associações de Pescadores do Paraopeba",
    identidade: "Pescadores Artesanais de Água Doce",
    regiao: "Bacia do Rio Paraopeba (MG)",
    municipios: "Brumadinho, Betim, São Joaquim de Bicas, Mário Campos",
    pautaCentral: "Reparação continuada por perda de renda e despoluição da calha",
    fonteOficial: "MPMG e Instituições de Justiça / Acordo Judicial",
  },
  {
    id: "quilombos-espinhaco",
    nomeGrupo: "Comunidades Quilombolas do Espinhaço e Biribiri",
    identidade: "Povos e Comunidades Tradicionais (PCTs)",
    regiao: "Alto Espinhaço (MG)",
    municipios: "Diamantina, Serro, Conceição do Mato Dentro",
    pautaCentral: "Titulação fundiária de territórios ancestrais e acesso a nascentes",
    fonteOficial: "Fundação Cultural Palmares e INCRA",
  },
  {
    id: "pescadores-rio-doce",
    nomeGrupo: "Pescadores e Ribeirinhos da Calha e Foz do Rio Doce",
    identidade: "Pescadores Continentais e Marítimos",
    regiao: "Leste de Minas e Litoral Capixaba (MG/ES)",
    municipios: "Governador Valadares, Resplendor, Linhares, Colatina",
    pautaCentral: "Indenizações justas na repactuação federal e retomada da pesca",
    fonteOficial: "TRF-6 e Defensoria Pública da União (DPU)",
  },
  {
    id: "atingidos-barragens",
    nomeGrupo: "Famílias Atingidas por Rompimentos e Descaracterizações",
    identidade: "Moradores em Áreas de Autossalvamento (ZAS) e Evacuados",
    regiao: "Quadrilátero Ferrífero (MG)",
    municipios: "Mariana, Ouro Preto, Nova Lima, Itabirito",
    pautaCentral: "Direito à moradia digna, reassentamentos consolidados e segurança",
    fonteOficial: "Defesa Civil Estadual / ANM",
  },
  {
    id: "geraizeiros-norte",
    nomeGrupo: "Geraizeiros e Vazanteiros do Norte de Minas",
    identidade: "Povos Tradicionais do Cerrado e Veredas",
    regiao: "Norte de Minas e Vale do São Francisco",
    municipios: "Montes Claros, Januária, São Francisco",
    pautaCentral: "Proteção das veredas, segurança contra grilagem e convivência com a seca",
    fonteOficial: "Secretaria de Estado de Desenvolvimento Social (SEDESE-MG)",
  },
];

export const metadata = {
  title: "Nossa Gente — Povos Tradicionais, Pescadores e Atingidos | ONSA",
  description:
    "Espaço de visibilidade para comunidades quilombolas, pescadores artesanais, geraizeiros e atingidos por barragens no Observatório Nacional Socioambiental.",
};

export default function PaginaNossaGente() {
  const gerarCsv = () => {
    const cabecalho = "Grupo / Comunidade;Identidade Cultural;Região;Municípios;Pauta Central;Fonte Oficial\n";
    const linhas = COMUNIDADES_CATALOGO.map(
      (c) =>
        `"${c.nomeGrupo}";"${c.identidade}";"${c.regiao}";"${c.municipios}";"${c.pautaCentral}";"${c.fonteOficial}"`
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
        <span className="font-semibold text-foreground">Nossa Gente</span>
      </nav>

      {/* CABEÇALHO */}
      <header className="mb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            #natureza
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            #ecossistema
          </span>
          <span className="rounded-full bg-surface-3 px-3 py-0.5 text-xs text-muted">
            Povos Tradicionais & Atingidos
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Nossa Gente
        </h1>
        <p className="mt-3 text-base text-muted sm:text-lg">
          O meio ambiente só é pleno quando inclui as pessoas que vivem da terra, das águas e dos saberes ancestrais.
          Aqui monitoramos comunidades tradicionais, pescadores e populações atingidas.
        </p>

        {/* EPÍGRAFE EDITORIAL */}
        <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-surface-2/60 p-4 text-sm italic text-muted">
          [Espaço para epígrafe/verso da equipe editorial sobre a dignidade do trabalho das mãos e o canto das águas]
        </div>
      </header>

      {/* CARTÕES DE STATUS DE TOPO */}
      <section aria-label="Indicadores da nossa gente" className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Quilombos Mapeados</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">840+</p>
          <span className="mt-1 block text-xs text-muted">Certificados ou em processo (Fundação Palmares/INCRA)</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Famílias de Pescadores</span>
          <p className="mt-2 font-display text-3xl font-bold text-amber-600 dark:text-amber-400">12.000+</p>
          <span className="mt-1 block text-xs text-muted">Impactadas nas bacias do Doce e Paraopeba</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface-2 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Territórios Coletivos</span>
          <p className="mt-2 font-display text-3xl font-bold text-foreground">45</p>
          <span className="mt-1 block text-xs text-muted">Aguardando titulação definitiva em Minas Gerais</span>
        </div>
      </section>

      {/* GRÁFICO SVG NATIVO (Distribuição de Povos e Comunidades Tradicionais) */}
      <section aria-label="Distribuição de comunidades tradicionais" className="mb-12 rounded-2xl border border-border bg-surface-2 p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-foreground">
          Presença de Comunidades Tradicionais por Segmento
        </h2>
        <p className="mt-1 text-xs text-muted">
          Estimativa de núcleos familiares e grupos organizados em defesa territorial e cultural (Fontes: INCRA, DPU e MPMG).
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {[
            { segmento: "Comunidades Quilombolas", pct: 45, familias: "8.500 famílias" },
            { segmento: "Pescadores Artesanais e Ribeirinhos", pct: 30, familias: "5.800 famílias" },
            { segmento: "Geraizeiros e Vazanteiros", pct: 15, familias: "2.900 famílias" },
            { segmento: "Povos Indígenas (Krenak, Maxakali, Xakriabá, Pataxó)", pct: 10, familias: "1.900 famílias" },
          ].map((item) => (
            <div key={item.segmento}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-foreground">{item.segmento}</span>
                <span className="text-muted">{item.familias} ({item.pct}%)</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-amber-600 dark:bg-amber-500 transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TABELA DE COMUNIDADES E GRUPOS */}
      <section aria-label="Comunidades e grupos tradicionais" className="mb-12">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Vozes e Coletivos do Território
            </h2>
            <p className="text-xs text-muted">
              Movimentos, associações de artesãos, pescadores e núcleos de resistência cultural e ambiental.
            </p>
          </div>
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(gerarCsv())}`}
            download="nossa-gente-comunidades-onsa.csv"
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-surface-1 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-surface-3 transition-colors sm:self-auto"
          >
            📥 Baixar Planilha (CSV)
          </a>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface-2 shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface-3 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Grupo / Comunidade</th>
                <th className="px-4 py-3">Identidade</th>
                <th className="px-4 py-3">Região & Cidades</th>
                <th className="px-4 py-3">Pauta Central</th>
                <th className="px-4 py-3">Fonte Oficial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMUNIDADES_CATALOGO.map((c) => (
                <tr key={c.id} className="hover:bg-surface-1/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{c.nomeGrupo}</td>
                  <td className="px-4 py-3 text-xs text-muted">{c.identidade}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-medium text-foreground">{c.regiao}</span>
                    <span className="block text-[11px] text-muted">{c.municipios}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{c.pautaCentral}</td>
                  <td className="px-4 py-3 text-xs text-muted">{c.fonteOficial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DIÁLOGO ENTRE FRENTES (Sanfona) */}
      <PainelDialogo
        origemRota="/ambiental/nossa-gente"
        origemTitulo="Povos Tradicionais e Atingidos"
      />

      {/* BLOCO OBRIGATÓRIO: E NOSSO POVO? */}
      <BlocoPovoGente
        variacao="povo"
        territorioNome="as comunidades tradicionais e atingidos"
      />
    </div>
  );
}
