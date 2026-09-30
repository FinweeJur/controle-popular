/**
 * Gerador do inventário de bases de dados do portal para o RAG.
 *
 * Papel no portal: medir, uma vez, TODAS as bases versionadas em
 * `apps/web/data/` e `apps/web/public/data/` e emitir um retrato compacto
 * (`apps/web/data/bases-portal.json`) que o assistente Seu Nonô consome no
 * acervo do RAG (`lib/assistente/acervo.ts`, função `deBasesPortal`).
 *
 * Fonte oficial dos dados: os próprios arquivos do repositório (varredura),
 * com o tema derivado de um mapa curado (abaixo) e a rota de uma tabela
 * verificada contra as páginas reais do portal. O número de registros é
 * MEDIDO (tamanho de array JSON) — nunca digitado à mão, conforme a regra
 * "o número vem do dado" do AGENTS.md §8.
 *
 * Decisões técnicas:
 * - Arquivos acima de `LIMITE_LEITURA_MB` não são lidos por dentro (só o
 *   tamanho entra): evita carregar dezenas de MB em memória só para contar.
 *   Nesses casos `registros` fica `null` e o agregado do tema marca
 *   `registros_parciais`.
 * - O JSON emitido é artefato derivado e determinístico: re-rodar sobre o
 *   mesmo dado produz o mesmo arquivo (exceto `gerado_em`). Não editar à mão.
 * - PDFs e não-JSON entram só no tamanho total (não são base legível).
 *
 * Uso:
 *   cd apps/web && npx tsx scripts/inventariar-bases-dados.mts
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

/** Raiz de dados versionados, relativa ao cwd (apps/web). */
const RAIZES = ["data", path.join("public", "data")];
/** Saída do inventário. */
const SAIDA = path.join("data", "bases-portal.json");
/** Acima disso, só o tamanho é lido (não abre o JSON para contar registros). */
const LIMITE_LEITURA_MB = 8;

/** Rótulo por extenso e rota REAL de cada tema (rota conferida no app). */
const TEMA_INFO: Record<string, { rotulo: string; rota: string }> = {
  "ambiental-licencas": { rotulo: "Licenças ambientais estaduais e federais", rota: "/ambiental/licencas" },
  "ambiental-barragens": { rotulo: "Barragens de mineração (SIGBM/ANM)", rota: "/ambiental/barragens" },
  "ambiental-outorgas": { rotulo: "Outorgas de água (ANA/IGAM)", rota: "/ambiental/nossos-rios" },
  ambiental: { rotulo: "Meio ambiente e territórios", rota: "/ambiental" },
  paraopeba: { rotulo: "Reparação do Rio Doce e do Paraopeba", rota: "/paraopeba" },
  mineracao: { rotulo: "Mineração e cavas", rota: "/mineracao/cavas" },
  congresso: { rotulo: "Congresso Nacional", rota: "/congresso" },
  assembleias: { rotulo: "Assembleias legislativas estaduais", rota: "/assembleias" },
  judiciario: { rotulo: "Judiciário", rota: "/judiciario" },
  cidades: { rotulo: "Municípios, contratos e indicadores locais", rota: "/cidades" },
  internacional: { rotulo: "Organismos multilaterais", rota: "/internacional" },
  eua: { rotulo: "Transparência dos Estados Unidos", rota: "/eua" },
  canada: { rotulo: "Mineradoras canadenses e emissões", rota: "/canada" },
  empresas: { rotulo: "Empresas, ESG e incentivos culturais", rota: "/empresas" },
  terras: { rotulo: "Terras, territórios, patrimônio e povos", rota: "/funcaosocialterra" },
  conselhos: { rotulo: "Conselhos de direitos e colegiados", rota: "/direitos-em-movimento/conselhos" },
  lai: { rotulo: "Canais de acesso à informação (LAI)", rota: "/direitos-em-movimento/informacao" },
  direitos: { rotulo: "Direitos humanos", rota: "/direitos-em-movimento" },
  governo: { rotulo: "Gestão e governo", rota: "/governo" },
  "estado-e-economia": { rotulo: "Estado e economia", rota: "/estado-e-economia" },
  "transparencia-internacional": { rotulo: "Índices de transparência internacional", rota: "/transparencia-internacional" },
  memoria: { rotulo: "Memória das resistências", rota: "/memoria" },
  noticias: { rotulo: "Notícias e clipping do portal", rota: "/noticias" },
  outros: { rotulo: "Outras bases do portal", rota: "/busca" },
};

/** Regras ordenadas de classificação — a primeira que casa manda. */
const REGRAS: { re: RegExp; tema: string }[] = [
  { re: /direitos-humanos|\bonu-|cndh|redesca|relatorios-direitos/i, tema: "direitos" },
  { re: /(^|\/)esg\//i, tema: "empresas" },
  { re: /(^|\/)documentos-empresas\//i, tema: "empresas" },
  { re: /(^|\/)canada\//i, tema: "canada" },
  { re: /(^|\/)eua\//i, tema: "eua" },
  { re: /(^|\/)internacional\//i, tema: "internacional" },
  { re: /(^|\/)europa\//i, tema: "internacional" },
  { re: /licen[çc]as?/i, tema: "ambiental-licencas" },
  { re: /outorgas?/i, tema: "ambiental-outorgas" },
  { re: /barragens|sigbm|descaracteriza/i, tema: "ambiental-barragens" },
  { re: /paraopeba|reparacao|brumadinho|desastres?|desastre|tac-projetos|acordos-reparacao|reparacao|biblioteca-desastres|biblioteca-ati|biblioteca-pro-brumadinho|ajri/i, tema: "paraopeba" },
  { re: /(^|\/)gestao\/|governo|editais/i, tema: "governo" },
  { re: /congresso|ceap|legislativo|camara|proposic/i, tema: "congresso" },
  { re: /assembleias/i, tema: "assembleias" },
  { re: /judiciario|comarcas|sirenejud|tjmg|designac|tribunal|cnj-|sinesp|achados-tjmg|remunerac|mpf-|mpmg-|dpu-|instituicoes-/i, tema: "judiciario" },
  { re: /conselhos/i, tema: "conselhos" },
  { re: /lai|canais-informacao|\bsic\b|decisoes-cge/i, tema: "lai" },
  { re: /sigmine|cavas|mineracao|\banm\b|pegmatito/i, tema: "mineracao" },
  { re: /memoria/i, tema: "memoria" },
  { re: /noticias|clipping|radar/i, tema: "noticias" },
  { re: /rouanet|incentivador|cultura|setores-estrategicos|negociacoes-parcerias|fornecedores|multinacionais|cvm-|socios-|vale|sigma|empresas-|incentivadores|esg/i, tema: "empresas" },
  { re: /contratos|pncp|licitac/i, tema: "cidades" },
  { re: /municipios?|cidades|cnes|datasus|telefonia|educacao|escolas|ibge|municipal|comunicabr|centroides|vereadores|estabelecimentos/i, tema: "cidades" },
  { re: /unidades-conservacao|funcaosocialterra|terras|quilombo|indigena|fundiario|assentamento|vales-|jequitinhonha|mucuri|patrimonio|estudos-rurais/i, tema: "terras" },
  { re: /ambiental|licencia|car-|ecossistema|biodivers|clima|ibama|sema|feam|igam|ana-|agua|rios?\b|ppp|concess|destinacoes|estudos|condicionantes|ibram|convenios/i, tema: "ambiental" },
  { re: /series-economicas|sgml|cotacoes|indicadores-regionais|fontes-27|arrecada|tribut|orcamento|pib/i, tema: "estado-e-economia" },
  { re: /transparencia/i, tema: "transparencia-internacional" },
];

/** Classifica um caminho relativo (com `/`) em um tema curado. */
function temaDe(rel: string): string {
  for (const { re, tema } of REGRAS) {
    if (re.test(rel)) return tema;
  }
  return "outros";
}

/** Lista recursiva de arquivos sob uma raiz, com caminho relativo ao cwd. */
function listarArquivos(raiz: string): string[] {
  const achados: string[] = [];
  const visitar = (dir: string) => {
    for (const nome of readdirSync(dir)) {
      const abs = path.join(dir, nome);
      const st = statSync(abs);
      if (st.isDirectory()) visitar(abs);
      else achados.push(abs);
    }
  };
  visitar(raiz);
  return achados;
}

/** Conta registros de um JSON: array → length; objeto → nº de chaves; senão null. */
function contarRegistros(abs: string): number | null {
  try {
    const dado = JSON.parse(readFileSync(abs, "utf-8"));
    if (Array.isArray(dado)) return dado.length;
    if (dado && typeof dado === "object") return Object.keys(dado).length;
  } catch {
    // JSON inválido ou grande demais: fica null e o tema marca parcial
  }
  return null;
}

interface AgregadoTema {
  tema: string;
  rotulo: string;
  rota: string;
  arquivos: number;
  mb: number;
  registros: number;
  registros_parciais: boolean;
  exemplos: string[];
}

function main(): void {
  const saidaAbs = path.resolve(SAIDA);
  const arquivos: { rel: string; kb: number; registros: number | null; tema: string }[] = [];

  for (const raiz of RAIZES) {
    for (const abs of listarArquivos(raiz)) {
      if (path.resolve(abs) === saidaAbs) continue;
      const rel = path.relative(process.cwd(), abs).split(path.sep).join("/");
      const kb = statSync(abs).size / 1024;
      const ehJson = /\.json$/i.test(abs);
      const podeLer = ehJson && kb / 1024 <= LIMITE_LEITURA_MB;
      arquivos.push({
        rel,
        kb: Math.round(kb * 10) / 10,
        registros: podeLer ? contarRegistros(abs) : null,
        tema: temaDe(rel),
      });
    }
  }

  const porTema = new Map<string, AgregadoTema>();
  for (const a of arquivos) {
    const info = TEMA_INFO[a.tema] ?? TEMA_INFO.outros;
    const t =
      porTema.get(a.tema) ??
      {
        tema: a.tema,
        rotulo: info.rotulo,
        rota: info.rota,
        arquivos: 0,
        mb: 0,
        registros: 0,
        registros_parciais: false,
        exemplos: [],
      };
    t.arquivos += 1;
    t.mb += a.kb / 1024;
    if (a.registros == null) t.registros_parciais = true;
    else t.registros += a.registros;
    if (t.exemplos.length < 6) t.exemplos.push(path.basename(a.rel));
    porTema.set(a.tema, t);
  }

  const temas = [...porTema.values()]
    .map((t) => ({ ...t, mb: Math.round(t.mb * 10) / 10 }))
    .sort((a, b) => b.mb - a.mb);

  const totalRegistros = arquivos.reduce((s, a) => s + (a.registros ?? 0), 0);
  const saida = {
    gerado_em: new Date().toISOString().slice(0, 10),
    fonte: "varredura de apps/web/data e apps/web/public/data",
    total_arquivos: arquivos.length,
    total_mb: Math.round((arquivos.reduce((s, a) => s + a.kb, 0) / 1024) * 10) / 10,
    total_registros: totalRegistros,
    temas,
    arquivos,
  };

  writeFileSync(saidaAbs, JSON.stringify(saida, null, 1) + "\n", "utf-8");
  console.log(
    `inventário: ${saida.total_arquivos} arquivos, ${saida.total_mb} MB, ` +
      `${temas.length} temas, ${totalRegistros} registros contados`
  );
}

main();
