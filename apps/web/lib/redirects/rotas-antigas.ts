/**
 * @file Registro único das rotas antigas que viraram recorte de painel.
 *
 * POR QUE UM REGISTRO, E NÃO DUAS LISTAS: a mesma URL antiga precisa de dois
 * mecanismos, porque o portal é publicado em dois alvos.
 *
 *  - Onde há servidor (Azure/standalone, Cloudflare Workers), quem responde é
 *    `redirects()` do `next.config.ts`.
 *  - No alvo estático (`PAGES_BASE_PATH` definido → GitHub Pages, `output:
 *    'export'`), `redirects()` **não é aplicado e o Next não avisa**: a rota
 *    antiga vira 404 em produção. Ali quem salva o link é a página-ponte com
 *    `<meta http-equiv="refresh">`.
 *
 * Duas listas separadas divergem no primeiro dia em que alguém edita uma e
 * esquece a outra — e o sintoma é link indexado quebrando só no alvo estático.
 * Aqui a lista é uma, e os dois lados importam dela. `next.config.ts` monta os
 * redirects a partir de `ROTAS_ANTIGAS`, e cada página-ponte pergunta o
 * destino com `destinoAntigo()`.
 *
 * REGRA: todo link antigo indexado entra aqui no mesmo commit que cria a URL
 * nova. Não se apaga rota sem ponte (ver `PLANO-PAINEL-INTEGRADO-02-11.md`).
 *
 * A query no destino é parte do contrato: `/saude-publica` não vira o painel
 * seco, vira o recorte de saúde. Sem ela, o leitor de um link antigo cairia em
 * outro assunto.
 */

export interface RotaAntiga {
  /** Caminho antigo, absoluto no site, sem query. */
  de: string;
  /** Destino novo, com a query quando o destino é um recorte. */
  para: string;
  /** Por que mudou — vai no comentário do redirect e no commit. */
  motivo: string;
}

export const ROTAS_ANTIGAS: RotaAntiga[] = [
  {
    de: "/direitos-em-movimento/saude-publica",
    para: "/direitos-em-movimento/servicos?subfrente=saude-publica",
    motivo: "virou faceta do painel de servicos essenciais (02/11/2026)",
  },
  {
    de: "/direitos-em-movimento/educacao",
    para: "/direitos-em-movimento/servicos?subfrente=educacao",
    motivo: "virou faceta do painel de servicos essenciais (02/11/2026)",
  },
  {
    de: "/direitos-em-movimento/trabalho-e-renda",
    para: "/direitos-em-movimento/servicos?subfrente=trabalho-e-renda",
    motivo: "virou faceta do painel de servicos essenciais (02/11/2026)",
  },
];

/**
 * Destino de uma rota antiga.
 *
 * Devolve `undefined` quando a rota não está no registro — a ponte usa isso
 * para dar 404 em vez de apontar para lugar nenhum, e o teste de guarda falha
 * se existir ponte sem entrada aqui.
 */
export function destinoAntigo(rota: string): string | undefined {
  return ROTAS_ANTIGAS.find((item) => item.de === rota)?.para;
}
