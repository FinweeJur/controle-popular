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
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";



interface ArquivoLicencasRaw {
  total?: number;
  total_disponivel?: number;
  truncado?: boolean;
  gerado_em?: string;
  ressalva_editorial?: string;
  colunas?: string[];
  linhas?: (LinhaBruta | (string | number | null)[])[];
}

function carregarDataJson(nome: string, maxLinhas: number = 500): ArquivoLicencasRaw {
  const caminhos = [
    path.resolve(process.cwd(), "apps", "web", "data", nome),
    path.resolve(process.cwd(), "data", nome),
  ];
  for (const c of caminhos) {
    if (existsSync(c)) {
      try {
        const conteudo = readFileSync(c, "utf-8");
        const dado = JSON.parse(conteudo) as ArquivoLicencasRaw;
        if (Array.isArray(dado.linhas) && dado.linhas.length > maxLinhas) {
          return {
            ...dado,
            linhas: dado.linhas.slice(0, maxLinhas),
          };
        }
        return dado;
      } catch {
        return { total: 0, linhas: [] };
      }
    }
  }
  return { total: 0, linhas: [] };
}

/** Carrega JSON já normalizado (coletores Onda 2: campos completos incluindo
 *  microresumo e tags). maxLinhas limita a janela por bundle (Rule 1).
 *  Os totais reais ficam no meta para uso em LICENCAS_COBERTURA. */
interface ArquivoNormalizadoRaw {
  total?: number;
  total_disponivel?: number;
  truncado?: boolean;
  ressalva_editorial?: string;
  gerado_em?: string;
  linhas?: LinhaLicencaUnificada[];
}

function carregarLinhasNormalizadas(
  nome: string,
  maxLinhas: number = 300,
): { linhas: LinhaLicencaUnificada[]; meta: ArquivoNormalizadoRaw } {
  const caminhos = [
    path.resolve(process.cwd(), "apps", "web", "data", nome),
    path.resolve(process.cwd(), "data", nome),
  ];
  for (const c of caminhos) {
    if (existsSync(c)) {
      try {
        const dado = JSON.parse(readFileSync(c, "utf-8")) as ArquivoNormalizadoRaw;
        const todas = (dado.linhas ?? []).map((l) => {
          const lAny = l as LinhaLicencaUnificada & { valor_multa?: number | string | null; fonte_url?: string | null };
          const porte = l.porte ?? inferirPorte(null, null, l.tipo, l.microresumo, l.tags);
          const valor = l.valor_investimento ?? extrairValor(lAny.valor_multa, l.microresumo);
          const tamanho = l.tamanho_detalhe ?? extrairTamanho(null, null, l.tipo, l.microresumo);
          const link = l.link_oficial ?? construirLinkOficial(l.orgao, l.processo, l.categoria, lAny.fonte_url);
          return {
            ...l,
            porte,
            valor_investimento: valor,
            tamanho_detalhe: tamanho,
            link_oficial: link,
          };
        });
        return {
          linhas: todas.length > maxLinhas ? todas.slice(0, maxLinhas) : todas,
          meta: dado,
        };
      } catch {
        return { linhas: [], meta: {} };
      }
    }
  }
  return { linhas: [], meta: {} };
}

const ibama = carregarDataJson("ibama-licencas.json");
const ibamaAutos = carregarDataJson("ibama-autos-infracao.json");
const igam = carregarDataJson("igam-outorgas.json");
const semaMt = carregarDataJson("sema-mt-licencas.json");
const inemaBa = carregarDataJson("inema-ba-licencas.json");
const semaMa = carregarDataJson("sema-ma-licencas.json");
const semasPa = carregarDataJson("semas-pa-licencas.json");
const semadGo = carregarDataJson("semad-go-licencas.json");
const ana = carregarDataJson("ana-outorgas.json", 1000);

// --- Onda 2: arquivos já no formato LinhaLicencaUnificada com microresumo + tags.
// maxLinhas=300 por fonte → janela do cliente, não o acervo real (Rule 1 AGENTS.md).
const { linhas: linhasFepamRs, meta: metaFepamRs } = carregarLinhasNormalizadas("fepam-rs-licencas.json");
const { linhas: linhasSemarPi, meta: metaSemarPi } = carregarLinhasNormalizadas("semar-pi-licencas.json");
const { linhas: linhasImasulMs, meta: metaImasulMs } = carregarLinhasNormalizadas("imasul-ms-licencas.json");
const { linhas: linhasIemaEs, meta: metaIemaEs } = carregarLinhasNormalizadas("iema-es-licencas.json");
const { linhas: linhasSedamRo, meta: metaSedamRo } = carregarLinhasNormalizadas("sedam-ro-licencas.json");
const { linhas: linhasIbramDf, meta: metaIbramDf } = carregarLinhasNormalizadas("ibram-df-licencas.json");
const { linhas: linhasCetesbSp, meta: metaCetesbSp } = carregarLinhasNormalizadas("cetesb-sp-licencas.json");
const { linhas: linhasIatPr, meta: metaIatPr } = carregarLinhasNormalizadas("iat-pr-licencas.json");
const { linhas: linhasImaSc, meta: metaImaSc } = carregarLinhasNormalizadas("ima-sc-licencas.json");

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
  valor_investimento?: number | null;
  porte?: string | null;
  tamanho_detalhe?: string | null;
  microresumo?: string | null;
  tags?: string[];
  link_oficial?: string | null;
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

/** Extrai ou infere o porte do empreendimento a partir de classe, PAC, tipo ou texto. */
export function inferirPorte(
  clas?: string | null,
  pac?: string | null,
  tipo?: string | null,
  microresumo?: string | null,
  tags?: string[]
): string {
  if (pac === "1" || pac === "SIM" || /pac/i.test(pac ?? "")) return "Excepcional / PAC";

  const textoComb = `${clas ?? ""} ${tipo ?? ""} ${microresumo ?? ""} ${(tags ?? []).join(" ")}`.toLowerCase();

  if (/classe\s*[56]|grande\s*porte|excepcional|mega|miner|petr[oó]leo|siderurg|rodovia|ferrovia|porto|barragem|aeroporto|hidrel[eé]trica/i.test(textoComb)) {
    return "Grande Porte";
  }
  if (/classe\s*[34]|m[eé]dio\s*porte|loteamento|posto\s*de\s*combust|frigor[ií]fico|ind[uú]stria|usina|irrig/i.test(textoComb)) {
    return "Médio Porte";
  }
  if (/classe\s*[12]|pequeno\s*porte|simplificad|las|dlae/i.test(textoComb)) {
    return "Pequeno Porte";
  }
  if (/dispensa|inclus[aã]o.*ve[ií]culo|transporte|micro/i.test(textoComb)) {
    return "Micro / Dispensado";
  }
  return "Não classificado";
}

/** Extrai valor numérico monetário em R$ se presente no registro ou texto. */
export function extrairValor(
  valorDireto?: number | string | null,
  textoBusca?: string | null
): number | null {
  if (typeof valorDireto === "number" && !isNaN(valorDireto) && valorDireto > 0) {
    return valorDireto;
  }
  if (typeof valorDireto === "string") {
    let limpo = valorDireto.replace(/[^\d.,]/g, "").trim();
    if (limpo.includes(",") && limpo.includes(".")) {
      limpo = limpo.replace(/\./g, "").replace(",", ".");
    } else if (limpo.includes(",")) {
      limpo = limpo.replace(",", ".");
    }
    const num = parseFloat(limpo);
    if (!isNaN(num) && num > 0) return num;
  }
  if (textoBusca) {
    const m = /R\$\s*([\d.]+,\d{2}|\d+[\.,]\d+|\d+)/i.exec(textoBusca);
    if (m) {
      const limpo = m[1].replace(/\./g, "").replace(",", ".");
      const v = parseFloat(limpo);
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return null;
}

/** Extrai detalhes de tamanho (área, vazão, classe, etc.). */
export function extrairTamanho(
  clas?: string | null,
  parametros?: string | null,
  tipo?: string | null,
  microresumo?: string | null
): string | null {
  if (parametros && parametros.trim() && parametros.trim() !== "—") return parametros.trim();
  if (clas && /classe/i.test(clas)) return clas.trim();

  const m = /(\d+(?:[.,]\d+)?\s*(?:ha|m[²2]|m[³3]\/h|m[³3]\/dia|l\/s|cab|km|MW))/i.exec(`${tipo ?? ""} ${microresumo ?? ""}`);
  if (m) return m[1];
  return null;
}

/**
 * Gera link oficial específico para consulta do processo, licença, outorga ou auto de infração
 * no respectivo órgão ambiental (federal ou estadual).
 * Evita homepages genéricas; aponta diretamente para a consulta processual pública.
 */
export function construirLinkOficial(
  orgao: string,
  processo?: string | null,
  categoria?: string | null,
  urlDireta?: string | null,
): string | null {
  if (urlDireta && /^https?:\/\//i.test(urlDireta.trim())) {
    return urlDireta.trim();
  }
  const proc = (processo ?? "").trim();
  if (!proc || proc === "s/n" || proc === "—") return null;

  const orgUpper = orgao.toUpperCase();

  // 1. IBAMA (Licenças federais)
  if (orgUpper === "IBAMA") {
    return `https://sei.ibama.gov.br/sei/controlador_externo.php?acao=usuario_externo_pesquisa_processo&txtPesquisa=${encodeURIComponent(proc)}`;
  }

  // 2. IBAMA (Autos de infração e embargos)
  if (orgUpper.includes("IBAMA (AUTOS)") || (orgUpper.includes("IBAMA") && categoria === "auto_infracao")) {
    return `https://servicos.ibama.gov.br/ctf/publico/areasembargadas/ConsultaInfracoes.php?termo=${encodeURIComponent(proc)}`;
  }

  // 3. ANA (Outorgas federais)
  if (orgUpper === "ANA") {
    return `https://www.snirh.gov.br/cnarh/consulta/processo?numero=${encodeURIComponent(proc)}`;
  }

  // 4. IGAM (MG - Outorgas)
  if (orgUpper.includes("IGAM")) {
    const limpo = proc.replace(/[^\d/]/g, "");
    return `http://www.siam.mg.gov.br/siam/legislacao/consulta_portarias.jsp?num=${encodeURIComponent(limpo || proc)}`;
  }

  // 5. SEMA (MT)
  if (orgUpper.includes("SEMA (MT)") || orgUpper.includes("SEMA-MT")) {
    return `https://simlam.sema.mt.gov.br/portal/processo/consulta?termo=${encodeURIComponent(proc)}`;
  }

  // 6. INEMA (BA)
  if (orgUpper.includes("INEMA")) {
    return `http://www.seia.ba.gov.br/consulta-processo?num_processo=${encodeURIComponent(proc)}`;
  }

  // 7. SEMA (MA)
  if (orgUpper.includes("SEMA (MA)") || orgUpper.includes("SEMA-MA")) {
    return `https://sigla.sema.ma.gov.br/consulta/processo?termo=${encodeURIComponent(proc)}`;
  }

  // 8. SEMAS (PA)
  if (orgUpper.includes("SEMAS (PA)") || orgUpper.includes("SEMAS-PA")) {
    return `http://monitoramento.semas.pa.gov.br/simlam/painel_processo.aspx?processo=${encodeURIComponent(proc)}`;
  }

  // 9. SEMAD (GO)
  if (orgUpper.includes("SEMAD (GO)") || orgUpper.includes("SEMAD-GO")) {
    return `https://sga.meioambiente.go.gov.br/consulta/processo?numero=${encodeURIComponent(proc)}`;
  }

  // 10. FEPAM (RS)
  if (orgUpper.includes("FEPAM")) {
    const m = /\((?:Proc\.?\s*)?([^)]+)\)/i.exec(proc);
    const termo = m ? m[1].trim() : proc;
    return `https://sol.fepam.rs.gov.br/consulta/processo?termo=${encodeURIComponent(termo)}`;
  }

  // 11. SEMAR / SEMARH (PI)
  if (orgUpper.includes("SEMAR")) {
    return `https://siga.semarh.pi.gov.br/consulta/processo/${encodeURIComponent(proc)}`;
  }

  // 12. IMASUL (MS)
  if (orgUpper.includes("IMASUL")) {
    return `https://www.imasul.ms.gov.br/consulta-processo?termo=${encodeURIComponent(proc)}`;
  }

  // 13. IEMA / AGERH (ES)
  if (orgUpper.includes("IEMA") || orgUpper.includes("AGERH")) {
    return `https://siga.es.gov.br/consulta/processo?termo=${encodeURIComponent(proc)}`;
  }

  // 14. SEDAM (RO)
  if (orgUpper.includes("SEDAM")) {
    return `https://sigam.sedam.ro.gov.br/consulta/processo?termo=${encodeURIComponent(proc)}`;
  }

  // 15. IBRAM (DF)
  if (orgUpper.includes("IBRAM")) {
    return `https://sei.df.gov.br/sei/controlador_externo.php?acao=usuario_externo_pesquisa_processo&txtPesquisa=${encodeURIComponent(proc)}`;
  }

  // 16. CETESB (SP)
  if (orgUpper.includes("CETESB")) {
    return `https://e.ambiente.sp.gov.br/atendimento/consulta/processo?numero=${encodeURIComponent(proc)}`;
  }

  // 17. IAT (PR)
  if (orgUpper.includes("IAT")) {
    const m = /Protocolo\s*([\d.]+)/i.exec(proc);
    const termo = m ? m[1].trim() : proc;
    return `https://www.eprotocolo.pr.gov.br/consulta/processo?numero=${encodeURIComponent(termo)}`;
  }

  // 18. IMA (SC)
  if (orgUpper.includes("IMA (SC)") || orgUpper.includes("IMA-SC")) {
    const m = /\((?:Proc\.?\s*)?([^)]+)\)/i.exec(proc);
    const termo = m ? m[1].trim() : proc;
    return `https://sinfat.ima.sc.gov.br/consulta/processo?codigo=${encodeURIComponent(termo)}`;
  }

  return null;
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
    valor_investimento?: number | null;
    porte?: string | null;
    tamanho_detalhe?: string | null;
    link_oficial?: string | null;
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
      link_oficial: extra.link_oficial ?? construirLinkOficial(orgao, extra.processo, categoria),
    };
  });
}

const linhasIbama: LinhaLicencaUnificada[] = unificar("IBAMA", "licenca", (linha) => {
  const tipo = texto(linha.tipol) ?? "Licença";
  const pac = texto(linha.pac);
  return {
    uf: null,
    data_inicio: dataIso(texto(linha.dt_emi)),
    data_fim: dataIso(texto(linha.dt_ven)),
    tipo,
    empresa: texto(linha.emp),
    municipio: null,
    bacia: null,
    situacao: "Emitida pelo IBAMA",
    processo: texto(linha.proc) ?? texto(linha.lic) ?? "s/n",
    porte: inferirPorte(null, pac, tipo, null, ["ibama"]),
    tamanho_detalhe: pac === "SIM" || pac === "1" ? "PAC — Programa de Aceleração do Crescimento" : null,
  };
}, (ibama as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasAna: LinhaLicencaUnificada[] = unificar("ANA", "outorga", (linha) => {
  const uso = texto(linha.uso) ?? "Uso";
  const tipoOutorga = texto(linha.tipo_outorga) ?? "Outorga";
  const tipoTexto = `${tipoOutorga} — ${uso}`;
  return {
    uf: texto(linha.uf),
    data_inicio: dataIso(texto(linha.dt_ini)),
    data_fim: dataIso(texto(linha.dt_fim)),
    tipo: tipoTexto,
    empresa: texto(linha.titular) ?? texto(linha.emp),
    municipio: texto(linha.mun),
    bacia: texto(linha.bacia)?.replace(/^Região hidrográfica do\s+/i, "") ?? null,
    situacao: texto(linha.valida) === "1" ? "Vigente" : null,
    processo: texto(linha.proc) ?? "s/n",
    porte: inferirPorte(null, null, tipoTexto, uso, ["ana", "outorga"]),
    tamanho_detalhe: `Captação: ${uso}`,
  };
}, (ana as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

function normalizarBaciaIgam(urga: string | null): string | null {
  if (!urga) return null;
  const u = urga.toUpperCase();
  if (u.includes("SM") || u.includes("MUCURI") || u.includes("MATEUS")) return "Rio Mucuri / São Mateus";
  if (u.includes("DOCE")) return "Rio Doce";
  if (u.includes("GRANDE")) return "Rio Grande";
  if (u.includes("PARANAÍBA") || u.includes("PARANAIBA")) return "Rio Paranaíba";
  if (u.includes("PARAÍBA") || u.includes("PARAIBA")) return "Rio Paraíba do Sul";
  if (u.includes("JEQUITINHONHA") || u.includes("PARDO")) return "Rio Jequitinhonha";
  if (u.includes("SF") || u.includes("CENTRAL") || u.includes("VELHAS") || u.includes("PARAOPEBA") || u.includes("FRANCISCO")) return "Rio São Francisco";
  return urga;
}

const igamRaw = igam as unknown as { colunas?: string[]; linhas?: (LinhaBruta | (string | number | null)[])[] };
const linhasIgamBrutas: LinhaBruta[] = (igamRaw.linhas ?? []).map((l) => {
  if (Array.isArray(l) && igamRaw.colunas) {
    const obj: LinhaBruta = {};
    igamRaw.colunas.forEach((col, idx) => {
      obj[col] = l[idx] ?? null;
    });
    return obj;
  }
  return l as LinhaBruta;
});

const linhasIgam: LinhaLicencaUnificada[] = unificar("IGAM (MG)", "outorga", (linha) => {
  const tipoUso = texto(linha.tipo_uso) ?? "Uso";
  const tipoTexto = `Outorga — ${primeiraPalavra(tipoUso, "uso")}`;
  return {
    uf: "MG",
    data_inicio: null,
    data_fim: dataIso(texto(linha.data_publicacao)),
    tipo: tipoTexto,
    empresa: texto(linha.empreendimento),
    municipio: null,
    bacia: normalizarBaciaIgam(texto(linha.regional)),
    situacao: texto(linha.situacao),
    processo: texto(linha.portaria) ?? "s/n",
    porte: inferirPorte(null, null, tipoTexto, tipoUso, ["igam", "mg"]),
    tamanho_detalhe: `Uso: ${tipoUso}`,
  };
}, linhasIgamBrutas);

const linhasMt: LinhaLicencaUnificada[] = unificar("SEMA (MT)", "licenca", (linha) => {
  const clasp = texto(linha.clas) ?? "licenca";
  const categoria = clasp.includes("infracao") ? "auto_infracao" : clasp.includes("embargo") ? "embargo" : "licenca";
  const tipo = texto(linha.documento) ?? texto(linha.tipo) ?? "Licença";
  const params = texto(linha.parametros);
  return {
    uf: texto(linha.uf) ?? "MT",
    data_inicio: dataIso(texto(linha.data_emissao)),
    data_fim: dataIso(texto(linha.data_validade)),
    tipo,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: texto(linha.processo) ?? "s/n",
    porte: inferirPorte(clasp, null, tipo, params, ["sema", "mt"]),
    tamanho_detalhe: extrairTamanho(clasp, params, tipo, null),
  };
}, (semaMt as unknown as { linhas?: LinhaBruta[] }).linhas ?? []).map((linha) => ({
  ...linha,
  categoria: linha.tipo.toLowerCase().includes("infrac") ? ("auto_infracao" as const) : linha.tipo.toLowerCase().includes("embarg") ? ("embargo" as const) : linha.categoria,
}));

/** IBAMA autos de infração */
const linhasIbamaAutos: LinhaLicencaUnificada[] = unificar("IBAMA (autos)", "auto_infracao", (linha) => {
  const motivo = texto(linha.motivo) ?? "Infração ambiental";
  return {
    uf: texto(linha.uf),
    data_inicio: dataIso(texto(linha.dt_auto)),
    data_fim: null,
    tipo: motivo,
    empresa: texto(linha.nom),
    municipio: texto(linha.mun),
    bacia: null,
    situacao: texto(linha.sit),
    processo: texto(linha.auto) ?? texto(linha.serie) ?? "s/n",
    porte: "Infração / Auto",
    valor_investimento: extrairValor(linha.val_auto as number | string | null, motivo),
  };
}, (ibamaAutos as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasBa: LinhaLicencaUnificada[] = unificar("INEMA (BA)", "licenca", (linha) => {
  const tipoTexto = texto(linha.tipo) ?? "Licença";
  const resumo = texto(linha.resumo);
  const proc = texto(linha.processo) ?? "s/n";
  const urlDireta = texto(linha.fonte_pagina);
  return {
    uf: "BA",
    data_inicio: dataIso(texto(linha.data_publicacao)),
    data_fim: null,
    tipo: tipoTexto,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: proc,
    porte: inferirPorte(null, null, tipoTexto, resumo, ["inema", "ba"]),
    tamanho_detalhe: extrairTamanho(null, null, tipoTexto, resumo),
    valor_investimento: extrairValor(null, resumo),
    link_oficial: construirLinkOficial("INEMA (BA)", proc, "licenca", urlDireta),
  };
}, (inemaBa as unknown as { linhas?: LinhaBruta[] }).linhas ?? []).map((linha) => ({
  ...linha,
  categoria: /notific|infrac|auto/i.test(linha.tipo) ? ("auto_infracao" as const) : linha.categoria,
}));

const linhasMa: LinhaLicencaUnificada[] = unificar("SEMA (MA)", "licenca", (linha) => {
  const tipo = texto(linha.tipo) ?? "Licença";
  const resumo = texto(linha.resumo);
  const proc = texto(linha.processo) ?? "s/n";
  const urlDireta = texto(linha.fonte_url);
  return {
    uf: "MA",
    data_inicio: dataIso(texto(linha.data_publicacao)),
    data_fim: null,
    tipo,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: proc,
    porte: inferirPorte(null, null, tipo, resumo, ["sema", "ma"]),
    tamanho_detalhe: extrairTamanho(null, null, tipo, resumo),
    valor_investimento: extrairValor(null, resumo),
    link_oficial: construirLinkOficial("SEMA (MA)", proc, "licenca", urlDireta),
  };
}, (semaMa as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

const linhasPa: LinhaLicencaUnificada[] = unificar("SEMAS (PA)", "licenca", (linha) => {
  const tipoTexto = texto(linha.tipo_texto) ?? texto(linha.tipo) ?? "licenca";
  const ativ = texto(linha.atividade);
  const proc = texto(linha.processo) ?? "s/n";
  const urlDireta = texto(linha.fonte_url);
  return {
    uf: "PA",
    data_inicio: null,
    data_fim: dataIso(texto(linha.data)),
    tipo: tipoTexto,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: proc,
    porte: inferirPorte(null, null, tipoTexto, ativ, ["semas", "pa"]),
    tamanho_detalhe: extrairTamanho(null, null, tipoTexto, ativ),
    link_oficial: construirLinkOficial("SEMAS (PA)", proc, "licenca", urlDireta),
  };
}, (semasPa as unknown as { linhas?: LinhaBruta[] }).linhas ?? []).map((linha) => ({
  ...linha,
  categoria: /infrac|auto/i.test(linha.tipo) ? ("auto_infracao" as const) : /outorga/i.test(linha.tipo) ? ("outorga" as const) : linha.categoria,
}));

const linhasGo: LinhaLicencaUnificada[] = unificar("SEMAD (GO)", "licenca", (linha) => {
  const tipo = texto(linha.tipo) ?? "Licença";
  const ativ = texto(linha.atividade);
  const proc = texto(linha.processo) ?? "s/n";
  const urlDireta = texto(linha.fonte_url);
  return {
    uf: "GO",
    data_inicio: dataIso(texto(linha.data)),
    data_fim: null,
    tipo,
    empresa: texto(linha.empresa),
    municipio: texto(linha.municipio),
    bacia: null,
    situacao: texto(linha.situacao),
    processo: proc,
    porte: inferirPorte(null, null, tipo, ativ, ["semad", "go"]),
    tamanho_detalhe: extrairTamanho(null, null, tipo, ativ),
    link_oficial: construirLinkOficial("SEMAD (GO)", proc, "licenca", urlDireta),
  };
}, (semadGo as unknown as { linhas?: LinhaBruta[] }).linhas ?? []);

export const REGISTROS_LICENCAS: LinhaLicencaUnificada[] = [
  // Fontes nacionais
  ...linhasAna,
  ...linhasIbama,
  ...linhasIbamaAutos,
  // Onda 1 (estados — sample de 500 cada)
  ...linhasIgam,
  ...linhasMt,
  ...linhasBa,
  ...linhasMa,
  ...linhasPa,
  ...linhasGo,
  // Onda 2 (estados — sample de 300 cada, acervo real em LICENCAS_COBERTURA)
  ...linhasFepamRs,
  ...linhasSemarPi,
  ...linhasImasulMs,
  ...linhasIemaEs,
  ...linhasSedamRo,
  ...linhasIbramDf,
  ...linhasCetesbSp,
  ...linhasIatPr,
  ...linhasImaSc,
];

function agrupar(forma: "orgao" | "uf" | "ano" | "categoria"): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const linha of REGISTROS_LICENCAS) {
    const chave = linha[forma];
    const k = chave === null || chave === undefined ? "—" : String(chave);
    contagem[k] = (contagem[k] ?? 0) + 1;
  }
  return contagem;
}

/** Acervo real (total do JSON — contagem da coleta, não da janela do cliente). */
function totalReal(meta: ArquivoNormalizadoRaw | { total?: number }): number {
  return (meta as ArquivoNormalizadoRaw).total ?? 0;
}

/** Soma os totais reais de todas as fontes para publicar no cartão de cobertura.
 *  ATENÇÃO: órgãos distintos não se somam numa linha só (AGENTS.md); o total
 *  aqui é só para "quanto foi coletado no total de atos/licenças". */
const TOTAL_ACERVO_REAL =
  totalReal(ibama as { total?: number }) +
  totalReal(ibamaAutos as { total?: number }) +
  totalReal(ana as { total?: number }) +
  totalReal(igam as { total?: number }) +
  totalReal(semaMt as { total?: number }) +
  totalReal(inemaBa as { total?: number }) +
  totalReal(semaMa as { total?: number }) +
  totalReal(semasPa as { total?: number }) +
  totalReal(semadGo as { total?: number }) +
  totalReal(metaFepamRs) +
  totalReal(metaSemarPi) +
  totalReal(metaImasulMs) +
  totalReal(metaIemaEs) +
  totalReal(metaSedamRo) +
  totalReal(metaIbramDf) +
  totalReal(metaCetesbSp) +
  totalReal(metaIatPr) +
  totalReal(metaImaSc);

export const LICENCAS_COBERTURA: CoberturaLicencas = {
  // NOTA: `total` é o acervo completo coletado; `REGISTROS_LICENCAS.length`
  // é a janela do cliente (subconjunto para não violar o limite de bundle).
  total: TOTAL_ACERVO_REAL || REGISTROS_LICENCAS.length,
  por_orgao: agrupar("orgao"),
  por_uf: agrupar("uf"),
  por_ano: agrupar("ano"),
  por_categoria: agrupar("categoria"),
  truncado:
    Boolean((ibama as { truncado?: boolean }).truncado) ||
    Boolean((ibamaAutos as { truncado?: boolean }).truncado) ||
    Boolean((ana as { truncado?: boolean }).truncado) ||
    Boolean((igam as { truncado?: boolean }).truncado) ||
    Boolean((semaMt as { truncado?: boolean }).truncado) ||
    Boolean((inemaBa as { truncado?: boolean }).truncado) ||
    Boolean((semaMa as { truncado?: boolean }).truncado) ||
    Boolean((semasPa as { truncado?: boolean }).truncado) ||
    Boolean((semadGo as { truncado?: boolean }).truncado) ||
    Boolean(metaFepamRs.truncado) ||
    Boolean(metaSemarPi.truncado) ||
    Boolean(metaImasulMs.truncado) ||
    Boolean(metaIemaEs.truncado) ||
    Boolean(metaSedamRo.truncado) ||
    Boolean(metaIbramDf.truncado) ||
    Boolean(metaCetesbSp.truncado) ||
    Boolean(metaIatPr.truncado) ||
    Boolean(metaImaSc.truncado),
  gerado_em: new Date().toISOString().slice(0, 10),
  ressalvas: [
    String((ana as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((ibamaAutos as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((igam as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semaMt as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((inemaBa as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semaMa as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semasPa as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String((semadGo as { ressalva_editorial?: string }).ressalva_editorial ?? ""),
    String(metaFepamRs.ressalva_editorial ?? ""),
    String(metaSemarPi.ressalva_editorial ?? ""),
    String(metaImasulMs.ressalva_editorial ?? ""),
    String(metaIemaEs.ressalva_editorial ?? ""),
    String(metaSedamRo.ressalva_editorial ?? ""),
    String(metaIbramDf.ressalva_editorial ?? ""),
    String(metaCetesbSp.ressalva_editorial ?? ""),
    String(metaIatPr.ressalva_editorial ?? ""),
    String(metaImaSc.ressalva_editorial ?? ""),
  ].filter(Boolean),
};
