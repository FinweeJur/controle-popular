/**
 * scripts/coletar-terras-indigenas.mts — coletor da camada WFS da FUNAI.
 *
 * PAPEL NO PORTAL: renova `terras-indigenas.geojson` (globo 3D, eixo
 * Terra e Território) direto do GeoServer oficial da FUNAI. A camada era
 * SNAPSHOT MANUAL (dump de 08/09/2026, sem writer): agora nasce com
 * `geradoEm` carimbado na escrita bem-sucedida, e o vigia de coletores
 * passa a cobrar frescor dela como de qualquer outra fonte.
 *
 * FONTE OFICIAL: https://geoserver.funai.gov.br/geoserver/ows — camada
 * `Funai:tis_poligonais` (Terras Indígenas poligonais), confirmada no
 * GetCapabilities em 15/10/2026. Formato GeoJSON via WFS 1.1.0, com
 * paginação por count/startIndex porque o GeoServer trava maxFeatures.
 *
 * REGRAS DA CASA: User-Agent honesto (nome do projeto), pausa de cortesia
 * entre páginas (≥1 s), zero dado pessoal, e a data de coleta viaja dentro
 * do próprio arquivo (membro estranho `geradoEm`, aceito pela spec
 * GeoJSON). Falhou a página? Aborta ANTES de escrever — nunca publica
 * meia camada com carimbo de completa.
 *
 * POR QUE curl.exe + RETORNO E NAO fetch: medido 15/10/2026 — o handshake
 * TLS do GeoServer da FUNAI passa de 10 s e o fetch do Node aborta a
 * conexao (UND_ERR_CONNECT_TIMEOUT) enquanto curl completa. Alem disso o
 * servico e INTERMITENTE na renderizacao do polygonal inteiro: a mesma
 * query cai com excecao XML (NoApplicableCode, timeout do servidor) e
 * passa 30 s depois. O coletor entao tenta ate 5 vezes, espera o dobro a
 * cada falha e so escreve o arquivo quando a contagem bate inteira —
 * nunca publica meia camada com carimbo de completa. (O parametro `count`
 * e ignorado pelo servidor: a pagina vem inteira mesmo com count=3,
 * medido hoje — por isso a coleta e single-shot com retry, nao paginada.)
 *
 * Uso: npx tsx scripts/coletar-terras-indigenas.mts
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = path.join(RAIZ, "apps/web/public/terras/globo/dados/camadas/terras-indigenas.geojson");
const URL_CAMADA =
  "https://geoserver.funai.gov.br/geoserver/ows?service=WFS&version=1.1.0&request=GetFeature" +
  "&typeName=Funai%3Atis_poligonais&outputFormat=application%2Fjson";
const AGENTE = "ControlePopular/1.0 (portal civico; coleta de dados abertos)";
// 8 tentativas com espera crescente (15s, 30s... 2 min): medido 15/10/2026,
// o GeoServer da FUNAI cai com timeout de render em rajadas curtas e
// responde pouco depois — a insistência barata é o collector sobreviver.
const TENTATIVAS = 8;

/** Busca a camada inteira; lanca em XML/HTML de erro ou JSON truncado. */
function buscarCamada(tentativa: number): any {
  const buf = execFileSync("curl.exe", ["-sS", "--max-time", "900", "-A", AGENTE, URL_CAMADA], {
    maxBuffer: 128 * 1024 * 1024,
  });
  const texto = buf.toString("utf8");
  if (texto.startsWith("<")) {
    throw new Error(`servidor devolveu XML/HTML na tentativa ${tentativa} (render timeout comum aqui)`);
  }
  const json = JSON.parse(texto);
  if (!Array.isArray(json.features)) throw new Error(`tentativa ${tentativa}: sem array de features`);
  const total = Number(json.numberMatched ?? json.totalFeatures ?? json.features.length);
  if (json.features.length !== total) {
    throw new Error(`tentativa ${tentativa}: ${json.features.length} de ${total} feicoes — pagina truncada`);
  }
  return json;
}

async function main(): Promise<void> {
  let bruto: any = null;
  for (let tentativa = 1; tentativa <= TENTATIVAS && !bruto; tentativa++) {
    try {
      bruto = buscarCamada(tentativa);
    } catch (e) {
      const espera = 15_000 * tentativa;
      console.log(`tentativa ${tentativa}/${TENTATIVAS} falhou (${(e as Error).message}); aguardando ${espera / 1000}s`);
      if (tentativa < TENTATIVAS) await new Promise((r) => setTimeout(r, espera));
    }
  }
  if (!bruto) throw new Error(`${TENTATIVAS} tentativas sem resposta integra — arquivo antigo mantido`);
  const camada = {
    type: "FeatureCollection",
    // Membro estranho permitido pela spec GeoJSON: a data da escrita
    // bem-sucedida. O vigia (scripts/vigia-coletores.mts) le este campo.
    geradoEm: new Date().toISOString(),
    name: "Funai:tis_poligonais",
    totalFeatures: bruto.features.length,
    crs: bruto.crs ?? undefined,
    features: bruto.features,
  };
  fs.writeFileSync(DESTINO, JSON.stringify(camada) + "\n", "utf8");
  console.log(`OK: ${camada.totalFeatures} feicoes de Terras Indigenas gravadas em ${path.relative(RAIZ, DESTINO)} (${camada.geradoEm})`);
}

main().catch((e) => {
  console.error(`FALHOU a coleta de terras-indigenas: ${(e as Error).message}`);
  process.exit(1);
});
