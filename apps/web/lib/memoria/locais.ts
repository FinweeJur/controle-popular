/**
 * locais.ts — onde cada fato da memória aconteceu, quando a fonte diz.
 *
 * ═══ POR QUE UM GAZETTEER CURADO, E NÃO UMA VARREDURA DE NOMES ═══
 *
 * Os verbetes da memória (Mística do Dia e `/memoria`) quase nunca trazem a
 * coordenada, e muitos nem o lugar. O caminho ingênuo — varrer o texto contra a
 * lista dos 5.570 municípios — produz **"onde" falso**, e onde falso é dano
 * (AGENTS § 7): "Rio de Janeiro" aparece em biografia de autor, "Prata" é
 * palavra comum, "Palmares" pode ser o quilombo ou um palmeiral. Um fato
 * ancorado no lugar errado é pior que fato sem lugar.
 *
 * Por isso só entra o que é **inequívoco**: nome de movimento com território
 * conhecido (`Inconfidência Mineira`, `Cabanagem`, `Canudos`) e nome de lugar
 * tombado (`Vila Rica`). O que não casa fica `null`, e a tela declara a lacuna.
 *
 * ═══ A COORDENADA VEM DO IBGE — VALIDADA POR TESTE, NÃO POR CONFIANÇA ═══
 *
 * As coordenadas estão aqui embutidas (para o módulo continuar leve: ele entra
 * no chunk da Mística, na home) copiadas de
 * `apps/web/data/municipios-centroides.json` (IBGE). O teste `locais.test.ts`
 * **confere cada uma contra esse arquivo oficial** e quebra se divergir mais que
 * ~0,05° — ninguém precisa confiar na memória de quem escreveu.
 *
 * Escopo declarado: só fatos ocorridos em **município brasileiro**. Movimento
 * internacional (Comuna de Paris, Revolução Cubana) fica sem lugar por ora — a
 * base de centróides é brasileira, e preferimos a lacuna ao chute.
 */
import type { EntradaCalendario } from "./tipos";

export interface Local {
  /** Nome como aparece para o leitor (pode ser o nome histórico). */
  nome: string;
  uf: string;
  lat: number;
  lon: number;
  /** Slug do contexto em `public/terras/globo/dados/contextos-lugares.json`. */
  ctx?: string;
}

interface DefinicaoLocal {
  /** Termos procurados no texto (sem acento; a comparação normaliza). */
  termos: string[];
  /** Nome OFICIAL do IBGE, conferido pelo teste. */
  municipioIbge: string;
  uf: string;
  lat: number;
  lon: number;
  /** Rótulo mostrado; quando ausente, usa o nome do IBGE. */
  rotulo?: string;
  ctx?: string;
}

/**
 * A LISTA. Só termos INEQUÍVOCOS — palavra ambígua fica de fora de propósito:
 * "palmares" (palmeiral), "males" (males = dores), "chibata" (o objeto),
 * "farrapos" (tecido), "alfaiates" (profissão) e "contestado" (disputado) são
 * palavras comuns; casá-las daria "onde" falso.
 *
 * A busca escolhe o termo mais LONGO que casa, então o mais específico vence.
 */
const DEFINICOES: DefinicaoLocal[] = [
  // ── Movimentos com território conhecido ────────────────────────────────
  { termos: ["inconfidencia mineira", "inconfidencia"], municipioIbge: "Ouro Preto", uf: "MG", lat: -20.3796, lon: -43.512, rotulo: "Ouro Preto (Vila Rica)", ctx: "inconfidencia-mineira" },
  { termos: ["revolta de vila rica", "vila rica"], municipioIbge: "Ouro Preto", uf: "MG", lat: -20.3796, lon: -43.512, rotulo: "Ouro Preto (Vila Rica)", ctx: "revolta-de-vila-rica" },
  { termos: ["conjuracao baiana", "revolta dos alfaiates"], municipioIbge: "Salvador", uf: "BA", lat: -12.9718, lon: -38.5011, ctx: "conjuracao-baiana" },
  { termos: ["revolta dos males"], municipioIbge: "Salvador", uf: "BA", lat: -12.9718, lon: -38.5011, ctx: "revolta-dos-males" },
  { termos: ["sabinada"], municipioIbge: "Salvador", uf: "BA", lat: -12.9718, lon: -38.5011, ctx: "sabinada" },
  { termos: ["cabanagem"], municipioIbge: "Belém", uf: "PA", lat: -1.4554, lon: -48.4898, ctx: "cabanagem" },
  { termos: ["balaiada"], municipioIbge: "Caxias", uf: "MA", lat: -4.86505, lon: -43.3617, ctx: "balaiada" },
  { termos: ["revolta de beckman", "beckman"], municipioIbge: "São Luís", uf: "MA", lat: -2.53874, lon: -44.2825, ctx: "revolta-de-beckman" },
  { termos: ["guerra de canudos", "canudos"], municipioIbge: "Canudos", uf: "BA", lat: -9.90014, lon: -39.1471, ctx: "guerra-de-canudos" },
  { termos: ["revolucao farroupilha", "farroupilha"], municipioIbge: "Porto Alegre", uf: "RS", lat: -30.0318, lon: -51.2065, ctx: "revolucao-farroupilha" },
  { termos: ["guerra do contestado"], municipioIbge: "Porto União", uf: "SC", lat: -26.2451, lon: -51.0759, rotulo: "Contestado (SC/PR)", ctx: "guerra-do-contestado" },
  { termos: ["quilombo dos palmares"], municipioIbge: "União dos Palmares", uf: "AL", lat: -9.15921, lon: -36.0223, ctx: "quilombo-dos-palmares" },
  { termos: ["revolta da chibata"], municipioIbge: "Rio de Janeiro", uf: "RJ", lat: -22.9129, lon: -43.2003, ctx: "revolta-da-chibata" },
  { termos: ["revolta da vacina"], municipioIbge: "Rio de Janeiro", uf: "RJ", lat: -22.9129, lon: -43.2003, ctx: "revolta-da-vacina" },
  { termos: ["quebra-quilos"], municipioIbge: "Campina Grande", uf: "PB", lat: -7.22196, lon: -35.8731, ctx: "quebra-quilos" },
  { termos: ["cabanada", "revolta dos cabanos"], municipioIbge: "Recife", uf: "PE", lat: -8.04666, lon: -34.8771, rotulo: "Pernambuco (Recife)", ctx: "cabanada" },
  // ── Segunda leva: eventos com sede conhecida e termo sem ambiguidade ────
  { termos: ["guerra dos emboabas"], municipioIbge: "Ouro Preto", uf: "MG", lat: -20.3796, lon: -43.512, rotulo: "Ouro Preto (Vila Rica)" },
  { termos: ["revolta de carrancas"], municipioIbge: "Carrancas", uf: "MG", lat: -21.4898, lon: -44.6446 },
  { termos: ["confederacao do equador"], municipioIbge: "Recife", uf: "PE", lat: -8.04666, lon: -34.8771 },
  { termos: ["guerra dos mascates"], municipioIbge: "Recife", uf: "PE", lat: -8.04666, lon: -34.8771 },
  { termos: ["revolta do vintem"], municipioIbge: "Rio de Janeiro", uf: "RJ", lat: -22.9129, lon: -43.2003 },
  { termos: ["revolta da armada"], municipioIbge: "Rio de Janeiro", uf: "RJ", lat: -22.9129, lon: -43.2003 },
  { termos: ["revolta dos dezoito do forte", "dezoito do forte"], municipioIbge: "Rio de Janeiro", uf: "RJ", lat: -22.9129, lon: -43.2003 },
  { termos: ["guerrilha do araguaia"], municipioIbge: "Marabá", uf: "PA", lat: -5.38075, lon: -49.1327 },
  { termos: ["massacre de eldorado dos carajas", "eldorado dos carajas"], municipioIbge: "Eldorado do Carajás", uf: "PA", lat: -6.10389, lon: -49.3553, rotulo: "Eldorado dos Carajás" },
  { termos: ["massacre de corumbiara", "corumbiara"], municipioIbge: "Corumbiara", uf: "RO", lat: -12.9551, lon: -60.8947 },
  { termos: ["massacre do carandiru", "carandiru"], municipioIbge: "São Paulo", uf: "SP", lat: -23.5329, lon: -46.6395 },
];

/** Exposta para o teste conferir nome e coordenada contra o IBGE. */
export { DEFINICOES as DEFINICOES_LOCAIS };

/** Normaliza texto para a busca: sem acento, sem caixa. */
function normalizar(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const ESCAPAR = /[.*+?^${}()|[\]\\]/g;

export const LOCAIS: { termos: string[]; local: Local }[] = DEFINICOES.map((def) => ({
  termos: def.termos.map(normalizar),
  local: {
    nome: def.rotulo ?? def.municipioIbge,
    uf: def.uf,
    lat: def.lat,
    lon: def.lon,
    ctx: def.ctx,
  },
}));

/**
 * Primeiro lugar inequívoco citado nos textos. `null` quando nenhum termo da
 * lista aparece — a lacuna é o resultado honesto.
 *
 * A escolha é pelo **termo mais longo** que casa: num texto que cita "Revolta
 * de Vila Rica" e "Inconfidência", o mais específico vence (os dois apontam
 * para Ouro Preto, mas o contexto da ficha é outro).
 */
export function detectarLocal(...textos: (string | undefined | null)[]): Local | null {
  const alvo = normalizar(textos.filter(Boolean).join(" \n "));
  if (!alvo.trim()) return null;
  let melhor: { local: Local; comprimento: number } | null = null;
  for (const { termos, local } of LOCAIS) {
    for (const termo of termos) {
      const re = new RegExp(`(^|[^a-z0-9])${termo.replace(ESCAPAR, "\\$&")}([^a-z0-9]|$)`);
      if (!re.test(alvo)) continue;
      if (!melhor || termo.length > melhor.comprimento) {
        melhor = { local, comprimento: termo.length };
      }
    }
  }
  return melhor?.local ?? null;
}

/** Lugar de um verbete do calendário: olha o campo `lugar` e, depois, o texto. */
export function localDaEntrada(e: EntradaCalendario): Local | null {
  return detectarLocal(e.lugar, e.titulo, e.resumo);
}

/**
 * Quantos verbetes do calendário ganham lugar. É o número que vai à tela: a
 * cobertura é declarada, não maquiada.
 */
export function coberturaDeLocais(entradas: EntradaCalendario[]): {
  total: number;
  comLocal: number;
  porLocal: { nome: string; uf: string; quantos: number }[];
} {
  const contagem = new Map<string, number>();
  let comLocal = 0;
  for (const e of entradas) {
    const l = localDaEntrada(e);
    if (!l) continue;
    comLocal += 1;
    const chave = `${l.nome}/${l.uf}`;
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }
  const porLocal = [...contagem.entries()]
    .map(([chave, quantos]) => {
      const [nome, uf] = chave.split("/");
      return { nome, uf, quantos };
    })
    .sort((a, b) => b.quantos - a.quantos || a.nome.localeCompare(b.nome, "pt-BR"));
  return { total: entradas.length, comLocal, porLocal };
}
