import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Repasse do Acordo Judicial de Brumadinho aos 853 municípios de Minas Gerais.
 *
 * Fonte: Pró-Brumadinho (Governo de MG), uma página HTML com três tabelas.
 * Coletor: `scripts/coletar-repasse-brumadinho-mg.mts`.
 * Arquivo: `apps/web/data/repasse-brumadinho-mg.json`, lido no BUILD.
 *
 * ═══ O QUE ESTE DADO É, E O QUE ELE NÃO É ═══
 *
 * É **estadual**, não da bacia do Paraopeba. A Lei 23.830/2021 rateou parte do
 * Acordo entre TODOS os municípios de Minas, inclusive os que ficam a 600 km
 * do rejeito. Misturar esta lista com a dos 26 municípios atingidos é
 * justamente a confusão que o portal não pode criar — por isso o dado mora na
 * página da CIDADE ("quanto Betim recebeu"), e não em `/paraopeba`.
 *
 * São três repasses distintos, com bases legais distintas, e somá-los sem
 * dizer isso inventaria um repasse único que nunca existiu:
 *
 * | tabela | base legal                             | municípios | total          |
 * |--------|----------------------------------------|-----------:|---------------:|
 * | rateio | Lei 23.830/2021, art. 5º e Anexo V      |        853 |  R$ 1.498,25 mi |
 * | compl. | Resolução SEGOV nº 38, de 03/11/2021    |        142 |     R$ 59,30 mi |
 * | compl. | Resolução SEGOV nº 28, de 28/06/2022    |        219 |     R$ 88,246 mi|
 *
 * ═══ ARMADILHA 1 — CASAR MUNICÍPIO POR NOME PEGA A CIDADE ERRADA ═══
 *
 * A fonte **não publica código IBGE**: as três tabelas trazem só o nome, e a
 * grafia muda de tabela para tabela e dentro da mesma tabela. Medido no HTML
 * de 15/08/2026: a tabela 1 usa grafia normal (`"Belo Horizonte"`); as tabelas
 * 2 e 3 gravam os 361 nomes em CAIXA ALTA, e a acentuação é inconsistente —
 * 44 de 142 acentuados na tabela 2, **0 de 219** na tabela 3.
 *
 * A defesa tem três camadas, nesta ordem, e nenhuma delas é aproximação:
 *
 * 1. `normalizarNome()` — maiúsculas, sem diacrítico, sem pontuação. Resolve
 *    a caixa e o acento, que são ruído de digitação, não informação.
 * 2. `APELIDOS` — grafias que a fonte escreve DIFERENTE do IBGE, cada uma
 *    resolvida à mão para um código de 7 dígitos escrito por extenso. É
 *    decisão editorial registrada, revisável linha a linha; não é distância
 *    de edição decidindo sozinha qual cidade recebeu dinheiro público.
 * 3. O que sobrar entra em `naoCasaram` **com motivo** e não vira município
 *    nenhum. Nunca se aproxima: um `"CÓRREGO DANTAS"` casado por similaridade
 *    com `"Córrego do Bom Jesus"` publicaria meio milhão de reais na cidade
 *    errada, e a tela não teria como suspeitar.
 *
 * O produto desta camada é o **código IBGE**. Depois daqui, ninguém casa por
 * nome nunca mais.
 *
 * ═══ ARMADILHA 2 — 7 DÍGITOS NO IBGE, 6 NO COMUNICABR ═══
 *
 * Betim é `3106705` no IBGE e `310670` no ComunicaBR: o de 6 é o de 7 sem o
 * dígito verificador. A conversão existe numa direção só, e trocar um pelo
 * outro responde 200 com resultado vazio — medido em `lib/comunicabr/mg.ts`.
 *
 * ⚠️ **O par de exemplo desta armadilha circula errado neste projeto.** A
 * anotação que abriu esta rodada dizia "Betim é `3106200` (7) e `310670` (6)",
 * e `3106200` é **Belo Horizonte** — `310620` é que é o par curto dele. O erro
 * atravessou o enunciado sem ninguém tropeçar porque `3106200` e `3106705`
 * ocupam o mesmo lugar na frase e nenhum humano decora código de município.
 * Quem o pegou foi o teste que compara o código com o NOME, não a revisão.
 * Está travado em `repasse.test.ts`, com os dois pares escritos por extenso.
 *
 * Este arquivo é do IBGE, e só: `ibge7`, 7 dígitos, chave única. Nenhum código
 * de 6 dígitos é gravado — publicar um convidaria à troca. E
 * `repasseDoMunicipio()` **lança** quando recebe 6 dígitos, em vez de devolver
 * `null` como se a cidade não tivesse recebido nada: o `null` silencioso é o
 * que transforma a troca de código numa tela afirmando, com cara de dado, que
 * a cidade ficou de fora do rateio.
 *
 * ═══ ARMADILHA 3 — 302 ELEITORAL QUE VIRA 200 ═══
 *
 * `/pro-brumadinho/noticias` responde 302 com o cabeçalho
 * `X-Drupal-Periodo-Eleitoral-Redirect: 1` e, seguindo o redirecionamento,
 * **200** numa página que diz que o conteúdo está indisponível. Um coletor que
 * valide status grava zero e reporta sucesso.
 *
 * Por isso `validarPaginaRepasse()` valida o CONTEÚDO — o título do repasse, a
 * base legal e as três tabelas com o número de linhas esperado — e é ela, não
 * o `res.ok`, que autoriza gravar.
 */

/** Página oficial. Uma requisição, HTML servido, sem API. */
export const URL_REPASSE =
  "https://www.mg.gov.br/pro-brumadinho/pagina/reparacao-brumadinho-repasses-aos-853-municipios-de-mg";

/**
 * User-Agent honesto. Nunca UA de navegador falso: o `robots.txt` de
 * `www.mg.gov.br` PERMITE `/pro-brumadinho`, e quem tem permissão não tem
 * motivo para se disfarçar. Se o serviço quiser bloquear este coletor, tem que
 * conseguir identificá-lo.
 */
export const AGENTE_REPASSE =
  "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)";

/** Pausa entre requisições. São poucas, mas serviço público não é alvo. */
export const PAUSA_MS_REPASSE = 1000;

export type FonteTabela = "rateio" | "segov38" | "segov28";

export interface RepasseComplementar {
  fonte: FonteTabela;
  baseLegal: string;
  centavos: number;
}

/** Uma cidade e tudo que ela recebeu. Chave: `ibge7`. */
export interface RepasseMunicipio {
  /**
   * Código IBGE de 7 dígitos. A chave, e o ÚNICO código deste arquivo.
   *
   * Não existe campo de 6 dígitos aqui, e é de propósito. Um `ibge6` gravado
   * ao lado seria lido como "o código curto desta cidade" e sairia daqui para
   * consultar outros sistemas — que respondem 200 e vazio quando a numeração
   * não é a deles. O arquivo não oferece a chave errada; quem precisar dela
   * busca na fonte que a define. Travado em `repasse.test.ts`.
   */
  ibge7: string;
  /** Nome do IBGE, não o da fonte — a fonte escreve em caixa alta e sem acento. */
  nome: string;
  /** Como a fonte escreveu, preservado para auditoria do casamento. */
  nomeNaFonte: string;
  /** População estimada 2019, o divisor do rateio da Lei 23.830/2021. */
  populacao2019: number | null;
  /** Rateio principal em 3 parcelas. `null` só se a cidade não estiver na tabela 1. */
  rateio: { centavos: number; parcelas: [number, number, number] } | null;
  /** Repasses complementares. Vazio na maioria das cidades. */
  complementares: RepasseComplementar[];
  /** Soma dos três. Ver o aviso de somatório em `TABELAS`. */
  centavos: number;
}

export interface RecusaRepasse {
  fonte: FonteTabela;
  nomeNaFonte: string;
  motivo: string;
}

export interface ArquivoRepasse {
  gerado_em: string;
  fonte_url: string;
  /** Data que a própria página declara. */
  atualizado_na_fonte: string;
  tabelas: { fonte: FonteTabela; rotulo: string; baseLegal: string; municipios: number; centavos: number }[];
  totalCentavos: number;
  municipios: RepasseMunicipio[];
  naoCasaram: RecusaRepasse[];
}

export const TABELAS: Record<FonteTabela, { rotulo: string; baseLegal: string }> = {
  rateio: {
    rotulo: "Rateio principal, em 3 parcelas",
    baseLegal: "Lei nº 23.830/2021, art. 5º e Anexo V",
  },
  segov38: {
    rotulo: "Repasse complementar, parcela única",
    baseLegal: "Resolução SEGOV nº 38, de 03/11/2021",
  },
  segov28: {
    rotulo: "Repasse complementar, parcela única",
    baseLegal: "Resolução SEGOV nº 28, de 28/06/2022",
  },
};

/* ─────────────────────────── nomes ─────────────────────────── */

/**
 * Caixa alta, sem diacrítico, sem pontuação, espaço colapsado.
 *
 * `"São Thomé das Letras"`, `"SAO THOME DAS LETRAS"` e `"são thomé das
 * letras"` viram a mesma chave. `"Olhos-d'Água"` e `"OLHOS D AGUA"` também —
 * é por isso que hífen e apóstrofo caem, e não só o acento.
 */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

/**
 * Grafias que a fonte escreve diferente do IBGE — resolvidas à mão, uma a uma.
 *
 * Cinco em 1.214 linhas. Cada entrada é uma AFIRMAÇÃO de que aquele nome é
 * aquela cidade, e o código de 7 dígitos está escrito por extenso justamente
 * para poder ser conferido sem rodar nada. Nenhuma delas é ambígua: em Minas
 * não há segundo candidato para nenhuma.
 *
 * Quem acrescentar uma linha aqui está decidindo o destino de dinheiro
 * público. Não acrescente por similaridade — confira na lista do IBGE.
 */
export const APELIDOS: Record<string, string> = {
  // A fonte usa a grafia antiga, com "TH". IBGE: "São Tomé das Letras".
  "SAO THOME DAS LETRAS": "3165206",
  // A fonte escreve com "S". IBGE: "Dona Euzébia".
  "DONA EUSEBIA": "3122900",
  // A fonte troca a preposição. IBGE: "Amparo do Serra".
  "AMPARO DA SERRA": "3102506",
  // A fonte troca a preposição. IBGE: "Santa Rita de Ibitipoca".
  "SANTA RITA DO IBITIPOCA": "3159407",
  // A fonte pluraliza. IBGE: "Córrego Danta" (os outros três "Córrego" de
  // Minas — do Bom Jesus, Fundo, Novo — não são parecidos com este).
  "CORREGO DANTAS": "3119807",
};

/* ─────────────────────── malha de Minas ─────────────────────── */

export interface MunicipioMG {
  ibge7: string;
  ibge6: string;
  nome: string;
}

/**
 * Os 853 municípios de Minas com código IBGE de 7 dígitos e nome oficial.
 *
 * Montada por JUNÇÃO EXATA de dois arquivos que já existiam no repositório, e
 * de propósito sem casar nome nenhum:
 *
 * - `public/data/risco-climatico.json` (AdaptaBrasil/MCTI) tem os 853 códigos de 7
 *   dígitos, sem nome;
 * - `public/data/comunicabr-31.json` tem os 853 nomes oficiais do IBGE com o
 *   código de 6 dígitos — que aqui, ao contrário do que o nome do arquivo
 *   sugere, é o prefixo IBGE (`3106200` → `310620`) e não a numeração do
 *   ComunicaBR.
 *
 * Medido: os 853 prefixos de 6 dígitos são distintos e casam 853/853, sem
 * colisão e sem sobra. Por isso a junção é determinística — se um dia deixar
 * de ser, `malhaMinas()` devolve menos de 853 e o coletor aborta em vez de
 * gravar uma malha furada.
 *
 * ⚠️ Só lê os campos de topo (`cod`, `nome`) de `comunicabr-31.json`. Percorrer
 * `municipios[].itens` devolve ZERO — o arquivo é compactado; ver
 * `lib/comunicabr/arquivo.ts`.
 */
let malhaCache: MunicipioMG[] | null = null;

export function malhaMinas(raiz = process.cwd()): MunicipioMG[] {
  if (malhaCache) return malhaCache;
  try {
    const risco = JSON.parse(
      // Movido de data/ para public/data/ em 16/08/2026 (ver `lib/clima/risco.ts`).
      readFileSync(path.join(raiz, "public", "data", "risco-climatico.json"), "utf-8")
    ) as { linhas: { id_municipio: string }[] };
    const comunica = JSON.parse(
      // Movido de data/ para public/data/ em 16/08/2026 — o arquivo agora é
      // servido pelo binding de Assets do Worker em vez de embutido no bundle
      // (ver `lib/comunicabr/mg.ts`). `malhaMinas()` só roda no script de
      // coleta (build machine, filesystem real), então continua sendo
      // `readFileSync` puro — só o caminho mudou.
      readFileSync(path.join(raiz, "public", "data", "comunicabr-31.json"), "utf-8")
    ) as { municipios: { cod: number; nome: string }[] };

    const porPrefixo = new Map<string, string>();
    for (const l of risco.linhas) {
      const c7 = String(l.id_municipio);
      if (c7.length === 7) porPrefixo.set(c7.slice(0, 6), c7);
    }

    const malha: MunicipioMG[] = [];
    for (const m of comunica.municipios) {
      const ibge6 = String(m.cod);
      const ibge7 = porPrefixo.get(ibge6);
      if (!ibge7) continue; // sem par: fica de fora em vez de virar código inventado
      malha.push({ ibge7, ibge6, nome: m.nome.replace(/\/MG$/, "") });
    }
    malhaCache = malha;
  } catch {
    malhaCache = [];
  }
  return malhaCache;
}

/** Índice nome-normalizado → município. Inclui os `APELIDOS`. */
export function indiceDaMalha(malha: MunicipioMG[]): Map<string, MunicipioMG> {
  const porCodigo = new Map(malha.map((m) => [m.ibge7, m]));
  const idx = new Map<string, MunicipioMG>();
  for (const m of malha) idx.set(normalizarNome(m.nome), m);
  for (const [grafia, ibge7] of Object.entries(APELIDOS)) {
    const alvo = porCodigo.get(ibge7);
    if (alvo) idx.set(normalizarNome(grafia), alvo);
  }
  return idx;
}

/* ─────────────────────────── parser ─────────────────────────── */

const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Texto de uma célula: sem marcação, sem entidade, sem espaço duplicado. */
export function textoDaCelula(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&([a-zA-Z]+);/g, (m, e: string) => ENTIDADES[e] ?? m)
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCharCode(Number(d)))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * `"R$ 1.498.250.000,00"` → `149825000000` centavos.
 *
 * Em centavos porque a soma tem que fechar com o TOTAL impresso na página, e
 * 853 somas em ponto flutuante que fecham hoje podem não fechar amanhã. Aqui
 * a conferência é aritmética de inteiros.
 *
 * A tabela 3 escreve `"&nbsp;R$&nbsp;&nbsp;&nbsp; 500.000,00&nbsp;&nbsp;"` —
 * daí a limpeza agressiva antes de olhar para o número.
 */
export function centavosDe(texto: string): number | null {
  const limpo = texto.replace(/[^0-9.,]/g, "");
  if (!/\d/.test(limpo)) return null;
  const m = limpo.match(/^(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?$/);
  if (!m) return null;
  const inteiro = m[1].replace(/\./g, "");
  const frac = (m[2] ?? "").padEnd(2, "0");
  return Number(inteiro) * 100 + Number(frac);
}

/** `"2.512.070"` → `2512070`. */
export function inteiroDe(texto: string): number | null {
  const c = centavosDe(texto);
  return c === null ? null : Math.round(c / 100);
}

export interface LinhaTabela {
  nome: string;
  centavos: number;
  populacao2019: number | null;
  parcelas: [number, number, number] | null;
}

export interface TabelaLida {
  fonte: FonteTabela;
  linhas: LinhaTabela[];
  /** O TOTAL impresso na última linha da própria tabela. */
  totalDeclarado: number | null;
}

/**
 * Marcas de conteúdo que a página do repasse tem e a página de bloqueio
 * eleitoral não tem. Ver armadilha 3.
 */
const MARCAS = [
  "ACORDO JUDICIAL DE REPARA",
  "REPASSE AOS MUNIC",
  "23.830/2021",
];

/**
 * Devolve o motivo da recusa, ou `null` se a página serve.
 *
 * **Esta função, e não o status HTTP, é quem autoriza gravar.** Um 200 vindo
 * de `/pro-brumadinho/periodo-eleitoral` cai aqui na primeira marca.
 */
export function validarPaginaRepasse(html: string): string | null {
  if (html.length < 50_000) return `corpo curto demais: ${html.length} bytes`;
  for (const marca of MARCAS) {
    if (!html.toUpperCase().includes(marca.toUpperCase())) {
      return `a página não contém "${marca}" — pode ser a tela de bloqueio eleitoral`;
    }
  }
  const tabelas = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  if (tabelas.length !== 3) return `esperava 3 tabelas, achei ${tabelas.length}`;
  return null;
}

/**
 * Lê as três tabelas do HTML.
 *
 * Não descarta linha por posição fixa: descarta o que não tem valor em
 * dinheiro (cabeçalhos) e a linha cujo primeiro campo normaliza para `TOTAL`.
 * Assim, se a fonte inserir ou remover uma linha de cabeçalho, a contagem de
 * municípios não muda calada — o que muda é o total, e o total é conferido.
 */
export function lerPaginaRepasse(html: string): TabelaLida[] {
  const problema = validarPaginaRepasse(html);
  if (problema) throw new Error(`página do repasse recusada: ${problema}`);

  const fontes: FonteTabela[] = ["rateio", "segov38", "segov28"];
  const tabelas = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];

  return tabelas.map((tabela, i) => {
    const fonte = fontes[i];
    const colValor = fonte === "rateio" ? 2 : 1;
    const linhas: LinhaTabela[] = [];
    let totalDeclarado: number | null = null;

    for (const tr of tabela.match(/<tr[\s\S]*?<\/tr>/gi) ?? []) {
      const celulas = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map(textoDaCelula);
      if (celulas.length <= colValor) continue;
      const nome = celulas[0];
      const centavos = centavosDe(celulas[colValor]);
      if (!nome || centavos === null) continue; // cabeçalho
      if (normalizarNome(nome) === "TOTAL") {
        totalDeclarado = centavos;
        continue;
      }
      const parcelas =
        fonte === "rateio"
          ? ([3, 4, 5].map((c) => centavosDe(celulas[c] ?? "") ?? 0) as [number, number, number])
          : null;
      linhas.push({
        nome,
        centavos,
        populacao2019: fonte === "rateio" ? inteiroDe(celulas[1]) : null,
        parcelas,
      });
    }
    return { fonte, linhas, totalDeclarado };
  });
}

/* ─────────────────────────── leitura ─────────────────────────── */

let arquivoCache: ArquivoRepasse | null | undefined;

/** Lê `data/repasse-brumadinho-mg.json`. `null` se ainda não foi coletado. */
export function arquivoRepasse(raiz = process.cwd()): ArquivoRepasse | null {
  if (arquivoCache !== undefined) return arquivoCache;
  try {
    arquivoCache = JSON.parse(
      readFileSync(path.join(raiz, "data", "repasse-brumadinho-mg.json"), "utf-8")
    ) as ArquivoRepasse;
  } catch {
    // Arquivo ausente não derruba o build — mesma regra de `lib/clima/risco.ts`.
    arquivoCache = null;
  }
  return arquivoCache;
}

/**
 * O repasse de uma cidade, pelo código IBGE de **7 dígitos**.
 *
 * Recebendo 6 dígitos, LANÇA. Não devolve `null`: `null` é indistinguível de
 * "esta cidade não recebeu nada", e é exatamente assim que a armadilha 2 vira
 * uma tela dizendo que Betim ficou de fora do rateio.
 */
export function repasseDoMunicipio(
  ibge7: string,
  raiz = process.cwd()
): RepasseMunicipio | null {
  const chave = String(ibge7);
  if (!/^\d{7}$/.test(chave)) {
    throw new Error(
      `código IBGE de 7 dígitos é obrigatório; recebi "${chave}". ` +
        `O de 6 dígitos é o mesmo código sem o verificador, e é a chave de OUTROS ` +
        `sistemas (Betim: 3106705 no IBGE, 310670 no ComunicaBR).`
    );
  }
  const arq = arquivoRepasse(raiz);
  if (!arq) return null;
  return arq.municipios.find((m) => m.ibge7 === chave) ?? null;
}

/** Só para os testes: derruba os caches de módulo. */
export function limparCacheRepasse(): void {
  arquivoCache = undefined;
  malhaCache = null;
}
