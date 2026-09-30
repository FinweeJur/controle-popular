/**
 * Carregador (server-only) do acervo de Destinações de Imóveis da União em MG.
 *
 * Papel no portal: ler `apps/web/data/destinacoes-uniao-mg.json` do disco e
 * entregar o acervo pronto para a página `/ambiental/autorizacoes`.
 *
 * Fonte oficial:
 * - SPU — Secretaria do Patrimônio da União, Painel de Transparência Ativa,
 *   aba "Imóveis da União", filtro UF=MG.
 *
 * ═══ POR QUE ESTE ARQUIVO EXISTE SEPARADO DE `autorizacoes.ts` ═══
 *
 * `autorizacoes.ts` é importado por um componente de CLIENTE
 * (`AutorizacoesClient.tsx`). Se o `node:fs` morasse lá, o webpack tentaria
 * empacotar `node:fs` no bundle do navegador e o build FALHARIA. Medido em
 * 29/09/2026: `UnhandledSchemeError: Reading from "node:path" is not handled
 * by plugins`, apontando `lib/ambiental/autorizacoes.ts` → `AutorizacoesClient`.
 * Por isso o disco fica aqui e o cliente importa só tipos e funções puras.
 *
 * Decisão técnica:
 * - Leitura síncrona com dois candidatos de `cwd` (`apps/web` no build/vitest,
 *   a raiz do monorepo nos scripts). Sem arquivo acessível, devolve acervo
 *   vazio com metadados neutros — nunca dado fabricado.
 */

import fs from "node:fs";
import path from "node:path";
import type {
  AcervoDestinacoesUniao,
  MetadadosDestinacoesUniao,
} from "./autorizacoes";

const ARQUIVO_DADOS = "destinacoes-uniao-mg.json";

/** Metadados neutros para ambiente sem acesso ao arquivo (nunca inventa números). */
const METADADOS_VAZIOS: MetadadosDestinacoesUniao = {
  titulo: "Destinações de Imóveis da União em Minas Gerais",
  fonte: "SPU - Painel de Transparência Ativa",
  fonteUrl:
    "https://qlik-publico.paineis.gov.br/extensions/transparencia-ativa/transparencia-ativa.html",
  dataAcessoFonte: "",
  geradoEm: "",
  dataReferencia: "",
  total: 0,
  totalMunicipios: 0,
  porDestinacao: {},
  ressalva:
    "Cadastro de imóveis da União em MG com o regime/destinação de cada um. Não é a relação nominal de TAUS/CDRU.",
};

/**
 * Resolve o caminho do JSON tolerando dois `cwd`: `apps/web` (build/vitest) e a
 * raiz do monorepo. Mesmo padrão de `lib/ambiental/licencas-unificada.ts`.
 */
function resolverCaminhoDados(): string | null {
  const candidatos = [
    path.resolve(process.cwd(), "data", ARQUIVO_DADOS),
    path.resolve(process.cwd(), "apps", "web", "data", ARQUIVO_DADOS),
  ];
  for (const caminho of candidatos) {
    if (fs.existsSync(caminho)) return caminho;
  }
  return null;
}

/**
 * Carrega o acervo real de destinações de imóveis da União em MG.
 *
 * Retorna `{ metadados, imoveis }`. Sem arquivo acessível devolve acervo vazio
 * com metadados neutros — nunca dado fabricado.
 */
export function carregarDestinacoesUniaoMg(): AcervoDestinacoesUniao {
  try {
    const caminho = resolverCaminhoDados();
    if (caminho) {
      const conteudo = fs.readFileSync(caminho, "utf-8");
      const bruto = JSON.parse(conteudo) as Partial<AcervoDestinacoesUniao>;
      return {
        metadados: bruto.metadados ?? METADADOS_VAZIOS,
        imoveis: Array.isArray(bruto.imoveis) ? bruto.imoveis : [],
      };
    }
  } catch {
    // Fallback silencioso: ambiente sem acesso a disco.
  }
  return { metadados: METADADOS_VAZIOS, imoveis: [] };
}
