import Link from "next/link";
import { Scale, BookOpen, FileText, ArrowRight } from "lucide-react";

export type TemaPassarela = "mariana" | "paraopeba" | "terras" | "patrimonio" | "ambiental";

interface DestinoPassarela {
  titulo: string;
  descricao: string;
  url: string;
  rotuloBadge: string;
  icone: "normas" | "congresso" | "acervo";
}

interface DadosPassarela {
  tituloSecao: string;
  subtituloSecao: string;
  destinos: DestinoPassarela[];
}

const CONFIG_PASSARELA: Record<TemaPassarela, DadosPassarela> = {
  mariana: {
    tituloSecao: "Passarela de Leis & Projetos: Bacia do Rio Doce",
    subtituloSecao:
      "Acompanhe as normas em vigor e os projetos de lei em tramitação no Congresso sobre a reparação de Mariana e os recursos hídricos.",
    destinos: [
      {
        titulo: "Normas da Bacia do Rio Doce",
        descricao:
          "Consulte decretos, resoluções conjuntas e atos estaduais e federais com foco na recuperação do Rio Doce.",
        url: "/ambiental/legislacao?q=Rio+Doce",
        rotuloBadge: "6.300+ Normas",
        icone: "normas",
      },
      {
        titulo: "Projetos de Lei: Recursos Hídricos & Bacias",
        descricao:
          "Proposições legislativas da Câmara e do Senado que tratam de segurança hídrica, saneamento e bacias de rios.",
        url: "/congresso/proposicoes?q=recursos+hidricos",
        rotuloBadge: "Congresso Nacional",
        icone: "congresso",
      },
      {
        titulo: "Biblioteca de Desastres: Rio Doce & Mariana",
        descricao:
          "Acervo com 291 relatórios, notas técnicas de ATIs, deliberações do CBH-Doce e prestação de contas da repactuação.",
        url: "/ambiental/crimes-socioambientais",
        rotuloBadge: "Acervo Documental",
        icone: "acervo",
      },
    ],
  },
  paraopeba: {
    tituloSecao: "Passarela de Leis & Projetos: Bacia do Paraopeba",
    subtituloSecao:
      "Fiscalize a legislação estadual e federal de segurança de barragens e os projetos de lei de reparação aos atingidos.",
    destinos: [
      {
        titulo: "Legislação: Paraopeba & Mineração",
        descricao:
          "Normas estaduais de MG e federais aplicadas à Bacia do Paraopeba, fiscalização de barragens e reparação integral.",
        url: "/ambiental/legislacao?q=Paraopeba",
        rotuloBadge: "6.300+ Normas",
        icone: "normas",
      },
      {
        titulo: "Projetos de Lei: Barragens & Crimes Ambientais",
        descricao:
          "PLs federais sobre descaracterização de barragens, responsabilidade penal de mineradoras e direitos dos atingidos.",
        url: "/congresso/proposicoes?q=barragens",
        rotuloBadge: "Congresso Nacional",
        icone: "congresso",
      },
      {
        titulo: "Biblioteca Paraopeba: 645 Documentos das ATIs",
        descricao:
          "Estudos técnicos independentes da AEDAS, Instituto Guaicuy e NACAB sobre a contaminação do rio e direitos violados.",
        url: "/paraopeba/biblioteca",
        rotuloBadge: "ATIs Paraopeba",
        icone: "acervo",
      },
    ],
  },
  terras: {
    tituloSecao: "Passarela de Leis & Projetos: Serras, Mineração e Terras",
    subtituloSecao:
      "Conecte o mapa territorial aos marcos legais: direitos de posse, demarcação quilombola/indígena e regulação mineral.",
    destinos: [
      {
        titulo: "Legislação de Serras & Áreas Protegidas",
        descricao:
          "Pesquise as leis ambientais que protegem as serras mineiras, unidades de conservação e zonas de amortecimento.",
        url: "/ambiental/legislacao?q=serras",
        rotuloBadge: "6.300+ Normas",
        icone: "normas",
      },
      {
        titulo: "Projetos de Lei: Código Mineral & Territórios",
        descricao:
          "Proposições sobre concessões minerárias, royalties da CFEM, moratória em topos de serra e titulação fundiária.",
        url: "/congresso/proposicoes?q=mineracao",
        rotuloBadge: "Congresso Nacional",
        icone: "congresso",
      },
      {
        titulo: "Patrimônio Cultural & Paisagístico Tombado",
        descricao:
          "Conheça os 153 bens culturais e conjuntos paisagísticos tombados pelo IEPHA em Minas Gerais que barram degradação.",
        url: "/ambiental/patrimonio-cultural",
        rotuloBadge: "IEPHA-MG",
        icone: "acervo",
      },
    ],
  },
  patrimonio: {
    tituloSecao: "Passarela de Leis & Projetos: Patrimônio Cultural e Ambiental",
    subtituloSecao:
      "Veja como a legislação protege o patrimônio histórico, as paisagens culturais e os saberes tradicionais das cidades.",
    destinos: [
      {
        titulo: "Normas de Tombamento & Meio Ambiente Cultural",
        descricao:
          "Legislação ambiental e patrimonial: decretos de tombamento, instrumentos de salvaguarda e diretrizes do CONEP.",
        url: "/ambiental/legislacao?q=patrimonio",
        rotuloBadge: "6.300+ Normas",
        icone: "normas",
      },
      {
        titulo: "Projetos de Lei: Cultura, Memória e Preservação",
        descricao:
          "Projetos no Congresso sobre incentivo ao patrimônio, combate à destruição de bens históricos e fortalecimento do IPHAN.",
        url: "/congresso/proposicoes?q=patrimonio+cultural",
        rotuloBadge: "Congresso Nacional",
        icone: "congresso",
      },
      {
        titulo: "Função Social da Terra & Territórios Tradicionais",
        descricao:
          "Cruzamento dos bens culturais com territórios quilombolas, comunidades tradicionais e alertas no globo 3D.",
        url: "/funcaosocialterra",
        rotuloBadge: "Território & Memória",
        icone: "acervo",
      },
    ],
  },
  ambiental: {
    tituloSecao: "Passarela Legislativa: Rios, Serras e Clima",
    subtituloSecao:
      "Navegue entre o observatório socioambiental, as mais de 15 mil normas registradas e os projetos de lei do Congresso Nacional.",
    destinos: [
      {
        titulo: "Acervo Unificado de Legislação Ambiental",
        descricao:
          "Busca unificada em 6.378 normas estaduais (ALMG/Semad) e 8.940 normas federais (MMA/CNDH) por tema e palavra-chave.",
        url: "/ambiental/legislacao",
        rotuloBadge: "15.300+ Normas",
        icone: "normas",
      },
      {
        titulo: "Projetos de Lei do Meio Ambiente e Clima",
        descricao:
          "Acompanhe proposições que ampliam ou restringem direitos socioambientais em tramitação na Câmara e no Senado.",
        url: "/congresso/proposicoes",
        rotuloBadge: "Congresso Nacional",
        icone: "congresso",
      },
      {
        titulo: "Biblioteca Unificada de Crimes Socioambientais",
        descricao:
          "936 documentos das maiores tragédias socioambientais do país (Mariana e Brumadinho) catalogados para fiscalização popular.",
        url: "/ambiental/crimes-socioambientais",
        rotuloBadge: "Mariana × Brumadinho",
        icone: "acervo",
      },
    ],
  },
};

export default function PassarelaLegislativa({
  tema,
  className = "",
}: {
  tema: TemaPassarela;
  className?: string;
}) {
  const config = CONFIG_PASSARELA[tema] || CONFIG_PASSARELA.ambiental;

  return (
    <section
      aria-label={config.tituloSecao}
      className={`my-10 rounded-2xl border border-border bg-surface p-6 shadow-xs ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Scale size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-text">
            {config.tituloSecao}
          </h2>
          <p className="mt-0.5 text-sm text-text-soft">
            {config.subtituloSecao}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {config.destinos.map((dest, idx) => (
          <Link
            key={idx}
            href={dest.url}
            className="group flex flex-col justify-between rounded-xl border border-border/80 bg-background/60 p-4 transition-all hover:border-primary hover:bg-background hover:shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-surface px-2 py-0.5 text-[0.72rem] font-semibold tracking-wider text-text-soft uppercase">
                  {dest.rotuloBadge}
                </span>
                {dest.icone === "normas" ? (
                  <BookOpen
                    size={16}
                    className="text-text-soft group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                ) : dest.icone === "congresso" ? (
                  <Scale
                    size={16}
                    className="text-text-soft group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                ) : (
                  <FileText
                    size={16}
                    className="text-text-soft group-hover:text-primary transition-colors"
                    aria-hidden="true"
                  />
                )}
              </div>

              <h3 className="mt-2.5 font-display text-base font-semibold text-text group-hover:text-primary transition-colors">
                {dest.titulo}
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-text-soft">
                {dest.descricao}
              </p>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
              <span>Acessar acervo</span>
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
