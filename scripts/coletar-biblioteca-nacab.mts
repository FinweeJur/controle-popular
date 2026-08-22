/**
 * ⚠ RODADO E REVERTIDO EM 2026-08-21. Este script grava com sucesso (48
 * itens, testado em `--conferir` e de verdade), mas o resultado foi tirado
 * de `biblioteca-ati.json` de volta ao estado sem NACAB: o desvio nº 2 do
 * cabeçalho (URL aponta pro PDF, não pra uma página do item) quebra a regra
 * "nunca o arquivo" que `biblioteca.test.ts` trava para o acervo, e ninguém
 * decidiu abrir uma exceção lá para `ati === "nacab"`. Rodar de novo
 * reproduz o mesmo conflito. Antes de rodar: (a) decidir e registrar a
 * exceção em `biblioteca.test.ts`, OU (b) achar uma URL de página por item
 * que o NACAB não tinha em 2026-08 — o que vier primeiro.
 *
 * Acrescenta o NACAB (ATI da Região 3) a `apps/web/public/data/biblioteca-ati.json`
 * — a mesma biblioteca que `coletar-biblioteca-ati.py` grava para AEDAS e
 * Guaicuy. Lê `X:\DevCoder\_lote-ambiental\saida\nacab.json`, já coletado por
 * `coletar_nacab.py` (raspagem de
 * https://nacab.org.br/projeto/paraopeba-estudos-e-publicacoes/).
 *
 * ═══ POR QUE A FONTE FICA FORA DO REPO ═══
 *
 * Mesma decisão de `gerar-sintese-ajri.mts`: o `nacab.json` bruto é saída de
 * um coletor de outra pasta de trabalho, não um dado deste repo. O que é
 * versionado é só o JSON combinado + este script de acréscimo.
 *
 * ═══ TRÊS DESVIOS DO PADRÃO AEDAS/GUAICUY, TODOS DECLARADOS ═══
 *
 * 1. **`data: null` em todos os 48 itens, de propósito.** O `nacab.json` só
 *    tem `ano_mes_do_caminho` — a pasta de upload do WordPress, não a data de
 *    publicação (a série "Germinar", por exemplo, tem 7 edições numeradas 1
 *    a 7 mas quase todas caem na mesma pasta "2025-06": a pasta é de quando
 *    alguém subiu o arquivo, não de quando cada edição saiu). Datar por ela
 *    seria inventar uma cronologia que a fonte não declara. `ItemBiblioteca`
 *    já previa esse caso (`data: string | null`) — nenhum dos 597 itens
 *    anteriores usava `null`; este script é o primeiro a precisar.
 *
 * 2. **`url` aponta para o PDF, não para uma página do item.** AEDAS e
 *    Guaicuy têm uma página própria por publicação; o NACAB não — a fonte é
 *    uma ÚNICA página de listagem com link direto para cada arquivo, sem
 *    página individual para redirecionar. Isso quebra o princípio "nunca o
 *    arquivo" que `biblioteca.ts` documenta para as outras duas fontes (e que
 *    `biblioteca.test.ts` trava num teste). Não há como cumprir os dois ao
 *    mesmo tempo aqui: inventar uma URL de página que não existe seria pior
 *    que apontar para o PDF real. Registrado para quem for revisar aquele
 *    teste — ele precisa de uma exceção explícita para `ati === "nacab"`.
 *
 * 3. **`temas: []` em todos os itens.** A página de listagem do NACAB não
 *    declara taxonomia temática por publicação (só a série, que vira
 *    `colecoes`) — mesmo caso já registrado para o Guaicuy em `biblioteca.ts`.
 *
 * ═══ TÍTULO E TIPO SÃO DERIVADOS, NÃO DECLARADOS PELA FONTE ═══
 *
 * Diferente de AEDAS/Guaicuy (que têm campo de título no CMS), o NACAB só dá
 * nome de arquivo. `TITULOS_CONHECIDOS` humaniza os 48 nomes conhecidos à mão
 * (revisado um a um — 3 séries são numeradas e o número sai do nome do
 * arquivo; a quarta, "Nacab em Campo", não tem numeração e usa o mês/ano que
 * aparece no nome). Arquivo novo que a fonte publicar depois cai no
 * humanizador genérico (`tituloGenerico`), com aviso no console — ele nunca
 * derruba a coleta, mas pede revisão humana antes do próximo commit.
 *
 * `tipo` sai da série (`TIPO_POR_SERIE`). Só "Estudos e Relatórios" →
 * "Documentos Técnicos" e "Reparação" → "Jornal" / "Mobilização" → "Boletins"
 * reaproveitam rótulo já usado por AEDAS/Guaicuy — e só porque os PRÓPRIOS
 * nomes de arquivo se autodeclaram assim ("Jornal-Reparacao_07_DIGITAL.pdf",
 * "Boletim-Mobilizacao-06-...pdf"). "Germinar" e "Nacab em Campo" não têm essa
 * autodeclaração em nenhum arquivo, então ficam com o nome da própria série
 * como tipo — inventar "Boletins" para elas seria uma inferência sem lastro
 * no nome do arquivo.
 *
 * ═══ IDEMPOTENTE ═══
 *
 * Rodar de novo substitui os itens e a fonte "nacab" anteriores (por
 * `ati`/`fonte_id`), nunca duplica. Os 597 itens de AEDAS/Guaicuy não são
 * tocados.
 *
 * Uso:
 *   npx tsx scripts/coletar-biblioteca-nacab.mts            # grava
 *   npx tsx scripts/coletar-biblioteca-nacab.mts --conferir # só mede, não grava
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const FONTE_BRUTA = "X:/DevCoder/_lote-ambiental/saida/nacab.json";
const DESTINO = resolve(RAIZ, "apps/web/public/data/biblioteca-ati.json");

const SO_CONFERIR = process.argv.includes("--conferir");

interface PublicacaoNacabBruta {
  url: string;
  nome_arquivo: string;
  serie: string | null;
  ano_mes_do_caminho: string | null;
}

interface NacabBruto {
  coletado_em: string;
  fonte: string;
  total: number;
  por_serie: Record<string, number>;
  publicacoes: PublicacaoNacabBruta[];
}

/** Mesmo formato de `ItemBiblioteca` em `apps/web/lib/paraopeba/biblioteca.ts` — duplicado
 *  aqui de propósito: os scripts desta pasta não importam `apps/web/lib` (ver os outros
 *  coletores; mistura resolução de módulo do app dentro de um script solto). */
interface ItemBiblioteca {
  id: string;
  ati: string;
  fonte_id: string;
  titulo: string;
  data: string | null;
  tipo: string;
  temas: string[];
  colecoes: string[];
  url: string;
  autoria: string | null;
  origem: string | null;
}

interface FonteBiblioteca {
  id: string;
  ati: string;
  nome: string;
  site: string;
  regioes: string;
  licenca: string;
  metodo: string;
  itens: number;
}

interface BibliotecaAtiArquivo {
  gerado_em: string;
  fontes: FonteBiblioteca[];
  ficou_de_fora: string;
  itens: ItemBiblioteca[];
}

// ═══ tipo, por série — ver justificativa item por item no cabeçalho ═══
const TIPO_POR_SERIE: Record<string, string> = {
  "Estudos e Relatórios": "Documentos Técnicos",
  "Reparação": "Jornal",
  "Mobilização": "Boletins",
  "Nacab em Campo": "Nacab em Campo",
  "Germinar": "Germinar",
};

// ═══ título conhecido, por nome de arquivo — revisado à mão, ver cabeçalho ═══
const TITULOS_CONHECIDOS: Record<string, string> = {
  // Germinar (numeração 1–7 sai do próprio nome do arquivo)
  "germinar_1.pdf": "Germinar nº 1",
  "germinar_02.pdf": "Germinar nº 2",
  "germinar_03.pdf": "Germinar nº 3",
  "Germinar_04_JAN_2025.pdf": "Germinar nº 4",
  "germinar-05.pdf": "Germinar nº 5",
  "germinar_06.pdf": "Germinar nº 6",
  "germinar_07-site.pdf": "Germinar nº 7",

  // Nacab em Campo (sem numeração — usa o mês/ano que consta no nome)
  "NEC_JANEIRO2023_web.pdf": "Nacab em Campo — janeiro de 2023",
  "202307_nacab_em_campo_semestre_1_julho_2023.pdf": "Nacab em Campo — 1º semestre de 2023",
  "NACAB_EM_CAMPO_DEZ2023.pdf": "Nacab em Campo — dezembro de 2023",
  "NACAB_EM_CAMPO_JUL2024.pdf": "Nacab em Campo — julho de 2024",
  "NACAB-EM-CAMPO_JAN2025.pdf": "Nacab em Campo — janeiro de 2025",
  "nec_jul_2025.pdf": "Nacab em Campo — julho de 2025",
  // só este não tem mês no nome, só o ano — "2026/03" na pasta é upload, não conteúdo
  "20260304_nec_2025_web.pdf": "Nacab em Campo — 2025",

  // Mobilização (numeração 1–8; a 06 tem subtítulo próprio no nome do arquivo)
  "Mobilizacao-1.pdf": "Mobilização nº 1",
  "Mobilizacao-2.pdf": "Mobilização nº 2",
  "Mobilizacao-3.pdf": "Mobilização nº 3",
  "Mobilizacao-4.pdf": "Mobilização nº 4",
  "Mobilizacao-5.pdf": "Mobilização nº 5",
  "Boletim-Mobilizacao-06-Ser-mulher-atingida.pdf": "Mobilização nº 6 — Ser mulher atingida",
  "mobilizacao_07-1.pdf": "Mobilização nº 7",
  "Mobilizacao-008.pdf": "Mobilização nº 8",

  // Reparação — os arquivos mais antigos (06, 07) se autodeclaram "Jornal-Reparacao"
  // no próprio nome; a numeração 6–15 é sequencial e contínua no acervo
  "Jornal-Reparacao-Edicao-06-1.pdf": "Jornal Reparação nº 6",
  "Jornal-Reparacao_07_DIGITAL.pdf": "Jornal Reparação nº 7",
  "REPARACAO_08_WEB.pdf": "Jornal Reparação nº 8",
  "boletim_09_web.pdf": "Jornal Reparação nº 9",
  "Reparacao_10_WEB.pdf": "Jornal Reparação nº 10",
  "reparacao_11web.pdf": "Jornal Reparação nº 11",
  "reparacao_12_site.pdf": "Jornal Reparação nº 12",
  "reparacao_13-DIGITAL.pdf": "Jornal Reparação nº 13",
  "reparacao_14.pdf": "Jornal Reparação nº 14",
  "Reparacao-15_PDF-site-1.pdf": "Jornal Reparação nº 15",

  // Estudos e Relatórios — cada um é um documento nomeado, não uma edição numerada
  "META-17-Entrega-1.pdf": "Meta 17 — Entrega 1",
  "20260213_Lista-de-Projetos_ATI-R3-Paraopeba-NACAB-Versao-final-1.pdf":
    "Lista de Projetos — ATI R3 Paraopeba (NACAB)",
  "20251124_Nota-Tecnica-Estudo-sobre-Assinatura-Espectral.pdf":
    "Nota Técnica — Estudo sobre Assinatura Espectral",
  "Relatorio_PesquisaJurisprudencial_2023.pdf": "Relatório — Pesquisa Jurisprudencial (2023)",
  "Pesquisa_Mulheres_NACAB.pdf": "Pesquisa Mulheres NACAB",
  "Cartilha-Povos-e-Comunidades-Tradicionais.pdf": "Cartilha — Povos e Comunidades Tradicionais",
  "Resultados-Preliminares-das-Coletas-de-Agua.pdf": "Resultados Preliminares das Coletas de Água",
  "20230706_cartilha_ipe_amarelo_v2.pdf": "Cartilha — Ipê Amarelo",
  "Nota-tecnica-PTR-versao-Final1.pdf": "Nota Técnica — PTR",
  "Cartilha_Aspectos_processuais_reparacao_individual.pdf":
    "Cartilha — Aspectos Processuais da Reparação Individual",
  "Tutorial-Hidroweb_ATIR3_2023.pdf": "Tutorial Hidroweb — ATI R3 (2023)",
  "Prescricao-e-Matriz-de-Danos-no-caso-Paraopeba-e-Tres-Marias.pdf":
    "Prescrição e Matriz de Danos no Caso Paraopeba e Três Marias",
  "Manifestacao-CTC-Nacab.pdf": "Manifestação — CTC/NACAB",
  "NotaTecnica_02-2026.pdf": "Nota Técnica nº 02/2026",
  "20260817_relatorio_analitico_prt_v2corrigido.pdf": "Relatório Analítico — PRT",
  "Nota-Tecnica-Finalistica-06-Suspensao-Acoes-Individuais.pdf":
    "Nota Técnica Finalística nº 6 — Suspensão de Ações Individuais",
};

/** Humanizador de reserva — só entra para arquivo que a coleta futura trouxer e que
 *  `TITULOS_CONHECIDOS` ainda não conhece. Nunca é a fonte de verdade dos 48 atuais. */
function tituloGenerico(nomeArquivo: string): string {
  const semExtensao = nomeArquivo.replace(/\.pdf$/i, "");
  const semData = semExtensao.replace(/^\d{6,8}_/, "");
  const semRuido = semData.replace(/[-_](web|site|digital|final\d*|versao-final|v\d)$/gi, "");
  const palavras = semRuido.split(/[-_]+/).filter(Boolean);
  return palavras
    .map((p) => (p.toUpperCase() === p && p.length > 1 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function transformar(pub: PublicacaoNacabBruta): ItemBiblioteca {
  if (!pub.serie || !(pub.serie in TIPO_POR_SERIE)) {
    throw new Error(
      `série desconhecida "${pub.serie}" em ${pub.nome_arquivo} — acrescente a ` +
        `TIPO_POR_SERIE (com justificativa no cabeçalho) antes de gravar`
    );
  }
  if (!pub.url.startsWith("https://nacab.org.br/")) {
    throw new Error(`URL fora do domínio do NACAB: ${pub.url}`);
  }
  const titulo = TITULOS_CONHECIDOS[pub.nome_arquivo];
  if (!titulo) {
    console.warn(
      `[coletar-biblioteca-nacab] título não revisado para "${pub.nome_arquivo}" — ` +
        `usando humanizador genérico. Acrescente a TITULOS_CONHECIDOS.`
    );
  }
  return {
    id: `nacab-${slugify(pub.nome_arquivo.replace(/\.pdf$/i, ""))}`,
    ati: "nacab",
    fonte_id: "nacab",
    titulo: titulo ?? tituloGenerico(pub.nome_arquivo),
    // Nunca `ano_mes_do_caminho`: é pasta de upload do WordPress, não data de
    // publicação — ver cabeçalho, desvio nº 1.
    data: null,
    tipo: TIPO_POR_SERIE[pub.serie],
    temas: [],
    colecoes: [pub.serie],
    // Aponta para o PDF, não para uma página do item — ver cabeçalho, desvio nº 2.
    url: pub.url,
    autoria: null,
    origem: null,
  };
}

const NOVO_TRECHO_FICOU_DE_FORA =
  "NACAB (Região 3): biblioteca de PDFs coletada (48 itens, 5 séries: Estudos e " +
  "Relatórios, Reparação, Mobilização, Germinar, Nacab em Campo) — mas a página-fonte " +
  "não declara data de publicação por item, só a pasta de upload (não confiável como " +
  "data), então todo item do NACAB aqui tem `data: null`.";
const TRECHO_ANTIGO_FICOU_DE_FORA = "NACAB (Região 3): sem biblioteca própria publicada.";

function main() {
  const bruto = JSON.parse(readFileSync(FONTE_BRUTA, "utf-8")) as NacabBruto;
  if (bruto.publicacoes.length !== bruto.total) {
    throw new Error(
      `nacab.json inconsistente: total declarado ${bruto.total}, ` +
        `mas ${bruto.publicacoes.length} publicações no array`
    );
  }
  for (const [serie, n] of Object.entries(bruto.por_serie)) {
    const real = bruto.publicacoes.filter((p) => p.serie === serie).length;
    if (real !== n) {
      throw new Error(`nacab.json inconsistente: por_serie diz ${serie}=${n}, medido ${real}`);
    }
  }

  const itensNovos = bruto.publicacoes.map(transformar);

  const idsRepetidos = itensNovos.map((i) => i.id).filter((id, idx, arr) => arr.indexOf(id) !== idx);
  if (idsRepetidos.length > 0) {
    throw new Error(`id duplicado dentro do próprio lote NACAB: ${[...new Set(idsRepetidos)].join(", ")}`);
  }

  if (!existsSync(DESTINO)) {
    throw new Error(`destino não existe: ${DESTINO} — este script só ACRESCENTA, não cria do zero`);
  }
  const atual = JSON.parse(readFileSync(DESTINO, "utf-8")) as BibliotecaAtiArquivo;

  const idsExistentesDeOutraAti = new Set(
    atual.itens.filter((i) => i.ati !== "nacab").map((i) => i.id)
  );
  const colisao = itensNovos.find((i) => idsExistentesDeOutraAti.has(i.id));
  if (colisao) {
    throw new Error(`id "${colisao.id}" já existe numa fonte que não é o NACAB`);
  }

  // Idempotente: substitui itens/fonte "nacab" de uma rodada anterior, nunca duplica;
  // os 597 itens de AEDAS/Guaicuy são preservados intactos.
  const itensPreservados = atual.itens.filter((i) => i.ati !== "nacab");
  const fontesPreservadas = atual.fontes.filter((f) => f.id !== "nacab");

  const novaFonteNacab: FonteBiblioteca = {
    ati: "nacab",
    nome: "NACAB — Assessoria Técnica Independente da Região 3",
    site: "https://nacab.org.br/",
    regioes: "Região 3",
    licenca:
      "não declarada — nenhuma página de termos ou licença localizada nesta coleta; tratado como direitos reservados",
    metodo:
      "raspagem de https://nacab.org.br/projeto/paraopeba-estudos-e-publicacoes/ — a série de " +
      "cada PDF é lida do <h2> imediatamente anterior ao link, por posição no documento " +
      "(ver X:\\DevCoder\\_lote-ambiental\\coletar_nacab.py); sem REST nem sitemap dedicado, " +
      "e sem página própria por item (por isso a URL de cada item aqui é o PDF)",
    id: "nacab",
    itens: itensNovos.length,
  };

  let ficouDeFora = atual.ficou_de_fora;
  if (ficouDeFora.includes(TRECHO_ANTIGO_FICOU_DE_FORA)) {
    ficouDeFora = ficouDeFora.replace(TRECHO_ANTIGO_FICOU_DE_FORA, NOVO_TRECHO_FICOU_DE_FORA);
  } else if (!ficouDeFora.includes("NACAB")) {
    ficouDeFora = `${ficouDeFora} ${NOVO_TRECHO_FICOU_DE_FORA}`;
  }
  // se já contém o trecho novo (rerun), não mexe — idempotente.

  const combinado: BibliotecaAtiArquivo = {
    gerado_em: new Date().toISOString(),
    fontes: [...fontesPreservadas, novaFonteNacab],
    ficou_de_fora: ficouDeFora,
    itens: [...itensPreservados, ...itensNovos],
  };

  console.log(`NACAB: ${itensNovos.length} itens (esperado 48)`);
  for (const [serie, n] of Object.entries(bruto.por_serie)) {
    console.log(`   ${serie.padEnd(24)} ${n}`);
  }
  console.log(`total combinado: ${combinado.itens.length} (${itensPreservados.length} preservados + ${itensNovos.length} novos)`);

  if (SO_CONFERIR) {
    console.log("--conferir: nada gravado.");
    return;
  }

  writeFileSync(DESTINO, JSON.stringify(combinado, null, 1), "utf-8");
  console.log("gravado:", DESTINO);
}

main();
