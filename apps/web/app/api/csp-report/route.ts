/**
 * @file route.ts
 * @description Coletor de violações de Content-Security-Policy (CSP) do portal.
 *
 * Papel no portal: a CSP está em `Content-Security-Policy-Report-Only`
 * (decisão em `apps/web/next.config.ts`) e manda as violações para cá via
 * `report-uri /api/csp-report` + `Reporting-Endpoints`. Sem este endpoint o
 * modo Report-Only é mudo: a política observa e ninguém lê o que ela viu.
 * As contagens gravadas aqui são o dado que autoriza (ou não) promover a CSP
 * para bloqueante — decisão do dono, medindo antes (PENDENCIAS-07-10.md).
 *
 * Formatos aceitos (oficiais dos navegadores):
 * - `application/csp-report` — legado, corpo único com `"csp-report"`;
 * - `application/reports+json` — Reporting API, array de entradas.
 *
 * Decisões técnicas não triviais:
 * - PRIVACIDADE (AGENTS §5.8): a URL da página (`document-uri`) é descartada
 *   no interpretador; aqui só entram diretiva + host. Nada de dado do visitante.
 * - Grava em `contadores` (tabela chave-valor já existente) com chaves
 *   `csp:<diretiva>:<origem>`, mais `csp:disposicao:<report|enforce>` e
 *   `csp:total` — sem migration, sem tocar no schema.
 * - RELATÓRIO NUNCA DERRUBA A PÁGINA: corpo inválido, banco indisponível ou
 *   erro inesperado terminam em `204` igual. O navegador não repete nem loga
 *   erro; o custo de perder uma contagem é menor que o de quebrar a rota.
 * - `runtime = "nodejs"`: rota de servidor pura (AGENTS §6, nada de edge).
 */
import { interpretarRelatorioCsp, type ViolacaoCsp } from "@/lib/csp/reportes";
import { somarContador } from "@/lib/db/queries/betimD1";

export const runtime = "nodejs";

/** Teto do corpo aceito: relatório legado é centenas de bytes; 8 KB é folga. */
const TETO_CORPO = 8 * 1024;

/** Teto de violações processadas por requisição — limita o custo por request. */
const TETO_VIOLACOES = 20;

/**
 * Recebe um relatório de violação de CSP e soma os contadores correspondentes.
 *
 * @param req Requisição `POST` com JSON nos dois formatos oficiais.
 * @returns `204` sempre (sem corpo), inclusive em corpo inválido ou falha de
 * banco — o relatório é best-effort por definição.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const corpo = await req.text();
    if (!corpo || corpo.length > TETO_CORPO) return new Response(null, { status: 204 });

    let desserializado: unknown = null;
    try {
      desserializado = JSON.parse(corpo);
    } catch {
      // Corpo não é JSON: nada a contar, mas responde 204 mesmo assim.
    }

    const violacoes = interpretarRelatorioCsp(desserializado).slice(0, TETO_VIOLACOES);
    if (violacoes.length > 0) {
      await gravar(violacoes);
    }
  } catch {
    // Relatório é observação, nunca caminho crítico.
  }
  return new Response(null, { status: 204 });
}

/**
 * Agrega as violações em contadores únicos e soma cada chave uma vez.
 *
 * @param violacoes Lista normalizada (já limitada a `TETO_VIOLACOES`).
 */
async function gravar(violacoes: ViolacaoCsp[]): Promise<void> {
  const totais = new Map<string, number>();
  const somar = (chave: string, n = 1) => totais.set(chave, (totais.get(chave) ?? 0) + n);

  for (const v of violacoes) {
    somar(`csp:${v.diretiva}:${v.origem}`);
    somar(`csp:disposicao:${v.disposicao}`);
    somar("csp:total");
  }

  await Promise.all(
    [...totais.entries()].map(async ([chave, n]) => {
      try {
        await somarContador(chave, n);
      } catch {
        // Banco fora do ar: perde a contagem, não a resposta.
      }
    })
  );
}
