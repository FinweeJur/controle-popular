/**
 * apps/web/lib/assistente/contexto-vales.ts
 *
 * Módulo de inteligência territorial e injeção de contexto cívico dos
 * 82 municípios dos Vales do Jequitinhonha e Mucuri para o assistente Seu Nonô.
 *
 * Consolida dados oficiais de localidades (IBGE), contratações públicas (PNCP),
 * terras e povos indígenas (FUNAI), recursos hídricos e polo minerário do lítio.
 */

import * as fs from "node:fs";
import * as path from "node:path";

export type NomeVale = "Jequitinhonha" | "Mucuri";

export interface ContextoMunicipioVales {
  id_ibge7: string;
  id_ibge6: string;
  nome: string;
  vale: NomeVale;
  polo_regional: string;
  tem_terras_indigenas: boolean;
  povo_indigena: string | null;
  bacia_principal: string;
  tags: string[];
  link_pncp: string;
  link_transparencia?: string;
  resumo_contextual: string;
  e_polo_litio?: boolean;
}

export interface EstatisticasVales {
  totalCidades: number;
  totalMucuri: number;
  totalJequitinhonha: number;
  totalIndigenas: number;
  totalLitio: number;
  polosRegionais: string[];
}

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
 * Garante que buscas externas ou documentos antigos resolvam para o município oficial.
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

let cacheMunicipiosVales: ContextoMunicipioVales[] | null = null;

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Resolve o caminho dos arquivos JSON de forma resiliente tanto na raiz do monorepo
 * quanto dentro de apps/web ou sob executores de teste.
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
 * Gera um resumo cívico conciso para injeção de prompt no chatbot (RAG).
 * Segue a regra do Seu Nonô: frases diretas até 13 palavras e tom informativo.
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
 * Carrega e normaliza os municípios a partir dos arquivos JSON disponíveis.
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

  // 2. Vale do Jequitinhonha (quando disponível)
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

/** Limpa o cache em memória (útil para testes ou recargas dinâmicas). */
export function recarregarCacheVales(): void {
  cacheMunicipiosVales = null;
}

/**
 * Retorna todos os municípios carregados dos Vales.
 */
export function listarMunicipiosVales(): ContextoMunicipioVales[] {
  return carregarTodosMunicipiosVales();
}

/**
 * Localiza o contexto cívico de um município pelo código IBGE (7 ou 6 dígitos),
 * alias legado ou busca direta por nome.
 *
 * @param termoOuIbge Nome ou código IBGE do município.
 * @returns O contexto completo do município ou null se não for encontrado.
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

  // 3. Busca parcial por nome
  const porNomeParcial = lista.find(
    (m) =>
      normalizarTexto(m.nome).includes(termoNormalizado) ||
      termoNormalizado.includes(normalizarTexto(m.nome))
  );
  if (porNomeParcial) return porNomeParcial;

  return null;
}

/**
 * Retorna apenas municípios com presença confirmada de terras indígenas.
 */
export function listarMunicipiosIndigenasVales(): ContextoMunicipioVales[] {
  return carregarTodosMunicipiosVales().filter((m) => m.tem_terras_indigenas);
}

/**
 * Retorna apenas municípios integrantes do polo de mineração de lítio.
 */
export function listarMunicipiosLitioVales(): ContextoMunicipioVales[] {
  return carregarTodosMunicipiosVales().filter((m) => m.e_polo_litio);
}

/**
 * Realiza busca textual flexível por nome, código IBGE, bacia, tags ou polo regional.
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
 * Retorna métricas consolidadas dos municípios catalogados nos Vales.
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
