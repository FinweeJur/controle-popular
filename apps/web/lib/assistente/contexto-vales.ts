/**
 * apps/web/lib/assistente/contexto-vales.ts
 *
 * Módulo de inteligência territorial e injeção de contexto cívico dos
 * 82 municípios dos Vales do Jequitinhonha e Mucuri para o assistente Seu Nonô.
 *
 * ═══ PAPEL NO PORTAL CÍVICO E NO ASSISTENTE ═══
 * Este módulo atua como a camada de RAG (Retrieval-Augmented Generation) territorial
 * que contextualiza o assistente cívico inteligente do portal ("Seu Nonô").
 * Quando um cidadão faz perguntas como:
 * - "Como ver as compras de Araçuaí?"
 * - "Teófilo Otoni tem terra indígena?"
 * - "Qual a bacia de Almenara?"
 * O módulo recupera com precisão determinística o perfil do município entre os 82 catalogados
 * (55 do Jequitinhonha e 27 do Mucuri), injetando no prompt do modelo:
 * 1. Códigos IBGE oficiais de 7 e 6 dígitos;
 * 2. Bacia hidrográfica e polo regional de atendimento;
 * 3. Presença de Povos Originários (ex: Povo Maxakali) ou Comunidades Tradicionais;
 * 4. Inserção na cadeia produtiva do Lítio (compensação da mineração / CFEM);
 * 5. Hiperlinks auditáveis e diretos para o PNCP (Portal Nacional de Contratações Públicas).
 *
 * ═══ FONTES OFICIAIS DE DADOS ═══
 * - IBGE: Nomenclaturas, limites territoriais e códigos de 6 e 7 dígitos com DV mod-10.
 * - PNCP (Lei Federal 14.133/2021): Links diretos de busca de compras e contratos públicos.
 * - FUNAI: Mapeamento de terras indígenas homologadas e reservadas.
 * - ANM / CPRM: Polos de mineração de pegmatitos e lítio no Médio Jequitinhonha.
 * - IGAM / CBH: Hidrografia das bacias dos Rios Jequitinhonha e Mucuri.
 *
 * ═══ DECISÕES DE ARQUITETURA E DESENHO TÉCNICO ═══
 * - "Regra do Seu Nonô" (AGENTS.md §12): Resumos contextuais construídos com frases
 *   de até 13 palavras, na ordem direta (sujeito, verbo, objeto), sem juridiquês,
 *   garantindo que o assistente responda de forma simples a cidadãos sob estresse.
 * - Cache Singleton em memória (`cacheMunicipiosVales`): Carrega os arquivos JSON
 *   (`vales-mucuri.json` e `vales-jequitinhonha.json`) apenas uma vez. Fornece o método
 *   `recarregarCacheVales()` para isolamento de testes e recargas dinâmicas.
 * - Resolução em cascata (`obterContextoMunicipioVales`):
 *   1º tenta código IBGE com suporte a alias legado;
 *   2º tenta nome exato sem acentos;
 *   3º tenta substring bidirecional de nome.
 */

import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Identificação dos vales atendidos pelo módulo.
 */
export type NomeVale = "Jequitinhonha" | "Mucuri";

/**
 * Contexto enriquecido de um município pronto para injeção em prompts ou exibição cívica.
 */
export interface ContextoMunicipioVales {
  /** Código IBGE de 7 dígitos com DV oficial (mod-10). */
  id_ibge7: string;
  /** Código IBGE de 6 dígitos sem DV (usado em sistemas legados federais). */
  id_ibge6: string;
  /** Nome canônico oficial do município. */
  nome: string;
  /** Vale geográfico de pertencimento ("Jequitinhonha" ou "Mucuri"). */
  vale: NomeVale;
  /** Polo de referência regional para comércio e serviços públicos. */
  polo_regional: string;
  /** Presença confirmada de terras indígenas pela FUNAI. */
  tem_terras_indigenas: boolean;
  /** Etnia indígena registrada (ex: "Maxakali"), ou null caso inexistente. */
  povo_indigena: string | null;
  /** Bacia hidrográfica principal que drena o território municipal. */
  bacia_principal: string;
  /** Tags descritivas para recuperação semântica e busca. */
  tags: string[];
  /** URL canônica para consulta de contratações públicas no PNCP. */
  link_pncp: string;
  /** URL oficial do portal próprio de transparência (quando catalogado). */
  link_transparencia?: string;
  /** Microresumo em linguagem cidadã concisa para injeção no assistente Seu Nonô. */
  resumo_contextual: string;
  /** Indica se o município pertence ao Polo do Lítio (Médio Jequitinhonha). */
  e_polo_litio?: boolean;
}

/**
 * Estatísticas consolidadas da inteligência territorial dos dois vales reunidos.
 */
export interface EstatisticasVales {
  /** Contagem total de cidades carregadas (82 municípios no acervo completo). */
  totalCidades: number;
  /** Cidades pertencentes ao Vale do Mucuri (27 cidades). */
  totalMucuri: number;
  /** Cidades pertencentes ao Vale do Jequitinhonha (55 cidades). */
  totalJequitinhonha: number;
  /** Total de cidades com presença de terras indígenas. */
  totalIndigenas: number;
  /** Total de cidades com mineração de lítio. */
  totalLitio: number;
  /** Lista de polos regionais mapeados. */
  polosRegionais: string[];
}

/** Interface auxiliar de tipagem para itens brutos oriundos dos arquivos JSON. */
interface ItemMunicipioJson {
  id_ibge7: string;
  id_ibge6?: string;
  nome: string;
  polo_regional?: string;
  tem_terras_indigenas?: boolean;
  povo_indigena?: string | null;
  bacia_principal?: string;
  tags?: string[];
  link_pncp?: string;
  link_transparencia?: string;
  e_polo_litio?: boolean;
}

/** Estrutura do catálogo JSON dos vales. */
interface CatalogoValesJson {
  total_cidades?: number;
  polo_regional?: string;
  bacia_hidrografica?: string;
  bioma?: string;
  atualizado_em?: string;
  fonte?: string;
  municipios: ItemMunicipioJson[];
}

/**
 * Mapeamento de compatibilidade para códigos legados ou rascunhos com dígito verificador divergente.
 *
 * Garante que documentos antigos, pesquisas externas ou denúncias civis com DVs incorretos
 * sejam mapeados para o código IBGE oficial sem falha de recuperação.
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

/** Cache em memória dos municípios dos dois vales carregados e normalizados. */
let cacheMunicipiosVales: ContextoMunicipioVales[] | null = null;

/**
 * Normaliza strings de texto removendo acentuação e convertendo para minúsculas.
 *
 * Utiliza o padrão canônico NFD para decomposição dos caracteres acentuados.
 *
 * @param texto Cadeia de caracteres a ser normalizada.
 * @returns Texto limpo em minúsculas e sem acentos.
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Resolve o caminho de arquivos JSON de dados de forma resiliente.
 *
 * ═══ ESTRATÉGIA MULTI-CAMINHO ═══
 * Procura o arquivo sequencialmente em:
 * 1. `<cwd>/apps/web/data/<arquivo>` (execução a partir da raiz do monorepo);
 * 2. `<cwd>/data/<arquivo>` (execução dentro da pasta `apps/web`);
 * 3. Relativo ao arquivo de código via `__dirname` (execução sob Vitest ou TS-Node);
 * 4. Caminho alternativo do workspace.
 *
 * @param nomeArquivo Nome do arquivo JSON desejado (ex: "vales-mucuri.json").
 * @returns Caminho completo do arquivo existente, ou `null` caso não seja encontrado.
 */
function resolverCaminhoArquivoJson(nomeArquivo: string): string | null {
  const caminhosPossiveis = [
    path.resolve(process.cwd(), "apps", "web", "data", nomeArquivo),
    path.resolve(process.cwd(), "data", nomeArquivo),
    path.resolve(__dirname, "..", "..", "data", nomeArquivo),
    path.resolve(__dirname, "..", "..", "..", "apps", "web", "data", nomeArquivo),
  ];

  for (const c of caminhosPossiveis) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

/**
 * Gera um microresumo cívico em conformidade com as regras editoriais do Seu Nonô.
 *
 * ═══ REGRA DO SEU NONÔ (AGENTS.md §12) ═══
 * - Frases curtas de até 13 palavras;
 * - Uma ideia clara por linha;
 * - Oração direta: sujeito, verbo e predicado;
 * - Tom educativo e de fácil entendimento por cidadãos leigos sob estresse.
 *
 * @param m Dados estruturados do município (sem o campo de resumo).
 * @returns Parágrafo estruturado com frases diretas e pontuadas.
 */
export function formatarResumoContextual(
  m: Omit<ContextoMunicipioVales, "resumo_contextual">
): string {
  const frases: string[] = [];
  const nomeVale = m.vale === "Jequitinhonha" ? "Vale do Jequitinhonha" : "Vale do Mucuri";

  frases.push(`${m.nome} integra o ${nomeVale} (código IBGE ${m.id_ibge7}).`);
  frases.push(`Polo regional de referência: ${m.polo_regional}.`);

  if (m.bacia_principal) {
    frases.push(`Bacia hidrográfica: ${m.bacia_principal}.`);
  }

  if (m.tem_terras_indigenas && m.povo_indigena) {
    frases.push(`Presença oficial de terras indígenas do Povo ${m.povo_indigena}.`);
  }

  if (m.e_polo_litio) {
    frases.push(`Integra o Polo do Lítio com compensação financeira da mineração.`);
  }

  frases.push(`Compras e contratos públicos auditáveis no PNCP.`);

  return frases.join(" ");
}

/**
 * Carrega, unifica e normaliza os municípios de ambos os vales com cache em memória.
 *
 * ═══ ETAPAS DE CONSOLIDAÇÃO ═══
 * 1. Carrega os 27 municípios do Vale do Mucuri a partir de `vales-mucuri.json`;
 * 2. Carrega os 55 municípios do Vale do Jequitinhonha a partir de `vales-jequitinhonha.json`;
 * 3. Deduplica cidades limítrofes pelo código `id_ibge7`;
 * 4. Mapeia automaticamente municípios com extração de lítio (Araçuaí, Itinga, Coronel Murta);
 * 5. Constrói o microresumo cívico para cada registro via `formatarResumoContextual`.
 *
 * @returns Lista consolidada de municípios prontos para injeção contextual.
 */
function carregarTodosMunicipiosVales(): ContextoMunicipioVales[] {
  if (cacheMunicipiosVales) return cacheMunicipiosVales;

  const resultado: ContextoMunicipioVales[] = [];

  // 1. Vale do Mucuri (27 municípios)
  const caminhoMucuri = resolverCaminhoArquivoJson("vales-mucuri.json");
  if (caminhoMucuri && fs.existsSync(caminhoMucuri)) {
    try {
      const conteudo = fs.readFileSync(caminhoMucuri, "utf-8");
      const dados = JSON.parse(conteudo) as CatalogoValesJson;

      for (const item of dados.municipios || []) {
        const base: Omit<ContextoMunicipioVales, "resumo_contextual"> = {
          id_ibge7: item.id_ibge7,
          id_ibge6: item.id_ibge6 || item.id_ibge7.slice(0, 6),
          nome: item.nome,
          vale: "Mucuri",
          polo_regional: item.polo_regional || dados.polo_regional || "Teófilo Otoni",
          tem_terras_indigenas: Boolean(item.tem_terras_indigenas),
          povo_indigena: item.povo_indigena ?? null,
          bacia_principal: item.bacia_principal || dados.bacia_hidrografica || "Bacia do Rio Mucuri",
          tags: item.tags || ["Vale do Mucuri"],
          link_pncp:
            item.link_pncp ||
            `https://pncp.gov.br/app/contratos?q=${encodeURIComponent(item.nome)}&uf=MG`,
          link_transparencia: item.link_transparencia,
          e_polo_litio: Boolean(item.e_polo_litio),
        };

        resultado.push({
          ...base,
          resumo_contextual: formatarResumoContextual(base),
        });
      }
    } catch {
      // Ignora falhas pontuais de parsing para resiliência de runtime
    }
  }

  // 2. Vale do Jequitinhonha (55 municípios)
  const caminhoJeq = resolverCaminhoArquivoJson("vales-jequitinhonha.json");
  if (caminhoJeq && fs.existsSync(caminhoJeq)) {
    try {
      const conteudo = fs.readFileSync(caminhoJeq, "utf-8");
      const dados = JSON.parse(conteudo) as CatalogoValesJson;

      for (const item of dados.municipios || []) {
        // Evita duplicatas se um município de divisa constar em ambos
        if (resultado.some((r) => r.id_ibge7 === item.id_ibge7)) continue;

        const eLitio = Boolean(
          item.e_polo_litio ||
          ["Araçuaí", "Itinga", "Coronel Murta"].includes(item.nome) ||
          item.tags?.some((t) => /l[ií]tio/i.test(t))
        );

        const base: Omit<ContextoMunicipioVales, "resumo_contextual"> = {
          id_ibge7: item.id_ibge7,
          id_ibge6: item.id_ibge6 || item.id_ibge7.slice(0, 6),
          nome: item.nome,
          vale: "Jequitinhonha",
          polo_regional: item.polo_regional || dados.polo_regional || "Araçuaí",
          tem_terras_indigenas: Boolean(item.tem_terras_indigenas),
          povo_indigena: item.povo_indigena ?? null,
          bacia_principal: item.bacia_principal || dados.bacia_hidrografica || "Bacia do Rio Jequitinhonha",
          tags: item.tags || ["Vale do Jequitinhonha"],
          link_pncp:
            item.link_pncp ||
            `https://pncp.gov.br/app/contratos?q=${encodeURIComponent(item.nome)}&uf=MG`,
          link_transparencia: item.link_transparencia,
          e_polo_litio: eLitio,
        };

        resultado.push({
          ...base,
          resumo_contextual: formatarResumoContextual(base),
        });
      }
    } catch {
      // Ignora falhas pontuais de parsing
    }
  }

  cacheMunicipiosVales = resultado;
  return cacheMunicipiosVales;
}

/**
 * Limpa o cache em memória dos vales.
 *
 * Utilizado por suítes de teste (Vitest) para garantir isolamento e recarga limpa.
 */
export function recarregarCacheVales(): void {
  cacheMunicipiosVales = null;
}

/**
 * Retorna todos os 82 municípios carregados e catalogados nos Vales.
 *
 * @returns Lista completa de objetos `ContextoMunicipioVales`.
 */
export function listarMunicipiosVales(): ContextoMunicipioVales[] {
  return carregarTodosMunicipiosVales();
}

/**
 * Localiza o contexto cívico de um município por código IBGE, alias legado ou busca por nome.
 *
 * ═══ HIERARQUIA DE RESOLUÇÃO ═══
 * 1. Código IBGE exato (7 ou 6 dígitos), consultando a tabela `ALIAS_IBGE_LEGADO`;
 * 2. Nome canônico exato (insensível a maiúsculas e sem acentos);
 * 3. Busca parcial bidirecional (o nome contém a busca ou a busca contém o nome).
 *
 * @param termoOuIbge Nome ou código IBGE do município (ex: "3168606", "Teófilo Otoni", "Itinga").
 * @returns O contexto completo do município ou `null` se não for localizado.
 */
export function obterContextoMunicipioVales(termoOuIbge: string): ContextoMunicipioVales | null {
  if (!termoOuIbge || typeof termoOuIbge !== "string") return null;

  const termo = termoOuIbge.trim();
  if (!termo) return null;

  const lista = carregarTodosMunicipiosVales();
  const termoNormalizado = normalizarTexto(termo);
  const idNormalizado = ALIAS_IBGE_LEGADO[termo] || termo;

  // 1. Busca exata por código IBGE (7 ou 6 dígitos)
  const porIbge = lista.find(
    (m) =>
      m.id_ibge7 === idNormalizado ||
      m.id_ibge6 === idNormalizado ||
      m.id_ibge7 === termo ||
      m.id_ibge6 === termo
  );
  if (porIbge) return porIbge;

  // 2. Busca exata por nome canônico (sem acento / minúsculo)
  const porNomeExato = lista.find((m) => normalizarTexto(m.nome) === termoNormalizado);
  if (porNomeExato) return porNomeExato;

  // 3. Busca parcial por nome (substring bidirecional)
  const porNomeParcial = lista.find(
    (m) =>
      normalizarTexto(m.nome).includes(termoNormalizado) ||
      termoNormalizado.includes(normalizarTexto(m.nome))
  );
  if (porNomeParcial) return porNomeParcial;

  return null;
}

/**
 * Retorna exclusivamente os municípios com presença oficial de terras indígenas.
 *
 * @returns Lista de municípios onde `tem_terras_indigenas === true`.
 */
export function listarMunicipiosIndigenasVales(): ContextoMunicipioVales[] {
  return carregarTodosMunicipiosVales().filter((m) => m.tem_terras_indigenas);
}

/**
 * Retorna exclusivamente os municípios pertencentes ao Polo do Lítio do Vale do Jequitinhonha.
 *
 * @returns Lista de municípios onde `e_polo_litio === true`.
 */
export function listarMunicipiosLitioVales(): ContextoMunicipioVales[] {
  return carregarTodosMunicipiosVales().filter((m) => m.e_polo_litio);
}

/**
 * Realiza busca textual flexível por nome, código IBGE, bacia, tags ou polo regional.
 *
 * Todos os campos passam por normalização NFD sem diacríticos antes da comparação.
 *
 * @param termo Termo de busca fornecido pelo cidadão.
 * @returns Municípios compatíveis; se o termo for vazio, retorna todos.
 */
export function buscarMunicipiosVales(termo: string): ContextoMunicipioVales[] {
  const norm = normalizarTexto(termo);
  if (!norm) return carregarTodosMunicipiosVales();

  return carregarTodosMunicipiosVales().filter((m) => {
    const nomeNorm = normalizarTexto(m.nome);
    const baciaNorm = normalizarTexto(m.bacia_principal);
    const poloNorm = normalizarTexto(m.polo_regional);
    const tagsNorm = m.tags.map(normalizarTexto);

    return (
      nomeNorm.includes(norm) ||
      baciaNorm.includes(norm) ||
      poloNorm.includes(norm) ||
      m.id_ibge7.includes(norm) ||
      m.id_ibge6.includes(norm) ||
      tagsNorm.some((t) => t.includes(norm))
    );
  });
}

/**
 * Gera um bloco formatado em texto para condicionamento de prompt (RAG)
 * no assistente Seu Nonô ou na rota `/api/chatbot`.
 *
 * ═══ FORMATO DE INJEÇÃO ═══
 * O bloco estruturado delimita claramente os atributos públicos do município
 * para que o LLM não alucine dados como códigos IBGE ou pertencimento a bacias.
 *
 * @param m Objeto `ContextoMunicipioVales` do município em foco.
 * @returns Texto estruturado em tópicos para inserção na mensagem de sistema da IA.
 */
export function gerarPromptContextoVales(m: ContextoMunicipioVales): string {
  const linhas = [
    `[CONTEXTO TERRITORIAL CÍVICO: ${m.nome.toUpperCase()}]`,
    `- Município: ${m.nome} (IBGE 7d: ${m.id_ibge7}, 6d: ${m.id_ibge6})`,
    `- Região: ${m.vale === "Jequitinhonha" ? "Vale do Jequitinhonha" : "Vale do Mucuri"}`,
    `- Polo regional de referência: ${m.polo_regional}`,
    `- Bacia hidrográfica: ${m.bacia_principal || "Bacia regional"}`,
    `- Terras e povos indígenas: ${m.tem_terras_indigenas ? `Sim (Povo ${m.povo_indigena || "Tradicional"})` : "Não registradas"}`,
    `- Polo do Lítio: ${m.e_polo_litio ? "Sim (mineração de lítio e compensação CFEM)" : "Não"}`,
    `- Tags temáticas: ${m.tags.join(", ")}`,
    `- Consulta oficial no PNCP: ${m.link_pncp}`,
    m.link_transparencia ? `- Portal de transparência: ${m.link_transparencia}` : null,
    `- Microresumo cívico: ${m.resumo_contextual}`,
  ];

  return linhas.filter(Boolean).join("\n");
}

/**
 * Retorna as métricas consolidadas dos municípios catalogados nos Vales.
 *
 * Computa contagens de cidades por vale, presença indígena, vocação mineral (lítio)
 * e compila a lista de todos os polos regionais sem repetições.
 *
 * @returns Objeto `EstatisticasVales` com os totais computados.
 */
export function obterEstatisticasVales(): EstatisticasVales {
  const lista = carregarTodosMunicipiosVales();
  let totalMucuri = 0;
  let totalJequitinhonha = 0;
  let totalIndigenas = 0;
  let totalLitio = 0;
  const polosSet = new Set<string>();

  for (const m of lista) {
    if (m.vale === "Mucuri") totalMucuri++;
    if (m.vale === "Jequitinhonha") totalJequitinhonha++;
    if (m.tem_terras_indigenas) totalIndigenas++;
    if (m.e_polo_litio) totalLitio++;
    if (m.polo_regional) polosSet.add(m.polo_regional);
  }

  return {
    totalCidades: lista.length,
    totalMucuri,
    totalJequitinhonha,
    totalIndigenas,
    totalLitio,
    polosRegionais: Array.from(polosSet),
  };
}
