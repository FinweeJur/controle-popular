import { readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Mede o maior asset gerado pelo build e diz se ele passa no teto da Cloudflare.
 *
 * ═══ POR QUE ISTO EXISTE (incidente de 15/08/2026) ═══
 *
 * O deploy do dia morreu com:
 *
 *     Error: Asset too large. Cloudflare Workers supports assets with sizes of
 *     up to 25 MiB. We found a file .../ambiental/legislacao.cache with a size
 *     of 35.5 MiB.
 *
 * A causa está medida em `docs/HANDOFF-PAYLOAD-LEGISLACAO.md`: a rota entregava
 * todas as normas como props de um componente de cliente, e o payload foi
 * serializado **duas vezes** (HTML e RSC flight), com o nome de cada campo
 * repetido em cada linha. O texto real das 15.318 ementas dá **4,7 MiB**; o
 * `.cache` saiu com **35,5 MiB** — inflação de **7,5×**.
 *
 * O problema não é a rota que estourou: é que o estouro só aparece no
 * `cf:deploy`, ou seja **depois** de gastar 6 a 7 minutos de build. É
 * exatamente a falha que `scripts/preflight-deploy.mts` existe para evitar —
 * "nada que o job precise no fim pode ser descoberto no fim" — só que aquele
 * roda ANTES do build e não tem como medir um arquivo que ainda não existe.
 * Esta medição é a metade que faltava, e roda entre o build e o deploy.
 *
 * ═══ POR QUE O LIMITE AQUI É 20 MiB, E NÃO 25 ═══
 *
 * 25 MiB é o teto da Cloudflare. Parar em 25 seria avisar no dia em que já é
 * tarde. Medido no mesmo build de 15/08, com o dado de hoje:
 *
 *     36 MiB  ambiental/legislacao.cache      ← estourou
 *     21 MiB  sp/educacao.cache               ← ninguém mexeu, e já está a 4 MiB
 *     11 MiB  bh/camara/legislacao.cache
 *     9,5 MiB diamantina/camara/legislacao.cache
 *
 * `sp/educacao` cobra a conta sozinho na próxima ingestão. A margem de 5 MiB é
 * o espaço para o dado crescer entre dois deploys sem transformar o
 * crescimento normal do acervo em incidente.
 */

/** Teto real da Cloudflare Workers para um único asset. */
export const TETO_CLOUDFLARE_MIB = 25;

/** Onde este projeto para, para ter margem. Ver o cabeçalho. */
export const LIMITE_AVISO_MIB = 20;

const MIB = 1024 * 1024;

export interface AssetMedido {
  /** Caminho relativo ao diretório de assets, com barras normais. */
  caminho: string;
  bytes: number;
  mib: number;
}

export interface ResultadoTamanho {
  /** Os maiores primeiro. Vazio quando o diretório não existe. */
  maiores: AssetMedido[];
  /** `null` quando não há asset nenhum — o chamador decide se isso é erro. */
  maior: AssetMedido | null;
  /** Acima do teto da Cloudflare: o deploy VAI falhar. */
  estoura: AssetMedido[];
  /** Entre o limite de aviso e o teto: ainda passa, mas é o próximo a estourar. */
  emRisco: AssetMedido[];
  /** `true` quando nada passou do limite de aviso. */
  ok: boolean;
}

function varrer(dir: string, raiz: string, achados: AssetMedido[]): void {
  let entradas;
  try {
    entradas = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entradas) {
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) {
      varrer(completo, raiz, achados);
      continue;
    }
    let bytes: number;
    try {
      bytes = statSync(completo).size;
    } catch {
      continue;
    }
    achados.push({
      caminho: path.relative(raiz, completo).replace(/\\/g, "/"),
      bytes,
      mib: bytes / MIB,
    });
  }
}

/**
 * Varre o diretório de assets do build e classifica pelos dois limites.
 *
 * Não decide nada e não escreve em lugar nenhum: devolve a medida para quem
 * chamou abortar (ou não). Assim a mesma função serve à rotina de deploy e a
 * um teste, sem precisar de um build de verdade.
 */
export function medirAssets(
  dirAssets: string,
  limiteAvisoMib = LIMITE_AVISO_MIB,
  tetoMib = TETO_CLOUDFLARE_MIB
): ResultadoTamanho {
  const achados: AssetMedido[] = [];
  varrer(dirAssets, dirAssets, achados);
  achados.sort((a, b) => b.bytes - a.bytes);

  const estoura = achados.filter((a) => a.mib > tetoMib);
  const emRisco = achados.filter((a) => a.mib > limiteAvisoMib && a.mib <= tetoMib);

  return {
    maiores: achados.slice(0, 10),
    maior: achados[0] ?? null,
    estoura,
    emRisco,
    ok: estoura.length === 0 && emRisco.length === 0,
  };
}

/**
 * A mensagem que a rotina imprime. Separada da medição porque texto de
 * incidente é o que alguém vai ler às 6 da manhã com o deploy vermelho — e
 * precisa dizer o que fazer, não só o que houve.
 */
export function explicar(r: ResultadoTamanho): string {
  if (r.estoura.length > 0) {
    const lista = r.estoura.map((a) => `  ${a.mib.toFixed(1)} MiB  ${a.caminho}`).join("\n");
    return (
      `${r.estoura.length} asset(s) acima do teto de ${TETO_CLOUDFLARE_MIB} MiB da Cloudflare — ` +
      `o deploy VAI falhar:\n${lista}\n` +
      `Causa quase certa: a rota entrega uma coleção inteira como props de componente ` +
      `de cliente, e o payload vai serializado duas vezes. Ver docs/HANDOFF-PAYLOAD-LEGISLACAO.md.`
    );
  }
  if (r.emRisco.length > 0) {
    const lista = r.emRisco.map((a) => `  ${a.mib.toFixed(1)} MiB  ${a.caminho}`).join("\n");
    return (
      `${r.emRisco.length} asset(s) acima de ${LIMITE_AVISO_MIB} MiB e abaixo do teto de ` +
      `${TETO_CLOUDFLARE_MIB} MiB. Ainda publica, mas é o próximo a estourar sozinho na ` +
      `ingestão seguinte:\n${lista}`
    );
  }
  const maior = r.maior;
  return maior
    ? `maior asset: ${maior.mib.toFixed(1)} MiB (${maior.caminho}) — folga de ${(TETO_CLOUDFLARE_MIB - maior.mib).toFixed(1)} MiB`
    : "nenhum asset encontrado para medir";
}
