/**
 * @file Gera as fichas de serras, bacias e fauna em `data/fichas/catalogo.json`.
 *
 * O QUE É: transforma cada registro brasileiro do acervo
 * `data/ambiente/ameacas-americas.compact.json` (serra, rio e espécie) em uma
 * `Ficha` do eixo Terra e Territórios. As seções "Fichas Geológicas e de
 * Preservação" (`/terra-e-territorios/nossas-serras`), "Fichas Hídricas"
 * (`/terra-e-territorios/nossos-rios`) e "Fichas da Fauna"
 * (`/ambiental/nossos-animais`) liam desse catálogo e apareciam vazias.
 *
 * POR QUE GERAR E NÃO DIGITAR: os números já existem no acervo, com fonte e
 * ano de referência (ICMBio, IUCN, ANA, IGAM, CPRM/SGB, UNESCO). Redigitar 41
 * fichas à mão é o caminho mais curto para o número divergir da fonte que o
 * portal já publica em `/ambiental/ameacas-americas` (AGENTS §5.2 e a lição
 * das bases fabricadas). Aqui a métrica sai de `extensaoOuPopulacao` por
 * expressão regular; o que é prosa (geologia) vem do mapa `GEOLOGIA` abaixo,
 * e é o único texto escrito para esta geração.
 *
 * O QUE NÃO É AUTOMÁTICO: a geologia de cada serra. Ela é uma frase curta,
 * presa ao Supergrupo/Grupo estratigráfico que aparece no mapa do Serviço
 * Geológico do Brasil. Sem esse mapa, o campo fica vazio — nunca inventado.
 *
 * IDEMPOTENTE: as fichas com prefixo `ficha-serra-`, `ficha-bacia-` e
 * `ficha-fauna-` são substituídas por inteiro a cada rodada. As demais
 * (saúde, educação, orçamento, SIRENEJud, as duas municipais de rio) são
 * preservadas. Rodar duas vezes não duplica nem reordena o resto.
 *
 * USO (da pasta `apps/web`):
 *   npx tsx scripts/gerar-fichas-ambiente.mts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Ficha, EixoId, SubfrenteId } from '../lib/eixos/types';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAMINHO_ACERVO = path.join(RAIZ, 'data', 'ambiente', 'ameacas-americas.compact.json');
const CAMINHO_CATALOGO = path.join(RAIZ, 'data', 'fichas', 'catalogo.json');

/**
 * Data de publicação das fichas geradas. Fixa de propósito: o `dataPublicacao`
 * é o dia em que a ficha nasceu, não o dia em que o script rodou. Se virasse
 * `new Date()`, cada rodada mudaria 41 datas e o diff ficaria ilegível.
 */
const DATA_PUBLICACAO = '2026-11-02T10:00:00.000Z';

/** Ordem editorial. O que não estiver aqui entra no fim, em ordem alfabética. */
const ORDEM_SERRAS = [
  'ser-espinhaco',
  'ser-canastra',
  'ser-mantiqueira',
  'ser-curral',
  'ser-gandarela',
  'ser-cipo',
  'ser-piedade',
  'ser-brigadeiro',
  'ser-mar',
  'ser-carajas',
];

const ORDEM_RIOS = [
  'rio-doce',
  'rio-paraopeba',
  'rio-sao-francisco',
  'rio-das-velhas',
  'rio-jequitinhonha',
  'rio-tiete',
  'rio-tapajos',
  'rio-xingu',
];

const ORDEM_FAUNA = [
  'esp-lobo-guara',
  'esp-muriqui-do-norte',
  'esp-onca-pintada',
  'esp-surubim-jequitinhonha',
  'esp-tamandua-bandeira',
  'esp-bicudo',
  'esp-anta-brasileira',
  'esp-arara-lear',
  'esp-ariranha',
  'esp-baleia-franca-austral',
  'esp-boto-rosa',
  'esp-cervo-pantanal',
  'esp-gato-maracaja',
  'esp-harpia',
  'esp-jacutinga',
  'esp-mico-leao-dourado',
  'esp-peixe-boi-marinho',
  'esp-queixada',
  'esp-sauim-coleira',
  'esp-soldadinho-araripe',
  'esp-tartaruga-amazonia',
  'esp-tartaruga-couro',
  'esp-tatu-bola',
];

/**
 * Geologia em uma frase, por serra.
 *
 * Critério: só entra o que está no mapa geológico nacional (CPRM/SGB) e no
 * dossiê de criação da unidade de conservação. Nada de idade absoluta com
 * casa decimal, nada de espessura de camada — o portal não mediu isso agora.
 */
const GEOLOGIA: Record<string, string> = {
  'ser-espinhaco':
    'Geologia: cordilheira de quartzitos e metarenitos do Supergrupo Espinhaço, sobre rochas do embasamento cristalino; o relevo alongado funciona como divisor de águas entre as bacias do São Francisco, do Doce e do Jequitinhonha.',
  'ser-canastra':
    'Geologia: quartzitos e metassedimentos do Grupo Canastra, soerguidos em planalto a mais de 1.400 m; é a cabeceira do Rio São Francisco, em São Roque de Minas.',
  'ser-mantiqueira':
    'Geologia: granitos, gnaisses e migmatitos do embasamento cristalino, com escarpas de falha que separam o planalto do Vale do Paraíba; o ponto mais alto é a Pedra da Mina, com 2.790 m.',
  'ser-curral':
    'Geologia: itabiritos e cangas do Supergrupo Minas, no Quadrilátero Ferrífero; a crista é aquífero de recarga e referência paisagística de Belo Horizonte.',
  'ser-gandarela':
    'Geologia: formação Gandarela, com carbonatos e itabiritos do Supergrupo Minas; o maciço concentra nascentes que alimentam as bacias do Velhas e do Doce.',
  'ser-cipo':
    'Geologia: quartzitos do Supergrupo Espinhaço em campos rupestres de altitude, com afloramentos que sustentam alto endemismo botânico.',
  'ser-piedade':
    'Geologia: itabiritos e rochas do Quadrilátero Ferrífero, com cavas históricas na encosta norte; o topo chega a 1.746 m.',
  'ser-brigadeiro':
    'Geologia: gnaisses e granitoides do embasamento cristalino cobertos por floresta nebular de altitude, entre as bacias do Doce e do Paraíba do Sul.',
  'ser-mar':
    'Geologia: escarpas de falha em granitos e gnaisses do embasamento, com até 1.500 km de frente para o Atlântico; o relevo íngreme concentra deslizamentos em chuvas extremas.',
  'ser-carajas':
    'Geologia: platôs de canga e minério de ferro de alto teor, em savanas metalófilas sobre a Floresta Nacional de Carajás.',
};

/** Categoria do acervo → eixo, subfrente e rótulos da ficha. */
const MOLDURA: Record<
  'serra' | 'rio' | 'especie',
  { eixo: EixoId; subfrente: SubfrenteId; prefixo: string; rotuloTag: string }
> = {
  serra: {
    eixo: 'terra',
    subfrente: 'nossas-serras',
    prefixo: 'ficha-serra',
    rotuloTag: 'serra',
  },
  rio: {
    eixo: 'terra',
    subfrente: 'nossos-rios',
    prefixo: 'ficha-bacia',
    rotuloTag: 'bacias',
  },
  especie: {
    eixo: 'terra',
    subfrente: 'biomas',
    prefixo: 'ficha-fauna',
    rotuloTag: 'fauna',
  },
};

interface RegistroAcervo {
  id: string;
  categoria: string;
  nome: string;
  subtitulo: string;
  pais: string;
  regiao: string;
  bioma: string;
  statusConservacao: string;
  grauRisco: string;
  vetoresPressao: string;
  extensaoOuPopulacao: string;
  anoReferencia: number;
  orgaoResponsavel: string;
  fonteOficial: string;
  urlFonte: string;
  descricaoImpacto: string;
}

interface Metrica {
  valor: string;
  unidade: string;
}

/** Sem acento, minúsculo e com hífen — mesma forma usada nas tags do portal. */
function slug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Primeira frase do texto, com teto de 240 caracteres. */
function primeiraFrase(texto: string): string {
  const frase = texto.split(/(?<=[.!?])\s+/)[0] ?? texto;
  return frase.length > 240 ? `${frase.slice(0, 237).trimEnd()}...` : frase;
}

/**
 * Extrai "número + unidade" de `extensaoOuPopulacao`.
 *
 * A fonte escreve a medida em prosa ("853 km de extensão; bacia de 86.715
 * km²"). O cartão precisa de valor curto. A expressão aceita milhar com ponto
 * e faixa ("1.000 a 1.200 indivíduos"); quando não acha unidade conhecida,
 * devolve `null` e a ficha fica só com o indicador de situação.
 */
function extrairMetrica(texto: string): Metrica | null {
  const unidades = 'km²|km|hectares|hectare|m³|indivíduos|desovas|espécies|municípios|pessoas';
  const numero = '\\d{1,3}(?:\\.\\d{3})*(?:,\\d+)?';
  // "1.000 a 1.200 indivíduos" e "2.000 e 5.000 indivíduos" são a mesma ideia:
  // um intervalo. Sem o "e", a ariranha saía como "5.000" e o leitor perdia o
  // piso da estimativa.
  const re = new RegExp(`(${numero}(?:\\s+(?:a|e)\\s+${numero})?)\\s*(${unidades})`, 'i');
  const achado = re.exec(texto);
  if (!achado) return null;
  return { valor: achado[1], unidade: achado[2] };
}

/**
 * Nome curto do indicador de tamanho, por categoria.
 *
 * O rótulo segue a unidade que a fonte escreveu: "200.000 hectares" é área
 * protegida; "500 km" é extensão da serra. Um rótulo único ("Extensão ou área")
 * deixava o leitor sem saber o que o número mede — e no Rio Doce, que tem 853 km
 * de calha e 650 km atingidos, isso vira contradição aparente.
 */
function rotuloMetrica(
  categoria: 'serra' | 'rio' | 'especie',
  unidade: string,
): string {
  const area = /km²|hectare/i.test(unidade);
  if (categoria === 'serra') return area ? 'Área protegida' : 'Extensão da serra';
  if (categoria === 'rio') return area ? 'Área da bacia' : 'Extensão da calha principal';
  if (/desova/i.test(unidade)) return 'Desovas registradas por ano';
  return 'População estimada';
}

/** Nome curto do indicador de situação, por categoria. */
function rotuloStatus(categoria: 'serra' | 'rio' | 'especie'): string {
  if (categoria === 'serra') return 'Situação de proteção';
  if (categoria === 'rio') return 'Situação da bacia';
  return 'Grau de ameaça';
}

/** Título da ficha. Espécie leva o nome científico; rio vira "Bacia do ...". */
function montarTitulo(categoria: 'serra' | 'rio' | 'especie', r: RegistroAcervo): string {
  if (categoria === 'serra') return `${r.nome}: geologia, água e pressão minerária`;
  if (categoria === 'rio') return `Bacia do ${r.nome}: água, território e reparação`;
  return `${r.nome} (${r.subtitulo})`;
}

/** Tags: categoria, nome, bioma e o vetor de pressão quando é mineração. */
function montarTags(categoria: 'serra' | 'rio' | 'especie', r: RegistroAcervo): string[] {
  const moldura = MOLDURA[categoria];
  const palavras = new Set<string>([moldura.rotuloTag, categoria]);

  const paradas = new Set([
    'serra', 'do', 'da', 'de', 'das', 'dos', 'rio', 'bacia', 'e', 'a', 'o',
  ]);
  for (const parte of slug(r.nome).split('-')) {
    if (parte && !paradas.has(parte)) palavras.add(parte);
  }

  const bioma = slug(
    (r.bioma.split('(')[0] ?? '').split(/[,/]/)[0].split(/\s+e\s+/i)[0] ?? ''
  );
  if (bioma) palavras.add(bioma);

  if (/minera|garimpo|cava|lavra|bauxita|ferro|lítio|litio/i.test(r.vetoresPressao)) {
    palavras.add('mineracao');
  }
  if (categoria === 'rio') palavras.add('agua');
  if (categoria === 'especie') palavras.add('especie-ameacada');

  return Array.from(palavras).slice(0, 6);
}

/** `nivel`: só MG vira estadual; o resto é federal. */
function montarNivel(categoria: 'serra' | 'rio' | 'especie', r: RegistroAcervo): Ficha['nivel'] {
  if (categoria === 'rio' || categoria === 'especie') return 'federal';
  const ufs = r.regiao.replace(/\([^)]*\)/g, '');
  const soMinas = /Minas Gerais/i.test(ufs) && !/Bahia|São Paulo|Rio de Janeiro|Pará|Paraná|Santa Catarina|Espírito Santo/i.test(ufs);
  return soMinas ? 'estadual' : 'federal';
}

/** Converte um registro do acervo em uma `Ficha` do catálogo. */
function montarFicha(categoria: 'serra' | 'rio' | 'especie', r: RegistroAcervo): Ficha {
  const moldura = MOLDURA[categoria];
  const metrica = extrairMetrica(r.extensaoOuPopulacao);

  const indicadores: NonNullable<Ficha['indicadores']> = [];
  if (metrica) {
    indicadores.push({
      chave: 'extensao_ou_populacao',
      nome: rotuloMetrica(categoria, metrica.unidade),
      valor: metrica.valor,
      unidade: metrica.unidade,
      fonte: r.orgaoResponsavel,
      anoReferencia: r.anoReferencia,
    });
  }
  indicadores.push({
    chave: 'status_conservacao',
    nome: rotuloStatus(categoria),
    // O texto completo vai para `conteudo`/`resumo`. No cartão, o primeiro
    // segmento já diz a situação ("Vulnerável (VU)", "Tombada pelo IPHAN") sem
    // empurrar a pílula para a largura inteira do card.
    valor: r.statusConservacao.split(' / ')[0].trim(),
    fonte: r.orgaoResponsavel,
    anoReferencia: r.anoReferencia,
  });

  const fontes: Ficha['fontes'] = [
    { nome: r.fonteOficial, url: r.urlFonte, orgao: r.orgaoResponsavel },
  ];

  let conteudo = r.descricaoImpacto;
  if (categoria === 'serra') {
    const geologia = GEOLOGIA[r.id];
    if (geologia) {
      conteudo = `${geologia} ${r.descricaoImpacto}`;
      // A frase de geologia não saiu do acervo: ela vem do mapa geológico
      // nacional. Sem esta fonte na ficha, o leitor não teria como conferir.
      fontes.push({
        nome: 'CPRM/Serviço Geológico do Brasil — Mapa Geológico do Brasil (1:1.000.000)',
        url: 'https://www.sgb.gov.br/',
        orgao: 'SGB/CPRM',
      });
    }
  }

  return {
    id: `${moldura.prefixo}-${slug(r.nome)}`,
    slug: `${slug(r.nome)}-${categoria === 'especie' ? 'fauna' : categoria === 'rio' ? 'bacia' : 'geologia'}`,
    eixo: moldura.eixo,
    subfrente: moldura.subfrente,
    titulo: montarTitulo(categoria, r),
    resumo: primeiraFrase(r.descricaoImpacto),
    conteudo,
    dataPublicacao: DATA_PUBLICACAO,
    fontes,
    indicadores,
    tags: montarTags(categoria, r),
    nivel: montarNivel(categoria, r),
  };
}

/** Ficha gerada + o id do acervo que a originou (a ordem editorial usa esse id). */
interface FichaGerada {
  origem: string;
  ficha: Ficha;
}

/** Ordena pelo vetor editorial; o que sobrar vai ao fim em ordem alfabética. */
function ordenar(geradas: FichaGerada[], ordem: string[]): Ficha[] {
  const posicao = new Map(ordem.map((id, i) => [id, i]));
  return [...geradas]
    .sort((a, b) => {
      const ia = posicao.get(a.origem) ?? 999;
      const ib = posicao.get(b.origem) ?? 999;
      if (ia !== ib) return ia - ib;
      return a.ficha.titulo.localeCompare(b.ficha.titulo, 'pt-BR');
    })
    .map((g) => g.ficha);
}

/** Lê o acervo compactado e devolve só os registros brasileiros. */
function lerAcervo(): RegistroAcervo[] {
  const bruto = JSON.parse(fs.readFileSync(CAMINHO_ACERVO, 'utf-8')) as {
    esqueleto: string[];
    dicionarios: Record<string, string[]>;
    linhas: unknown[][];
  };

  return bruto.linhas.map((linha) => {
    const saida: Record<string, unknown> = {};
    for (const [i, campo] of bruto.esqueleto.entries()) {
      const dic = bruto.dicionarios[campo];
      saida[campo] = dic ? dic[linha[i] as number] : linha[i];
    }
    return saida as unknown as RegistroAcervo;
  });
}

function principal(): void {
  const acervo = lerAcervo().filter((r) => r.pais === 'Brasil');

  const serras = acervo
    .filter((r) => r.categoria === 'serra')
    .map((r) => ({ origem: r.id, ficha: montarFicha('serra', r) }));
  const rios = acervo
    .filter((r) => r.categoria === 'rio')
    .map((r) => ({ origem: r.id, ficha: montarFicha('rio', r) }));
  const fauna = acervo
    .filter((r) => r.categoria === 'especie')
    .map((r) => ({ origem: r.id, ficha: montarFicha('especie', r) }));

  const novas = [
    ...ordenar(serras, ORDEM_SERRAS),
    ...ordenar(rios, ORDEM_RIOS),
    ...ordenar(fauna, ORDEM_FAUNA),
  ];

  const prefixosGerados = ['ficha-serra-', 'ficha-bacia-', 'ficha-fauna-'];
  const manuais = (JSON.parse(fs.readFileSync(CAMINHO_CATALOGO, 'utf-8')) as Ficha[]).filter(
    (f) => !prefixosGerados.some((p) => f.id.startsWith(p))
  );

  const catalogo = [...novas, ...manuais];
  fs.writeFileSync(CAMINHO_CATALOGO, `${JSON.stringify(catalogo, null, 2)}\n`, 'utf-8');

  console.log(
    `Fichas geradas: ${serras.length} serras, ${rios.length} bacias, ` +
      `${fauna.length} fauna — ${manuais.length} fichas manuais preservadas ` +
      `(${catalogo.length} no total).`
  );
}

principal();
