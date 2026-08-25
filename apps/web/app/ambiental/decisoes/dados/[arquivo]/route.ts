import { NextResponse } from "next/server";
import { arquivosDoIndice, type ArquivoIndice } from "@/lib/estatico/emitir";
import {
  enxugarNegativa,
  type DecisaoLicenciamentoBruta,
  type DecisaoLicenciamentoNegativa,
} from "@/lib/ambiental/decisoes-licenciamento";
import { carregarJsonEtl } from "@/lib/server-only/json-etl";

/**
 * Índice estático fatiado das 9.554 negativas de licenciamento —
 * `manifesto.json` + `0.json`, `1.json`, `2.json`, consumidos por
 * `PainelDecisoes.tsx`. Mesmo mecanismo de `congresso/proposicoes/dados/
 * [arquivo]/route.ts` (o padrão do repo, ver `docs/ARQUITETURA.md` §payload)
 * — só que a fonte aqui é um `import` estático, não uma consulta ao banco.
 *
 * ═══ ESTE É O ÚNICO ARQUIVO QUE IMPORTA O JSON DE 8,1 MB ═══
 *
 * `decisoes-licenciamento-mg.json` carrega as 33.890 deferidas (agregadas) E
 * as 9.554 negativas (inteiras, 20 campos cada). Nada disso deve alcançar
 * `page.tsx` nem `PainelDecisoes.tsx` — os dois importam só `lib/ambiental/
 * decisoes-licenciamento.ts`, que é literal e não toca este arquivo. Ver o
 * cabeçalho daquele módulo para o raciocínio completo.
 *
 * ═══ MEMOIZAÇÃO ═══
 *
 * Diferente de `congresso/proposicoes` (consulta ao banco, por isso memoiza
 * uma Promise), aqui a fonte já é síncrona — o `import` só roda uma vez,
 * pelo próprio Node. `arquivosDoIndice` (que chama `fatiar()`) ainda vale a
 * pena cachear: sem isso, rodaria de novo a cada arquivo gerado
 * (`generateStaticParams` decide QUANTOS existem, depois o Next chama `GET`
 * uma vez por arquivo).
 */
let cache: ArquivoIndice[] | null = null;

function arquivos(): ArquivoIndice[] {
  if (!cache) {
    const bruto = carregarJsonEtl<{ negativas: DecisaoLicenciamentoBruta[] }>(
      "decisoes-licenciamento-mg.json"
    );
    const negativasBrutas = bruto.negativas;
    const enxutas: DecisaoLicenciamentoNegativa[] = negativasBrutas.map(enxugarNegativa);
    if (enxutas.length < 9000) {
      // Mesma guarda de `agregar-decisoes-licenciamento.mts`: abortar o build
      // antes de publicar um índice menor que o medido é melhor que publicar
      // "achado" incompleto sem avisar.
      throw new Error(`só ${enxutas.length} negativas enxutas — o bruto tinha 9.554. Abortando antes de fatiar.`);
    }
    cache = arquivosDoIndice(enxutas);
  }
  return cache;
}

export async function generateStaticParams() {
  return arquivos().map((a) => ({ arquivo: a.nome }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ arquivo: string }> }) {
  const { arquivo } = await params;
  const achado = arquivos().find((a) => a.nome === arquivo);
  if (!achado) {
    return new NextResponse("não encontrado", { status: 404 });
  }
  return new NextResponse(achado.conteudo, {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
