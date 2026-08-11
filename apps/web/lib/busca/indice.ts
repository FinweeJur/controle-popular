import { separarPalavras, semAcento, distancia, tolerancia } from "./normalizar";

/**
 * Busca estática — o motor que roda no navegador.
 *
 * ═══ POR QUE NÃO PERDE A RADICALIZAÇÃO ═══
 *
 * O plano registrava `/busca` como "decisão de produto": a versão estática
 * perderia a radicalização do `to_tsvector('portuguese')`. Isso vale para busca
 * por SUBSTRING, não para esta. A radicalização acontece no lado do DOCUMENTO,
 * e documento é processado no build — com o Postgres aberto do lado. O gerador
 * (`scripts/gerar-indice-busca.mts`) pede os radicais ao PRÓPRIO Postgres, via
 * `ts_lexize('portuguese_stem', ...)`, e embarca o resultado. Não é aproximação
 * de radicalizador: é o mesmo radicalizador.
 *
 * Sobra só radicalizar a palavra DIGITADA. Em vez de embarcar um Snowball em JS
 * e torcer para bater, o índice traz `formas`: um mapa forma-de-superfície ->
 * radical, gerado pelo Postgres a partir do vocabulário do acervo. Toda palavra
 * que existe no acervo tem paridade EXATA. Palavra que não existe (erro de
 * digitação, termo novo) cai na rede de segurança abaixo.
 *
 * ═══ A REDE DE SEGURANÇA, E POR QUE ELA PRECISA EXISTIR ═══
 *
 * Medido no PostgreSQL 18.4 — o radicalizador português tem buracos reais:
 *
 *     lei -> lei          leis -> leis          (plural NÃO reduz)
 *     ambiental -> ambiental   ambientais -> ambient
 *
 * Ou seja: confiar só no radical faria "leis" não achar "lei", que é o tipo de
 * falha que ninguém reporta — a pessoa conclui que o portal não tem o dado.
 * Por isso, além do radical exato, casamos por PREFIXO e por DISTÂNCIA DE
 * EDIÇÃO. As três formas somam confiança diferente na ordenação (ver `PESO`).
 */

/** Documento como ele viaja no índice — chaves curtas porque são ~10 mil. */
export interface DocumentoIndexado {
  /** id posicional; é o que aparece nas listas de ocorrência */
  i: number;
  /** título ("Lei 1.234/2020", "PL 3611/2023", "STF") */
  t: string;
  /** ementa/subtítulo já truncado — serve para exibir E para conferir frase */
  e: string;
  /** href relativo — navegação interna (contexto: cidade/proposição/tribunal) */
  h: string;
  /** zona */
  f: "cidades" | "congresso" | "judiciario";
  /** slug do município, quando faz sentido */
  m?: string;
  /** ano/data, para ordenar empate pelo mais recente */
  d?: string;
  /** slugs de tema (vocabulário municipal) */
  a?: string[];
  /** URL da fonte oficial (Diário Oficial, PNCP, site do tribunal...), quando
   *  a fonte foi coletada. Ausente não é erro — nem toda linha tem link. */
  u?: string;
}

export interface IndiceBusca {
  /** radicais distintos do acervo, ordenados */
  lexemas: string[];
  /** lexemaId -> ids de documento */
  ocorrencias: number[][];
  /** forma de superfície (sem acento) -> lexemaId. Paridade com o Postgres. */
  formas: Record<string, number>;
  docs: DocumentoIndexado[];
}

export interface Resultado {
  doc: DocumentoIndexado;
  pontos: number;
  /** termos que casaram só por aproximação — a tela avisa "você quis dizer" */
  aproximados: string[];
}

export interface OpcoesBusca {
  tema?: string;
  municipio?: string;
  limite?: number;
}

/**
 * Peso de cada forma de casamento.
 *
 * Exato vale muito mais que aproximado de propósito: quem digitou certo tem de
 * ver o resultado certo em primeiro lugar, mesmo que um documento com erro de
 * digitação parecido exista. O aproximado entra para RESGATAR busca que daria
 * zero, não para competir com a boa.
 */
const PESO = { exato: 10, prefixo: 4, aproximado: 2, titulo: 6, frase: 15 } as const;

interface TermoConsulta {
  palavra: string;
  negado: boolean;
}

/**
 * Interpreta a consulta escrita.
 *
 * Aceita o que as pessoas já usam em buscador: `"entre aspas"` para frase
 * exata e `-palavra` para excluir. É o subconjunto do `websearch_to_tsquery`
 * que aparece de verdade — implementar o resto (OR explícito) sem ninguém
 * pedir seria peso morto no navegador.
 */
export function interpretarConsulta(entrada: string): {
  termos: TermoConsulta[];
  frases: string[];
} {
  const frases: string[] = [];
  const semFrases = entrada.replace(/"([^"]+)"/g, (_, f: string) => {
    const limpa = separarPalavras(f).join(" ");
    if (limpa) frases.push(limpa);
    return " ";
  });

  const termos: TermoConsulta[] = [];
  for (const bruto of semFrases.split(/\s+/)) {
    if (!bruto) continue;
    const negado = bruto.startsWith("-");
    for (const palavra of separarPalavras(negado ? bruto.slice(1) : bruto)) {
      termos.push({ palavra, negado });
    }
  }
  return { termos, frases };
}

/**
 * Dos radicais do acervo, quais respondem por esta palavra digitada.
 *
 * A ordem das tentativas é a ordem da confiança, e ela para na primeira que
 * der resultado: achou exato, não sai procurando parecido. É o que impede
 * "saude" de trazer junto tudo que lembra "saude" de longe.
 */
function candidatos(
  palavra: string,
  indice: IndiceBusca
): { lexemaId: number; peso: number; aproximado: boolean }[] {
  const achados = new Map<number, { peso: number; aproximado: boolean }>();
  const direto = indice.formas[palavra];
  const temExato = direto !== undefined;
  if (temExato) achados.set(direto, { peso: PESO.exato, aproximado: false });

  // VIZINHO MORFOLÓGICO — roda MESMO tendo casado exato, e é isso que fecha o
  // buraco medido do radicalizador (`lei -> lei`, `leis -> leis`: dois radicais
  // distintos para a mesma palavra). Sem esta passagem, "leis" acharia só o
  // documento que escreveu "leis" e juraria que "lei" não existe no acervo.
  //
  // A folga é de 2 letras na ponta — o bastante para `s`/`es`/`is` do plural
  // português, e curta o suficiente para "lei" NÃO arrastar "leitura".
  //
  // NÚMERO PURO NÃO ENTRA NESTE LAÇO. Medido: "4793" (a busca) e "47" (um
  // radical qualquer do acervo — artigo, emenda, percentual) têm folga de 2
  // dígitos e passavam como "o mesmo número com sufixo de plural" — mas
  // número não tem plural em português, "2 dígitos de folga" é OUTRO
  // número, não uma variação do mesmo. Sem este bloqueio, buscar "4793"
  // devolvia os documentos que citam "47" (e não os que citam "4793") como
  // se fossem a mesma coisa — medido 19 resultados em Cidades + 1 no
  // Congresso, nenhum deles a proposição 4793 de verdade.
  const numeroPuro = /^\d+$/.test(palavra);
  if (palavra.length >= 3 && !numeroPuro) {
    for (let id = 0; id < indice.lexemas.length; id++) {
      if (achados.has(id)) continue;
      const lex = indice.lexemas[id];
      const [maior, menor] = lex.length >= palavra.length ? [lex, palavra] : [palavra, lex];
      if (maior.startsWith(menor) && maior.length - menor.length <= 2) {
        // `aproximado` só quando NÃO houve casamento exato: aí a palavra
        // digitada não existe no acervo e o que devolvemos é palpite, que a
        // tela precisa poder rotular como "você quis dizer".
        achados.set(id, { peso: PESO.prefixo, aproximado: !temExato });
      }
    }
  }
  if (achados.size > 0) {
    return [...achados].map(([lexemaId, v]) => ({ lexemaId, ...v }));
  }

  // Digitação parcial, para busca-enquanto-digita: "licit" -> "licitacao".
  // Só chega aqui quem não casou nem exato nem por vizinho, então o prefixo
  // largo não rouba lugar de resultado bom.
  const porPrefixo: { lexemaId: number; peso: number; aproximado: boolean }[] = [];
  if (palavra.length >= 3) {
    for (let id = 0; id < indice.lexemas.length; id++) {
      if (indice.lexemas[id].startsWith(palavra)) {
        porPrefixo.push({ lexemaId: id, peso: PESO.prefixo, aproximado: false });
      }
    }
  }
  if (porPrefixo.length > 0) return porPrefixo.slice(0, 40);

  // Erro de digitação. Só chega aqui quem não casou de jeito nenhum, então o
  // custo de varrer os radicais não pesa na busca normal.
  const limite = tolerancia(palavra);
  if (limite === 0) return [];
  const perto: { lexemaId: number; peso: number; aproximado: boolean }[] = [];
  for (let id = 0; id < indice.lexemas.length; id++) {
    if (distancia(palavra, indice.lexemas[id], limite) <= limite) {
      perto.push({ lexemaId: id, peso: PESO.aproximado, aproximado: true });
    }
  }
  return perto.slice(0, 20);
}

/**
 * A busca.
 *
 * Termos somam em E (todos precisam aparecer), como todo buscador faz — em OU,
 * uma consulta de três palavras devolveria o acervo inteiro ordenado por
 * palpite, que é pior que não achar nada.
 */
export function buscar(
  consulta: string,
  indice: IndiceBusca,
  { tema, municipio, limite = 40 }: OpcoesBusca = {}
): Resultado[] {
  const { termos, frases } = interpretarConsulta(consulta);
  const positivos = termos.filter((t) => !t.negado);
  const negativos = termos.filter((t) => t.negado);

  // Sem palavra-chave, os filtros ainda valem: a tela usa isso para navegar
  // por tema/cidade sem digitar nada.
  const semTexto = positivos.length === 0 && frases.length === 0;

  const pontos = new Map<number, number>();
  const aproximadosPorDoc = new Map<number, Set<string>>();

  if (semTexto) {
    for (const d of indice.docs) pontos.set(d.i, 0);
  } else {
    let primeiro = true;
    for (const termo of positivos) {
      const achados = candidatos(termo.palavra, indice);
      const desteTermo = new Map<number, number>();
      for (const c of achados) {
        for (const docId of indice.ocorrencias[c.lexemaId] ?? []) {
          const anterior = desteTermo.get(docId) ?? 0;
          if (c.peso > anterior) desteTermo.set(docId, c.peso);
          if (c.aproximado) {
            const s = aproximadosPorDoc.get(docId) ?? new Set<string>();
            s.add(termo.palavra);
            aproximadosPorDoc.set(docId, s);
          }
        }
      }
      if (primeiro) {
        for (const [docId, p] of desteTermo) pontos.set(docId, p);
        primeiro = false;
      } else {
        for (const docId of [...pontos.keys()]) {
          const p = desteTermo.get(docId);
          if (p === undefined) pontos.delete(docId);
          else pontos.set(docId, (pontos.get(docId) ?? 0) + p);
        }
      }
      if (pontos.size === 0) break;
    }
    if (primeiro) for (const d of indice.docs) pontos.set(d.i, 0);
  }

  const porId = new Map(indice.docs.map((d) => [d.i, d]));
  const saida: Resultado[] = [];

  for (const [docId, base] of pontos) {
    const doc = porId.get(docId);
    if (!doc) continue;

    if (tema && !(doc.a ?? []).includes(tema)) continue;
    if (municipio && doc.m !== municipio) continue;

    const textoNormalizado = semAcento(`${doc.t} ${doc.e}`);

    // Frase exata é conferida no texto, não nas ocorrências: manter posição de
    // cada palavra multiplicaria o tamanho do índice para atender um recurso
    // que aparece em poucas buscas.
    let ok = true;
    let extra = 0;
    for (const frase of frases) {
      if (textoNormalizado.includes(frase)) extra += PESO.frase;
      else {
        ok = false;
        break;
      }
    }
    if (!ok) continue;

    if (negativos.some((n) => textoNormalizado.includes(n.palavra))) continue;

    // Casar no título vale mais que casar no meio da ementa: quem busca
    // "PL 3611" quer a proposição 3611, não as que a citam.
    const noTitulo = semAcento(doc.t);
    for (const t of positivos) if (noTitulo.includes(t.palavra)) extra += PESO.titulo;

    saida.push({
      doc,
      pontos: base + extra,
      aproximados: [...(aproximadosPorDoc.get(docId) ?? [])],
    });
  }

  saida.sort((a, b) => b.pontos - a.pontos || (b.doc.d ?? "").localeCompare(a.doc.d ?? ""));
  return saida.slice(0, limite);
}
