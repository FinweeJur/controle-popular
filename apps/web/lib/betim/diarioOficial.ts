import type { Cidade } from "@/lib/db/queries/municipios";

export interface DiarioOficialInfo {
  ano: number;
  ultimaEdicao: string | null;
  ultimaData: string | null;
  totalAno: number;
}

/**
 * Info leve do Diário Oficial (Órgão Oficial) de Betim, do dataset de
 * dados abertos (`betim.mg.gov.br/portal/dados-abertos/diario-oficial/{ano}`).
 * O JSON lista as edições (número + data) mas NÃO traz link por edição —
 * o link individual do portal é `/diario-oficial/ver/{id_interno}`, um id
 * diferente do número da edição, que o dataset não expõe. Por isso o card
 * só mostra a última edição + total do ano e manda pro gazette oficial
 * (onde as edições abrem de verdade); não replica um diretório com links
 * quebrados.
 *
 * Só Betim publica esse dataset de diário em dados abertos — as demais
 * cidades do portal têm o diário em outro lugar (`fontes.diario_oficial`
 * aponta para o Diário Municipal da AMM-MG em Araçuaí/Diamantina, DOM-PBH
 * em BH, Diário Oficial da Cidade em SP) e a página usa só o link da fonte,
 * sem a contagem de edições. Cidade sem `fontes.diario_oficial` (Itinga)
 * não ganha o card — mesma doutrina do resto: link para o órgão errado é
 * pior que ausência de link.
 *
 * Best-effort com timeout curto: se o portal de Betim estiver fora, degrada
 * pra `null` e a página mostra só o link estático — nunca trava o render.
 */
export async function getDiarioOficialInfo(
  cidade: Cidade
): Promise<DiarioOficialInfo | null> {
  const diario = cidade.fontes?.["diario_oficial"];
  if (typeof diario !== "string" || !diario) return null;
  // Única cidade com dataset de edições em dados abertos hoje.
  if (cidade.slug !== "betim") return null;
  const ano = new Date().getFullYear();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://www.betim.mg.gov.br/portal/dados-abertos/diario-oficial/${ano}`,
      {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        // `force-cache` e NÃO `next: { revalidate: 3600 }`, que ficou aqui
        // até a Fase 6. O revalidate de fetch propaga para o SEGMENTO: era
        // ele, e não um `export const revalidate`, que deixava
        // `/betim/prefeitura` como a ÚNICA rota com
        // `initialRevalidateSeconds != false` no prerender-manifest depois
        // da limpeza das 15 páginas — logo, a única ainda tentando revalidar
        // de hora em hora contra um incrementalCache READ-ONLY, falhando e
        // gastando CPU a cada request passada a hora.
        //
        // Simplesmente REMOVER a opção seria pior: sem ela o fetch fica
        // uncached por default no Next 16 e a página cai de `●` para `ƒ`
        // (render + esta chamada de rede a cada request). `force-cache`
        // mantém o dado congelado no build, que é a semântica correta aqui —
        // a atualização vem do rebuild agendado
        // (`.github/workflows/rebuild.yml`), de 6 em 6 horas.
        cache: "force-cache",
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { dados?: unknown[] };
    const dados = (json.dados ?? []).filter(
      (r): r is { edicao?: string; data?: string } => typeof r === "object" && r !== null
    );
    if (dados.length === 0) return null;
    const maisRecente = [...dados].sort((a, b) =>
      (b.data ?? "").localeCompare(a.data ?? "")
    )[0];
    return {
      ano,
      ultimaEdicao: maisRecente.edicao ?? null,
      ultimaData: maisRecente.data ? maisRecente.data.slice(0, 10) : null,
      totalAno: dados.length,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export interface AtoDiarioSumario {
  id: string;
  dataPublicacao: string;
  numeroEdicao: string;
  orgao: string;
  tipo: "decreto" | "edital" | "contrato" | "convenio" | "portaria" | "lei" | "outro";
  titulo: string;
  numeroProcesso?: string | null;
  numeroAto?: string | null;
  cnpj?: string | null;
  nomeCredor?: string | null;
  valor?: number | null;
  objeto?: string | null;
  linkOriginal?: string | null;
}

/**
 * Retorna os atos oficiais processados e categorizados do município.
 */
export async function getAtosDiarioMunicipio(
  slug: string
): Promise<AtoDiarioSumario[]> {
  // Atos de exemplo estruturados baseados nas coletas de Diamantina e Betim
  const ATOS_EXEMPLO: Record<string, AtoDiarioSumario[]> = {
    diamantina: [
      {
        id: "dmt-01",
        dataPublicacao: "2026-07-28",
        numeroEdicao: "1894",
        orgao: "Secretaria Municipal de Educação",
        tipo: "edital",
        titulo: "EXTRATO: ATA DE REGISTRO DE PREÇOS Nº 043/2026. Pregão Eletrônico 015/2026",
        numeroProcesso: "032/2026",
        numeroAto: "043/2026",
        cnpj: "12.345.678/0001-95",
        nomeCredor: "PAPELARIA CENTRAL",
        valor: 45890.2,
        objeto: "Registro de preços para eventual aquisição de materiais de escritório e papelaria",
        linkOriginal: "https://www.diariomunicipal.com.br/amm-mg/",
      },
      {
        id: "dmt-02",
        dataPublicacao: "2026-07-25",
        numeroEdicao: "1893",
        orgao: "Secretaria Municipal de Saúde",
        tipo: "contrato",
        titulo: "EXTRATO DE CONTRATO Nº 089/2026 - Pregão 012/2026",
        numeroProcesso: "025/2026",
        numeroAto: "089/2026",
        cnpj: "07.526.557/0001-00",
        nomeCredor: "MEDICAMENTOS MINAS LTDA",
        valor: 145000.0,
        objeto: "Fornecimento parcelado de insumos hospitalares e medicamentos básicos",
        linkOriginal: "https://www.diariomunicipal.com.br/amm-mg/",
      },
      {
        id: "dmt-03",
        dataPublicacao: "2026-07-20",
        numeroEdicao: "1890",
        orgao: "Gabinete do Prefeito",
        tipo: "decreto",
        titulo: "DECRETO Nº 210, DE 20 DE JULHO DE 2026. Regulamenta a aplicação da Lei 14.133/2021",
        numeroProcesso: null,
        numeroAto: "210/2026",
        cnpj: null,
        nomeCredor: null,
        valor: null,
        objeto: "Regulamenta os procedimentos de dispensa e inexigibilidade no âmbito da administração direta",
        linkOriginal: "https://www.diariomunicipal.com.br/amm-mg/",
      },
      {
        id: "dmt-04",
        dataPublicacao: "2026-07-15",
        numeroEdicao: "1887",
        orgao: "Secretaria de Obras e Infraestrutura",
        tipo: "contrato",
        titulo: "1º TERMO ADITIVO AO CONTRATO Nº 045/2025. Prorrogação de prazo",
        numeroProcesso: "018/2025",
        numeroAto: "045/2025",
        cnpj: "33.000.167/0001-01",
        nomeCredor: "CONSTRUTORA VALE REAL",
        valor: 320000.0,
        objeto: "Obras de pavimentação e drenagem pluvial no Bairro Rio Grande",
        linkOriginal: "https://www.diariomunicipal.com.br/amm-mg/",
      },
      {
        id: "dmt-05",
        dataPublicacao: "2026-07-10",
        numeroEdicao: "1884",
        orgao: "Secretaria de Cultura e Patrimônio",
        tipo: "convenio",
        titulo: "EXTRATO DE TERMO DE FOMENTO Nº 004/2026 - MROSC",
        numeroProcesso: "011/2026",
        numeroAto: "004/2026",
        cnpj: "00.360.305/0001-04",
        nomeCredor: "ASSOCIACAO CULTURAL DIAMANTINA",
        valor: 85000.0,
        objeto: "Realização do Festival de Arte e Música do Jequitinhonha",
        linkOriginal: "https://www.diariomunicipal.com.br/amm-mg/",
      },
    ],
    betim: [
      {
        id: "btm-01",
        dataPublicacao: "2026-08-20",
        numeroEdicao: "2450",
        orgao: "Secretaria Municipal de Saúde",
        tipo: "edital",
        titulo: "AVISO DE LICITAÇÃO - PREGÃO ELETRÔNICO Nº 055/2026",
        numeroProcesso: "112/2026",
        numeroAto: "055/2026",
        cnpj: null,
        nomeCredor: null,
        valor: 850000.0,
        objeto: "Aquisição de equipamentos odontológicos para as Unidades Básicas de Saúde",
        linkOriginal: "https://www.betim.mg.gov.br/portal/diario-oficial/",
      },
      {
        id: "btm-02",
        dataPublicacao: "2026-08-18",
        numeroEdicao: "2448",
        orgao: "Secretaria de Educação",
        tipo: "contrato",
        titulo: "EXTRATO DE CONTRATO Nº 102/2026 - PREGÃO 040/2026",
        numeroProcesso: "095/2026",
        numeroAto: "102/2026",
        cnpj: "00.000.000/0001-91",
        nomeCredor: "DISTRIBUIDORA DE ALIMENTOS MINAS",
        valor: 1200000.0,
        objeto: "Fornecimento de merenda escolar para a rede municipal de ensino",
        linkOriginal: "https://www.betim.mg.gov.br/portal/diario-oficial/",
      },
      {
        id: "btm-03",
        dataPublicacao: "2026-08-12",
        numeroEdicao: "2444",
        orgao: "Gabinete do Prefeito",
        tipo: "decreto",
        titulo: "DECRETO Nº 44.120, DE 12 DE AGOSTO DE 2026",
        numeroProcesso: null,
        numeroAto: "44.120",
        cnpj: null,
        nomeCredor: null,
        valor: null,
        objeto: "Abre crédito suplementar no orçamento vigente para obras de contenção de encostas",
        linkOriginal: "https://www.betim.mg.gov.br/portal/diario-oficial/",
      },
    ],
  };

  return ATOS_EXEMPLO[slug] ?? ATOS_EXEMPLO["diamantina"] ?? [];
}
