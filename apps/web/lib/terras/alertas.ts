import { lerGeoJSON } from "./camadas";

/**
 * Leitura das camadas de ALERTA do globo 3D (`/funcaosocialterra/mapa`), para
 * a página de verificação `/funcaosocialterra/alertas`.
 *
 * ═══ POR QUE ISTO EXISTE ═══
 *
 * Os alertas (sobreposição território×SIGMINE, TI×mancha de barragem,
 * quilombola×mancha, normas que mexem em área protegida) hoje só existem
 * como camada do globo — dá para VER no mapa, não dá para CONFERIR item a
 * item. Este módulo lê os GeoJSON publicados em
 * `public/terras/globo/dados/camadas/` — a MESMA pasta que o globo serve —
 * e devolve dado estruturado para a página renderizar.
 *
 * NUNCA edita nada dentro de `public/terras/globo/`: outra frente está
 * reprocessando essas camadas (territórios quilombolas ganhando nome, entre
 * outras coisas) ao mesmo tempo em que este módulo foi escrito. Este arquivo
 * só LÊ — e lê toda vez que roda, sem cache entre execuções do processo, para
 * nunca publicar um número que a outra frente já corrigiu.
 *
 * ═══ POR QUE NENHUM NÚMERO AQUI É DIGITADO ═══
 *
 * Cada contagem (quantas sobreposições, quantos hectares, quantas normas)
 * sai de `.length`/`.reduce()` sobre o array `features` do GeoJSON — nunca
 * de um literal. `alertas.test.ts` pinça os valores medidos AGORA como
 * expectativa do teste (mesmo padrão de `zonas.test.ts` e
 * `taxa-erro-g0.test.ts`): se a outra frente publicar uma camada nova e a
 * contagem mudar, o teste quebra na hora certa, e quem atualiza o número vê
 * o que mudou — não é o mesmo erro de "30% digitado à mão" que motivou
 * `taxa-erro-g0.ts` a existir.
 *
 * ═══ O DEEP-LINK PARA O MAPA ═══
 *
 * O globo abre uma feição específica pelo hash `#area=<camada>:<índice>`,
 * onde `<camada>` é o `id` de uma fonte REGISTRADA em `LAYER_REGISTRY`
 * (`public/terras/globo/js/config.js`) e `<índice>` é a posição da feição
 * DENTRO DO ARQUIVO daquela fonte (ver `abrirAreaDoEndereco` em
 * `public/terras/globo/js/main.js`, e `GloboIframe.tsx` para o contrato
 * `?camada=&idx=` → `#area=:`).
 *
 * As camadas de alerta (`alerta-territorio-sigmine-operacao`,
 * `alerta-territorio-sigmine-interesse`, `atos-area-protegida-municipios`)
 * NÃO estão registradas como fonte própria no globo hoje — só
 * `alerta-ti-mancha` está (e vazia). Por isso o link "ver no mapa" de cada
 * item de sobreposição SIGMINE não aponta para o arquivo de alerta: aponta
 * para a MESMA feição dentro da camada que o globo já carrega
 * (`sigmine-operacao`/`sigmine-interesse`), localizada por casar
 * `sigmine_processo` — chave que a ANM garante única. Da mesma forma, cada
 * norma de `atos-area-protegida-municipios` aponta para o contorno do
 * município dentro de `municipios-mg`, casado por `geocodigo` (IBGE) — a
 * granularidade real desta camada é por município, não por norma
 * individual, e o link é honesto sobre isso.
 *
 * Quando a busca não acha o processo/geocódigo no arquivo maior (não deveria
 * acontecer — mesma fonte, mesma extração —, mas pode se os dois arquivos
 * saírem de sincronia entre uma reprocessagem e outra), `mapa` fica `null` e
 * a página não desenha o link, em vez de desenhar um link quebrado.
 */

// ═══ Índices de posição, para o deep-link ═══════════════════════════════
//
// Memoizados no módulo (não em disco, não entre execuções do processo):
// cada `next build`/`vitest run` é um processo novo, então o cache nunca
// sobrevive a uma reprocessagem da outra frente. Existem só para não reler
// e reanalisar `sigmine-interesse.geojson.gz` (47.830 feições) uma vez por
// item de alerta — 195 vezes seria 195 descompressões do mesmo arquivo de
// 6 MB.

type CamadaSigmine = "sigmine-operacao" | "sigmine-interesse";

const CACHE_IDX_SIGMINE = new Map<CamadaSigmine, Map<string, number>>();

function idxSigminePorProcesso(camada: CamadaSigmine): Map<string, number> {
  const existente = CACHE_IDX_SIGMINE.get(camada);
  if (existente) return existente;

  const arquivo =
    camada === "sigmine-operacao"
      ? "sigmine-operacao.geojson"
      : "sigmine-interesse.geojson.gz";
  const dados = lerGeoJSON<{ processo: string }>(arquivo);
  const mapa = new Map<string, number>();
  dados.features.forEach((f, idx) => {
    // `processo` é único por design do SIGMINE (1 polígono por processo
    // junto à ANM) — o primeiro índice encontrado é o único.
    if (!mapa.has(f.properties.processo)) mapa.set(f.properties.processo, idx);
  });
  CACHE_IDX_SIGMINE.set(camada, mapa);
  return mapa;
}

let cacheIdxMunicipios: Map<string, number> | null = null;

function idxMunicipioPorGeocodigo(): Map<string, number> {
  if (cacheIdxMunicipios) return cacheIdxMunicipios;
  const dados = lerGeoJSON<{ geocodigo: string }>("municipios-mg.geojson");
  const mapa = new Map<string, number>();
  dados.features.forEach((f, idx) => mapa.set(f.properties.geocodigo, idx));
  cacheIdxMunicipios = mapa;
  return mapa;
}

/** Destino do deep-link `/funcaosocialterra/mapa?camada=&idx=`. */
export interface AlvoNoMapa {
  camada: string;
  idx: number;
}

// ═══ Sobreposição território × SIGMINE ═══════════════════════════════════

interface PropsAlertaSigmineBruto {
  territorio_tipo: "terra_indigena" | "quilombola";
  territorio_nome: string | null;
  territorio_etnia: string | null;
  territorio_fase: string | null;
  territorio_municipio: string | null;
  territorio_arquivo_origem?: string | null;
  territorio_indice_origem?: number | null;
  sigmine_fonte: string;
  sigmine_processo: string;
  sigmine_nome: string;
  sigmine_subs: string;
  sigmine_fase: string;
  sigmine_uso?: string | null;
  area_intersecao_ha: number;
}

export interface AlertaSigmine {
  territorioTipo: "terra_indigena" | "quilombola";
  /** `null` quando o dado de origem não tem o nome — ver `semNomeMotivo`. */
  territorioNome: string | null;
  /**
   * Preenchido só quando `territorioNome` é `null`: explica a lacuna em vez
   * de deixar a tela em branco. Hoje isso só acontece com território
   * quilombola, porque `territorios-quilombolas(-vales).geojson` guarda
   * apenas `area_ha` — nenhuma das duas fontes tem campo de nome.
   */
  semNomeMotivo: string | null;
  territorioEtnia: string | null;
  territorioFase: string | null;
  territorioMunicipios: string[];
  sigmineProcesso: string;
  sigmineNome: string;
  sigmineSubs: string;
  sigmineFase: string;
  sigmineUso: string | null;
  areaIntersecaoHa: number;
  mapa: AlvoNoMapa | null;
}

export interface ListaAlertasSigmine {
  fase: "operacao" | "interesse";
  itens: AlertaSigmine[];
  areaTotalHa: number;
}

export function carregarAlertasSigmine(
  fase: "operacao" | "interesse"
): ListaAlertasSigmine {
  const arquivo =
    fase === "operacao"
      ? "alerta-territorio-sigmine-operacao.geojson"
      : "alerta-territorio-sigmine-interesse.geojson";
  const camadaMapa: CamadaSigmine =
    fase === "operacao" ? "sigmine-operacao" : "sigmine-interesse";

  const dados = lerGeoJSON<PropsAlertaSigmineBruto>(arquivo);
  const idx = idxSigminePorProcesso(camadaMapa);

  const itens: AlertaSigmine[] = dados.features.map((f) => {
    const p = f.properties;
    const posicao = idx.get(p.sigmine_processo);
    return {
      territorioTipo: p.territorio_tipo,
      territorioNome: p.territorio_nome,
      semNomeMotivo:
        p.territorio_nome === null
          ? `Território quilombola sem nome no dado de origem${
              p.territorio_arquivo_origem
                ? ` (${p.territorio_arquivo_origem}, feição ${p.territorio_indice_origem ?? "?"})`
                : ""
            } — a camada de territórios quilombolas registra o polígono e a área, sem campo de nome. Não é ausência do território: é lacuna do dado que o descreve.`
          : null,
      territorioEtnia: p.territorio_etnia,
      territorioFase: p.territorio_fase,
      territorioMunicipios: p.territorio_municipio
        ? p.territorio_municipio.split(",")
        : [],
      sigmineProcesso: p.sigmine_processo,
      sigmineNome: p.sigmine_nome,
      sigmineSubs: p.sigmine_subs,
      sigmineFase: p.sigmine_fase,
      sigmineUso: p.sigmine_uso ?? null,
      areaIntersecaoHa: p.area_intersecao_ha,
      mapa: posicao !== undefined ? { camada: camadaMapa, idx: posicao } : null,
    };
  });

  const areaTotalHa = itens.reduce((s, i) => s + i.areaIntersecaoHa, 0);
  return { fase, itens, areaTotalHa };
}

// ═══ TI × mancha de barragem, e quilombola × mancha de barragem ═════════
//
// As duas hoje dão ZERO — resultado publicável, não ausência de conteúdo
// (ver cabeçalho do arquivo). O "universo" (quantas combinações foram
// testadas) é o que dá peso ao zero: 16×156 é uma varredura completa,
// "zero de duas checadas" não seria notícia nenhuma.

export interface AlertaVazioMedido {
  /** `true` hoje para as duas camadas — mas lido do arquivo, não suposto. */
  vazio: boolean;
  qtdFeaturesEncontradas: number;
  qtdTerritorios: number;
  qtdBarragensComManchaPublicada: number;
  universoCombinacoes: number;
}

function carregarAlertaVazioContraMancha(
  arquivoAlerta: string,
  arquivosTerritorio: string[]
): AlertaVazioMedido {
  const alerta = lerGeoJSON<unknown>(arquivoAlerta);
  const mancha = lerGeoJSON<unknown>("mancha-inundacao-barragens.geojson.gz");
  const qtdTerritorios = arquivosTerritorio.reduce(
    (soma, nome) => soma + lerGeoJSON<unknown>(nome).features.length,
    0
  );
  const qtdBarragensComManchaPublicada = mancha.features.length;

  return {
    vazio: alerta.features.length === 0,
    qtdFeaturesEncontradas: alerta.features.length,
    qtdTerritorios,
    qtdBarragensComManchaPublicada,
    universoCombinacoes: qtdTerritorios * qtdBarragensComManchaPublicada,
  };
}

export function carregarAlertaTiMancha(): AlertaVazioMedido {
  return carregarAlertaVazioContraMancha("alerta-ti-mancha.geojson", [
    "terras-indigenas.geojson",
  ]);
}

export function carregarAlertaQuilombolaMancha(): AlertaVazioMedido {
  return carregarAlertaVazioContraMancha("alerta-quilombola-mancha.geojson", [
    "territorios-quilombolas.geojson",
    "territorios-quilombolas-vales.geojson",
  ]);
}

// ═══ Normas que mexem em área protegida ══════════════════════════════════

interface NormaBruta {
  tipo: string;
  numero: string;
  data_publicacao: string;
  ementa: string;
  categoria: string;
  categoria_label: string;
  motivo_classificacao: string;
  link_fonte: string;
}

interface PropsAtosAreaProtegidaBruto {
  nome: string;
  geocodigo: string;
  uf: string;
  total_normas_area_protegida: number;
  total_cria: number;
  total_altera_area: number;
  total_processo_em_andamento: number;
  normas: NormaBruta[];
  aviso: string;
  cobertura_da_camada: string;
  fonte: string;
}

export interface NormaAreaProtegida {
  tipo: string;
  numero: string;
  dataPublicacao: string;
  ementa: string;
  categoria: string;
  categoriaLabel: string;
  motivoClassificacao: string;
  linkFonte: string;
}

export interface MunicipioComAtoAreaProtegida {
  nome: string;
  geocodigo: string;
  totalCria: number;
  totalAlteraArea: number;
  totalProcessoAndamento: number;
  normas: NormaAreaProtegida[];
  /** Aponta para o CONTORNO do município em `municipios-mg` — esta camada é
   *  por município, não por norma; não existe geometria por ato. */
  mapa: AlvoNoMapa | null;
}

export interface AtosAreaProtegida {
  municipios: MunicipioComAtoAreaProtegida[];
  totalNormas: number;
  coberturaTexto: string;
  avisoTexto: string;
  fonteTexto: string;
}

export function carregarAtosAreaProtegida(): AtosAreaProtegida {
  const dados = lerGeoJSON<PropsAtosAreaProtegidaBruto>(
    "atos-area-protegida-municipios.geojson"
  );
  const idx = idxMunicipioPorGeocodigo();

  const municipios: MunicipioComAtoAreaProtegida[] = dados.features.map(
    (f) => {
      const p = f.properties;
      const posicao = idx.get(p.geocodigo);
      return {
        nome: p.nome,
        geocodigo: p.geocodigo,
        totalCria: p.total_cria,
        totalAlteraArea: p.total_altera_area,
        totalProcessoAndamento: p.total_processo_em_andamento,
        normas: (p.normas ?? []).map((n) => ({
          tipo: n.tipo,
          numero: n.numero,
          dataPublicacao: n.data_publicacao,
          ementa: n.ementa,
          categoria: n.categoria,
          categoriaLabel: n.categoria_label,
          motivoClassificacao: n.motivo_classificacao,
          linkFonte: n.link_fonte,
        })),
        mapa: posicao !== undefined ? { camada: "municipios-mg", idx: posicao } : null,
      };
    }
  );

  const totalNormas = municipios.reduce((s, m) => s + m.normas.length, 0);

  return {
    municipios,
    totalNormas,
    coberturaTexto: dados.features[0]?.properties.cobertura_da_camada ?? "",
    avisoTexto: dados.features[0]?.properties.aviso ?? "",
    fonteTexto: dados.features[0]?.properties.fonte ?? "",
  };
}

/**
 * ANM — Sistema de Cadastro Mineiro (SCM). Não existe parâmetro de URL que
 * pré-preencha a busca por número de processo (checado ao vivo, 13/08): a
 * página é um formulário interativo, campo "NUP". O link leva até lá; o
 * número do processo (formato NNNNNN/AAAA, o mesmo que a ANM chama de NUP
 * antigo) é o que a pessoa digita para conferir.
 */
export const FONTE_ANM_PROCESSOS = {
  label: "ANM — Sistema de Cadastro Mineiro (busca por processo)",
  url: "https://sistemas.anm.gov.br/SCM/Extra/site/admin/pesquisarProcessos.aspx",
};
