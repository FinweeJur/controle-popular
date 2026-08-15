import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Leitura de `data/ultimo-build.json` para o painel de edição.
 *
 * ═══ O QUE ESTE ARQUIVO É ═══
 *
 * O vigia do `home-pc` grava aqui o resultado de cada build que ele atende
 * (`scripts/vigia-build.mts`): quando começou e terminou, se publicou, qual
 * commit foi buildado e, em falha, o erro. O vigia commita e dá push — é o
 * canal pelo qual quem pediu a publicação fica sabendo como terminou.
 *
 * Arquivo ausente é o estado normal de um clone que nunca viu um build
 * acontecer: o painel mostra "nenhum build registrado" em vez de estourar.
 * O painel NÃO escreve aqui — quem escreve é o vigia, na máquina de build.
 */

export interface UltimoBuild {
  /** `em` do pedido atendido, para o vigia saber que já rodou. */
  pedidoAtendido: string | null;
  /** ISO de quando o build começou. */
  comecouEm: string;
  /** ISO de quando o build terminou. */
  terminouEm: string;
  /** Código de saída da rotina; 0 = publicou. */
  codigoDeSaida: number;
  publicou: boolean;
  /** SHA do commit que foi buildado. */
  commitBuildado: string;
  erro?: string;
}

function arquivo(): string {
  return path.join(process.cwd(), "data", "ultimo-build.json");
}

/** Nunca lança: arquivo ausente ou corrompido devolve null. */
export function lerUltimoBuild(): UltimoBuild | null {
  try {
    const dados = JSON.parse(readFileSync(arquivo(), "utf-8")) as UltimoBuild;
    if (typeof dados.terminouEm !== "string") return null;
    return dados;
  } catch {
    return null;
  }
}