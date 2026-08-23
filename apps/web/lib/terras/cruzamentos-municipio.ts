import { lerGeoJSON } from "./camadas";
import {
  carregarAlertaQuilombolaMancha,
  carregarAlertaTiMancha,
  carregarAlertasSigmine,
} from "./alertas";
import {
  montarLinhasCruzamento,
  municipioNaLista,
  type EntradaBarragemQuilombola,
  type EntradaSigmine,
  type LinhaCruzamento,
} from "./cruzamentos-puro";

/**
 * ═══ CRUZAMENTOS POR MUNICÍPIO — A LENTE CIDADE (Sprint 3) ═══
 *
 * As camadas de alerta do globo são estaduais; esta lente recorta para UM
 * município. Nada de geometria nova aqui: as interseções já foram
 * computadas pela frente do globo e este módulo só FILTRA (por nome de
 * município normalizado, pois FUNAI/INCRA/FEAM não publicam código IBGE
 * nas camadas) e MONTA a linha unificada.
 *
 * O que volta:
 * - `linhas` — sobreposições EXATAS (polígono × polígono) envolvendo
 *   território que toca o município. É sobreposição medida em hectares,
 *   não proximidade: nenhum buffer entra nesta tela.
 * - `territoriosPresentes` — TI e quilombolas cujo polígono registra o
 *   município, COM ou SEM sobreposição (o "sem" é conteúdo, não ruído).
 * - `barragensNoMunicipio` — manchas publicadas no município. Co-existir
 *   no mesmo município NÃO é sobreposição; quem consome decide com o
 *   rótulo que acompanha cada seção.
 * - `licenciamentoMunicipal` — estudos do SISEMA/FEAM agregados por
 *   município (`estudos-ambientais`, casado por geocodigo IBGE). Também é
 *   co-ocorrência municipal, rotulada.
 * - `lacunas` — cada ausência medida, com número (mesmo padrão do
 *   `carregarAlertaTiMancha`: zero acompanhado do universo testado).
 */

export interface TerritorioPresente {
  tipo: "terra_indigena" | "quilombola";
  nome: string | null;
  etniaOuFase: string | null;
  fase: string | null;
  areaHa: number | null;
  municipios: string[];
}

export interface BarragemNoMunicipio {
  estrutura: string;
  empreendedor: string;
  statusPae: string;
  statusErh: string;
}

export interface LicenciamentoMunicipal {
  municipio: string;
  audiencias: number;
  estudosEnumeraveis: number;
  temEia: boolean;
  temRima: boolean;
  ultimaPublicacao: string | null;
  linkEstudos: string | null;
  linkFonteOficial: string | null;
}

export interface CruzamentosDoMunicipio {
  linhas: LinhaCruzamento[];
  territoriosPresentes: TerritorioPresente[];
  barragensNoMunicipio: BarragemNoMunicipio[];
  licenciamentoMunicipal: LicenciamentoMunicipal | null;
  /** Cada ausência medida, com o número que dá peso ao zero/vazio. */
  lacunas: string[];
}

interface PropsTerritorioBruto {
  nome: string | null;
  municipio_nome?: string | null;
  etnia_nome?: string | null;
  fase_ti?: string | null;
  fase_quilombola?: string | null;
  area_ha?: number | null;
}

/** Área total das interseções de um conjunto de linhas (para os cartões). */
export function areaTotalHa(linhas: Pick<LinhaCruzamento, "areaIntersecaoHa">[]): number {
  return linhas.reduce((s, l) => s + l.areaIntersecaoHa, 0);
}

export function carregarCruzamentosDoMunicipio(nomeCidade: string, geocodigo: string): CruzamentosDoMunicipio {
  const lacunas: string[] = [];

  // ── SIGMINE × territórios (interseção exata) ────────────────────────────
  const filtraSigmine = (fase: "operacao" | "interesse"): EntradaSigmine[] =>
    carregarAlertasSigmine(fase).itens
      .filter((a) => a.territorioMunicipios.some((m) => municipioNaLista(m, nomeCidade)))
      .map((a) => ({
        territorioTipo: a.territorioTipo,
        territorioNome: a.territorioNome,
        semNomeMotivo: a.semNomeMotivo,
        territorioMunicipios: a.territorioMunicipios,
        sigmineProcesso: a.sigmineProcesso,
        sigmineNome: a.sigmineNome,
        sigmineSubs: a.sigmineSubs,
        sigmineFase: a.sigmineFase,
        sigmineUso: a.sigmineUso,
        areaIntersecaoHa: a.areaIntersecaoHa,
        mapaCamada: a.mapa?.camada ?? null,
        mapaIdx: a.mapa?.idx ?? null,
      }));

  const operacao = filtraSigmine("operacao");
  const interesse = filtraSigmine("interesse");

  // ── Mancha de barragem × quilombolas (interseção exata) ────────────────
  const alertaQui = carregarAlertaQuilombolaMancha();
  const barragensQui: EntradaBarragemQuilombola[] = alertaQui.itens
    .filter((i) => i.territorioMunicipios.some((m) => municipioNaLista(m, nomeCidade)))
    .map((i) => ({
      territorioNome: i.territorioNome,
      territorioMunicipios: i.territorioMunicipios,
      territorioFase: i.territorioFase,
      barragem: i.barragem,
      empreendedor: i.empreendedor,
      municipioBarragem: i.municipioBarragem,
      statusPae: i.statusPae,
      areaIntersecaoHa: i.areaIntersecaoHa,
      mapaCamada: i.mapa?.camada ?? null,
      mapaIdx: i.mapa?.idx ?? null,
    }));
  lacunas.push(`TI × mancha de barragem: ${tiManchaVazioTexto()}`);

  // ── Territórios presentes no município (com ou sem sobreposição) ───────
  const territoriosPresentes: TerritorioPresente[] = [];

  for (const f of lerGeoJSON<PropsTerritorioBruto>("terras-indigenas.geojson").features) {
    if (!municipioNaLista(f.properties.municipio_nome, nomeCidade)) continue;
    territoriosPresentes.push({
      tipo: "terra_indigena",
      nome: f.properties.nome,
      etniaOuFase: f.properties.etnia_nome ?? null,
      fase: f.properties.fase_ti ?? null,
      areaHa: f.properties.area_ha ?? null,
      municipios: (f.properties.municipio_nome ?? "").split(",").filter(Boolean),
    });
  }
  for (const f of lerGeoJSON<PropsTerritorioBruto>("territorios-quilombolas.geojson").features) {
    if (!municipioNaLista(f.properties.municipio_nome, nomeCidade)) continue;
    territoriosPresentes.push({
      tipo: "quilombola",
      nome: f.properties.nome,
      etniaOuFase: null,
      fase: f.properties.fase_quilombola ?? null,
      areaHa: f.properties.area_ha ?? null,
      municipios: (f.properties.municipio_nome ?? "").split(",").filter(Boolean),
    });
  }

  // ── Barragens com mancha publicada NO município (co-ocorrência) ────────
  const mancha = lerGeoJSON<{
    estrutura: string;
    empreended: string;
    municipio: string;
    status_pae: string;
    status_erh: string;
  }>("mancha-inundacao-barragens.geojson.gz");
  const barragensNoMunicipio = mancha.features
    .filter((f) => municipioNaLista(f.properties.municipio, nomeCidade))
    .map((f) => ({
      estrutura: f.properties.estrutura,
      empreendedor: f.properties.empreended,
      statusPae: f.properties.status_pae,
      statusErh: f.properties.status_erh,
    }));
  lacunas.push(
    `${barragensNoMunicipio.length} barragens com mancha publicada em ${nomeCidade}; a camada cobre ${mancha.features.length} estruturas de MG — estrutura sem mancha publicada não foi testada contra território nenhum.`
  );

  // ── Licenciamento municipal (co-ocorrência por geocodigo) ──────────────
  let licenciamentoMunicipal: LicenciamentoMunicipal | null = null;
  const estudos = lerGeoJSON<{
    municipio: string;
    geocodigo: string;
    audiencias: number;
    estudos_enumeraveis: number;
    eia: number;
    rima: number;
    ultima_publicacao: string;
    link_estudos: string;
    link_fonte_oficial: string;
  }>("estudos-ambientais.geojson");
  const estudoCidade = estudos.features.find((f) => f.properties.geocodigo === geocodigo);
  if (estudoCidade) {
    const p = estudoCidade.properties;
    licenciamentoMunicipal = {
      municipio: p.municipio,
      audiencias: p.audiencias,
      estudosEnumeraveis: p.estudos_enumeraveis,
      temEia: p.eia > 0,
      temRima: p.rima > 0,
      ultimaPublicacao: p.ultima_publicacao || null,
      linkEstudos: p.link_estudos || null,
      linkFonteOficial: p.link_fonte_oficial || null,
    };
  } else {
    lacunas.push(
      "Licenciamento ambiental: nenhuma audiência/estudo registrado para este município na camada `estudos-ambientais` (SISEMA/FEAM)."
    );
  }

  const linhas = montarLinhasCruzamento(operacao, interesse, barragensQui);

  return { linhas, territoriosPresentes, barragensNoMunicipio, licenciamentoMunicipal, lacunas };
}

function tiManchaVazioTexto(): string {
  const vazio = carregarAlertaTiMancha();
  return vazio.vazio
    ? `nenhuma interseção encontrada — varredura completa de ${vazio.qtdTerritorios} territórios indígenas × ${vazio.qtdBarragensComManchaPublicada} manchas publicadas (${vazio.universoCombinacoes} combinações testadas). Zero medido, não ausência de checagem.`
    : `${vazio.qtdFeaturesEncontradas} interseções encontradas.`;
}
