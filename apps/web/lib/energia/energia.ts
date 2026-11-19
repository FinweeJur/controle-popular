/**
 * apps/web/lib/energia/energia.ts
 *
 * Painel de energia — fase 2 (contratos, outorgas, leilões e impostos).
 *
 * O que é: tipagem e leitura do recorte de usinas de geração de Minas Gerais
 * que o coletor `scripts/coletar-siga-mg.py` grava em
 * `apps/web/data/energia/usinas-mg.json`. Aqui não há coleta nem banco: só
 * funções puras que a página usa para somar potência, agrupar por fonte e
 * listar prazos de outorga.
 *
 * Fonte oficial do dado: ANEEL — SIGA, Sistema de Informações de Geração
 * (https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel),
 * licença ODbL 1.0. A atribuição viaja dentro do próprio JSON (`fonte`,
 * `coletadoEm`) porque a página cidadã precisa exibir de onde veio o número.
 *
 * Decisões técnicas não triviais:
 * - O JSON guarda até 300 usinas, com piso de 10 por tipo de geração; a base
 *   completa (1.300 em MG) continua na fonte. Somar potência aqui, portanto,
 *   é somar **o recorte publicado**, nunca a capacidade instalada do estado.
 *   Toda função que soma devolve a ressalva junto para o texto da página não
 *   prometer o que o dado não entrega.
 * - `potenciaKw` é potência **outorgada**, não medida. Usina em construção
 *   entra na lista com potência e sem `entradaOperacao`.
 * - Preço de contrato bilateral não existe nesta base e não existe em fonte
 *   pública: o limite está documentado em `docs/06-fontes/ENERGIA-CONTRATOS.md`.
 */

import dadosSigla from "@/data/energia/usinas-mg.json";

/** Tipos de geração que o SIGA usa e que o recorte aceita. */
export const TIPOS_GERACAO = ["UHE", "PCH", "CGH", "UFV", "UTE", "EOL"] as const;

export type TipoGeracao = (typeof TIPOS_GERACAO)[number];

/** As 27 unidades da federação — a UF do dado tem de ser uma delas. */
export const UFS_VALIDAS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS",
  "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC",
  "SE", "SP", "TO",
] as const;

/** Uma usina do recorte publicado. */
export interface Usina {
  /** Posição no ranking por potência outorgada, começando em 1. */
  posicao: number;
  /** Código Único de Empreendimento de Geração da ANEEL (ex.: UHE.PH.MG.001194-0.1). */
  ceg: string;
  nome: string;
  tipo: TipoGeracao;
  /** Fase no SIGA: "Operação", "Construção", "Construção não iniciada". */
  fase: string | null;
  /** Combustível/fonte detalhada, como o SIGA publica. */
  fonteEnergia: string | null;
  /** Potência da outorga, em kW. Sempre maior que zero. */
  potenciaKw: number;
  potenciaFiscalizadaKw: number;
  /** Garantia física (lastro de contrato), em kW. */
  garantiaFisicaKw: number;
  municipios: string[];
  uf: string;
  /** "Concessão", "Autorização" ou "Registro". */
  outorga: string | null;
  /** "REG" (ambiente regulado) ou "PIE" (produtor independente), quando informado. */
  regime: string | null;
  /** ISO AAAA-MM-DD, ou null quando a usina ainda não entrou em operação. */
  entradaOperacao: string | null;
  inicioVigencia: string | null;
  /** Fim do prazo da outorga — é o que vence e volta a ser licitado. */
  fimVigencia: string | null;
  /** URL do arquivo da ANEEL usado na linha. */
  fonte: string;
  /** ISO 8601 UTC da coleta. Presente em toda linha, por decisão de auditoria. */
  coletadoEm: string;
}

export interface SnapshotUsinas {
  titulo: string;
  fonte: string;
  fonteUrl: string;
  datasetUrl: string;
  licenca: string;
  coletadoEm: string;
  dataConjunto: string | null;
  uf: string;
  criterio: string | null;
  totalNoRecorte: number;
  totalIncluido: number;
  ressalva: string | null;
  usinas: Usina[];
}

const SNAPSHOT = dadosSigla as unknown as SnapshotUsinas;

/**
 * Devolve o recorte publicado inteiro (metadados + usinas).
 * Não valida de novo: a integridade é cobrada pelo teste `energia.test.ts`,
 * que roda na suíte e no pre-push.
 */
export function carregarUsinas(): SnapshotUsinas {
  return SNAPSHOT;
}

/**
 * Lista as usinas ordenadas como vieram do coletor (potência decrescente).
 */
export function listarUsinas(): Usina[] {
  return SNAPSHOT.usinas;
}

/**
 * Soma da potência outorgada do recorte, em MW.
 *
 * Atenção: é o recorte publicado (até 300 usinas), não a capacidade instalada
 * de MG. Use `carregarUsinas().totalNoRecorte` para dizer quantas ficaram fora.
 */
export function potenciaTotalMw(usinas: Usina[] = SNAPSHOT.usinas): number {
  const kw = usinas.reduce((soma, u) => soma + u.potenciaKw, 0);
  return Math.round(kw / 1000);
}

/**
 * Contagem e potência por tipo de geração, do maior para o menor.
 * Usada no gráfico de composição do painel.
 */
export function resumoPorTipo(
  usinas: Usina[] = SNAPSHOT.usinas,
): Array<{ tipo: TipoGeracao; quantidade: number; potenciaMw: number }> {
  const mapa = new Map<TipoGeracao, { quantidade: number; potenciaMw: number }>();
  for (const u of usinas) {
    const atual = mapa.get(u.tipo) ?? { quantidade: 0, potenciaMw: 0 };
    atual.quantidade += 1;
    atual.potenciaMw += u.potenciaKw / 1000;
    mapa.set(u.tipo, atual);
  }
  return [...mapa.entries()]
    .map(([tipo, v]) => ({ tipo, quantidade: v.quantidade, potenciaMw: Math.round(v.potenciaMw) }))
    .sort((a, b) => b.potenciaMw - a.potenciaMw);
}

/**
 * Usinas cujo município (comparação sem acento e sem caixa) casa com o nome.
 * A usina pode estar em mais de um município — entra em cada um.
 */
export function usinasDoMunicipio(nome: string, usinas: Usina[] = SNAPSHOT.usinas): Usina[] {
  const alvo = normalizar(nome);
  if (!alvo) return [];
  return usinas.filter((u) => u.municipios.some((m) => normalizar(m) === alvo));
}

/**
 * Outorgas com prazo já vencido no ano de referência informado.
 *
 * Por que importa: outorga vencida e não renovada é o ponto em que a usina
 * deixa de ter título e o rio volta a ser objeto de disputa. `fimVigencia`
 * ausente não entra na conta — ausência de prazo não é prova de vencimento.
 */
export function outorgasVencidas(
  anoReferencia: number,
  usinas: Usina[] = SNAPSHOT.usinas,
): Usina[] {
  if (!Number.isInteger(anoReferencia) || anoReferencia < 1900) return [];
  return usinas
    .filter((u) => u.fimVigencia !== null && Number(u.fimVigencia.slice(0, 4)) < anoReferencia)
    .sort((a, b) => (a.fimVigencia ?? "").localeCompare(b.fimVigencia ?? ""));
}

/**
 * Valida um snapshot e devolve a lista de problemas encontrados.
 *
 * Vive em código de produção (e não só no teste) porque o mesmo contrato vai
 * ser usado pelo build quando a fase 2 passar a ler mais de um recorte. Lista
 * vazia = dado íntegro.
 */
export function validarSnapshot(snapshot: unknown): string[] {
  const problemas: string[] = [];
  if (typeof snapshot !== "object" || snapshot === null) return ["snapshot não é objeto"];
  const s = snapshot as Partial<SnapshotUsinas>;

  for (const campo of ["fonte", "fonteUrl", "coletadoEm", "uf"] as const) {
    if (typeof s[campo] !== "string" || !s[campo]) problemas.push(`metadado ausente: ${campo}`);
  }
  if (s.coletadoEm && !dataValida(s.coletadoEm.slice(0, 10))) {
    problemas.push(`coletadoEm não é data ISO: ${s.coletadoEm}`);
  }
  if (!Array.isArray(s.usinas) || s.usinas.length === 0) {
    problemas.push("snapshot sem usinas");
    return problemas;
  }
  if (s.usinas.length > 300) {
    problemas.push(`recorte passou do teto de 300 usinas: ${s.usinas.length}`);
  }

  s.usinas.forEach((u, i) => {
    const onde = `usinas[${i}]`;
    if (!Number.isInteger(u.posicao) || u.posicao < 1) problemas.push(`${onde}: posicao inválida`);
    if (typeof u.ceg !== "string" || !u.ceg.trim()) problemas.push(`${onde}: ceg vazio`);
    if (typeof u.nome !== "string" || !u.nome.trim()) problemas.push(`${onde}: nome vazio`);
    if (!TIPOS_GERACAO.includes(u.tipo)) problemas.push(`${onde}: tipo inválido (${u.tipo})`);
    if (typeof u.potenciaKw !== "number" || !(u.potenciaKw > 0)) {
      problemas.push(`${onde}: potência não positiva (${u.potenciaKw})`);
    }
    if (!UFS_VALIDAS.includes(u.uf as (typeof UFS_VALIDAS)[number])) {
      problemas.push(`${onde}: UF inválida (${u.uf})`);
    }
    if (!Array.isArray(u.municipios) || u.municipios.length === 0) {
      problemas.push(`${onde}: sem município`);
    }
    if (typeof u.fonte !== "string" || !u.fonte.startsWith("http")) {
      problemas.push(`${onde}: fonte ausente ou não é URL`);
    }
    if (typeof u.coletadoEm !== "string" || !dataValida(u.coletadoEm.slice(0, 10))) {
      problemas.push(`${onde}: coletadoEm ausente ou fora do padrão ISO`);
    }
    for (const campo of ["entradaOperacao", "inicioVigencia", "fimVigencia"] as const) {
      const valor = u[campo];
      if (valor !== null && (typeof valor !== "string" || !dataValida(valor))) {
        problemas.push(`${onde}: ${campo} fora do padrão ISO (${valor})`);
      }
    }
  });

  return problemas;
}

/** Chave de comparação: minúscula, sem acento, sem espaço extra. */
function normalizar(texto: string): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** AAAA-MM-DD que existe no calendário. */
function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [ano, mes, dia] = texto.split("-").map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  return d.getUTCFullYear() === ano && d.getUTCMonth() === mes - 1 && d.getUTCDate() === dia;
}
