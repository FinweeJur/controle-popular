/**
 * lib/cidades/vales-mucuri.ts
 *
 * Módulo de inteligência territorial e catálogo dos 27 municípios do Vale do Mucuri (MG).
 *
 * ═══ PAPEL NO PORTAL CÍVICO ═══
 * Este módulo estrutura as informações geo-sociais, administrativas e de controle cívico
 * para todos os 27 municípios que compõem o Vale do Mucuri, no nordeste de Minas Gerais.
 * Ele alimenta:
 * 1. Páginas municipais dedicadas com estatísticas e contexto da região;
 * 2. Links canônicos para auditoria direta no PNCP (Portal Nacional de Contratações Públicas);
 * 3. Mapeamento de vulnerabilidade socioambiental e garantia de direitos originários
 *    (presença de Terras Indígenas do Povo Maxakali);
 * 4. Contextualização para o assistente de IA cidadão (Seu Nonô).
 *
 * ═══ FONTES OFICIAIS DE DADOS ═══
 * - IBGE (Instituto Brasileiro de Geografia e Estatística): Malha municipal oficial,
 *   nomenclaturas canônicas e códigos territoriais (padrão 7 dígitos com DV e 6 dígitos).
 * - PNCP / Lei Federal 14.133/2021: Links paramétricos para consulta de contratos e compras públicas.
 * - FUNAI (Fundação Nacional dos Povos Indígenas): Delimitação e homologação de terras
 *   tradicionais do Povo Maxakali (ex: TI Maxakali em Bertópolis/Santa Helena de Minas e Aldeia Verde em Ladainha).
 * - IGAM / CBH-Mucuri: Informações hidrográficas da Bacia do Rio Mucuri e rios afluentes.
 *
 * ═══ DECISÕES DE ARQUITETURA E DESENHO TÉCNICO ═══
 * - Armazenamento estático em JSON (`vales-mucuri.json`): Compactado e versionado,
 *   garante carregamento instantâneo em tempo de build (SSG/ISR), eliminando overhead
 *   de banco de dados em páginas com alta frequência de acesso.
 * - Cache em memória singleton (`cacheCatalogo`): Evita leitura repetida de disco I/O
 *   a cada requisição server-side ou execução de teste.
 * - Resolução elástica de caminhos (`resolverCaminhoJson`): O monorepo possui múltiplos
 *   pontos de execução (raiz do monorepo, pasta `apps/web`, executores Vitest e scripts).
 *   O resolvedor percorre os caminhos canônicos sem quebrar em nenhum ambiente.
 * - Resolução por Alias de Códigos IBGE (`ALIAS_IBGE_LEGADO`): Em acervos externos legados
 *   ou digitações em relatórios antigos, dígitos verificadores incorretos impediam a correlação.
 *   O mapa de alias resolve para o código IBGE oficial sem perda de compatibilidade.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Polos regionais de referência e prestação de serviços no Vale do Mucuri.
 * - Teófilo Otoni: Principal polo universitário, médico-hospitalar e comercial do nordeste mineiro.
 * - Nanuque: Polo do Baixo Mucuri, estratégico na divisa com Espírito Santo e Bahia.
 */
export type PoloRegionalMucuri = "Teófilo Otoni" | "Nanuque";

/**
 * Estrutura representativa de um município do Vale do Mucuri.
 * Todos os campos contêm dados públicos e auditáveis.
 */
export interface MunicipioMucuri {
  /** Código IBGE oficial completo de 7 dígitos (com dígito verificador módulo 10). */
  id_ibge7: string;
  /** Código IBGE truncado de 6 dígitos (utilizado por sistemas federais como SIAFI/DataSUS). */
  id_ibge6: string;
  /** Nome canônico oficial do município conforme registro do IBGE. */
  nome: string;
  /** Polo regional de influência socioeconômica mais próximo. */
  polo_regional: PoloRegionalMucuri;
  /** Indica se há presença de terras indígenas demarcadas ou em processo pela FUNAI. */
  tem_terras_indigenas: boolean;
  /** Nome da etnia/povo indígena presente (ex: "Maxakali"), ou null caso inexista. */
  povo_indigena: string | null;
  /** Bacia ou sub-bacia hidrográfica principal que corta o território municipal. */
  bacia_principal: string;
  /** Marcadores temáticos e vocações socioeconômicas para indexação e busca. */
  tags: string[];
  /** URL oficial para consulta pública de contratos do município no PNCP. */
  link_pncp: string;
  /** URL do portal próprio de transparência do município ou da câmara municipal. */
  link_transparencia: string;
}

/**
 * Metadados globais e coleção dos municípios do catálogo regional do Mucuri.
 */
export interface CatalogoMucuri {
  /** Quantidade total de municípios catalogados (27 municípios). */
  total_cidades: number;
  /** Polo regional predominante no catálogo. */
  polo_regional: string;
  /** Bacia hidrográfica principal que drena a região. */
  bacia_hidrografica: string;
  /** Bioma predominante no território (Mata Atlântica com faixas de transição para Caatinga). */
  bioma: string;
  /** Data da última atualização dos dados no formato ISO (AAAA-MM-DD). */
  atualizado_em: string;
  /** Órgãos oficiais e fontes de extração da base de dados. */
  fonte: string;
  /** Lista completa dos 27 municípios do território. */
  municipios: MunicipioMucuri[];
}

/**
 * Métricas agregadas e consolidadas para os cartões de topo da interface.
 */
export interface EstatisticasMucuri {
  /** Total de cidades que compõem o território do Vale do Mucuri. */
  totalCidades: number;
  /** Total de cidades com demarcação oficial de terras indígenas. */
  totalIndigenas: number;
  /** Distribuição da contagem de municípios subordinados a cada polo regional. */
  municipiosPorPolo: Record<PoloRegionalMucuri, number>;
  /** Relação única de povos originários residentes na região. */
  povosIndigenas: string[];
  /** Bacias e sub-bacias hidrográficas presentes nos municípios. */
  baciasPrincipais: string[];
}

/**
 * Mapeamento de compatibilidade para códigos legados ou rascunhos com dígito verificador incorreto.
 *
 * ═══ POR QUE ESTE MAPA EXISTE ═══
 * O código IBGE municipal possui 7 dígitos, onde o último é um dígito verificador (DV)
 * calculado pelo algoritmo de Luhn (módulo 10 com pesos 1 e 2).
 * Em várias bases governamentais antigas, planilhas históricas e sistemas legados,
 * erros de cálculo geraram códigos com DV falso (ex: "3168608" em vez de "3168606" para Teófilo Otoni).
 * Este dicionário intercepta a consulta antes do filtro, garantindo que links antigos,
 * denúncias ou integrações de terceiros não resultem em erro 404.
 */
const ALIAS_IBGE_LEGADO: Record<string, string> = {
  "3168608": "3168606", // Teófilo Otoni
  "3110905": "3110806", // Campanário
  "3113206": "3113008", // Caraí
  "3115607": "3115458", // Catuji
  "3132404": "3132305", // Itaipé
  "3137502": "3137007", // Ladainha
  "3138908": "3138906", // Machacalis
  "3139203": "3139201", // Malacacheta
  "3144302": "3144300", // Nanuque
  "3144906": "3144904", // Nova Módica
  "3145309": "3145307", // Novo Cruzeiro
  "3145358": "3145356", // Novo Oriente de Minas
  "3146208": "3146206", // Ouro Verde de Minas
  "3148402": "3148509", // Pavão
  "3149509": "3150000", // Pescador
  "3152909": "3152402", // Poté
  "3157700": "3157658", // Santa Helena de Minas
  "3163609": "3163300", // São José do Divino
  "3166701": "3166709", // Serra dos Aimorés
  "3170307": "3170305", // Umburatiba
};

/** Cache em memória do catálogo JSON carregado para evitar leituras repetidas de disco. */
let cacheCatalogo: CatalogoMucuri | null = null;

/**
 * Resolve o caminho físico do arquivo `vales-mucuri.json` de forma resiliente.
 *
 * ═══ POR QUE TESTAR MÚLTIPLOS CAMINHOS ═══
 * O monorepo do Controle Popular executa em diferentes contextos:
 * 1. Raiz do repositório (`process.cwd()` aponta para a raiz);
 * 2. Aplicação web (`process.cwd()` aponta para `apps/web`);
 * 3. Execução de testes com Vitest (`__dirname` relativo à pasta `lib/cidades`).
 * A iteração testa a existência em ordem e retorna o primeiro caminho válido,
 * prevenindo quebras de build e de testes.
 *
 * @returns Caminho absoluto ou relativo resolvido do arquivo JSON.
 */
function resolverCaminhoJson(): string {
  const caminhos = [
    path.resolve(process.cwd(), "data", "vales-mucuri.json"),
    path.resolve(process.cwd(), "apps", "web", "data", "vales-mucuri.json"),
    path.resolve(__dirname, "..", "..", "data", "vales-mucuri.json"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) return c;
  }
  return caminhos[0];
}

/**
 * Carrega o catálogo completo dos 27 municípios do Vale do Mucuri com cache em memória.
 *
 * Lê o arquivo `vales-mucuri.json` apenas na primeira chamada. As chamadas subsequentes
 * utilizam a referência já instanciada em memória (padrão Singleton), economizando I/O.
 *
 * @throws {Error} Caso o arquivo físico do catálogo não seja localizado nos caminhos esperados.
 * @returns Objeto com metadados do catálogo e a lista tipada de municípios.
 */
export function obterCatalogoMucuri(): CatalogoMucuri {
  if (cacheCatalogo) return cacheCatalogo;

  const jsonPath = resolverCaminhoJson();
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Arquivo vales-mucuri.json não encontrado em: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, "utf-8");
  cacheCatalogo = JSON.parse(raw) as CatalogoMucuri;
  return cacheCatalogo;
}

/**
 * Retorna a lista contendo todos os 27 municípios do Vale do Mucuri.
 *
 * Função conveniente que desacopla os metadados do catálogo da lista pura de cidades.
 *
 * @returns Vetor de objetos `MunicipioMucuri`.
 */
export function listarMunicipiosMucuri(): MunicipioMucuri[] {
  return obterCatalogoMucuri().municipios;
}

/**
 * Localiza um município específico pelo código IBGE oficial, truncado ou legado.
 *
 * ═══ ESTRATÉGIA DE RESOLUÇÃO ═══
 * 1. Normaliza o termo de entrada removendo espaços em branco;
 * 2. Verifica se o código consta na tabela `ALIAS_IBGE_LEGADO` (corrige DVs errôneos);
 * 3. Busca correspondência por código de 7 dígitos (`id_ibge7`) ou 6 dígitos (`id_ibge6`).
 *
 * @param id Código IBGE de 6 ou 7 dígitos (ex: "3168606" ou "316860").
 * @returns Objeto do município localizado ou `undefined` se inexistente no catálogo.
 */
export function obterMunicipioMucuriPorIbge(id: string): MunicipioMucuri | undefined {
  const termo = id.trim();
  const idNormalizado = ALIAS_IBGE_LEGADO[termo] || termo;
  const municipios = listarMunicipiosMucuri();

  return municipios.find(
    (m) =>
      m.id_ibge7 === idNormalizado ||
      m.id_ibge6 === idNormalizado ||
      m.id_ibge7 === termo ||
      m.id_ibge6 === termo
  );
}

/**
 * Filtra e retorna exclusivamente os municípios com presença oficial de terras indígenas.
 *
 * ═══ IMPORTÂNCIA SOCIAL DO RECORTE ═══
 * O Vale do Mucuri abriga o Povo Maxakali (Tikmũ'ũn), uma das etnias mais vulneráveis
 * de Minas Gerais, historicamente pressionada pela degradação florestal e conflitos agrários.
 * Este filtro permite a pesquisadores, órgãos cívicos e cidadãos auditar investimentos
 * públicos e proteção socioambiental específicos dessas localidades.
 *
 * @returns Vetor de municípios com `tem_terras_indigenas === true`.
 */
export function listarMunicipiosIndigenas(): MunicipioMucuri[] {
  return listarMunicipiosMucuri().filter((m) => m.tem_terras_indigenas);
}

/**
 * Retorna os municípios subordinados a determinado polo regional (Teófilo Otoni ou Nanuque).
 *
 * Permite segmentar visualizações e relatórios pelo centro de gravidade socioeconômico.
 *
 * @param polo Nome do polo de referência ("Teófilo Otoni" ou "Nanuque").
 * @returns Lista de municípios cujo `polo_regional` coincide com o argumento.
 */
export function listarMunicipiosPorPolo(polo: PoloRegionalMucuri): MunicipioMucuri[] {
  return listarMunicipiosMucuri().filter((m) => m.polo_regional === polo);
}

/**
 * Realiza busca flexível de municípios por múltiplos critérios textuais.
 *
 * ═══ MECANISMO DE NORMALIZAÇÃO E BUSCA ═══
 * Utiliza decomposição canônica NFD (`normalize("NFD")`) e remoção de diacríticos
 * via expressão regular `[\u0300-\u036f]`. Dessa forma, o cidadão pode buscar
 * "teofilo", "Teófilo", "nanuque" ou "pote" e obter o mesmo resultado correto.
 * A busca inspeciona cumulativamente:
 * - Nome do município;
 * - Nome da bacia hidrográfica;
 * - Códigos IBGE (7 e 6 dígitos);
 * - Tags temáticas associadas ao município.
 *
 * @param termo Palavra-chave, fragmento de nome, código IBGE ou tag.
 * @returns Lista de municípios correspondentes; caso o termo seja vazio, retorna todos.
 */
export function buscarMunicipiosMucuri(termo: string): MunicipioMucuri[] {
  const normalizado = termo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (!normalizado) return listarMunicipiosMucuri();

  return listarMunicipiosMucuri().filter((m) => {
    const nomeNorm = m.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const baciaNorm = m.bacia_principal
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const tagsNorm = m.tags.map((t) =>
      t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    return (
      nomeNorm.includes(normalizado) ||
      baciaNorm.includes(normalizado) ||
      m.id_ibge7.includes(normalizado) ||
      m.id_ibge6.includes(normalizado) ||
      tagsNorm.some((t) => t.includes(normalizado))
    );
  });
}

/**
 * Calcula e retorna estatísticas consolidadas do território do Vale do Mucuri.
 *
 * ═══ EFICIÊNCIA DO CÁLCULO ═══
 * Realiza a agregação em passada única O(N) sobre o acervo de municípios,
 * totalizando contagens por polo, identificando povos indígenas únicos (Set)
 * e mapeando as principais bacias hidrográficas sem repetição.
 *
 * @returns Objeto `EstatisticasMucuri` com os agregados prontos para os cartões de topo.
 */
export function obterEstatisticasMucuri(): EstatisticasMucuri {
  const cat = obterCatalogoMucuri();
  const municipios = cat.municipios;

  const porPolo: Record<PoloRegionalMucuri, number> = {
    "Teófilo Otoni": 0,
    "Nanuque": 0,
  };

  const povosSet = new Set<string>();
  const baciasSet = new Set<string>();
  let totalIndigenas = 0;

  for (const m of municipios) {
    if (m.polo_regional in porPolo) {
      porPolo[m.polo_regional]++;
    }
    if (m.tem_terras_indigenas) {
      totalIndigenas++;
    }
    if (m.povo_indigena) {
      povosSet.add(m.povo_indigena);
    }
    if (m.bacia_principal) {
      baciasSet.add(m.bacia_principal);
    }
  }

  return {
    totalCidades: municipios.length,
    totalIndigenas,
    municipiosPorPolo: porPolo,
    povosIndigenas: Array.from(povosSet),
    baciasPrincipais: Array.from(baciasSet),
  };
}
