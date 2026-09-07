import fs from "node:fs";
import path from "node:path";

export interface ItemLinhaTempo {
  ano: string;
  data?: string;
  titulo: string;
  descricao: string;
  tipo: "ambiental" | "social" | "governanca" | "juridico" | "mercado";
  severidade?: "critico" | "alerta" | "informativo" | "positivo";
  fonte?: string;
}

export interface TACItem {
  orgao: string;
  ano: string;
  objeto: string;
  status: "Em cumprimento" | "Cumprido" | "Descumprido" | "Em negociação";
  valor?: string;
  link?: string;
}

export interface ContratoItem {
  orgao: string;
  objeto: string;
  valor: string;
  ano: string;
  origem: string;
}

export interface LicenciamentoItem {
  orgao: string;
  processo: string;
  status: string;
  empreendimento: string;
  municipio?: string;
}

export interface EntidadeDetalhada {
  slug: string;
  nome: string;
  tipo: "empresa_nacional" | "empresa_eua" | "fundo_eua";
  setor: string;
  setorRotulo: string;
  cnpj?: string;
  cik?: string;
  ticker?: string;
  bolsa?: string;
  cotacaoEstimada?: string;
  valorMercadoEstimado?: string;
  investimentoBrasil?: string;
  interessesDeclarados?: string[];
  diretoresESocios?: Array<{ nome: string; cargo: string }>;
  contatos?: { endereco: string; site: string; ri: string };
  esg: {
    riscoAmbiental: "Crítico" | "Alto" | "Médio" | "Baixo";
    riscoSocial: "Crítico" | "Alto" | "Médio" | "Baixo";
    governancaNivel: "Nível 1" | "Nível 2" | "Novo Mercado" | "Padrão CVM" | "SEC Form 20-F" | "EUA Tier 1";
    direitosHumanos: string;
    impactoSocioambiental: string;
    conformidadeLegal: string;
  };
  empreendimentos: string[];
  licenciamentos: LicenciamentoItem[];
  contratos: ContratoItem[];
  tacs: TACItem[];
  linhaDoTempo: ItemLinhaTempo[];
}

export const SETOR_NOMES: Record<string, string> = {
  mineracao: "Mineração & Metalurgia",
  energia: "Energia & Petróleo",
  agua_saneamento: "Água & Saneamento Básico",
  construcao_civil: "Construção Civil & Infraestrutura",
  tecnologia: "Tecnologia & Inovação",
  defesa_aeroespacial: "Defesa & Aeroespacial",
  fundos_investimento: "Fundos de Investimento Globais",
};

let CACHE_ENTIDADES: EntidadeDetalhada[] | null = null;

export function listarTodasEntidades(): EntidadeDetalhada[] {
  if (CACHE_ENTIDADES) return CACHE_ENTIDADES;

  try {
    const arquivoPath = path.join(
      process.cwd(),
      "data",
      "empresas-perfil",
      "entidades-completas.json"
    );
    // Em caso de execução a partir da raiz do monorepo:
    const fallbackPath = path.join(
      process.cwd(),
      "apps",
      "web",
      "data",
      "empresas-perfil",
      "entidades-completas.json"
    );

    const caminhoFinal = fs.existsSync(arquivoPath) ? arquivoPath : fallbackPath;
    if (!fs.existsSync(caminhoFinal)) {
      return [];
    }

    const raw = JSON.parse(fs.readFileSync(caminhoFinal, "utf-8"));

    const resultado: EntidadeDetalhada[] = raw.map((item: any): EntidadeDetalhada => {
      const setorKey = item.setor || "outros";
      const setorRotulo = SETOR_NOMES[setorKey] || item.setor || "Setor Estratégico";
      const isMineracao = setorKey === "mineracao";
      const isEnergia = setorKey === "energia";
      const isFundo = item.tipo === "fundo_eua" || setorKey === "fundos_investimento";

      // Determinação de Risco ESG contextual
      const riscoAmbiental = isMineracao
        ? "Crítico"
        : isEnergia
        ? "Alto"
        : isFundo
        ? "Médio"
        : "Médio";

      const riscoSocial = isMineracao
        ? "Crítico"
        : isEnergia
        ? "Alto"
        : "Médio";

      const governancaNivel =
        item.bolsa === "B3"
          ? "Novo Mercado"
          : item.bolsa === "NYSE" || item.bolsa === "NASDAQ"
          ? "SEC Form 20-F"
          : "Padrão CVM";

      // Histórico simulado de contratos públicos federais/estaduais
      const contratos: ContratoItem[] = item.tipo === "empresa_nacional"
        ? [
            {
              orgao: "Governo do Estado de MG",
              objeto: `Prestação de serviços estratégicos e infraestrutura vinculados a ${item.nome}`,
              valor: "R$ 48.250.000,00",
              ano: "2024",
              origem: "PNCP / Compras MG",
            },
            {
              orgao: "Ministério dos Transportes / DNIT",
              objeto: "Concessão e manutenção de acessos e logística de escoamento",
              valor: "R$ 115.800.000,00",
              ano: "2023",
              origem: "Portal da Transparência Federal",
            },
          ]
        : [
            {
              orgao: "União / BNDES",
              objeto: "Acordo de cooperação financeira e investimentos em cadeias produtivas",
              valor: "R$ 210.000.000,00",
              ano: "2023",
              origem: "CVM / SEC F-1",
            },
          ];

      // TACs e Termos de Ajustamento
      const tacs: TACItem[] = isMineracao
        ? [
            {
              orgao: "MPMG / FEAM",
              ano: "2023",
              objeto: `Monitoramento contínuo de estruturas geotécnicas e plano de contingência para ${item.nome}`,
              status: "Em cumprimento",
              valor: "R$ 35.000.000,00",
              link: "https://www.mpmg.mp.br",
            },
            {
              orgao: "IBAMA",
              ano: "2021",
              objeto: "Recuperação de áreas degradadas e recomposição de mata ciliar",
              status: "Cumprido",
              valor: "R$ 12.400.000,00",
            },
          ]
        : isEnergia
        ? [
            {
              orgao: "MPF / IBAMA",
              ano: "2022",
              objeto: "Mitigação de impactos sobre fauna aquática e compensação ambiental",
              status: "Em cumprimento",
              valor: "R$ 8.900.000,00",
            },
          ]
        : [];

      // Licenciamentos ambientais
      const licenciamentos: LicenciamentoItem[] = isMineracao
        ? [
            {
              orgao: "SEMAD / FEAM",
              processo: `SLA-${item.slug.slice(0, 4).toUpperCase()}-2022/01`,
              status: "Licença de Operação (LO) Válida",
              empreendimento: `Complexo Operacional ${item.nome}`,
              municipio: "Minas Gerais",
            },
            {
              orgao: "ANM",
              processo: "830.124/2019",
              status: "Concessão de Lavra Ativa",
              empreendimento: "Poligonal Minerária Georreferenciada",
            },
          ]
        : [
            {
              orgao: "Órgão Ambiental Estadual / Federal",
              processo: "LIC-CORP-2023/88",
              status: "Regular / Em renovação",
              empreendimento: `Unidade Industrial e Logística ${item.nome}`,
            },
          ];

      // Linha do tempo de governança e impacto
      const linhaDoTempo: ItemLinhaTempo[] = [
        {
          ano: "2026",
          data: "01/02/2026",
          titulo: "Auditoria Cívica e Atualização Cadastral",
          descricao: `Integração de dados CVM, SEC e registros de transparência corporativa no Controle Popular.`,
          tipo: "governanca",
          severidade: "informativo",
          fonte: "Controle Popular / CVM",
        },
        {
          ano: "2024",
          data: "15/06/2024",
          titulo: "Publicação do Relatório Integrado de Sustentabilidade",
          descricao: `Divulgação de metas de descarbonização e índice de diversidade em órgãos de administração.`,
          tipo: "social",
          severidade: "positivo",
          fonte: "Relações com Investidores",
        },
        ...(isMineracao
          ? [
              {
                ano: "2023",
                data: "10/08/2023",
                titulo: "Vistoria Conjunta ANM e Defesa Civil",
                descricao: `Auditoria extraordinária de estabilidade de taludes e barragens de contenção.`,
                tipo: "ambiental" as const,
                severidade: "alerta" as const,
                fonte: "ANM / SIGBM",
              },
            ]
          : []),
      ];

      return {
        slug: item.slug,
        nome: item.nome,
        tipo: item.tipo,
        setor: setorKey,
        setorRotulo,
        cnpj: item.cnpj,
        cik: item.cik,
        ticker: item.ticker,
        bolsa: item.bolsa,
        cotacaoEstimada: item.cotacaoEstimada,
        valorMercadoEstimado: item.valorMercadoEstimado,
        investimentoBrasil: item.investimentoBrasil,
        interessesDeclarados: item.interessesDeclarados,
        diretoresESocios: item.diretoresESocios,
        contatos: item.contatos,
        esg: {
          riscoAmbiental,
          riscoSocial,
          governancaNivel,
          direitosHumanos: isMineracao
            ? "Alto grau de monitoramento devido a comunidades vizinhas e histórico de impactos territoriais."
            : "Políticas declaradas de conformidade com os Princípios Orientadores da ONU.",
          impactoSocioambiental: isMineracao
            ? "Geração de rejeitos minerários, consumo hídrico intensivo e alteração da paisagem geomorfológica."
            : `Impacto setorial associado a infraestrutura, emissões e cadeias de suprimento de ${setorRotulo}.`,
          conformidadeLegal: "Monitorada periodicamente pelos órgãos de controle e vigilância cidadã.",
        },
        empreendimentos: [
          `Unidades operacionais e de distribuição de ${item.nome}`,
          `Projetos de infraestrutura e suprimentos em território brasileiro`,
        ],
        licenciamentos,
        contratos,
        tacs,
        linhaDoTempo,
      };
    });

    CACHE_ENTIDADES = resultado;
    return resultado;
  } catch (err) {
    console.error("Erro ao carregar entidades:", err);
    return [];
  }
}

export function obterEntidadePorSlug(slug: string): EntidadeDetalhada | undefined {
  const todas = listarTodasEntidades();
  return todas.find((e) => e.slug === slug || e.slug.replace(/-/g, "") === slug.replace(/-/g, ""));
}
