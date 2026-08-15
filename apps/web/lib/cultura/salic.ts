/**
 * SALIC (Lei Rouanet / MinC) — leitura da API pública, sem chave.
 *
 * Base: `https://api.salic.cultura.gov.br/api/v1`. Só funções puras: quem faz
 * requisição é `scripts/coletar-salic-rouanet.mts`; aqui mora o que dá para
 * testar sem rede, que é justamente onde as armadilhas desta fonte moram.
 *
 * ═══ O ENCAIXE QUE JUSTIFICA A FONTE ═══
 *
 * O eixo Cidades já responde "quem ganhou contrato desta prefeitura" a partir
 * do CNPJ do fornecedor. O SALIC publica `cgccpf` em CADA incentivador — o
 * mesmo CNPJ, no outro papel: quem abateu imposto para financiar cultura.
 * `normalizarCgccpf` existe só por causa disso. Não é mais um catálogo: é a
 * chave que permite perguntar se a empresa que vende para a prefeitura é a
 * mesma que patrocina o festival da cidade. Sem essa junção, esta fonte seria
 * um diretório bonito e inútil.
 *
 * ═══ AS ARMADILHAS, TODAS MEDIDAS EM 15/08/2026 ═══
 *
 * As quatro primeiras vieram do plano (`docs/PLANO-2026-08-15.md` §N2); as
 * duas últimas foram medidas ao escrever este arquivo e são PIORES que as do
 * plano, porque as duas devolvem HTTP 200.
 *
 * 1. **Barra final devolve 301.** `/api/v1/projetos/?UF=MG` redireciona para
 *    a versão sem barra, e o corpo do 301 é HTML de Apache com
 *    `charset=iso-8859-1`. Sem seguir o redirect o cliente faz `JSON.parse`
 *    em HTML. Pior: o `Location` do 301 aponta para **http://**, não https —
 *    quem segue redirect cego sai do TLS sem perceber. `montarUrl` nunca põe
 *    barra final, e é por isso.
 *
 * 2. **Os hashes de `_links` não são identidade.** Medido: o MESMO
 *    incentivador (BANCO DO BRASIL SA, cgccpf 00000000000191) veio com
 *    `self` terminando em `41fb0efb…` para `?limit=1`, `f5d51fad…` para
 *    `?limit=2` e `ffe6e7fd…` para `?limit=1&offset=0`. O hash é função da
 *    CONSULTA, não do registro. E `self` e `doacoes` do mesmo item já vêm
 *    com hashes diferentes entre si. Concatenar o id do `self` para montar a
 *    URL de doações dá 404 — mas guardar o hash como se fosse um id estável
 *    é o erro maior, porque ele "funciona" na mesma sessão e apodrece na
 *    seguinte. A chave estável é `cgccpf`; o hash é descartável.
 *
 * 3. **Codificação.** Na rota JSON o corpo é ASCII puro (medido: nenhum byte
 *    acima de 127 — o servidor escapa "Brasília" como `Bras\u00edlia`), então
 *    o mojibake NÃO nasce ali. Nasce em duas outras portas: `?format=csv`,
 *    que devolve UTF-8 cru (`Brasília` vira `BrasÃ­lia` lido como latin-1), e
 *    o HTML do 301 acima, que se declara iso-8859-1. `decodificarCorpo`
 *    força UTF-8 e **aborta** se sobrar U+FFFD, que é a regra que
 *    `scripts/extrair-educacao-paraopeba.mts` já aplica — gravar sujo é pior
 *    que não gravar.
 *
 * 4. **Volume.** 113.548 incentivadores no Brasil a 100 por página são 1.136
 *    requisições. Por isso o coletor tem retomada e começa por MG (7.206
 *    projetos, 20.785 incentivadores domiciliados — os dois medidos hoje).
 *
 * 5. **Filtro inexistente devolve 200 com o catálogo inteiro.** Medido:
 *    `?limit=1` → total 113.548; `?parametro_inexistente_xyz=1&limit=1` →
 *    total 113.548. É a mesma armadilha já registrada nas APIs de compras
 *    públicas. O caso grave é que o PRÓPRIO PORTAL cai nela: cada projeto
 *    publica `_links.incentivadores` apontando para
 *    `incentivadores?incentivador_id=<PRONAC>`, e `incentivador_id` não é
 *    filtro reconhecido — a URL devolve os 113.548 incentivadores do Brasil.
 *    Quem confia no link publicado atribui o país inteiro a um projeto de
 *    Igarapé. `conferirFiltroHonrado` existe para transformar isso em abort.
 *
 * 6. **`sort` é ignorado em silêncio.** Medido: `?limit=5` sem sort,
 *    `sort=total_doado`, `sort=-total_doado`, `sort=total_doado&order=desc` e
 *    `sort=nome` devolveram as CINCO MESMAS linhas, na mesma ordem, com
 *    valores 648.387.436,40 / 15.000,00 / 350,00 / 9.252.331,33 / 500,00.
 *    Não está ordenado por nada. Consequência direta: "o maior incentivador é
 *    o Banco do Brasil" não é resultado de ordenação, é a primeira linha da
 *    ordem natural. Só se prova varrendo tudo e ordenando aqui — que é o que
 *    `ordenarPorTotalDoado` e `topPorTotalDoado` fazem.
 *
 * 7. **A fonte já mascara CPF — e é por isso que há um guarda.** Pessoa física
 *    chega como `cgccpf: "***008317**"`; 1.461 dos 6.100 projetos de MG
 *    conferidos vieram assim, contra 4.639 com CNPJ inteiro. Consequência
 *    prática: a junção por documento só existe para pessoa jurídica, que é
 *    justamente o lado que interessa. `conferirSemCpf` para a coleta se a
 *    máscara sumir — este repositório é público.
 */

/** Sem barra no fim: com ela vem 301 para http:// e corpo HTML (armadilha 1). */
export const BASE_SALIC = "https://api.salic.cultura.gov.br/api/v1";

/**
 * Teto de página da API. Medido: `limit` aceita 1 a 100; acima disso o
 * servidor devolve o que quer, não o que foi pedido — por isso o coletor pede
 * 100 e confere `count` contra o que chegou.
 */
export const LIMITE_MAXIMO = 100;

export interface Incentivador {
  nome: string;
  municipio: string;
  UF: string;
  responsavel: string;
  /** Total doado no Brasil inteiro, não no estado consultado. Ver `agregarPorCgccpf`. */
  total_doado: number;
  tipo_pessoa: "juridica" | "fisica" | string;
  cgccpf: string;
  _links?: Record<string, string>;
}

/**
 * Projeto da Rouanet, com só os campos do rastro do dinheiro.
 *
 * A resposta bruta traz 34 campos, e os de texto livre (`objetivos`,
 * `justificativa`, `resumo`, `sinopse`, `etapa`…) sozinhos fazem 2 projetos
 * ocuparem 71 KB — medido ao gravar a fixture. Guardar os 7.206 de MG assim
 * poria dezenas de MB no bundle para responder uma pergunta que é de dinheiro,
 * não de texto. `enxugarProjeto` corta na coleta, não na tela.
 */
export interface ProjetoRouanet {
  PRONAC: string;
  nome: string;
  /** CNPJ/CPF do PROPONENTE — o outro lado da junção; o do incentivador vem em `Incentivador.cgccpf`. */
  cgccpf: string;
  proponente: string;
  UF: string;
  municipio: string;
  segmento: string;
  situacao: string;
  /** Dois dígitos na origem ("26"), não quatro. `anoDeQuatroDigitos` normaliza. */
  ano_projeto: string;
  valor_solicitado: number;
  valor_aprovado: number;
  valor_captado: number;
  valor_projeto: number;
}

/** Campos que `enxugarProjeto` mantém, na ordem em que a tela vai querer. */
const CAMPOS_PROJETO = [
  "PRONAC",
  "nome",
  "cgccpf",
  "proponente",
  "UF",
  "municipio",
  "segmento",
  "situacao",
  "ano_projeto",
  "valor_solicitado",
  "valor_aprovado",
  "valor_captado",
  "valor_projeto",
] as const;

/**
 * Monta a URL sem barra final e com os parâmetros na ordem dada.
 *
 * A ordem importa mais do que parece: como o hash de `_links` é função da
 * consulta (armadilha 2), duas montagens diferentes da MESMA página produzem
 * hashes diferentes. Fixar a ordem aqui deixa a retomada do coletor
 * reproduzível.
 */
export function montarUrl(recurso: string, params: Record<string, string | number> = {}): string {
  const limpo = recurso.replace(/^\/+|\/+$/g, "");
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) q.set(k, String(v));
  const cauda = q.toString();
  return `${BASE_SALIC}/${limpo}${cauda ? `?${cauda}` : ""}`;
}

/**
 * Decodifica o corpo como UTF-8 e ABORTA se sobrar caractere de substituição.
 *
 * `TextDecoder("utf-8")` sem `fatal` troca byte inválido por U+FFFD em
 * silêncio — é assim que mojibake vira arquivo gravado. A checagem explícita
 * de U+FFFD é a mesma de `extrair-educacao-paraopeba.mts`: parar é melhor que
 * publicar "Bras?lia".
 */
export function decodificarCorpo(bytes: Uint8Array, origem = "resposta"): string {
  const texto = new TextDecoder("utf-8").decode(bytes);
  // O caractere de substituição vai por ESCAPE (`\uFFFD`), nunca literal:
  // um arquivo que contém o próprio U+FFFD é o primeiro candidato a se
  // corromper, e a trava passaria a acusar a si mesma.
  if (/\uFFFD/.test(texto)) {
    throw new Error(
      `ABORTADO: ${origem} tem caractere de substituição (U+FFFD) — o corpo não é UTF-8 limpo.`
    );
  }
  return texto;
}

export interface Pagina<T> {
  itens: T[];
  /** Quantos vieram nesta página. */
  count: number;
  /** Quantos existem no filtro inteiro. */
  total: number;
}

/**
 * Lê o envelope HAL (`_embedded.<chave>`, `count`, `total`).
 *
 * Aborta em vez de devolver lista vazia quando o envelope não tem a forma
 * esperada: página vazia silenciosa é indistinguível de "acabou", e foi assim
 * que a coleta de clipping perdeu três acervos sem ninguém notar.
 */
export function lerEnvelope<T>(texto: string, chave: string): Pagina<T> {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    // O caso real: seguiu um 301, recebeu HTML de Apache e tentou parsear.
    throw new Error(
      `ABORTADO: resposta de "${chave}" não é JSON (começa com ${JSON.stringify(texto.slice(0, 40))}).`
    );
  }
  const env = bruto as {
    _embedded?: Record<string, unknown>;
    count?: unknown;
    total?: unknown;
    message?: unknown;
  };
  if (!env._embedded || !Array.isArray(env._embedded[chave])) {
    const msg = typeof env.message === "string" ? ` (a API disse: "${env.message}")` : "";
    throw new Error(`ABORTADO: envelope sem _embedded.${chave}${msg}.`);
  }
  const itens = env._embedded[chave] as T[];
  const total = Number(env.total);
  if (!Number.isFinite(total)) throw new Error(`ABORTADO: envelope de "${chave}" sem "total".`);
  const count = Number.isFinite(Number(env.count)) ? Number(env.count) : itens.length;
  if (count !== itens.length) {
    throw new Error(
      `ABORTADO: "count" diz ${count} e vieram ${itens.length} itens em "${chave}" — página truncada.`
    );
  }
  return { itens, count, total };
}

/**
 * Devolve o link publicado em `_links`, e recusa montar um.
 *
 * Armadilha 2 em forma de função: existe a tentação de fazer
 * `BASE + "/incentivadores/" + idDoSelf + "/doacoes"`, e ela dá 404. Aqui não
 * há caminho para isso — ou o link veio no corpo, ou o chamador para.
 *
 * ⚠️ Medido em 15/08/2026: o link `doacoes` publicado devolveu **404** em
 * 9 de 9 incentivadores testados (BANCO DO BRASIL SA e os 8 primeiros de MG),
 * com `{"message":"No funding info was found with your criteria"}`. Ou seja,
 * seguir o link certo também não traz doação hoje. A função continua sendo a
 * forma correta de pedir; o coletor registra o 404 como fato medido em vez de
 * fingir que a trilha existe.
 */
export function linkPublicado(item: { _links?: Record<string, string> }, rel: string): string {
  const url = item._links?.[rel];
  if (!url) {
    throw new Error(
      `ABORTADO: o item não publicou _links.${rel}. Não monte a URL à mão — o hash do "self" ` +
        `pertence a outro recurso e dá 404.`
    );
  }
  return url;
}

/**
 * Dígitos verificadores de CPF (mod-11). Gêmeo do de
 * `lib/sem-cpf-no-repo.test.ts` — ver `conferirSemCpf` para por que existe uma
 * segunda cópia aqui.
 */
function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;
  const dv = (ate: number) => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/**
 * ABORTA se algum registro a ser gravado carrega um CPF de pessoa real.
 *
 * ═══ POR QUE, SE A FONTE JÁ MASCARA ═══
 *
 * Medido em 15/08/2026: o SALIC **já entrega o CPF mascarado**. Pessoa física
 * vem com `cgccpf: "***008317**"`; dos 6.100 projetos de MG lidos até a
 * conferência, 4.639 traziam CNPJ de 14 dígitos e 1.461 vinham mascarados.
 * Nenhum CPF inteiro apareceu.
 *
 * Este guarda existe **exatamente por isso**: a única defesa hoje é uma
 * decisão do servidor do MinC, que pode mudar numa terça-feira sem aviso, e
 * este é um repositório PÚBLICO. `lib/sem-cpf-no-repo.test.ts` pegaria o
 * vazamento — mas só no `npm test` seguinte, depois do arquivo já gravado e
 * possivelmente já commitado. Aqui a coleta para antes de escrever.
 *
 * ═══ O QUE A MÁSCARA CUSTA, E POR QUE NÃO É PERDA ═══
 *
 * `cgccpf` só serve de chave para pessoa JURÍDICA. A junção que motiva esta
 * fonte — incentivador cultural × fornecedor de contrato público — é entre
 * empresas, e o CNPJ vem inteiro. O lado pessoa física fica sem chave, e isso
 * é o comportamento certo: quem doou R$ 100 não é o alvo de um portal de
 * controle de dinheiro público corporativo.
 */
export function conferirSemCpf(itens: Array<Record<string, unknown>>, campo = "cgccpf"): void {
  for (const item of itens) {
    const digitos = String(item[campo] ?? "").replace(/\D/g, "");
    if (digitos.length === 11 && cpfValido(digitos)) {
      throw new Error(
        `ABORTADO: registro com CPF de pessoa real em "${campo}". A fonte mascarava CPF em ` +
          `15/08/2026 (\`***008317**\`) e parou de mascarar — este repositório é PÚBLICO. ` +
          `Não grave: decida como anonimizar antes.`
      );
    }
  }
}

/**
 * Aborta quando um filtro foi ignorado e a API devolveu o catálogo inteiro.
 *
 * `totalSemFiltro` tem de ser medido na mesma rodada, não decorado: 113.548 é
 * o número de 15/08/2026 e ele cresce. A comparação é de igualdade exata
 * porque é isso que o servidor faz — ignorar o parâmetro devolve exatamente a
 * mesma consulta.
 */
export function conferirFiltroHonrado(
  descricao: string,
  totalFiltrado: number,
  totalSemFiltro: number
): void {
  if (totalFiltrado === totalSemFiltro) {
    throw new Error(
      `ABORTADO: ${descricao} devolveu ${totalFiltrado}, igual ao total sem filtro nenhum — ` +
        `o parâmetro foi ignorado e isto é o catálogo inteiro, não o recorte.`
    );
  }
}

/**
 * Normaliza CNPJ/CPF para a junção com o fornecedor de contrato público.
 *
 * É o motivo de a fonte existir no portal. Só dígitos, e zero à esquerda que o
 * JSON já traz (`"00000000000191"`) preservado — 14 dígitos para CNPJ, 11 para
 * CPF. Quem passar por `Number` perde o zero e a junção falha calada.
 */
export function normalizarCgccpf(valor: string | number | null | undefined): string | null {
  if (valor === null || valor === undefined) return null;
  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length === 14 || digitos.length === 11) return digitos;
  // ⚠️ O comprimento fora do padrão NÃO é lixo: é a MÁSCARA DA FONTE.
  // Pessoa física chega como `***008317**` (6 dígitos sobram) — medido em
  // 15/08/2026, e em 1.461 dos 6.100 projetos de MG conferidos. Devolver null
  // aqui é o comportamento certo: um quase-CPF de 6 dígitos casaria com
  // qualquer coisa. Quem ler "registro sem CNPJ válido" no relatório tem de
  // entender que são pessoas físicas mascaradas na origem, não dado sujo.
  return null;
}

/** `ano_projeto` chega com dois dígitos ("26", "23"); a tela precisa de quatro. */
export function anoDeQuatroDigitos(ano: string | number): number | null {
  const bruto = String(ano).trim();
  // `Number("")` é 0, não NaN — e 0 passaria por `isFinite` e viraria "2000".
  // Ano em branco existe na base; inventar 2000 para ele poria projetos num
  // ano que ninguém escolheu. O teste pegou exatamente isto.
  if (!bruto) return null;
  const n = Number(bruto);
  if (!Number.isFinite(n)) return null;
  if (n >= 1000) return n;
  // A Rouanet é de 1991. "91".."99" é 1900+, o resto é 2000+.
  return n >= 91 ? 1900 + n : 2000 + n;
}

/** Converte para número tolerando string e vazio, sem inventar zero para ausente. */
function numero(v: unknown): number {
  const n = typeof v === "number" ? v : Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Corta o projeto para os campos do rastro do dinheiro.
 *
 * Aborta se faltar `PRONAC`: sem ele o registro não tem identidade e não dá
 * para retomar coleta nem deduplicar.
 */
export function enxugarProjeto(bruto: Record<string, unknown>): ProjetoRouanet {
  const pronac = String(bruto.PRONAC ?? "").trim();
  if (!pronac) throw new Error("ABORTADO: projeto sem PRONAC — a estrutura da API mudou.");
  const saida: Record<string, unknown> = {};
  for (const campo of CAMPOS_PROJETO) {
    saida[campo] = campo.startsWith("valor_")
      ? numero(bruto[campo])
      : String(bruto[campo] ?? "").trim();
  }
  return saida as unknown as ProjetoRouanet;
}

/**
 * Ordena por valor doado, decrescente — LOCALMENTE.
 *
 * Existe porque `sort` da API é ignorado (armadilha 6): confiar na ordem que
 * chega é publicar um ranking que não é ranking.
 */
export function ordenarPorTotalDoado<T extends { total_doado: number }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => numero(b.total_doado) - numero(a.total_doado));
}

export interface AgregadoIncentivador {
  cgccpf: string;
  /** O nome mais frequente; a base grafa a mesma empresa de várias formas. */
  nome: string;
  tipo_pessoa: string;
  total_doado: number;
  /** Quantos registros distintos (filiais, grafias) foram somados neste CNPJ. */
  registros: number;
  ufs: string[];
}

/**
 * Soma por `cgccpf`, e não por nome.
 *
 * Medido na 1ª página de `?limit=10`: "BANCO DO BRASIL SA", "Banco do Brasil
 * S.A", "Banco do Brasil S.A - Centro Cultural" e "Banco do Brasil " são
 * quatro grafias em quatro UFs, com CNPJs de raiz 00000000 e filiais
 * diferentes (`…000191`, `…001830`, `…108634`). Agrupar por nome funde
 * empresas homônimas; agrupar por CNPJ mantém a filial separada e ainda deixa
 * a raiz visível para quem quiser consolidar depois — decisão de tela, não de
 * coleta.
 *
 * Registro sem `cgccpf` válido fica DE FORA e é contado à parte pelo chamador:
 * jogar num balde "sem CNPJ" criaria um incentivador gigante e fictício.
 */
export function agregarPorCgccpf(lista: Incentivador[]): AgregadoIncentivador[] {
  const mapa = new Map<string, AgregadoIncentivador & { nomes: Map<string, number> }>();
  for (const inc of lista) {
    const chave = normalizarCgccpf(inc.cgccpf);
    if (!chave) continue;
    let ag = mapa.get(chave);
    if (!ag) {
      ag = {
        cgccpf: chave,
        nome: "",
        tipo_pessoa: String(inc.tipo_pessoa ?? ""),
        total_doado: 0,
        registros: 0,
        ufs: [],
        nomes: new Map(),
      };
      mapa.set(chave, ag);
    }
    ag.total_doado += numero(inc.total_doado);
    ag.registros += 1;
    const nome = String(inc.nome ?? "").trim();
    if (nome) ag.nomes.set(nome, (ag.nomes.get(nome) ?? 0) + 1);
    const uf = String(inc.UF ?? "").trim();
    if (uf && !ag.ufs.includes(uf)) ag.ufs.push(uf);
  }
  return [...mapa.values()].map(({ nomes, ...ag }) => ({
    ...ag,
    nome: [...nomes.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? "",
    ufs: [...ag.ufs].sort(),
  }));
}

/** Top N por valor, já agregado por CNPJ e ordenado aqui (nunca pela API). */
export function topPorTotalDoado(lista: Incentivador[], n = 10): AgregadoIncentivador[] {
  return agregarPorCgccpf(lista)
    .sort((a, b) => b.total_doado - a.total_doado)
    .slice(0, n);
}

/** Soma de um campo de valor sobre os projetos, para o resumo do relatório. */
export function somar(projetos: ProjetoRouanet[], campo: keyof ProjetoRouanet): number {
  return projetos.reduce((s, p) => s + numero(p[campo]), 0);
}

/** Formata em real, para o relatório e para a tela. */
export function reais(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
