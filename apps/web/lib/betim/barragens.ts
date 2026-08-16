import { barragensFeam, barragensSnisb } from "@/lib/db/queries/betim";
import type { Cidade, IdMunicipio } from "@/lib/db/queries/municipios";

/**
 * Barragens do município, juntando FEAM (MG) e SNISB (nacional).
 *
 * ═══ POR QUE JUNTAR É UM PROBLEMA, E NÃO UM DETALHE ═══
 *
 * As duas fontes se sobrepõem parcialmente e **não têm chave comum**. A FEAM
 * identifica por `id_sigibar` (às vezes o literal "Não cadastrado"), o SNISB
 * por `codigo_snisb`. Somar as contagens conta a mesma barragem duas vezes —
 * em Betim, o "Dique D" está nas duas.
 *
 * O único casamento disponível é por NOME normalizado dentro do município, e
 * ele é falível nos dois sentidos:
 *   - grafias diferentes da mesma barragem viram duas linhas (contagem ALTA);
 *   - duas barragens homônimas no mesmo município viram uma (contagem BAIXA).
 *
 * Não dá para eliminar isso sem uma chave que as fontes não publicam. O que dá
 * para fazer é **nunca esconder**: cada linha diz de que fonte veio, o total
 * vem rotulado como estimativa, e a tela repete a ressalva. Um número exato
 * fabricado seria pior que um número honesto com margem.
 *
 * ═══ E CADA FONTE RESPONDE UMA PERGUNTA DIFERENTE ═══
 *
 * FEAM: só mineração e indústria de MG (249), mas com DCE, nível de emergência
 * e método construtivo preenchidos.
 * SNISB: todos os usos (2.212 em MG — abastecimento, irrigação, hidrelétrica),
 * mas com `nivel_perigo` vazio em ~97%.
 *
 * Logo: **ausência na FEAM não é ausência de barragem**, e presença no SNISB
 * sem nível de perigo não é "barragem segura". A tela precisa dizer as duas.
 */

/** A FEAM é estadual. Mesmo gate do CAP: UF, não `temFonte`. */
export function feamCobreCidade(cidade: Cidade): boolean {
  return cidade.uf === "MG";
}

export const FONTE_FEAM = {
  nome: "Inventário de Barragens da FEAM",
  url: "https://feam.br/documents/d/feam/lista-de-barragens-2024-xlsx",
};
export const FONTE_SNISB = {
  nome: "Cadastro Nacional de Barragens (SNISB/ANA)",
  url: "https://www.snirh.gov.br/snisb/",
};

/**
 * Só a FEAM classifica o método construtivo, e só ele distingue a barragem
 * a montante — a técnica de Mariana (2015) e Brumadinho (2019), proibida para
 * novas barragens desde a Lei 14.066/2020. É o único atributo desta tela que
 * merece destaque próprio.
 */
export const METODO_MONTANTE = "Montante";

export interface BarragemUnificada {
  chave: string;
  nome: string;
  empreendedor: string | null;
  /** De onde veio cada pedaço — mostrado na tela, não é metadado interno. */
  fontes: ("FEAM" | "SNISB")[];
  uso: string | null;
  situacao: string | null;
  orgaoFiscalizador: string | null;
  categoriaRisco: string | null;
  danoPotencial: string | null;
  /** Só FEAM. `null` = a FEAM não cobre esta barragem, não "sem emergência". */
  nivelEmergencia: number | null;
  condicaoEstabilidade: string | null;
  metodoConstrutivo: string | null;
  suspensao: string | null;
  alturaM: number | null;
  /** Só SNISB. */
  possuiPae: string | null;
  possuiPlanoSeguranca: string | null;
  nivelPerigo: string | null;
  cursoDagua: string | null;
}

export interface BarragensData {
  /** `false` = banco não configurado. Distinto de "município sem barragem". */
  configurado: boolean;
  barragens: BarragemUnificada[];
  totalFeam: number;
  totalSnisb: number;
  /** Quantas o casamento por nome uniu — a medida da incerteza do total. */
  emAmbas: number;
  /** Recortes que a tela destaca porque mudam a leitura de risco. */
  aMontante: BarragemUnificada[];
  semEstabilidadeAtestada: BarragemUnificada[];
  emEmergencia: BarragemUnificada[];
  semPae: BarragemUnificada[];
}

const VAZIO: BarragensData = {
  configurado: false,
  barragens: [],
  totalFeam: 0,
  totalSnisb: 0,
  emAmbas: 0,
  aMontante: [],
  semEstabilidadeAtestada: [],
  emEmergencia: [],
  semPae: [],
};

/** Maiúsculo, sem acento, espaço único — o mesmo normalizador dos coletores. */
function normalizar(s: string | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

export async function getBarragensData(idMunicipio: IdMunicipio): Promise<BarragensData> {
  try {
    const [feam, snisb] = await Promise.all([
      barragensFeam(idMunicipio),
      barragensSnisb(idMunicipio),
    ]);
    if (feam === null || snisb === null) return VAZIO;

    const porChave = new Map<string, BarragemUnificada>();

    for (const b of feam) {
      const chave = normalizar(b.nome);
      porChave.set(chave, {
        chave,
        nome: b.nome,
        empreendedor: b.empreendedor,
        fontes: ["FEAM"],
        uso: b.finalidade ?? b.atividade,
        situacao: b.situacao,
        orgaoFiscalizador: "FEAM/SEMAD-MG",
        categoriaRisco: b.categoria_risco,
        danoPotencial: b.dano_potencial,
        nivelEmergencia: b.nivel_emergencia,
        condicaoEstabilidade: b.condicao_estabilidade,
        metodoConstrutivo: b.metodo_construtivo,
        suspensao: b.suspensao,
        alturaM: b.altura_m,
        possuiPae: null,
        possuiPlanoSeguranca: null,
        nivelPerigo: null,
        cursoDagua: null,
      });
    }

    let emAmbas = 0;
    for (const b of snisb) {
      const chave = normalizar(b.nome);
      const existente = porChave.get(chave);
      if (existente) {
        // Mesma barragem nas duas fontes: completa o que só o SNISB tem e
        // NÃO sobrescreve o que a FEAM traz melhor (estabilidade, emergência).
        emAmbas += 1;
        existente.fontes.push("SNISB");
        existente.possuiPae = b.possui_pae;
        existente.possuiPlanoSeguranca = b.possui_plano_seguranca;
        existente.nivelPerigo = b.nivel_perigo;
        existente.cursoDagua = b.curso_dagua;
        existente.uso ??= b.uso_principal;
        existente.categoriaRisco ??= b.categoria_risco;
        existente.danoPotencial ??= b.dano_potencial;
        continue;
      }
      porChave.set(chave, {
        chave,
        nome: b.nome ?? "(sem nome na fonte)",
        empreendedor: b.empreendedor,
        fontes: ["SNISB"],
        uso: b.uso_principal,
        situacao: null,
        orgaoFiscalizador: b.orgao_fiscalizador,
        categoriaRisco: b.categoria_risco,
        danoPotencial: b.dano_potencial,
        nivelEmergencia: null,
        condicaoEstabilidade: null,
        metodoConstrutivo: null,
        suspensao: null,
        alturaM: null,
        possuiPae: b.possui_pae,
        possuiPlanoSeguranca: b.possui_plano_seguranca,
        nivelPerigo: b.nivel_perigo,
        cursoDagua: b.curso_dagua,
      });
    }

    const barragens = [...porChave.values()].sort((a, b) => {
      // Ordem de atenção, não alfabética: o que exige olhar vem primeiro.
      const peso = (x: BarragemUnificada) =>
        (x.nivelEmergencia ?? 0) * 10 +
        (x.metodoConstrutivo === METODO_MONTANTE ? 5 : 0) +
        (x.condicaoEstabilidade && x.condicaoEstabilidade !== "Atestada" ? 3 : 0);
      return peso(b) - peso(a) || a.nome.localeCompare(b.nome, "pt-BR");
    });

    return {
      configurado: true,
      barragens,
      totalFeam: feam.length,
      totalSnisb: snisb.length,
      emAmbas,
      aMontante: barragens.filter((b) => b.metodoConstrutivo === METODO_MONTANTE),
      semEstabilidadeAtestada: barragens.filter(
        (b) => b.condicaoEstabilidade != null && b.condicaoEstabilidade !== "Atestada"
      ),
      emEmergencia: barragens.filter((b) => (b.nivelEmergencia ?? 0) > 0),
      // "Não" explícito na fonte — diferente de campo ausente, que é silêncio.
      semPae: barragens.filter((b) => normalizar(b.possuiPae) === "NAO"),
    };
  } catch {
    return { ...VAZIO, configurado: true };
  }
}
