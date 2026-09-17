/**
 * licencas-unificada.ts — feed único de licenças/outorgas/autos para
 * `/ambiental/licencas`, lendo os JSONs de amostra coletados (coleta cheia
 * roda na home-pc pela rotina agendada: `rotina-ambiental.mts`).
 *
 * Server-only: importa os arquivos de data/. A página recebe o feed
 * NORMALIZADO + COBERTURA — o array inteiro não serdado por fora de
 * `TabelaLicencas`/tamanho; teto de 3 MiB gzip do Worker.
 *
 * REGRA EDITORIAL (AGENTS.md): cadastros de órgãos diferentes NUNCA são
 * somados num "total geral"; cada linha mantém `orgao` de origem, e a
 * ressalva de cada JSON segue no `CoberturaLicencas.ressalvas`.
 *
 * Campos unificados: orgao, uf, ano, categoria (licenca/outorga/
 * auto_infracao/embargo), tipo (tag), empresa, municipio, bacia,
 * data_inicio, data_fim, situacao, processo.
 */
import ibama from "@/data/ibama-licencas.json";
import ibamaAutos from "@/data/ibama-autos-infracao.json";
import ana from "@/data/ana-outorgas.json";
import igam from "@/data/igam-outorgas.json";
import semaMt from "@/data/sema-mt-licencas.json";
import inemaBa from "@/data/inema-ba-licencas.json";
import semaMa from "@/data/sema-ma-licencas.json";
import semasPa from "@/data/semas-pa-licencas.json";
import semadGo from "@/data/semad-go-licencas.json";

export interface LinhaLicencaUnificada {
  orgao: string;
  uf: string | null;
  ano: number | null;
  categoria: "licenca" | "outorga" | "auto_infracao" | "embargo";
  tipo: string;
  empresa: string | null;
  municipio: string | null;
  bacia: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  situacao: string | null;
  processo: string;
}

export interface CoberturaLicencas {
  total: number;
  por_orgao: Record<string, number>;
  por_uf: Record<string, number>;
  por_ano: Record<string, number>;
  por_categoria: Record<string, number>;
  truncado: boolean;
  gerado_em: string;
  ressalvas: string[];
}

type LinhaBruta = Record<string, string | number | boolean | null>;

function texto(valor: string | number | boolean | null | undefined): string | null {
  if (valor === null || valor === undefined || valor === "" || valor === "xxxxx") return null;
  return String(valor);
}

/** dd/mm/yyyy → yyyy-mm-dd; ISO já válido passa; ruído vira null. */
function dataIso(data: string | null): string | null {
  if (!data) return null;
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(data.trim());
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return /^\d{4}-\d{2}-\d{2}$/.test(data.trim()) ? data.trim() : null;
}

function anoDe(data: string | null): number | null {
  const iso = dataIso(data);
  if (!iso) return null;
  return Number(iso.slice(0, 4));
}

function primeiraPalavra(valor: string | null, padrao: string): string {
  if (!valor) return padrao;
  return valor.replace(/[^\w ]/g, " ").trim().split(/\s+/)[0] || padrao;
}

/** Converte um bloco bruto em linhas unificadas. */
function unificar(
  orgao: string,
  categoria: LinhaLicencaUnificada["categoria"],
  extrair: (linha: LinhaBruta) => {
    uf: string | null;
    data_inicio: string | null;
    data_fim: string | null;
    tipo: string;
    empresa: string | null;
    municipio: string | null;
    bacia: string | null;
    situacao: string | null;
    processo: string;
  },
  linhas: LinhaBruta[],
): LinhaLicencaUnificada[] {
  return linhas.map((linha) => {
    const extra = extrair(linha);
    return {
      orgao,
      categoria,
      ...extra,
      ano: anoDe(extra.data_inicio ?? extra.data_fim),
    };
  });
}

const linhasIbama: LinhaLicencaUnificada[] = unificar("IBAMA", "licenca", (linha) => {
  const tipo = texto(linha.tipol) ?? "Licença";
  return {
    uf: null, // fonte DILIC não traz UF — registros por município chegam no ETL existente
    data_inicio: dataIso(texto(linha.dt_emi)),
    data_fim: dataIso(texto(linha.dt_ven)),
    tipo,
    empresa: texto(linha.emp),
    municipio: null,
    bacia: null,
    situacao: "Emitida pelo IBAMA",
    processo: texto(linha.proc) ?? texto(linha.lic) ?? "s/n",
  };
}, (ibama as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasAna: LinhaLicencaUnificada[] = unificar("ANA", "outorga", (linha) => {
  const uso = texto(linha.uso) ?? "Uso";
  const tipoOutorga = texto(linha.tipo_outorga) ?? "Outorga";
  return {
    uf: texto(linha.uf),
    data_inicio: dataIso(texto(linha.dt_ini)),
    data_fim: dataIso(texto(linha.dt_fim)),
    tipo: `${tipoOutorga} — ${uso}`,
    empresa: texto(linha.titular) ?? texto(linha.emp),
    municipio: texto(linha.mun),
    // ANA usa "Região Hidrográfica do X"; o prefixo nacional não ajuda
    // no filtro — deixo só o nome. IGAM usa URGA (vocabulário próprio).
    bacia: texto(linha.bacia)?.replace(/^Região hidrográfica do\s+/i, "") ?? null,
    situacao: texto(linha.valida) === "1" ? "Vigente" : null,
    processo: texto(linha.proc) ?? "s/n",
  };
}, (ana as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasIgam: LinhaLicencaUnificada[] = unificar("IGAM (MG)", "outorga", (linha) => {
  const tipoUso = texto(linha.tipo_uso) ?? "Uso";
  return {
    uf: "MG",
    data_inicio: null,
    data_fim: dataIso(texto(linha.data_publicacao)),
    tipo: `Outorga — ${primeiraPalavra(tipoUso, "uso")}`,
    empresa: texto(linha.empreendimento),
    municipio: null,
    bacia: texto(linha.regional),
    situacao: texto(linha.situacao),
    processo: texto(linha.portaria) ?? "s/n",
  };
}, (igam as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasMt: LinhaLicencaUnificada[] = unificar("SEMA (MT)", "licenca", (linha) => {
  const clasp = texto(linha.clas) ?? "licenca";
  const categoria = clasp.includes("infracao") ? "auto_infracao" : clasp.includes("embargo") ? "embargo" : "licenca";
  return {
    uf: texto(linha.uf) ?? "MT",
    data_inicio: dataIso(texto(linha.data_emissao)),
    data_fim: dataIso(texto(linha.data_validade)),
    tipo: texto(linha.documento) ?? texto(linha.tipo) ?? "Licença",
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
  };
}, (semaMt as unknown as { linhas?: LinhaBruta[] }).linhas ?? []).map((linha) => ({
  ...linha,
  categoria: linha.tipo.toLowerCase().includes("infrac") ? ("auto_infracao" as const) : linha.tipo.toLowerCase().includes("embarg") ? ("embargo" as const) : linha.categoria,
}));

/** IBAMA autos de infração (CAP/SIFISC): começa pelo residencial “auto”
 * (nº) e o “nome” (NOM) NÃO entra na linha — nome de autuado em feed
 * lista é o que a ressalva do próprio JSON pede para não copiar. */
const linhasIbamaAutos: LinhaLicencaUnificada[] = unificar("IBAMA (autos)", "auto_infracao", (linha) => {
  const motivo = texto(linha.motivo) ?? "Infração ambiental";
  return {
    uf: texto(linha.uf),
    data_inicio: dataIso(texto(linha.dt_auto)),
    data_fim: null,
    tipo: motivo,
    // NOM (nome do autuado) entra como "empresa/titular" — o cadastro é
    // público (D.O.U./IBAMA), e a ressalva "não é atribuição de culpa"
    // viaja junto na LICENCAS_COBERTURA.ressalvas.
    empresa: texto(linha.nom),
    municipio: texto(linha.mun),
    bacia: null,
    situacao: texto(linha.sit),
    processo: texto(linha.auto) ?? texto(linha.serie) ?? "s/n",
  };
}, (ibamaAutos as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

/** Estado: DOE extrai portaria/notificação (INEMA-BA, SEMA-MA) — a
 * data_publicacao é a DO EDITAL, não da decisão; ação declarada no tipo. */
const linhasBa: LinhaLicencaUnificada[] = unificar("INEMA (BA)", "licenca", (linha) => {
  const tipoTexto = texto(linha.tipo) ?? "Licença";
  const	auto = tipoTexto.toLowerCase().includes("notifi") || tipoTexto.toLowerCase().includes("infrac");
  return {
    uf: "BA",
    data_inicio: dataIso(texto(linha.data_publicacao)),
    data_fim: null,
    tipo: tipoTexto,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
  };
}, (inemaBa as unknown as { linhas?: LinhaBruta[] }).linhas ?? []).map((linha) => ({
  ...linha,
  categoria: /notific|infrac|auto/i.test(linha.tipo) ? ("auto_infracao" as const) : linha.categoria,
}));

const linhasMa: LinhaLicencaUnificada[] = unificar("SEMA (MA)", "licenca", (linha) => {
  return {
    uf: "MA",
    data_inicio: dataIso(texto(linha.data_publicacao)),
    data_fim: null,
    tipo: texto(linha.tipo) ?? "Licença",
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
  };
}, (semaMa as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasPa: LinhaLicencaUnificada[] = unificar("SEMAS (PA)", "licenca", (linha) => {
  const tipoTexto = texto(linha.tipo) ?? "licenca";
  return {
    uf: "PA",
    data_inicio: null,
    data_fim: dataIso(texto(linha.data)),
    tipo: texto(linha.tipo_texto) ?? tipoTexto,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
  };
}, (semasPa as unknown as { linhas?: LinhaBruta[] }).linhas ?? []).map((linha) => ({
  ...linha,
  categoria: /infrac|auto/i.test(linha.tipo) ? ("auto_infracao" as const) : /outorga/i.test(linha.tipo) ? ("outorga" as const) : linha.categoria,
}));

const linhasGo: LinhaLicencaUnificada[] = unificar("SEMAD (GO)", "licenca", (linha) => {
  return {
    uf: "GO",
    data_inicio: dataIso(texto(linha.data)),
    data_fim: null,
    tipo: texto(linha.tipo) ?? "Licença",
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
  };
}, (semadGo as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

export const REGISTROS_LICENCAS: LinhaLicencaUnificada[] = [
  ...linhasAna,
  ...linhasIbama,
  ...linhasIbamaAutos,
  ...linhasIgam,
  ...linhasMt,
  ...linhasBa,
  ...linhasMa,
  ...linhasPa,
  ...linhasGo,
];

function agrupar(forma: "orgao" | "uf" | "ano" | "categoria"): Record<string, number> {  const contagem: Record<string, number> = {};
  for (const linha of REGISTROS_LICENCAS) {
    const chave = linha[forma];
    const k = chave === null || chave === undefined ? "—" : String(chave);
    contagem[k] = (contagem[k] ?? 0) + 1;
  }
  return contagem;
}

export const LICENCAS_COBERTURA: CoberturaLicencas = {
  total: REGISTROS_LICENCAS.length,
  por_orgao: agrupar("orgao"),
  por_uf: agrupar("uf"),
  por_ano: agrupar("ano"),
  por_categoria: agrupar("categoria"),
  truncado: Boolean((ibama as { truncado?: boolean }).truncado ?? false) ||
    Boolean((ibamaAutos as { truncado?: boolean }).truncado ?? false) ||
    Boolean((ana as { truncado?: boolean }).truncado ?? false) ||
    Boolean((igam as { truncado?: boolean }).truncado ?? false) ||
    Boolean((semaMt as { truncado?: boolean }).truncado ?? false) ||
    Boolean((inemaBa as { truncado?: boolean }).truncado ?? false) ||
    Boolean((semaMa as { truncado?: boolean }).truncado ?? false) ||
    Boolean((semasPa as { truncado?: boolean }).truncado ?? false) ||
    Boolean((semadGo as { truncado?: boolean }).truncado ?? false),
  gerado_em: String((semaMt as { gerado_em?: string }).gerado_em ?? ""),
  ressalvas: [
    String((ana as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((ibamaAutos as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((igam as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semaMt as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((inemaBa as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semaMa as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semasPa as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semadGo as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
  ].filter(Boolean),
};
