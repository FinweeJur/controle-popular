/**
 * gerar-proveniencia-globo.mjs — monta o manifesto "de onde vêm estes dados"
 * do globo 3D, a partir do que o portal DE FATO publica.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE ═══
 *
 * `js/ui/proveniencia.js` busca `/terras/globo/dados/proveniencia.json` e
 * monta com ele o bloco recolhível que aparece na ficha de toda área e na
 * vista de perto. Esse arquivo NUNCA foi publicado: o manifesto original era
 * gerado por `pipeline/proveniencia.py`, no repositório `terras-devolutas`,
 * cuja saída nunca veio junto com as camadas. O fetch dava 404 e a ficha
 * exibia "HTTP 404" no lugar da lista de fontes — num portal cuja tese é
 * procedência de dado.
 *
 * E o dano não parava na ficha: `ui/statusbar.js` lê `gerado_em_utc` deste
 * mesmo manifesto para escrever o selo "dados de …". Sem manifesto, o selo
 * caía para sempre na constante `DADOS_DE` de `js/config.js` e afirmava
 * "dados de 28/07/2026" com confiança sobre camadas reexportadas depois — que
 * é exatamente a falha que o comentário daquela constante registra já ter
 * acontecido uma vez.
 *
 * ═══ POR QUE NÃO CHAMAR O PIPELINE ORIGINAL ═══
 *
 * `pipeline/proveniencia.py` descreve as ENTRADAS do pipeline (os shapefiles
 * do Acervo Fundiário do INCRA, o WFS do CAR, os rasters do MapBiomas) e
 * precisa dos arquivos brutos em disco para medir SHA e contagem. Esses
 * arquivos estão atrás de conta gov.br e nunca foram versionados — o pipeline
 * não roda nesta máquina nem no CI do portal, e não deveria mesmo.
 *
 * Este gerador responde a outra pergunta, que é a que a pessoa na ficha está
 * fazendo: **de onde veio a camada que estou olhando agora**. Ele mede o
 * arquivo publicado (quantas áreas, quando foi gerado, que impressão digital
 * tem) e junta a isso a origem declarada de cada camada. Roda com Node puro,
 * sem dependência nenhuma, contra os arquivos que estão no repositório.
 *
 * ═══ A REGRA DAS ORIGENS ═══
 *
 * Nada em `ORIGENS` é invenção deste arquivo. Cada linha é a fonte que a
 * própria camada já declara — no `hint` e no `aviso` do LAYER_REGISTRY
 * (`js/config.js`), na tabela "De onde vem cada dado" do README e no bloco
 * homônimo de `app/funcaosocialterra/page.tsx`. Camada nova sem entrada aqui
 * entra no manifesto marcada como origem não declarada, e não some: sumir
 * seria a versão silenciosa do mesmo 404.
 *
 * Uso:
 *   node scripts/gerar-proveniencia-globo.mjs
 *   node scripts/gerar-proveniencia-globo.mjs --conferir   (não escreve; sai 1 se desatualizado)
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const GLOBO = path.join(AQUI, '..', 'public', 'terras', 'globo');
const DIR_CAMADAS = path.join(GLOBO, 'dados', 'camadas');
const SAIDA = path.join(GLOBO, 'dados', 'proveniencia.json');

/**
 * Origem declarada de cada camada.
 *
 * `obtencao` segue o vocabulário do manifesto original:
 *   'automatica'  — serviço aberto, coletado por script
 *   'manual'      — download por portal (às vezes autenticado)
 *   'derivada'    — calculada aqui a partir de outras camadas
 *   'propria'     — produzida pelo próprio projeto
 */
const ORIGENS = {
  'municipios-mg': {
    obtencao: 'automatica',
    servico: 'Malha municipal do IBGE',
  },
  'vazio-cadastral-bacia': {
    obtencao: 'derivada',
    origem: 'CAR/SICAR menos as exclusões do IDE-Sisema, sobre a malha do IBGE',
  },
  'vazio-cadastral': {
    obtencao: 'derivada',
    origem: 'CAR/SICAR menos as exclusões do IDE-Sisema, sobre a malha do IBGE',
  },
  'vazio-cadastral-vales': {
    obtencao: 'derivada',
    origem: 'CAR/SICAR menos as exclusões do IDE-Sisema, sobre a malha do IBGE',
  },
  'terra-publica-certificada': {
    obtencao: 'manual',
    origem: 'INCRA — SIGEF e SNCI Público, pelo Acervo Fundiário',
    portal: 'https://acervofundiario.incra.gov.br/ (requer conta gov.br)',
  },
  'terra-publica-certificada-vales': {
    obtencao: 'manual',
    origem: 'INCRA — SIGEF e SNCI Público, pelo Acervo Fundiário',
    portal: 'https://acervofundiario.incra.gov.br/ (requer conta gov.br)',
  },
  assentamentos: {
    obtencao: 'manual',
    origem: 'INCRA — Projetos de Assentamento, pelo Acervo Fundiário',
    portal: 'https://acervofundiario.incra.gov.br/ (requer conta gov.br)',
  },
  'assentamentos-vales': {
    obtencao: 'manual',
    origem: 'INCRA — Projetos de Assentamento, pelo Acervo Fundiário',
    portal: 'https://acervofundiario.incra.gov.br/ (requer conta gov.br)',
  },
  'territorios-quilombolas': {
    obtencao: 'manual',
    origem: 'INCRA — Áreas de Quilombolas, pelo Acervo Fundiário',
    portal: 'https://acervofundiario.incra.gov.br/ (requer conta gov.br)',
  },
  // Terceira fonte, NOVA em 13/08/2026 (mais tarde) — os 13 territórios do
  // INCRA que não entram nas duas fontes acima (ver
  // scripts/ingerir_incra_quilombolas.py, seção "OS 13 QUE SOBRAVAM AGORA
  // ENTRAM"). Mesmo serviço (WFS i3Geo do Acervo Fundiário, camada
  // `quilombolas_mg`, GML), mesma licença ("vedado o uso comercial",
  // conferida no `AccessConstraints` do `GetCapabilities`).
  'spu-imoveis-uniao': {
    obtencao: 'manual',
    origem: 'SPU — cadastro de imóveis da União (só o ponto, nunca o perímetro)',
  },
  'spu-imoveis-uniao-vales': {
    obtencao: 'manual',
    origem: 'SPU — cadastro de imóveis da União (só o ponto, nunca o perímetro)',
  },
  'embargos-ambientais-vales': {
    obtencao: 'automatica',
    servico: 'IDE-Sisema (Semad-MG) — áreas embargadas por infração ambiental',
  },
  'lotes-vagos-bh': {
    obtencao: 'automatica',
    servico: 'Prefeitura de Belo Horizonte — cadastro do IPTU, classe "LOTE VAGO"',
  },
  'normas-geolocalizadas': {
    obtencao: 'derivada',
    origem:
      'Acervo normativo das cidades do portal, com o lugar extraído da ementa '
      + 'e geocodificado pelo Nominatim (nunca do PDF ou do texto completo)',
  },
  'checagem-g0': {
    obtencao: 'propria',
    origem:
      'Amostra sorteada e conferida a olho sobre imagem de satélite, para medir '
      + 'quanto o método erra',
  },
  'devolutas-arrecadadas': {
    obtencao: 'automatica',
    servico: 'INCRA — base não publicada; a camada existe vazia para registrar a lacuna',
  },
  'pesquisa-noticias': {
    obtencao: 'propria',
    origem: 'Levantamento em imprensa — ainda não coletado',
  },
  // Território indígena, mineração e barragens (13/08/2026) — ver
  // docs/FONTES-TERRITORIO-E-MINERACAO.md.
  'zas-barragens': {
    obtencao: 'automatica',
    servico: 'FEAM/IDE-Sisema — Zona de Autossalvamento (ide_1903_mg_zas_pae_pol), geometria do Estudo de Ruptura Hipotética de Barragem, simplificada para desenho',
  },
  'mancha-inundacao-barragens': {
    obtencao: 'automatica',
    servico: 'FEAM/IDE-Sisema — mancha de inundação (ide_1903_mg_mancha_inundacao_pae_pol), mesma origem da ZAS, simplificada para desenho',
  },
  'terras-indigenas': {
    obtencao: 'automatica',
    servico: 'FUNAI — WFS oficial (Funai:tis_poligonais), todas as fases de demarcação',
  },
  'alerta-ti-mancha': {
    obtencao: 'derivada',
    origem: 'Interseção geométrica real (shapely, não bbox) entre terras-indigenas e a geometria completa (não simplificada) da mancha de inundação',
  },
  // As três derivadas que faltavam declarar origem — o script avisava
  // "origem não declarada" para elas, e camada sem procedência num portal
  // de transparência é o defeito que este manifesto existe para impedir.
  'alerta-quilombola-mancha': {
    obtencao: 'derivada',
    origem: 'Mesma interseção geométrica real de alerta-ti-mancha, aplicada aos territórios quilombolas do INCRA. Resultado medido: zero — nenhum território publicado cai dentro de mancha publicada',
  },
  'alerta-territorio-sigmine-operacao': {
    obtencao: 'derivada',
    origem: 'Interseção geométrica real entre territórios (terras indígenas da FUNAI + quilombolas do INCRA) e as poligonais do SIGMINE em fase que AUTORIZA extrair. É sobreposição consumada, não risco futuro',
  },
  'alerta-territorio-sigmine-interesse': {
    obtencao: 'derivada',
    origem: 'Mesma interseção, contra as poligonais do SIGMINE em fase de requerimento ou pesquisa. É processo protocolado sobre território, não lavra — mantida em camada separada de propósito',
  },
  // O raio de 8 km da Portaria Interministerial 60/2015 (14/08/2026) — ver
  // docs/HANDOFF-ALERTA-RAIO-8KM.md. É o primeiro alerta do projeto que mede
  // PROXIMIDADE e não sobreposição: a faixa de restrição vem PRONTA do
  // IDE-Sisema (não é buffer calculado aqui) e o cruzamento é com o SIGMINE,
  // nunca com barragem — para barragem, o círculo superestima a ZAS real de
  // 14× a 127×, medido em docs/FONTES-TERRITORIO-E-MINERACAO.md §3.
  'alerta-raio-territorio-sigmine-operacao': {
    obtencao: 'derivada',
    origem: 'Interseção geométrica real entre a faixa de restrição de 8 km que o IDE-Sisema publica em volta de terra indígena e de território quilombola (Portaria Interministerial 60/2015, Anexo I — empreendimento pontual, que inclui mineração) e as poligonais do SIGMINE em fase que AUTORIZA extrair. Mede proximidade, não sobreposição',
  },
  'alerta-raio-territorio-sigmine-interesse': {
    obtencao: 'derivada',
    origem: 'Mesma faixa de 8 km, contra as poligonais do SIGMINE em fase de requerimento, pesquisa ou disponibilidade. Papel protocolado perto do território — nem extração nem sobreposição; mantida em camada separada de propósito',
  },
  'atos-area-protegida-municipios': {
    obtencao: 'derivada',
    origem: 'Normas de atos_oficiais cuja ementa indica criação, alteração, redução ou extinção de área protegida, com cada ementa lida e classificada à mão antes de entrar',
  },
  'sigmine-operacao': {
    obtencao: 'automatica',
    servico: 'ANM/SIGMINE — processos minerários de MG, só as fases que autorizam extrair (Concessão de Lavra, Licenciamento, Lavra Garimpeira, Registro de Extração)',
  },
  'sigmine-interesse': {
    obtencao: 'automatica',
    servico: 'ANM/SIGMINE — processos minerários de MG nas demais fases (requerimento, pesquisa, disponibilidade): processo protocolado, não mina',
  },
  // Dinheiro público e mineração (13/08/2026) — ver
  // docs/HANDOFF-CAMADA-DINHEIRO.md e docs/FONTES-FLUXO-FINANCEIRO.md.
  'cfem-municipios': {
    obtencao: 'automatica',
    servico: 'ANM — CFEM (Compensação Financeira pela Exploração Mineral) arrecadada em 2024, por município',
  },
  'cruzamento-dinheiro-ambiental-4cidades': {
    obtencao: 'derivada',
    origem: 'IDE-Sisema/SEMAD (licenciamento ambiental) cruzado com PNCP (contratos) e Portal da Transparência (convênios federais), por raiz de CNPJ, só nos 4 municípios com dado de contrato/convênio coletado',
  },
  // O rompimento real da B1, Brumadinho (13/08/2026, mais tarde) — ver
  // docs/PLANO-INTEGRACAO-BRUMADINHO.md, seção 1.2. Mesmo geoserver de
  // `zas-barragens`/`mancha-inundacao-barragens`, série `ide_250102_mg_*`.
  // Licença "acesso livre" conferida no GeoNetwork da Semad camada a camada
  // só para `impactos_ambientais_pol` e `remanejamento_pto`; presumida (não
  // confirmada individualmente) para as outras 6 da mesma série/publicador.
  'brumadinho-area-atingida': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — área diretamente afetada pelo rompimento (ide_250102_mg_impactos_ambientais_pol), mapeada por satélite Pleiades a 1:2.500 — licença conferida individualmente',
  },
  'brumadinho-monitoramento': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — pontos de monitoramento ambiental pós-rompimento (ide_250102_mg_monitoramento_pto) — licença presumida da série, não conferida individualmente',
  },
  'brumadinho-remanejamento': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — origem de famílias remanejadas, agregada por bairro (ide_250102_mg_remanejamento_pto) — licença conferida individualmente',
  },
  'brumadinho-estruturas-contencao': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — estruturas de contenção de rejeito pós-rompimento (ide_250102_mg_estruturas_contecao_pol) — licença presumida da série, não conferida individualmente',
  },
  'brumadinho-obras-poligonais': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — obras e intervenções emergenciais com área (ide_250102_mg_obras_intervencoes_poligonais_pol) — licença presumida da série, não conferida individualmente',
  },
  'brumadinho-obras-pontuais': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — obras e intervenções emergenciais pontuais (ide_250102_mg_obras_intervencoes_pontuais_pto) — licença presumida da série, não conferida individualmente',
  },
  'brumadinho-obras-lineares': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — obras e intervenções emergenciais lineares (ide_250102_mg_obras_intervencoes_lineares_lin) — licença presumida da série, não conferida individualmente',
  },
  'brumadinho-restauracao': {
    obtencao: 'automatica',
    servico: 'Semad/IDE-Sisema — áreas de revegetação/restauração pós-rompimento (ide_250102_mg_restauracao_pol) — licença presumida da série, não conferida individualmente',
  },
  // Documentos do processo judicial da reparação, agregados por município
  // (15/08/2026) — ver docs/CAMADA-DOCUMENTOS-PROCESSO-MUNICIPIO.md.
  // `derivada`, não `automatica`, de propósito: o script NÃO chama o Solr da
  // UFMG — ele conta o que o portal JÁ PUBLICA em /paraopeba/documentos
  // (apps/web/lib/paraopeba/documentos.ts, já passado pela triagem de dado
  // pessoal de lib/paraopeba/triagem.ts). A camada leva contagem por tipo e
  // por processo; resumo, título e id de documento ficam fora do GeoJSON.
  'documentos-processo-municipios': {
    obtencao: 'derivada',
    origem: 'Contagem, sobre a malha municipal do IBGE, dos 471 documentos do processo de Brumadinho já publicados em /paraopeba/documentos que CITAM cada município (campo de local da Plataforma Brumadinho UFMG) — 6,6% do acervo de 7.107 documentos, e só contagem: nenhum resumo entra no mapa',
  },
  // SIRENEJud (CNJ) — 30/08/2026. O `cod_ibge` do arquivo da fonte NÃO é o
  // código IBGE (é o código da comarca do órgão julgador); o IBGE real foi
  // casado por nome normalizado contra a malha municipal — ver a docstring
  // de etl/betim/etl/apis/sirenejud_cnj.py.
  'processos-ambientais-cnj': {
    obtencao: 'automatica',
    servico: 'SIRENEJud — CNJ/CNMP, arquivo em massa (parquet no S3 público do CNJ), agregado por comarca do órgão julgador e casado com a malha municipal do IBGE; só contagens, nomes de partes descartados na coleta',
  },
};

/**
 * O aviso e a lacuna que o bloco exibe em destaque.
 *
 * Não é enfeite: `blocoProveniencia()` renderiza `aviso` no topo e
 * `lacuna_principal` no rodapé, e a lacuna é a informação que este projeto
 * mais insiste em não deixar implícita.
 */
const AVISO =
  'Cada camada é uma foto da data em que foi gerada — nada aqui é ao vivo. '
  + 'O contorno das áreas derivadas é calculado por subtração de camadas '
  + 'públicas, não levantado em campo.';

const LACUNA_PRINCIPAL =
  'Não existe base aberta de terra devoluta reconhecida, nem camada de terras '
  + 'do Estado de Minas. Por isso o mapa mostra terra SEM CADASTRO, que é outra '
  + 'coisa: ausência de declaração no CAR não é ausência de dono.';

/**
 * Feições e impressão digital de um arquivo de camada.
 *
 * ⟲ 13/08/2026 — passou a aceitar `.geojson.gz` (três camadas saíram do
 * repositório em versão crua — teto de 25 MiB do Workers Static Assets, ver
 * scripts/comprimir-camadas-grandes.mjs). `bytes`/`sha256` continuam medindo
 * o arquivo QUE O NAVEGADOR BAIXA (o `.gz`, menor — é o que importa para
 * quem está pensando em teto de deploy e custo de rede), e `feicoes` precisa
 * descomprimir primeiro: contar direto no `.gz` cru daria a contagem de
 * bytes comprimidos, não de feições.
 */
function medir(arquivo) {
  const caminho = path.join(DIR_CAMADAS, arquivo);
  const bruto = readFileSync(caminho);
  const comprimido = arquivo.endsWith('.gz');
  let feicoes = null;
  try {
    const texto = (comprimido ? gunzipSync(bruto) : bruto).toString('utf8');
    const fc = JSON.parse(texto);
    feicoes = Array.isArray(fc.features) ? fc.features.length : null;
  } catch {
    // Arquivo ilegível (ou .gz corrompido) entra no manifesto sem contagem,
    // e não fora dele.
    feicoes = null;
  }
  return {
    feicoes,
    bytes: bruto.length,
    comprimido,
    sha256: createHash('sha256').update(bruto).digest('hex'),
    mtime_utc: statSync(caminho).mtime.toISOString(),
  };
}

function gerar() {
  // `.geojson.gz` ANTES de `.geojson` na ordenação não importa aqui — o que
  // importa é que os dois casam com o mesmo `id` (tira as duas extensões) e
  // nenhum arquivo é ignorado. Hoje nenhuma camada tem as duas versões ao
  // mesmo tempo (ver a nota de `comprimida` em js/config.js: o cru saiu do
  // repo nas três que ganharam `.gz`), mas se algum dia tiver, o `.gz` vence
  // — é o que o navegador de fato baixa.
  const arquivos = readdirSync(DIR_CAMADAS)
    .filter((f) => f.endsWith('.geojson') || f.endsWith('.geojson.gz'))
    .sort();

  const porId = new Map();
  for (const arquivo of arquivos) {
    const id = arquivo.replace(/\.geojson(\.gz)?$/, '');
    if (arquivo.endsWith('.gz') || !porId.has(id)) porId.set(id, arquivo);
  }

  const fontes = [...porId.entries()].map(([id, arquivo]) => {
    const declarada = ORIGENS[id];
    return {
      camada: id,
      ...medir(arquivo),
      ...(declarada ?? {
        obtencao: 'nao_declarada',
        origem: 'origem não declarada — acrescente esta camada a ORIGENS em scripts/gerar-proveniencia-globo.mjs',
      }),
    };
  });

  // O manifesto original separa automáticas de manuais, e `blocoProveniencia()`
  // concatena as duas listas nessa ordem. Mantido: o que é coletado sozinho e
  // o que dependeu de alguém baixar à mão têm confiabilidade de atualização
  // diferente, e quem lê tem direito de saber qual é qual.
  const automaticas = fontes.filter((f) => f.obtencao !== 'manual');
  const manuais = fontes.filter((f) => f.obtencao === 'manual');

  // A data do manifesto é a da camada MAIS RECENTE, não a de hoje: o selo
  // "dados de …" da statusbar fala sobre os dados, não sobre quando alguém
  // rodou este script. Rodar o gerador sem reexportar camada nenhuma não pode
  // rejuvenescer o acervo.
  const maisRecente = fontes
    .map((f) => f.mtime_utc)
    .sort()
    .at(-1) ?? new Date().toISOString();

  return {
    gerado_em_utc: maisRecente,
    aviso: AVISO,
    fontes_automaticas: automaticas,
    fontes_manuais: manuais,
    lacuna_principal: LACUNA_PRINCIPAL,
    camadas_sem_origem_declarada: fontes
      .filter((f) => f.obtencao === 'nao_declarada')
      .map((f) => f.camada),
  };
}

const dados = gerar();
const texto = `${JSON.stringify(dados, null, 2)}\n`;

if (process.argv.includes('--conferir')) {
  let atual = null;
  try {
    atual = readFileSync(SAIDA, 'utf8');
  } catch {
    atual = null;
  }
  if (atual !== texto) {
    console.error('✗ proveniencia.json está desatualizado — rode `node scripts/gerar-proveniencia-globo.mjs`');
    process.exit(1);
  }
  console.log('✓ proveniencia.json em dia');
} else {
  writeFileSync(SAIDA, texto, 'utf8');
  const n = dados.fontes_automaticas.length + dados.fontes_manuais.length;
  console.log(`✓ ${path.relative(process.cwd(), SAIDA)} — ${n} camadas, dados de ${dados.gerado_em_utc.slice(0, 10)}`);
  for (const c of dados.camadas_sem_origem_declarada) {
    console.log(`  ⚠ ${c} — origem não declarada`);
  }
}
