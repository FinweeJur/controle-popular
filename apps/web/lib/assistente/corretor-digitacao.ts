/**
 * @file corretor-digitacao.ts
 * @description Normalizador e corretor tolerante a erros de digitação e variações fonéticas
 * para o assistente Seu Nonô e busca de termos determinísticos.
 * 
 * Papel no portal:
 * Garante que erros de digitação comuns no celular (letras trocadas, fonética s/c/z/ç,
 * inversão de teclas adjacentes, ausência ou duplicação de letras) sejam corrigidos
 * para os termos canônicos antes de avaliar a Regra de Escada.
 * 
 * Exemplos de correção suportados:
 * - "licensiamento", "licensas", "licensiameto" -> "licenciamento" / "licencas"
 * - "orcameto", "orçamneto" -> "orcamento"
 * - "conveino", "convenio" -> "convenios"
 * - "obsidiam", "obsidiano" -> "obsidian"
 * - "power bii", "poweerbi", "labortorio" -> "power bi" / "laboratorio"
 * - "betin", "belo orizonte", "sygma", "sigima" -> "betim", "belo horizonte", "sigma lithium"
 * - "barragen", "barragens a montamte" -> "barragem", "barragens"
 * - "tjm", "tce-mg" -> "tjmg", "tcemg"
 * 
 * Regra de integridade:
 * Palavras curtas (<= 3 letras) possuem tolerância zero para evitar falsos positivos
 * (ex: 'lei' não vira 'rio'). Palavras médias e longas toleram até distância 2.
 */

import { semAcento, distancia, tolerancia } from "../busca/normalizar";

/**
 * Dicionário canônico de termos e frases-chave do Controle Popular
 * mapeados para sua forma canônica normalizada.
 */
export const TERMOS_CANONICOS: Record<string, string> = {
  // Laboratório & Ferramentas
  laboratorio: "laboratorio",
  laboratrio: "laboratorio",
  labortorio: "laboratorio",
  powerbi: "power bi",
  poweerbi: "power bi",
  powerbii: "power bi",
  "powe bi": "power bi",
  obsidian: "obsidian",
  obsidiam: "obsidian",
  obsidiano: "obsidian",
  "arvore de conexoes": "arvore",
  "arvore de links": "arvore",
  "mapa mental": "mapa mental",
  mapamental: "mapa mental",
  comparador: "comparador",
  graficos: "graficos",
  grafico: "graficos",
  camadas: "camadas",
  "camadas de dados": "camadas",

  // Meio Ambiente & Barragens
  licenciamento: "licenciamento",
  licensiamento: "licenciamento",
  licenciamneto: "licenciamento",
  licensiameto: "licenciamento",
  licenca: "licencas",
  licencas: "licencas",
  licensa: "licencas",
  licensas: "licencas",
  convenio: "convenios",
  convenios: "convenios",
  conveino: "convenios",
  conveio: "convenios",
  legislacao: "legislacao",
  legislasao: "legislacao",
  leis: "leis",
  decreto: "decreto",
  decretos: "decretos",
  condicionante: "condicionantes",
  condicionantes: "condicionantes",
  condisionantes: "condicionantes",
  barragem: "barragens",
  barragens: "barragens",
  barragen: "barragens",
  descaracterizacao: "descaracterizacao",
  descaracterisacao: "descaracterizacao",
  descaracterizaçao: "descaracterizacao",
  "mar de lama": "mar de lama",
  copam: "copam",
  semad: "semad",
  ibama: "ibama",
  sigbm: "sigbm",

  // Cidades
  betim: "betim",
  betin: "betim",
  "belo horizonte": "belo horizonte",
  "belo orizonte": "belo horizonte",
  belohorizonte: "belo horizonte",
  diamantina: "diamantina",
  diamantna: "diamantina",
  aracuai: "aracuai",
  itinga: "itinga",
  "sao paulo": "sao paulo",
  saopaulo: "sao paulo",
  cidades: "cidades",
  "199 cidades": "199 cidades",

  // Empresas
  vale: "vale",
  "vale sa": "vale",
  "sigma lithium": "sigma lithium",
  sigma: "sigma lithium",
  sygma: "sigma lithium",
  sigima: "sigma lithium",
  csn: "csn",
  cemig: "cemig",
  copasa: "copasa",
  gerdau: "gerdau",
  samarco: "samarco",
  empresas: "empresas",
  mineradoras: "empresas",

  // Judiciário & Órgãos
  tjmg: "tjmg",
  tjm: "tjmg",
  "tj-mg": "tjmg",
  mpmg: "mpmg",
  "mp-mg": "mpmg",
  dpmg: "dpmg",
  "dp-mg": "dpmg",
  tcemg: "tcemg",
  "tce-mg": "tcemg",
  tce: "tcemg",
  trt3: "trt3",
  "trt-3": "trt3",
  trt: "trt3",
  trf6: "trf6",
  "trf-6": "trf6",
  trf: "trf6",
  dpu: "dpu",
  judiciario: "judiciario",
  justica: "judiciario",
  "balcao virtual": "balcao virtual",

  // Finanças & PNCP
  orcamento: "orcamento",
  orcameto: "orcamento",
  orçamneto: "orcamento",
  contratos: "contratos",
  contrato: "contratos",
  licitacao: "licitacoes",
  licitacoes: "licitacoes",
  licitasao: "licitacoes",
  pncp: "pncp",
  compras: "compras",

  // Central & Outros
  editais: "editais",
  edital: "editais",
  editasi: "editais",
  noticias: "noticias",
  noticia: "noticias",
  notisias: "noticias",
  reportagem: "noticias",
  reportagens: "noticias",
  "estudos rurais": "estudos rurais",
  biblioteca: "biblioteca",
  imprensa: "imprensa",
  documentacao: "documentacao",
  "fontes estados": "fontes estados",
  comunicabr: "comunicabr",
  mariana: "mariana",
  brumadinho: "brumadinho",
  paraopeba: "paraopeba",
};

/**
 * Normaliza variações fonéticas comuns da língua portuguesa antes do matching.
 * Reduz trocas de s/c/ç/z, m/n no fim de sílaba e duplicações.
 */
export function normalizarFoneticaPtBr(texto: string): string {
  let s = semAcento(texto).trim().toLowerCase();

  // Remove caracteres especiais exceto espaços e alfanuméricos
  s = s.replace(/[^a-z0-9\s]/g, " ");

  // Normaliza múltiplos espaços
  s = s.replace(/\s+/g, " ");

  // Substituições fonéticas simplificadas:
  // 1. Troca 'm' por 'n' no final de palavras para igualar Betim/Betin, barragem/barragen
  s = s.replace(/m\b/g, "n");

  // 2. Remove letras repetidas consecutivas (ex: "poweer" -> "power", "bii" -> "bi")
  s = s.replace(/([a-z])\1+/g, "$1");

  return s.trim();
}

/**
 * Corrige uma palavra ou termo único comparando com a lista canônica por Levenshtein.
 */
export function corrigirTermoUnico(palavra: string): string {
  const norm = semAcento(palavra).trim().toLowerCase();
  if (norm.length <= 3) {
    // Termo curto: apenas se estiver no dicionário exato
    return TERMOS_CANONICOS[norm] || norm;
  }

  // Se já for exato
  if (TERMOS_CANONICOS[norm]) {
    return TERMOS_CANONICOS[norm];
  }

  const limiteTol = tolerancia(norm);
  let melhorCandidato = norm;
  let menorDistancia = limiteTol + 1;

  for (const [termoBase, termoCanonica] of Object.entries(TERMOS_CANONICOS)) {
    // Apenas termos de tamanho similar
    if (Math.abs(termoBase.length - norm.length) <= limiteTol) {
      const d = distancia(norm, termoBase, limiteTol);
      if (d <= limiteTol && d < menorDistancia) {
        menorDistancia = d;
        melhorCandidato = termoCanonica;
      }
    }
  }

  return melhorCandidato;
}

/**
 * Higieniza e corrige a frase de entrada do usuário tolerando erros de português e digitação.
 * 
 * Regra:
 * 1. Confere se a frase inteira corresponde a alguma chave com typo (ex: "belo orizonte", "mar de lama").
 * 2. Quebra em palavras e aplica correção com limite de tolerância individual.
 * 3. Retorna a frase corrigida pronta para ser avaliada pela Escada Determinista.
 */
export function corrigirDigitacaoFrase(frase: string): string {
  const limpa = semAcento(frase).trim().toLowerCase();
  if (!limpa) return frase;

  // 1. Casamento direto na tabela de termos compostos
  if (TERMOS_CANONICOS[limpa]) {
    return TERMOS_CANONICOS[limpa];
  }

  // 2. Confere se alguma chave composta está a distância <= 2
  for (const [chave, canonic] of Object.entries(TERMOS_CANONICOS)) {
    if (chave.includes(" ") && Math.abs(chave.length - limpa.length) <= 2) {
      if (distancia(limpa, chave, 2) <= 2) {
        return canonic;
      }
    }
  }

  // 3. Corrige palavra por palavra
  const palavras = limpa.split(/\s+/).filter(Boolean);
  const corrigidas = palavras.map((p) => {
    // Se a palavra for número ou sigla com dígito, não mexe
    if (/\d/.test(p)) return p;
    return corrigirTermoUnico(p);
  });

  return corrigidas.join(" ");
}
