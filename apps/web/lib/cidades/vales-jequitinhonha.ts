/**
 * lib/cidades/vales-jequitinhonha.ts
 *
 * Módulo de inteligência territorial e catálogo dos 55 municípios do Vale do Jequitinhonha (MG).
 *
 * ═══ PAPEL NO PORTAL CÍVICO ═══
 * Este módulo reúne os dados socioterritoriais, econômicos e de governança pública dos 55 municípios
 * que formam o Vale do Jequitinhonha, no nordeste do estado de Minas Gerais.
 * Suas funções centrais no Controle Popular são:
 * 1. Estruturar a navegação cívica e transparência ativa nas 55 cidades da bacia;
 * 2. Mapear o Polo do Lítio (mineral crítico para transição energética e baterias) e permitir
 *    o acompanhamento cidadão das receitas da CFEM (Compensação Financeira pela Exploração Mineral);
 * 3. Assegurar visibilidade às Comunidades Tradicionais (Quilombolas, Geraizeiros, Vazanteiros e Indígenas),
 *    evitando a invisibilização dessas populações nos relatórios de impacto socioambiental;
 * 4. Fornecer links paramétricos auditáveis e canônicos para o PNCP (Portal Nacional de Contratações Públicas).
 *
 * ═══ FONTES OFICIAIS DE DADOS ═══
 * - IBGE (Instituto Brasileiro de Geografia e Estatística): Nomenclaturas, malhas territoriais
 *   e códigos padronizados (7 dígitos com dígito verificador módulo 10 e 6 dígitos).
 * - PNCP / Lei Federal 14.133/2021: Portal Nacional de Contratações Públicas (compras e contratos).
 * - ANM (Agência Nacional de Mineração) / CPRM-SGB: Registros de títulos minerários, reservas
 *   de espodumênio/lítio na Faixa Pegmatítica do Médio Jequitinhonha (ex: Araçuaí, Itinga).
 * - FCP (Fundação Cultural Palmares) e INCRA: Certificação de territórios quilombolas e assentamentos tradicionais.
 * - IGAM / CBH-Jequitinhonha: Delimitação das sub-bacias do Rio Jequitinhonha (Alto, Médio e Baixo).
 *
 * ═══ DECISÕES DE ARQUITETURA E DESENHO TÉCNICO ═══
 * - Divisão Tripartite Oficial: O território é estruturado em Alto, Médio e Baixo Jequitinhonha,
 *   respeitando as especificidades bioclimáticas e a hidrografia regional.
 * - Performance estática com JSON versionado (`vales-jequitinhonha.json`): Dados lidos no build time,
 *   sem necessidade de consultar o Postgres a cada renderização de página pública.
 * - Cache Singleton em memória (`cacheCatalogo`): Minimiza I/O em tempo de execução server-side.
 * - Resolução elástica de caminhos (`resolverCaminhoJson`): Compatível com execução a partir
 *   da raiz, da pasta `apps/web` ou de suítes de teste automatizado (Vitest).
 * - Tabela de Alias (`ALIAS_IBGE_LEGADO`): Compatibiliza códigos históricos com dígito verificador
 *   divergente, assegurando que buscas de cidadãos ou links antigos continuem funcionando.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Classificação regional tripartite do Vale do Jequitinhonha conforme hidrografia e relevo:
 * - Alto Jequitinhonha: Região de cabeceiras na Serra do Espinhaço (Diamantina, Minas Novas, Capelinha).
 * - Médio Jequitinhonha: Centro do vale e polo pegmatítico de lítio (Araçuaí, Itinga, Pedra Azul).
 * - Baixo Jequitinhonha: Próximo à divisa com o sul da Bahia, foz na Mata Atlântica (Almenara, Salto da Divisa).
 */
export type SubRegiaoJequitinhonha =
  | "Alto Jequitinhonha"
  | "Médio Jequitinhonha"
  | "Baixo Jequitinhonha";

/**
 * Interface representativa de um município do Vale do Jequitinhonha.
 */
export interface MunicipioJequitinhonha {
  /** Código IBGE oficial de 7 dígitos com DV (algoritmo mod-10). */
  id_ibge7: string;
  /** Código IBGE de 6 dígitos (utilizado em sistemas federais de repasse). */
  id_ibge6: string;
  /** Nome canônico oficial do município registrado no IBGE. */
  nome: string;
  /** Sub-região geográfica (Alto, Médio ou Baixo Jequitinhonha). */
  sub_regiao: SubRegiaoJequitinhonha;
  /** Cidade polo mais próxima para comércio, saúde e serviços públicos. */
  polo_regional: string;
  /** Indica se o município possui lavra ativa, pesquisa ou reservas reconhecidas de lítio. */
  tem_litio: boolean;
  /** Indica se há comunidades tradicionais mapeadas ou certificadas. */
  tem_comunidades_tradicionais: boolean;
  /** Tipos de povos e comunidades tradicionais presentes (ex: Quilombolas, Geraizeiros, Vazanteiros). */
  tipo_comunidade: string[];
  /** Bacia hidrográfica principal que banha o município. */
  bacia_principal: string;
  /** Rótulos temáticos para busca, contextualização e categorização. */
  tags: string[];
  /** URL de consulta de contratações públicas auditáveis no PNCP. */
  link_pncp: string;
  /** Link para o portal próprio de transparência da prefeitura. */
  link_transparencia: string;
}

/**
 * Catálogo completo consolidado dos 55 municípios do Vale do Jequitinhonha.
 */
export interface CatalogoJequitinhonha {
  /** Contagem total de cidades no catálogo (55 municípios). */
  total_cidades: number;
  /** Relação das três sub-regiões do território. */
  sub_regioes: SubRegiaoJequitinhonha[];
  /** População total estimada somada de todos os municípios da bacia. */
  populacao_total_estimada: number;
  /** Bioma predominante no território (Cerrado, Caatinga e Mata Atlântica). */
  bioma_predominante: string;
  /** Bacia hidrográfica principal que define o vale. */
  bacia_hidrografica: string;
  /** Data da extração dos dados no formato ISO (AAAA-MM-DD). */
  atualizado_em: string;
  /** Fontes públicas oficiais utilizadas para composição da base. */
  fonte: string;
  /** Lista completa dos 55 municípios tipados. */
  municipios: MunicipioJequitinhonha[];
}

/**
 * Estatísticas e métricas analíticas agregadas para exibição no painel de controle do Vale.
 */
export interface EstatisticasJequitinhonha {
  /** Quantidade total de cidades catalogadas. */
  totalCidades: number;
  /** Quantidade de municípios envolvidos na cadeia extrativa do lítio. */
  totalLitio: number;
  /** Quantidade de municípios com povos ou comunidades tradicionais. */
  totalTradicionais: number;
  /** População regional total somada. */
  populacaoTotal: number;
  /** Contagem de municípios por sub-região (Alto, Médio e Baixo). */
  municipiosPorSubregiao: Record<SubRegiaoJequitinhonha, number>;
  /** Relação de todos os tipos de comunidades tradicionais presentes. */
  tiposComunidades: string[];
  /** Lista única das principais bacias hidrográficas. */
  baciasPrincipais: string[];
  /** Lista dos polos regionais de referência. */
  polosRegionais: string[];
}

/**
 * Mapeamento de compatibilidade para códigos legados ou rascunhos com dígito verificador incorreto.
 *
 * ═══ MOTIVO TÉCNICO DA NORMALIZAÇÃO ═══
 * Diversos sistemas estaduais e planilhas legadas contêm códigos IBGE de 7 dígitos com DV
 * calculado incorretamente ou gerados por sistemas pré-consolidação do IBGE.
 * Este mapeamento traduz requisições com códigos legados diretamente para o código
 * canônico e oficial mantido pelo IBGE.
 */
const ALIAS_IBGE_LEGADO: Record<string, string> = {
  // Alto Jequitinhonha
  "3153303": "3153301", // Presidente Kubitschek
  "3162577": "3125507", // São Gonçalo do Rio Preto
  "3166107": "3165909", // Senador Modestino Gonçalves
  "3113107": "3113503", // Carbonita
  "3171156": "3171071", // Veredinha

  // Médio Jequitinhonha
  "3115904": "3116100", // Chapada do Norte
  "3134905": "3135456", // Jenipapo de Minas
  "3135357": "3136520", // José Gonçalves de Minas
  "3141407": "3141405", // Medina
  "3152131": "3152170", // Ponto dos Volantes
  "3171602": "3171600", // Virgem da Lapa
  "3141803": "3141801", // Minas Novas
  "3169705": "3169703", // Turmalina
  "3138353": "3138351", // Leme do Prado
  "3148709": "3148707", // Pedra Azul
  "3109808": "3102704", // Cachoeira de Pajeú
  "3117207": "3117009", // Comercinho

  // Baixo Jequitinhonha
  "3105301": "3105202", // Bandeira
  "3125507_BAIXO": "3125606", // Felisburgo
  "3134509": "3134707", // Jacinto
  "3136405": "3136504", // Jordânia
  "3140854": "3140555", // Mata Verde
  "3143155": "3143153", // Monte Formoso
  "3146703": "3146750", // Palmópolis
  "3155100": "3155108", // Rio do Prado
  "3156801": "3156601", // Rubim
  "3157106": "3157104", // Salto da Divisa
  "3158104": "3158102", // Santa Maria do Salto
  "3159003": "3160306", // Santo Antônio do Jacinto
};

/** Cache em memória do catálogo JSON carregado para evitar leituras repetidas de disco. */
let cacheCatalogo: CatalogoJequitinhonha | null = null;

/**
 * Resolve o caminho físico do arquivo `vales-jequitinhonha.json` no sistema de arquivos.
 *
 * Testa sucessivamente múltiplos caminhos possíveis no monorepo para garantir
 * que scripts, testes unitários e servidor web localizem o arquivo sem falha.
 *
 * @returns Caminho absoluto ou relativo resolvido do arquivo JSON.
 */
function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "vales-jequitinhonha.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "vales-jequitinhonha.json"),
    path.resolve(__dirname, "..", "..", "data", "vales-jequitinhonha.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

/**
 * Carrega o catálogo completo dos 55 municípios do Vale do Jequitinhonha com cache em memória.
 *
 * Aplica o padrão Singleton para evitar requisições redundantes de disco I/O.
 *
 * @throws {Error} Se o arquivo físico `vales-jequitinhonha.json` não for encontrado.
 * @returns Objeto com metadados do catálogo e o vetor tipado de municípios.
 */
export function obterCatalogoJequitinhonha(): CatalogoJequitinhonha {
  if (cacheCatalogo) return cacheCatalogo;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo vales-jequitinhonha.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheCatalogo = JSON.parse(raw) as CatalogoJequitinhonha;
  return cacheCatalogo;
}

/**
 * Retorna a lista contendo todos os 55 municípios do Vale do Jequitinhonha.
 *
 * @returns Vetor de objetos `MunicipioJequitinhonha`.
 */
export function listarMunicipiosJequitinhonha(): MunicipioJequitinhonha[] {
  return obterCatalogoJequitinhonha().municipios;
}

/**
 * Localiza um município específico pelo código IBGE (7 ou 6 dígitos), com suporte a alias legado.
 *
 * @param id Código IBGE com 7 ou 6 dígitos (ex: "3103405" ou "310340").
 * @returns O município correspondente ou `undefined` se não constar no catálogo.
 */
export function obterMunicipioJequitinhonhaPorIbge(id: string): MunicipioJequitinhonha | undefined {
  const termo = id.trim();
  const idNormalizado = ALIAS_IBGE_LEGADO[termo] || termo;
  const municipios = listarMunicipiosJequitinhonha();

  return municipios.find(
    (m) =>
      m.id_ibge7 === idNormalizado ||
      m.id_ibge6 === idNormalizado ||
      m.id_ibge7 === termo ||
      m.id_ibge6 === termo
  );
}

/**
 * Retorna os municípios com reservas, pesquisas ou projetos minerários de lítio.
 *
 * ═══ RELEVÂNCIA PÚBLICA DO LÍTIO ═══
 * O projeto "Lithium Valley Brazil" atraiu grandes empreendimentos internacionais
 * para o Médio Jequitinhonha. Este filtro viabiliza auditoria cidadã das compensações
 * financeiras (CFEM), das licenças ambientais emitidas e do impacto no uso de água regional.
 *
 * @returns Lista de municípios onde `tem_litio === true`.
 */
export function listarMunicipiosLitio(): MunicipioJequitinhonha[] {
  return listarMunicipiosJequitinhonha().filter((m) => m.tem_litio);
}

/**
 * Retorna municípios com presença reconhecida de povos e comunidades tradicionais.
 *
 * Filtra municípios habitados por Quilombolas, Geraizeiros, Vazanteiros ou Indígenas.
 *
 * @returns Lista de municípios onde `tem_comunidades_tradicionais === true`.
 */
export function listarMunicipiosTradicionais(): MunicipioJequitinhonha[] {
  return listarMunicipiosJequitinhonha().filter((m) => m.tem_comunidades_tradicionais);
}

/**
 * Filtra e retorna municípios de acordo com a sub-região geográfica (Alto, Médio ou Baixo).
 *
 * @param subregiao Sub-região desejada ("Alto Jequitinhonha", "Médio Jequitinhonha" ou "Baixo Jequitinhonha").
 * @returns Vetor de municípios pertencentes à sub-região informada.
 */
export function listarPorSubregiao(subregiao: SubRegiaoJequitinhonha): MunicipioJequitinhonha[] {
  return listarMunicipiosJequitinhonha().filter((m) => m.sub_regiao === subregiao);
}

/**
 * Busca flexível de municípios por termo textual em múltiplos campos.
 *
 * ═══ ALGORITMO DE BUSCA E NORMALIZAÇÃO ═══
 * Executa normalização NFD sem diacríticos (acentos) e caixa baixa tanto no termo
 * de pesquisa quanto nos dados dos municípios.
 * Campos inspecionados:
 * - Nome do município;
 * - Bacia hidrográfica principal;
 * - Nome da sub-região;
 * - Códigos IBGE (7 e 6 dígitos);
 * - Tags temáticas;
 * - Tipos de comunidades tradicionais (ex: busca por "quilombola" retorna todas as cidades com quilombos).
 *
 * @param termo Termo de busca digitado pelo usuário.
 * @returns Vetor de municípios compatíveis com o termo fornecido.
 */
export function buscarMunicipiosJequitinhonha(termo: string): MunicipioJequitinhonha[] {
  const normalizado = termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizado) return listarMunicipiosJequitinhonha();

  return listarMunicipiosJequitinhonha().filter((m) => {
    const nomeNorm = m.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const baciaNorm = m.bacia_principal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const subNorm = m.sub_regiao
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const tagsNorm = m.tags.map((t) =>
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    const comNorm = m.tipo_comunidade.map((c) =>
      c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    return (
      nomeNorm.includes(normalizado) ||
      baciaNorm.includes(normalizado) ||
      subNorm.includes(normalizado) ||
      m.id_ibge7.includes(normalizado) ||
      m.id_ibge6.includes(normalizado) ||
      tagsNorm.some((t) => t.includes(normalizado)) ||
      comNorm.some((c) => c.includes(normalizado))
    );
  });
}

/**
 * Calcula e retorna estatísticas consolidadas do território do Vale do Jequitinhonha.
 *
 * Realiza agregação em passada única O(N), computando contagens por sub-região,
 * totais minerários e de comunidades tradicionais, e ordenando listas de bacias e polos.
 *
 * @returns Objeto `EstatisticasJequitinhonha` preenchido.
 */
export function obterEstatisticasJequitinhonha(): EstatisticasJequitinhonha {
  const cat = obterCatalogoJequitinhonha();
  const municipios = cat.municipios;

  const porSub: Record<SubRegiaoJequitinhonha, number> = {
    "Alto Jequitinhonha": 0,
    "Médio Jequitinhonha": 0,
    "Baixo Jequitinhonha": 0,
  };

  const tiposSet = new Set<string>();
  const baciasSet = new Set<string>();
  const polosSet = new Set<string>();
  let totalLitio = 0;
  let totalTradicionais = 0;

  for (const m of municipios) {
    if (m.sub_regiao in porSub) {
      porSub[m.sub_regiao]++;
    }
    if (m.tem_litio) {
      totalLitio++;
    }
    if (m.tem_comunidades_tradicionais) {
      totalTradicionais++;
    }
    for (const tipo of m.tipo_comunidade) {
      tiposSet.add(tipo);
    }
    if (m.bacia_principal) {
      baciasSet.add(m.bacia_principal);
    }
    if (m.polo_regional) {
      polosSet.add(m.polo_regional);
    }
  }

  return {
    totalCidades: municipios.length,
    totalLitio,
    totalTradicionais,
    populacaoTotal: cat.populacao_total_estimada,
    municipiosPorSubregiao: porSub,
    tiposComunidades: Array.from(tiposSet).sort(),
    baciasPrincipais: Array.from(baciasSet).sort(),
    polosRegionais: Array.from(polosSet).sort(),
  };
}
