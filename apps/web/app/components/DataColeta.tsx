/**
 * Data de coleta visível na página — oitava qualidade da informação
 * (PLANO-DATA-DO-DADO.md, aprovado pelo dono em 15/10/2026).
 *
 * Papel no portal: responder em texto simples e visível "de quando é este
 * dado, de qual fonte vem e qual a competência dele". O dono não precisa
 * confiar na tela: a data vem do cabeçalho do arquivo de dado
 * (`dataDoAcervo`), carimbado pelo coletor/ETL na ESCRITA BEM-SUCEDIDA —
 * nova coleta bem-sucedida renova o arquivo, e a página seguinte já nasce
 * com a data nova. Data digitada à mão é proibida (número errado é dano;
 * data errada também).
 *
 * Restrições que já custaram lição: §5.10 — nunca menor que `text-sm`;
 * §5.14 — uma linha de texto, legível em 390 px, sem estourar a tela.
 * `sem data` = renderiza nada e o porteiro (checagem D1) pega a ausência:
 * a página fica SEMPRE mais honesta que bonita.
 */
import { formatarDataBR } from "@/lib/fontes/dataDoArquivo";

interface PropsDataColeta {
  /** ISO do cabeçalho do arquivo (`geradoEm` e afins). Nulo = nada prometido. */
  coletadoEm: string | null | undefined;
  /** Nome legível da fonte oficial (órgão/programa), se couber na linha. */
  fonte?: string;
  /** Competência dos valores, quando cada programa tem corte próprio. */
  competencia?: string;
}

/**
 * Linha discreta, acima do conteúdo, com a data da última coleta bem-sucedida.
 * Use `<time dateTime>`: máquina e leitor de tela entendem, humano vê DD/MM.
 */
export default function DataColeta({ coletadoEm, fonte, competencia }: PropsDataColeta) {
  if (!coletadoEm) return null;
  return (
    <p className="mt-2 text-sm text-muted max-w-4xl" role="note">
      Dado coletado em <time dateTime={coletadoEm}>{formatarDataBR(coletadoEm)}</time>
      {fonte ? <> · fonte: {fonte}</> : null}
      {competencia ? <> · {competencia}</> : null}
    </p>
  );
}
