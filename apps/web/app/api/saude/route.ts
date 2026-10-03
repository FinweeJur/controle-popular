/**
 * /api/saude — endpoint de saúde e "keep-warm" do portal.
 *
 * O QUE É: responde 200 rapidinho (GET e POST). Não faz trabalho pesado de
 * propósito: serve para um verificador externo confirmar que a APLICAÇÃO está
 * de pé E para manter o container acordado (o serviço no plano Starter
 * "dorme" quando fica ocioso; um POST periódico evita o cold start).
 *
 * QUEM CHAMA: cron worker do Guara Cloud (`guara crons`, destino HTTP — ele
 * só faz POST, por isso o POST aqui). Um 200 = app viva; 4xx/5xx/timeout no
 * cron = indisponível (classificação automática: http_5xx, timeout, DNS...).
 *
 * POR QUE NÃO CONSULTA O BANCO AQUI: manter leve é o ponto — medir latência de
 * banco a cada batida viraria carga sem necessidade. Se um dia precisar vigiar
 * o banco, o caminho é uma rota separada com `comBancoReserva`.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Resposta única, sem dependências — para GET e POST darem o mesmo 200. */
function responde(): Response {
  return Response.json(
    { ok: true, app: "controle-popular", t: new Date().toISOString() },
    { headers: { "cache-control": "no-store" } },
  );
}

export function GET(): Response {
  return responde();
}

export function POST(): Response {
  return responde();
}
