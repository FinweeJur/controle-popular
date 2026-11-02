/**
 * @file Registro único das rotas antigas que viraram recorte de painel.
 *
 * POR QUE UM REGISTRO, E NÃO DUAS LISTAS: a mesma URL antiga precisa de dois
 * mecanismos, porque o portal é publicado em dois alvos.
 *
 *  - Onde há servidor (Azure/standalone, Cloudflare Workers), quem responde é
 *    `redirects()` do `next.config.ts`, montado a partir daqui.
 *  - No alvo estático (`PAGES_BASE_PATH` definido → GitHub Pages, `output:
 *    'export'`), `redirects()` **não é aplicado e o Next não avisa**: a rota
 *    antiga vira 404 em produção. Ali quem salva o link é a página-ponte com
 *    `<meta http-equiv="refresh">`.
 *
 * Duas listas separadas divergem no primeiro dia em que alguém edita uma e
 * esquece a outra — e o sintoma é link indexado quebrando só no alvo estático.
 * `next.config.ts` monta os redirects a partir de `ROTAS_ANTIGAS`, e cada
 * página-ponte pergunta o destino com `destinoAntigo()`.
 *
 * REGRA: todo link antigo indexado entra aqui no mesmo commit que cria a URL
 * nova. Não se apaga rota sem ponte (ver `PLANO-PAINEL-INTEGRADO-02-11.md`).
 *
 * A query no destino é parte do contrato: `/saude-publica` não vira o painel
 * seco, vira o recorte de saúde. Sem ela, o leitor de um link antigo cairia em
 * outro assunto.
 *
 * ORDEM: só acrescentar no fim. O teste `rotas-antigas.test.ts` confere que
 * toda rota daqui tem `page.tsx` de ponte e vice-versa.
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
  {
    de: "/congresso/alertas",
    para: "/congresso/analises?recorte=restringem",
    motivo: "virou recorte do painel de analises do congresso (02/11/2026)",
  },
  {
    de: "/congresso/bons-exemplos",
    para: "/congresso/analises?recorte=ampliam",
    motivo: "virou recorte do painel de analises do congresso (02/11/2026)",
  },
  {
    de: "/paraopeba/indice",
    para: "/paraopeba#indice",
    motivo: "indice sem dado proprio absorvido pelo hub da frente (02/11/2026)",
  },
  {
    de: "/paraopeba/noticias-vale",
    para: "/paraopeba/noticias?fonte=vale",
    motivo: "virou recorte do painel de noticias da bacia e da Vale (02/11/2026)",
  },
  {
    de: "/terra-e-territorios/cidades",
    para: "/cidades#catalogo-cidades",
    motivo: "repetia o catalogo e os totais de /cidades; virou ancora da pagina canonica (02/11/2026)",
  },
  {
    de: "/ambiental/nossos-rios",
    para: "/ambiental/nossos?colecao=rios",
    motivo: "virou faceta do painel da Colecao Nossos (02/11/2026)",
  },
  {
    de: "/ambiental/nossas-serras",
    para: "/ambiental/nossos?colecao=serras",
    motivo: "virou faceta do painel da Colecao Nossos (02/11/2026)",
  },
  {
    de: "/ambiental/nossos-territorios",
    para: "/ambiental/nossos?colecao=territorios",
    motivo: "virou faceta do painel da Colecao Nossos (02/11/2026)",
  },
  {
    de: "/ambiental/barragens/sigbm",
    para: "/ambiental/barragens#sigbm-anm",
    motivo: "absorvida pela pagina de barragens; a tabela SIGBM ja vivia la (02/11/2026)",
  },
  {
    de: "/ambiental/direito-critico",
    para: "/ambiental/legislacao",
    motivo: "unificado ao painel de legislacao em 13/08/2026; ponte migrada para o registro (02/11/2026)",
  },
  {
    de: "/judiciario/tribunais",
    para: "/judiciario/composicao",
    motivo: "virou a lente padrao do painel de composicao (02/11/2026)",
  },
  {
    de: "/judiciario/vagas",
    para: "/judiciario/composicao?lente=vagas",
    motivo: "virou a lente de vagas do painel de composicao (02/11/2026)",
  },
  {
    de: "/judiciario/indicacoes",
    para: "/judiciario/composicao?lente=indicacoes",
    motivo: "virou a lente de indicacoes do painel de composicao (02/11/2026)",
  },
  {
    de: "/judiciario/varas",
    para: "/judiciario/contatos",
    motivo: "duplicava o catalogo de contatos; canonical ja apontava para la (02/11/2026)",
  },
];




/**
 * Destino de uma rota antiga.
 *
 * Rota fora da lista é erro de programação, não caso de tela: a ponte só existe
 * porque alguém a registrou. Por isso lança em vez de devolver vazio — um
 * `<meta refresh>` sem destino levaria o leitor para lugar nenhum.
 */
export function destinoAntigo(rota: string): string {
  const achada = ROTAS_ANTIGAS.find((item) => item.de === rota);
  if (!achada) {
    throw new Error(
      `rota antiga sem destino registrado: ${rota}. Acrescente em lib/redirects/rotas-antigas.ts.`
    );
  }
  return achada.para;
}
