import type { ColunaOrdenavel } from "@/lib/tabela/ordenavel";

/**
 * Descritores de coluna das tabelas de agregado da página de gastos de
 * campanha 2026 — separados do JSX para que a página fique curta e cada
 * coluna seja revisada num lugar só.
 *
 * São descritores PLANOS (campo, rótulo, formato) porque atravessam a
 * fronteira servidor→cliente até a `TabelaOrdenavel`; função de render não
 * passa. A formatação (moeda, número) e o alinhamento acontecem lá dentro.
 *
 * `filtro: true` liga o `<select>` de categoria acima da tabela (o pedido do
 * dono de 10/10/2026: "selecionável por partido, estado, gasto e tipo de big
 * tech"). Todo cabeçalho é clicável para ordenar (AGENTS.md § 8, qualidade 3).
 */

/** Receita por origem do dinheiro. */
export const COLUNAS_RECEITA: ColunaOrdenavel[] = [
  { campo: "fonte", rotulo: "Fonte do dinheiro" },
  { campo: "total", rotulo: "Total recebido", numerica: true, formato: "moeda" },
];

/** Natureza da despesa (as maiores, por valor contratado). */
export const COLUNAS_NATUREZA: ColunaOrdenavel[] = [
  { campo: "ds", rotulo: "Natureza da despesa", vazio: "sem natureza na fonte" },
  { campo: "contratado", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "pago", rotulo: "Pago", numerica: true, formato: "moeda" },
  { campo: "linhas", rotulo: "Despesas", numerica: true, formato: "numero" },
];

/** Cargo: dinheiro e custo por voto. */
export const COLUNAS_CARGO: ColunaOrdenavel[] = [
  { campo: "cargo", rotulo: "Cargo", filtro: true },
  { campo: "candidaturas", rotulo: "Candidaturas", numerica: true, formato: "numero" },
  { campo: "eleitos", rotulo: "Eleitos", numerica: true, formato: "numero" },
  { campo: "receita", rotulo: "Receita", numerica: true, formato: "moeda" },
  { campo: "contratado", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "pago", rotulo: "Pago", numerica: true, formato: "moeda" },
  { campo: "digital", rotulo: "Digital", numerica: true, formato: "moeda" },
  { campo: "custoVotoMedianoEleitos", rotulo: "Custo por voto (mediano, eleitos)", numerica: true, formato: "moeda", vazio: "—" },
];

/** UF: dinheiro por estado. */
export const COLUNAS_UF: ColunaOrdenavel[] = [
  { campo: "uf", rotulo: "UF", filtro: true },
  { campo: "candidaturas", rotulo: "Candidaturas", numerica: true, formato: "numero" },
  { campo: "eleitos", rotulo: "Eleitos", numerica: true, formato: "numero" },
  { campo: "receita", rotulo: "Receita", numerica: true, formato: "moeda" },
  { campo: "contratado", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "pago", rotulo: "Pago", numerica: true, formato: "moeda" },
  { campo: "digital", rotulo: "Digital", numerica: true, formato: "moeda" },
];

/** Fornecedores de campanha (com selo de big tech). */
export const COLUNAS_FORNECEDOR: ColunaOrdenavel[] = [
  { campo: "nome", rotulo: "Fornecedor", selo: "bigtech", seloTexto: "big tech" },
  { campo: "cnpj", rotulo: "CNPJ", vazio: "—" },
  { campo: "total", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "linhas", rotulo: "Despesas", numerica: true, formato: "numero" },
];

/** Órgãos partidários (prestação própria do partido). */
export const COLUNAS_PARTIDO: ColunaOrdenavel[] = [
  { campo: "partido", rotulo: "Partido", subtexto: "nome", filtro: true },
  { campo: "receita", rotulo: "Receita", numerica: true, formato: "moeda" },
  { campo: "contratado", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "pago", rotulo: "Pago", numerica: true, formato: "moeda" },
];

/** Análise por partido (candidatos do universo completo). */
export const COLUNAS_PARTIDO_ANALISE: ColunaOrdenavel[] = [
  { campo: "partido", rotulo: "Partido", subtexto: "nome" },
  { campo: "candidaturas", rotulo: "Candidaturas", numerica: true, formato: "numero" },
  { campo: "eleitos", rotulo: "Eleitos", numerica: true, formato: "numero" },
  { campo: "receita", rotulo: "Receita", numerica: true, formato: "moeda" },
  { campo: "contratado", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "pago", rotulo: "Pago", numerica: true, formato: "moeda" },
  { campo: "digital", rotulo: "Digital", numerica: true, formato: "moeda" },
  { campo: "bigtech", rotulo: "Big tech", numerica: true, formato: "moeda" },
  { campo: "custoVotoMedianoEleitos", rotulo: "Custo por voto (mediano, eleitos)", numerica: true, formato: "moeda", vazio: "—" },
];

/** Meta por plataforma (heurística da descrição da despesa). */
export const COLUNAS_META_PLATAFORMA: ColunaOrdenavel[] = [
  { campo: "plataforma", rotulo: "Plataforma" },
  { campo: "linhas", rotulo: "Despesas", numerica: true, formato: "numero" },
  { campo: "total", rotulo: "Contratado", numerica: true, formato: "moeda" },
];

/** Empresas de big tech — filtrável por grupo (o "tipo" de big tech). */
export const COLUNAS_EMPRESA_BIGTECH: ColunaOrdenavel[] = [
  { campo: "empresa", rotulo: "Empresa" },
  { campo: "cnpj", rotulo: "CNPJ", vazio: "sem CNPJ na fonte" },
  { campo: "grupo", rotulo: "Grupo", filtro: true },
  { campo: "total", rotulo: "Contratado", numerica: true, formato: "moeda" },
  { campo: "linhas", rotulo: "Despesas", numerica: true, formato: "numero" },
  { campo: "candidatos", rotulo: "Candidatos", numerica: true, formato: "numero" },
];

/** Candidatos que mais contrataram big tech — filtrável por cargo e partido. */
export const COLUNAS_CANDIDATO_BIGTECH: ColunaOrdenavel[] = [
  { campo: "urna", rotulo: "Candidato", subtexto: "nome" },
  { campo: "cargo", rotulo: "Cargo/UF", combinar: ["cargo", "uf"], separador: "/", filtro: true },
  { campo: "partido", rotulo: "Partido", filtro: true },
  { campo: "bigtech", rotulo: "Big tech", numerica: true, formato: "moeda" },
  { campo: "digital", rotulo: "Digital total", numerica: true, formato: "moeda" },
];

/** Big tech por partido. */
export const COLUNAS_PARTIDO_BIGTECH: ColunaOrdenavel[] = [
  { campo: "partido", rotulo: "Partido", filtro: true },
  { campo: "total", rotulo: "Big tech", numerica: true, formato: "moeda" },
];

/** Menção textual da rede no texto da despesa (pista, não pagamento direto). */
export const COLUNAS_MENCAO: ColunaOrdenavel[] = [
  { campo: "rede", rotulo: "Rede citada na despesa" },
  { campo: "linhas", rotulo: "Despesas", numerica: true, formato: "numero" },
  { campo: "total", rotulo: "Contratado", numerica: true, formato: "moeda" },
];

/** Resumo da amostra da Meta Ads Library por candidato. */
export const COLUNAS_META_AMOSTRA_RESUMO: ColunaOrdenavel[] = [
  { campo: "urna", rotulo: "Candidato", subtexto: "nome" },
  { campo: "cargo", rotulo: "Cargo/UF", combinar: ["cargo", "uf"], separador: "/", filtro: true },
  { campo: "partido", rotulo: "Partido", filtro: true },
  { campo: "bigtechTSE", rotulo: "Big tech no TSE", numerica: true, formato: "moeda" },
  { campo: "qAnuncios", rotulo: "Anúncios na amostra", numerica: true, formato: "numero" },
  { campo: "comFaixa", rotulo: "Com faixa de gasto", numerica: true, formato: "numero" },
];

/** Cada anúncio da amostra da Meta Ads Library. */
export const COLUNAS_META_ANUNCIO: ColunaOrdenavel[] = [
  { campo: "candidato", rotulo: "Candidato / página do anúncio", subtexto: "patrocinador", filtro: true },
  { campo: "cargo", rotulo: "Cargo/UF", combinar: ["cargo", "uf"], separador: "/" },
  { campo: "periodo", rotulo: "Período exibido", vazio: "—" },
  { campo: "faixaGastoBRL", rotulo: "Gasto (faixa da Meta)", vazio: "não divulgado" },
  { campo: "impressoes", rotulo: "Impressões", vazio: "—" },
];
