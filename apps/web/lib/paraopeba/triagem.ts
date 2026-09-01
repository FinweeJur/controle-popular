/**
 * Régua de triagem de dado pessoal usada para gerar `documentos.ts` a
 * partir do índice Solr da Plataforma Brumadinho UFMG.
 *
 * `scripts/checar-dado-pessoal.py` varre CÓDIGO-FONTE rastreado no git —
 * `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção 3) já registrou que ele NÃO
 * cobre dado ingerido em massa ("L.H.M.G." não é CPF, "lista de pessoas
 * desaparecidas" não é segredo de código). Este arquivo é a régua dedicada
 * para esse acervo — exportada e testada (`triagem.test.ts`), não perdida
 * dentro de um script de geração de uso único.
 *
 * Ordem de aplicação (documentada de novo em `documentos.ts`, cabeçalho):
 *   1. `ehTipoPessoal` — exclui o item inteiro.
 *   2. `precisaRedigirResumo` — mantém o item, redige só o resumo (`citacao: null`).
 */

// Mesma regra de `scripts/checar-dado-pessoal.py::cpf_valido` — dígitos
// verificadores por mod-11. Reimplementada aqui (não importada) porque
// aquele arquivo é Python, sem ponte com o portal Next.
export function cpfValido(digitos: string): boolean {
  if (digitos.length !== 11 || new Set(digitos).size === 1) return false;
  const dv = (ate: number): number => {
    let soma = 0;
    for (let i = 0; i < ate; i++) soma += Number(digitos[i]) * (ate + 1 - i);
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };
  return dv(9) === Number(digitos[9]) && dv(10) === Number(digitos[10]);
}

/** CPF (formatado ou 11 dígitos corridos) que passa no mod-11, em qualquer lugar do texto. */
export function temCpfValido(texto: string | null | undefined): boolean {
  if (!texto) return false;
  const re = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (cpfValido(m[0].replace(/\D/g, ""))) return true;
  }
  return false;
}

// "L.H.M.G", "L.H.M.G.", "J.P." — duas ou mais iniciais separadas por
// ponto. Padrão medido em `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção
// 2.4): a própria UFMG reduz nome de vítima a iniciais no resumo.
const RE_INICIAIS = /\b([A-ZÀ-Ý]\.){2,}[A-ZÀ-Ý]?\b/;

export function temIniciais(texto: string | null | undefined): boolean {
  if (!texto) return false;
  return RE_INICIAIS.test(texto);
}

// Achado manual (documento id 73161271_1 do índice): o resumo descrevia
// "lista com nome do desaparecido, endereço e telefone para contato" — sem
// CPF, sem iniciais, sem tema "saúde da população". `checar-dado-pessoal.py`
// não pega isso. Regra dedicada para texto que nomeia vítima/desaparecido
// ou descreve contato pessoal associado a nome/família.
const RE_NOMEIA_VITIMA = /nome (d[oa]s?|da[s]?)?\s*(desaparecid|v[ií]tima)/i;
const RE_CONTATO_PESSOAL = /(endere[cç]o|telefone)\s+(e\s+telefone|para\s+contato|de\s+contato)/i;

export function temContatoPessoal(texto: string | null | undefined): boolean {
  if (!texto) return false;
  return RE_NOMEIA_VITIMA.test(texto) || RE_CONTATO_PESSOAL.test(texto);
}

// "Nota de pesar: <nome completo>" — obituário público publicado pela
// própria ATI (medido no feed do Guaicuy, `docs/FONTES-BIBLIOTECA-ATI.md`
// §5). A régua pegava CPF, iniciais e contato, mas não nome por extenso —
// e este é o caso em que o nome chega INTEIRO no título. O nome por extenso
// de vítima é dado pessoal: a mesma regra que redige iniciais redige aqui.
const RE_NOTA_DE_PESAR = /nota\s+de\s+pesar\s*:?\s+([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)+)/i;

export function temNotaDePesar(texto: string | null | undefined): boolean {
  if (!texto) return false;
  return RE_NOTA_DE_PESAR.test(texto);
}

// Tipo confirmado como pessoal em `docs/PLANO-INTEGRACAO-BRUMADINHO.md`
// (seção 2.2): documento de identificação, comprovante de residência,
// declaração de hipossuficiência — e qualquer variação com essas palavras
// no nome do tipo (lista fechada, revisável).
const RE_TIPO_PESSOAL = /identifica[cç][aã]o|comprovante|declara[cç][aã]o/i;

export function ehTipoPessoal(tipo: string): boolean {
  return RE_TIPO_PESSOAL.test(tipo);
}

// Tipos catch-all — composição real varia por processo (seção 2.4 do
// mesmo plano), por isso só entram como sinal de risco quando combinados
// com o tema "saúde da população".
const RE_TIPO_CATCH_ALL = /^(documentos comprobat[oó]rios|outros documentos)$/i;

export function ehTemaSaude(temas: string[]): boolean {
  return temas.some((t) => /sa[uú]de da popula[cç][aã]o/i.test(t));
}

export interface DocumentoParaTriagem {
  tipo: string;
  titulo: string;
  resumo: string | null;
  temas: string[];
}

/**
 * `true` quando o resumo deve ser removido (`citacao: null`) mas o item
 * CONTINUA publicado — "publique só metadado e link", não "não publique".
 * Não decide exclusão de tipo pessoal: isso é `ehTipoPessoal`, aplicado
 * antes e à parte (remove o item inteiro, não só o resumo).
 */
export function precisaRedigirResumo(doc: DocumentoParaTriagem): boolean {
  const texto = `${doc.titulo} ${doc.resumo ?? ""}`;
  return (
    temCpfValido(texto) ||
    temIniciais(texto) ||
    temNotaDePesar(texto) ||
    temContatoPessoal(texto) ||
    (ehTemaSaude(doc.temas) && RE_TIPO_CATCH_ALL.test(doc.tipo))
  );
}

/**
 * `true` quando o item do acervo não pode ser publicado — nem em título.
 *
 * Composição das duas portas da régua, na ordem de `documentos.ts`:
 * `ehTipoPessoal` remove o item inteiro; `precisaRedigirResumo` (que em
 * acervo com resumo redigiria só o texto) aqui também veta o item, porque
 * um acervo cujo único texto é o título não tem nada a redigir — ou o
 * título é publicável, ou o item sai inteiro.
 *
 * É a função que o agregador da biblioteca unificada usa ao gerar o dado;
 * `lib/paraopeba/biblioteca.ts` delega nela para não manter duas cópias da
 * mesma regra.
 */
export function ehItemBloqueado(doc: DocumentoParaTriagem): boolean {
  return ehTipoPessoal(doc.tipo) || precisaRedigirResumo(doc);
}
