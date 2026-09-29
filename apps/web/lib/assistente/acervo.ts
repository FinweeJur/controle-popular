/**
 * Acervo do chatbot (degrau 3 do assistente): a memória de onde as respostas
 * IA saem, com a URL da fonte colada em cada pedaço.
 *
 * ═══ O QUE ISTO É ═══
 *
 * O RAG de demonstração (`demonstracao.ts`) indexava 4 normas federais sobre
 * a barragem de Fundão — corpus de prova de conceito, não o portal. Este
 * módulo monta o acervo REAL: as respostas pré-curadas do Seu Nonô
 * (`SeuNonoData.ts`), as sugestões contextuais por rota
 * (`contexto-pagina.ts`), os resumos de dados das páginas
 * (`PAGINAS_DADOS`), as postagens do blog, os atos de pessoal e — desde a
 * Fase 5 do plano de cavas — a série anual de mineração de MG. Tudo texto já
 * curado do portal, cada pedaço com `rota`/`fonteUrl` — a disciplina de
 * "citação colada ao número" do `AGENTS.md`: se não há onde apontar a fonte,
 * o pedaço não entra.
 *
 * ═══ POR QUE EM CÓDIGO, E NÃO NUM JSON COMMITADO ═══
 *
 * A primeira versão do plano previa um manifesto versionado
 * (`data/assistente-acervo.json`). Na prática o JSON seria artefato
 * derivado das MESMAS fontes TS — e artefato derivado commitado é armadilha
 * de stale (a fonte muda, o JSON fica velho, e o teste que compara os dois
 * vira manutenção). Decisão registrada: `montarAcervo()` constrói em
 * código, determinístico, sem fs e sem rede — roda em `next dev`, em
 * `next start` no home-pc e, se um dia o Worker voltar a servir, também lá.
 * O JSONL de finetuning (Fase 4) e a carga pgvector (Fase 5) são gerados a
 * partir DESTA mesma função por script — um consumidor a mais, zero
 * duplicação de verdade.
 *
 * ═══ DADO PESSOAL ═══
 *
 * As fontes aqui são módulos TS curados (varridos pela guarda de código
 * `checar-dado-pessoal.py` e pelo teste gêmeo `sem-cpf-no-repo.test.ts`) —
 * não dado ingerido de coletor. Quando a ingestão passar a puxar JSON de
 * `etl/betim/dados/` (que a guarda de DADO `checar-dado-pessoal-em-dado.py`
 * já cobre desde 22/08), a regra do AGENTS.md vale: varrer ANTES de
 * ingerir, nunca depois.
 */

import { FRENTES, PAGINAS_DADOS } from "@/app/components/SeuNonoData";
import { CONTEXTOS } from "@/lib/seo/contexto-pagina";
import { listarNoticiasPortal } from "@/lib/noticias/portal";
import { listarDesignacoes } from "@/lib/judiciario/designacoes";
import serieCavas from "@/data/cavas-serie-mineracao-mg.json";
import estadosCavas from "@/data/cavas-estados-mg.json";
import {
  cartoesTopo,
  estadoDaSerie,
  FONTE_ANM_PROCESSOS,
  type LinhaSerie,
} from "@/lib/cavas/serie";

/** Um pedaço do acervo — texto + onde apontar a fonte. */
export interface AcervoFonte {
  /** Chave estável de deduplicação (frente + origem + id). */
  id: string;
  /** Frente do portal a que o pedaço pertence (id livre, ver FRENTES). */
  frente: string;
  /** Rota primária do portal onde o conteúdo aparece. */
  rota: string;
  /** Título curto do pedaço (a pergunta ou o nome da página). */
  titulo: string;
  /** URL para citar — a mesma `rota` quando a fonte é interna. */
  fonteUrl: string;
  /** O texto do pedaço (resposta pré-curada ou resumo de página). */
  texto: string;
  /** Links extras para mostrar junto da fonte (abrir/copiar). */
  links?: { href: string; texto: string }[];
}

/** Frente derivada da rota — mesma régua dos CONTEXTOS de `contexto-pagina.ts`. */
export function frenteDaRota(rota: string): string {
  if (
    rota.startsWith("/betim") ||
    rota.startsWith("/bh") ||
    rota.startsWith("/diamantina") ||
    rota.startsWith("/aracuai") ||
    rota.startsWith("/itinga") ||
    rota.startsWith("/sp")
  ) {
    return "cidades";
  }
  if (rota.startsWith("/congresso")) return "congresso";
  if (rota.startsWith("/judiciario")) return "judiciario";
  if (rota.startsWith("/ambiental")) return "ambiental";
  if (rota.startsWith("/paraopeba")) return "paraopeba";
  if (rota.startsWith("/funcaosocialterra")) return "funcaosocialterra";
  if (rota.startsWith("/direitos-em-movimento")) return "direitos-em-movimento";
  return "geral";
}

/** Um link do portal, no formato de `SeuNonoData`. */
interface LinkPortal {
  href: string;
  texto: string;
}

function rotaPrimaria(p: {
  link?: LinkPortal;
  links?: LinkPortal[];
}): LinkPortal | null {
  if (p.link) return p.link;
  if (p.links && p.links.length > 0) return p.links[0];
  return null;
}

function deFrentes(): { fontes: AcervoFonte[]; puladas: number } {
  const fontes: AcervoFonte[] = [];
  let puladas = 0;
  for (const frente of FRENTES) {
    for (const categoria of frente.categorias) {
      for (const pergunta of categoria.perguntas) {
        const primaria = rotaPrimaria(pergunta);
        // Regra "ou o número não vai": resposta sem página apontada não
        // entra no acervo — a IA não pode citar o que não tem endereço.
        if (!primaria) {
          puladas++;
          continue;
        }
        fontes.push({
          id: `pergunta:${frente.id}:${pergunta.id}`,
          frente: frente.id,
          rota: primaria.href,
          titulo: pergunta.pergunta,
          fonteUrl: primaria.href,
          texto: pergunta.resposta,
          links: pergunta.links ?? (pergunta.link ? [pergunta.link] : undefined),
        });
      }
    }
  }
  return { fontes, puladas };
}

function deContextos(): AcervoFonte[] {
  const fontes: AcervoFonte[] = [];
  CONTEXTOS.forEach((contexto, i) => {
    contexto.sugestoes.forEach((s, j) => {
      fontes.push({
        id: `contexto:${i}:${j}`,
        frente: frenteDaRota(s.link),
        rota: s.link,
        titulo: s.pergunta,
        fonteUrl: s.link,
        texto: s.resposta,
        links: [{ href: s.link, texto: s.linkTexto }],
      });
    });
  });
  return fontes;
}

function dePaginasDados(): AcervoFonte[] {
  const fontes: AcervoFonte[] = [];
  for (const pagina of PAGINAS_DADOS) {
    const primaria = pagina.links[0];
    if (!primaria) continue;
    fontes.push({
      id: `pagina:${pagina.id}`,
      frente: frenteDaRota(primaria.href),
      rota: primaria.href,
      titulo: pagina.titulo,
      fonteUrl: primaria.href,
      texto: [pagina.resumo, ...pagina.dados].join("\n"),
      links: pagina.links,
    });
  }
  return fontes;
}

/** Postagens do blog entram no acervo: o assistente precisa conhecer as
 *  publicações para citar o que o portal afirma (regra "todo contexto no
 *  chatbot", pedido do dono em 10/09/2026). Cada post vira um pedaço com
 *  o lead (resumo) + primeiro parágrafo — o texto inteiro pesaria demais
 *  na janela de contexto e não melhora a citação. */
function dePostsDoBlog(): AcervoFonte[] {
  const fontes: AcervoFonte[] = [];
  for (const post of listarNoticiasPortal()) {
    const rota = `/noticias/${post.slug}`;
    fontes.push({
      id: `blog:${post.slug}`,
      frente: frenteDaRota(rota),
      rota,
      titulo: post.titulo,
      fonteUrl: rota,
      texto: [post.resumo, ...post.paragrafos.slice(0, 2)].join("\n"),
    });
  }
  return fontes;
}

/** Atos de pessoal do Diário Oficial: o assistente responde "quem é o
 *  designado para X" com o dado coletado e o link do ato oficial. */
function deDesignacoes(): AcervoFonte[] {
  const fontes: AcervoFonte[] = [];
  for (const d of listarDesignacoes()) {
    const rota = "/judiciario/contatos";
    fontes.push({
      id: `designacao:${d.fonte}|${d.data_edicao}|${d.ato}|${d.pessoa}`,
      frente: "judiciario",
      rota,
      titulo: `${d.cargo ? d.cargo + " — " : ""}${d.pessoa}`,
      fonteUrl: rota,
      texto: `${d.tipo} publicada em ${d.data_edicao}. Pessoa: ${d.pessoa}. Cargo: ${d.cargo}. Órgão/local: ${d.orgao}. Ato: ${d.ato}. Fonte: ${d.fonte}.`,
    });
  }
  return fontes;
}

/** Rota das cavas de mineração — a página da Fase 5 (fonte interna). */
const ROTA_CAVAS = "/mineracao/cavas";

/** Linhas da série anual de mineração de MG, em número de polígonos/hectares. */
const SERIE_CAVAS = serieCavas.serie as LinhaSerie[];

/** Agregados dos cartões de topo — número medido, nunca digitado à mão. */
const CARTOES_CAVAS = cartoesTopo(SERIE_CAVAS);

/** Estado da janela de 24 meses, calculado sobre a data da coleta. */
const ESTADO_CAVAS = estadoDaSerie(SERIE_CAVAS, new Date(serieCavas.gerado_em));

/**
 * Pedaços de contexto das duas bases de cavas (Fase 5), para o assistente.
 *
 * É a regra 5 ("toda base alimenta o assistente") aplicada às bases de
 * mineração: cada pedaço leva o agregado medido + a ressalva da própria
 * fonte, e aponta a rota do portal ou a fonte oficial da ANM. Os números saem
 * do JSON coletado (`cavas-serie-*.json`, `cavas-estados-*.json`) e das
 * funções de `lib/cavas/serie.ts` — o mesmo caminho da página, então chatbot
 * e tela nunca divergem (regra "o número vem do dado").
 *
 * @returns 6 pedaços, todos com rota e fonteUrl
 */
function deCavas(): AcervoFonte[] {
  const fmt = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  const dataCavas = serieCavas.gerado_em.slice(0, 10).split("-").reverse().join("/");
  const dataEstados = estadosCavas.gerado_em.slice(0, 10).split("-").reverse().join("/");
  const C = CARTOES_CAVAS;
  const R = estadosCavas.resumo;
  const fonteMapa = `Fonte: ${serieCavas.fonte}. Camada ${serieCavas.camada}. Coletado em ${dataCavas}.`;
  const rota = { href: ROTA_CAVAS, texto: "Série anual e tabela" };

  return [
    {
      id: "cavas:cobertura",
      frente: frenteDaRota(ROTA_CAVAS),
      rota: ROTA_CAVAS,
      titulo: "Quanto de chão mudou em Minas Gerais com mineração",
      fonteUrl: ROTA_CAVAS,
      texto:
        `O portal acompanha ${fmt.format(C.poligonos)} polígonos de mineração em Minas Gerais, ` +
        `somando ${fmt.format(C.area)} hectares entre ${C.primeiroAno} e ${C.ultimoAno} ` +
        `(${C.qtdAnos} anos). A imagem tem ${serieCavas.resolucao_m} metros por pixel. ` +
        `${serieCavas.fonte}. ${serieCavas.ressalva}. ${fonteMapa}`,
      links: [rota],
    },
    {
      id: "cavas:estado-janela",
      frente: frenteDaRota(ROTA_CAVAS),
      rota: ROTA_CAVAS,
      titulo: "A mineração de MG ainda cresce, parou ou encerrou",
      fonteUrl: ROTA_CAVAS,
      texto:
        `Estado da janela de 24 meses: ${ESTADO_CAVAS.estado}. ${ESTADO_CAVAS.explicacao}. ` +
        `O pico de área nova foi em ${C.picoAno}, que não é o ano do teto da série (${C.primeiroAno}). ` +
        (C.ultimoDelta == null
          ? `O último ano (${C.ultimoAno}) não tem delta calculado. `
          : `No último ano (${C.ultimoAno}) apareceram ${fmt.format(C.ultimoDelta)} hectares novos. `) +
        `Estado calculado em ${dataCavas} por \`lib/cavas/serie.ts\`.`,
      links: [rota],
    },
    {
      id: "cavas:tres-estados",
      frente: frenteDaRota(ROTA_CAVAS),
      rota: ROTA_CAVAS,
      titulo: "Em operação, indício ou sem cadastro: os três estados de uma cava",
      fonteUrl: ROTA_CAVAS,
      texto:
        `Amostra de ${estadosCavas.amostra} cavas: ${R.em_operacao} em operação, ` +
        `${R.indicio_processual} com indício processual e ${R.sem_cadastro_anm} sem cadastro na ANM. ` +
        `Estado em operação significa dentro de polígono ANM em fase que autoriza extrair na data da coleta. ` +
        `Estado com indício é dentro de polígono ANM sem autorização — conferir na ANM. ` +
        `Sem cadastro é fora de todo polígono ANM: o mapa enxerga mineração onde a ANM não tem cadastro. ` +
        `Aparar no mapa não é ilegal por si só. Amostra datada de ${dataEstados}; não é total de MG.`,
      links: [rota],
    },
    {
      id: "cavas:fora-da-anm",
      frente: frenteDaRota(ROTA_CAVAS),
      rota: ROTA_CAVAS,
      titulo: "Mineração mapeada fora de todo polígono da ANM",
      fonteUrl: ROTA_CAVAS,
      texto:
        `A série soma ${fmt.format(C.qtdFora)} polígonos e ${fmt.format(C.areaFora)} hectares ` +
        `fora de todo polígono da ANM, em ${C.qtdAnos} anos. Isso é ausência de cadastro, ` +
        `não é ausência de mineração e não é, sozinho, prova de ilicitude. ` +
        `${estadosCavas.ressalva}. ${fonteMapa}`,
      links: [rota],
    },
    {
      id: "cavas:limites",
      frente: frenteDaRota(ROTA_CAVAS),
      rota: ROTA_CAVAS,
      titulo: "O que a base de cavas ainda não responde",
      fonteUrl: ROTA_CAVAS,
      texto:
        `Lacunas declaradas da Fase 5: a coleta cobre só Minas Gerais, não todas as UF. ` +
        `Não há distância até terra indígena nem área de conservação por cava. ` +
        `Não há imagem de satélite com data de cada cava. ` +
        `A resolução é ${serieCavas.resolucao_m} metros por pixel: cava pequena ou sob nuvem aparece atrasada. ` +
        `${serieCavas.resolucao_aviso} ${serieCavas.ressalva}`,
      links: [rota],
    },
    {
      id: "cavas:conferir-anm",
      frente: frenteDaRota(ROTA_CAVAS),
      rota: ROTA_CAVAS,
      titulo: "Como conferir um processo de mineração na ANM",
      fonteUrl: FONTE_ANM_PROCESSOS,
      texto:
        `Para conferir o processo citado no portal, use a consulta pública da ANM. ` +
        `O link não aceita parâmetro: o campo se chama NUP e a busca é manual. ` +
        `Processo dentro de polígono ANM sem fase que autoriza extração é indício, não sentença. ` +
        `Fonte: ${estadosCavas.fonte}.`,
      links: [{ href: FONTE_ANM_PROCESSOS, texto: "Consultar processo na ANM" }, rota],
    },
  ];
}

/**
 * Pedaços de conhecimento macro e dados estruturantes do portal.
 * Cobre o painel geral da Home (R$ 251 bi), as 5 perguntas fixas,
 * a repactuação de Mariana (R$ 171 bi), o Judiciário MG, contratos PNCP,
 * barragens a montante e o licenciamento ambiental SEMAD.
 */
function deDadosMacro(): AcervoFonte[] {
  return [
    {
      id: "macro:soma-251-bi",
      frente: "geral",
      rota: "/",
      titulo: "Soma dos R$ 251 bilhões monitorados no painel do portal",
      fonteUrl: "/",
      texto:
        "O portal Controle Popular monitora R$ 251 bilhões no painel geral de impacto popular. " +
        "A soma pública oficial é composta por: Acordo de Repactuação do Rio Doce / Mariana (R$ 171 bilhões) + " +
        "Acordo Judicial de Reparação de Brumadinho / Paraopeba (R$ 37,7 bilhões) + " +
        "Orçamento anual do Sistema de Justiça de Minas Gerais (R$ 20,1 bilhões somando TJMG, MPMG e DPMG) + " +
        "Orçamentos e contratos das cidades monitoradas no radar municipal (R$ 22,7 bilhões). " +
        "O radar acompanha 203 cidades (27 capitais e 176 polos estratégicos) e 1.389 proposições legislativas auditadas.",
      links: [
        { href: "/", texto: "Painel Geral do Portal" },
        { href: "/ambiental/mariana", texto: "Acordo de Mariana" },
        { href: "/paraopeba/execucao", texto: "Acordo de Brumadinho" },
        { href: "/judiciario/instituicoes", texto: "Orçamento da Justiça MG" },
      ],
    },
    {
      id: "macro:acordo-mariana-171-bi",
      frente: "ambiental",
      rota: "/ambiental/mariana",
      titulo: "Repactuação do Rio Doce (Mariana) de R$ 171 bilhões",
      fonteUrl: "/ambiental/mariana",
      texto:
        "O Acordo Judicial de Repactuação da Bacia do Rio Doce e Mariana soma R$ 171 bilhões totais. " +
        "Desse valor, R$ 100 bilhões representam dinheiro novo a ser pago pelas mineradoras Samarco, Vale e BHP Billiton ao longo de 20 anos. " +
        "Os recursos destinam-se a saúde pública, saneamento básico, infraestrutura, recuperação ambiental da calha do Rio Doce e repasses diretos aos municípios de Minas Gerais e do Espírito Santo atingidos pelo rompimento da barragem de Fundão.",
      links: [
        { href: "/ambiental/mariana", texto: "Painel da Bacia do Rio Doce" },
        { href: "/ambiental/barragens", texto: "Painel de Barragens" },
      ],
    },
    {
      id: "macro:orcamento-justica-disparidade",
      frente: "judiciario",
      rota: "/judiciario/instituicoes",
      titulo: "Orçamento do TJMG, MPMG e DPMG e a disparidade institucional",
      fonteUrl: "/judiciario/instituicoes",
      texto:
        "O Sistema de Justiça de Minas Gerais consome mais de R$ 20,1 bilhões anuais do orçamento público estadual. " +
        "O Tribunal de Justiça de Minas Gerais (TJMG) tem orçamento de R$ 14,96 bilhões e o Ministério Público (MPMG) consome R$ 4,09 bilhões anuais. " +
        "Em contrapartida, a Defensoria Pública de Minas Gerais (DPMG) recebe R$ 1,06 bilhão — um orçamento 14 vezes menor que o TJMG. " +
        "Essa disparidade orçamentária resulta no déficit da Defensoria Pública em 176 comarcas mineiras, deixando populações vulneráveis sem assistência jurídica gratuita integral.",
      links: [
        { href: "/judiciario/instituicoes", texto: "Fichas Orçamentárias da Justiça MG" },
        { href: "/judiciario/instituicoes/dpmg", texto: "Déficit da Defensoria Pública" },
        { href: "/judiciario/contatos", texto: "Guia de 990 Varas e Gabinetes" },
      ],
    },
    {
      id: "macro:pesquisa-contratos-prefeituras",
      frente: "cidades",
      rota: "/betim/prefeitura/contratos",
      titulo: "Como pesquisar contratos e licitações de prefeituras no portal",
      fonteUrl: "/betim/prefeitura/contratos",
      texto:
        "O portal audita contratações públicas municipais conectando-se ao PNCP (Portal Nacional de Contratações Públicas) e aos Diários Oficiais. " +
        "Para pesquisar: acesse a página da cidade (ex: Betim, BH, Diamantina, Araçuaí, Itinga) e clique em 'Contratos' ou 'Licitações'. " +
        "O sistema oferece busca por fornecedor, objeto, modalidade (Pregão, Dispensa, Inexigibilidade), alertas de concentração de receita, " +
        "exportação em planilha CSV com UTF-8 BOM e link direto para o edital ou termo contratual original.",
      links: [
        { href: "/betim/prefeitura/contratos", texto: "Contratos de Betim" },
        { href: "/diamantina/prefeitura/diario", texto: "Diário Oficial de Diamantina" },
        { href: "/busca", texto: "Busca Universal de Contratos" },
      ],
    },
    {
      id: "macro:barragens-montante-nivel-3",
      frente: "ambiental",
      rota: "/ambiental/barragens/descaracterizacao",
      titulo: "Barragens a montante e estruturas em nível 3 de emergência em MG",
      fonteUrl: "/ambiental/barragens/descaracterizacao",
      texto:
        "O portal monitora 23 barragens a montante sob exigência legal de descaracterização pela Lei Estadual 23.291/2019 ('Mar de Lama Nunca Mais'). " +
        "Duas barragens continuam em Nível 3 de Emergência (risco iminente de ruptura): Forquilha III (mina Fábrica, em Ouro Preto/Itabirito) e Sul Superior (mina Gongo Soco, em Barão de Cocais), ambas da Vale. " +
        "O Programa de Descaracterização da Vale abrange 45 estruturas a montante em MG (21 concluídas e 24 em andamento até 2035). Os dados oficiais são integrados do SIGBM/ANM e FEAM.",
      links: [
        { href: "/ambiental/barragens/descaracterizacao", texto: "Descaracterização de Barragens" },
        { href: "/ambiental/barragens", texto: "Painel Geral de Barragens" },
      ],
    },
    {
      id: "macro:licenciamento-semad-onsa",
      frente: "ambiental",
      rota: "/ambiental/licenciamento",
      titulo: "Licenciamento ambiental em Minas Gerais (SEMAD / IDE-Sisema)",
      fonteUrl: "/ambiental/licenciamento",
      texto:
        "O painel do ONSA reúne o censo completo de mais de 19.700 empreendimentos com licença ambiental deferida em Minas Gerais pela SEMAD (Secretaria de Estado de Meio Ambiente e Desenvolvimento Sustentável). " +
        "A consulta permite filtrar por 853 municípios, 8 setores oficiais (A - Agropecuária, B - Mineração, C - Indústrias Metalúrgicas, D - Química, E - Infraestrutura, F - Energia, G - Resíduos/Saneamento, H - Serviços), " +
        "classes de risco 1 a 6 e modalidades (LP, LI, LO, LAC, LAS). Todas as licenças possuem link para o ato público e dados georreferenciados.",
      links: [
        { href: "/ambiental/licenciamento", texto: "Censo de Licenciamento Ambiental" },
        { href: "/ambiental/copam", texto: "Pautas e Decisões do COPAM" },
      ],
    },
    {
      id: "macro:vales-jequitinhonha-mucuri-litio",
      frente: "cidades",
      rota: "/direitos-em-movimento",
      titulo: "Vales do Jequitinhonha e Mucuri: polo do lítio e royalties da mineração",
      fonteUrl: "/direitos-em-movimento",
      texto:
        "O portal mapeia 82 municípios dos Vales do Jequitinhonha e Mucuri. No Médio Jequitinhonha, o Polo do Lítio abrange Araçuaí, Itinga e Coronel Murta (projetos da Sigma Lithium e outras mineradoras). " +
        "O portal fiscaliza a destinação da CFEM (Compensação Financeira pela Exploração de Recursos Minerais), o impacto nos recursos hídricos da bacia do Jequitinhonha, contratações no PNCP e a proteção das terras indígenas Maxakali no Vale do Mucuri.",
      links: [
        { href: "/noticias/itinga-transparencia-repasses-litio", texto: "Royalties do Lítio em Itinga" },
        { href: "/funcaosocialterra", texto: "Terras Tradicionais e Indígenas" },
      ],
    },
    {
      id: "macro:canais-lai-conselhos-direitos",
      frente: "direitos",
      rota: "/direitos-em-movimento/informacao",
      titulo: "Central de Canais LAI (445 entidades) e Conselhos de Direitos (710 colegiados)",
      fonteUrl: "/direitos-em-movimento/informacao",
      texto:
        "A Central de Canais LAI reúne 445 entidades públicas brasileiras (prefeituras, câmaras, tribunais, órgãos federais e concessionárias de água/energia) com e-mail, telefone, e-SIC e modelo de pedido pronto. " +
        "O portal também mapeia 710 conselhos participativos (Saúde, Meio Ambiente CODEMA, Tutelares, Direitos Humanos) das 27 UFs e 199 cidades estratégicas com datas de reunião e canais de participação popular.",
      links: [
        { href: "/direitos-em-movimento/informacao", texto: "Central de Canais LAI" },
        { href: "/direitos-em-movimento/conselhos", texto: "Conselhos de Direitos" },
        { href: "/direitos-em-movimento/denuncia", texto: "Canal de Denúncia Popular" },
      ],
    },
  ];
}

/** Contagem de cobertura do acervo, para relatório e teste. */
export interface CoberturaAcervo {
  total: number;
  porFrente: Record<string, number>;
  /** Respostas pré-curadas sem link — fora do acervo por regra do módulo. */
  puladasSemRota: number;
}

/** Resultado de `montarAcervoDetalhado`: as fontes + a contagem de puladas. */
export interface AcervoMontado {
  fontes: AcervoFonte[];
  cobertura: CoberturaAcervo;
}

/**
 * Monta o acervo inteiro, determinístico: macro → frentes → contextos → páginas →
 * posts → designações → cavas. Nenhuma dependência de fs/rede/banco — os
 * JSONs de cavas entram como import estático (mesma disciplina de página
 * estática do Next), então roda em qualquer ambiente.
 */
export function montarAcervoDetalhado(): AcervoMontado {
  const { fontes: deFrentesFontes, puladas } = deFrentes();
  const acervo = [
    ...deDadosMacro(),
    ...deFrentesFontes,
    ...deContextos(),
    ...dePaginasDados(),
    ...dePostsDoBlog(),
    ...deDesignacoes(),
    ...deCavas(),
  ];

  // Garantia estrutural: nada sem rota/fonteUrl/titulo/texto no acervo
  // (regra "ou o número não vai" do AGENTS.md, aplicada em código).
  const incompletas = acervo.filter(
    (f) => !f.rota || !f.fonteUrl || !f.titulo || !f.texto
  );
  if (incompletas.length > 0) {
    throw new Error(
      `montarAcervoDetalhado: ${incompletas.length} pedaço(s) incompleto(s) — ` +
        `ids: ${incompletas.map((f) => f.id).join(", ")}`
    );
  }

  // Dedup por id — id duplicado quebraria a citação [n] na UI.
  const vistos = new Set<string>();
  const unicos: AcervoFonte[] = [];
  for (const f of acervo) {
    if (vistos.has(f.id)) {
      throw new Error(`montarAcervoDetalhado: id duplicado "${f.id}"`);
    }
    vistos.add(f.id);
    unicos.push(f);
  }

  const porFrente: Record<string, number> = {};
  for (const f of unicos) {
    porFrente[f.frente] = (porFrente[f.frente] ?? 0) + 1;
  }

  return {
    fontes: unicos,
    cobertura: { total: unicos.length, porFrente, puladasSemRota: puladas },
  };
}

/** Apenas as fontes — atalho para quem não precisa da cobertura. */
export function montarAcervo(): AcervoFonte[] {
  return montarAcervoDetalhado().fontes;
}
