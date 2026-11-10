/**
 * @file Fonte oficial de um caso de jurisprudência: link do acórdão ou busca.
 *
 * POR QUE ESTE MÓDULO EXISTE
 *
 * Metade do acervo do TJMG (5.199 casos, medido em 10/11/2026) veio da coleta
 * sem `link`, e o TJES tem 2.492 casos cujo `link` é a rota interna
 * `/api/inteiro-teor` — que serve o texto do portal, não o site do tribunal.
 * A lista mostrava o número do processo sem nenhum caminho para a fonte
 * oficial, e o leitor não tinha como conferir a decisão na origem.
 *
 * LINK DO ACÓRDÃO ≠ BUSCA PELO NÚMERO
 *
 * - `link` externo (`http`/`https`) é o **link do acórdão**: abre a decisão
 *   naquele processo, no site do tribunal. É o que o número do processo
 *   linka.
 * - A **busca oficial** é a página de consulta do tribunal, sem o número
 *   embutido. O TJMG exige código/captcha antes de pesquisar, então uma URL
 *   "profunda" montada com o número cai em 401 e prometeria um resultado que
 *   não existe — por isso o rótulo é "Buscar no TJMG", e não "Ver no TJMG".
 *   O número não vai na URL: quem pesquisa cola o número no campo do site.
 * - Sem link e sem página oficial cadastrada, a resposta é
 *   "fonte oficial não informada". Nunca inventamos URL nem apontamos para
 *   outro processo.
 *
 * Só os tribunais com página de consulta VERIFICADA entram em `BUSCA_OFICIAL`.
 * Medido em 10/11/2026: TJMG responde 200 em `formEspelhoAcordao.do`; TJES
 * responde 200 em `consulta-jurisprudencia`. A rota de pesquisa por número do
 * TJMG devolve 401 sem o código de sessão, e é justamente o motivo de não
 * montarmos URL com o processo.
 */

import type { CasoJurisprudencia } from "./jurisprudencia";

export type FonteOficial =
  | { tipo: "acordao"; url: string; rotulo: string; titulo: string }
  | { tipo: "busca"; url: string; rotulo: string; titulo: string }
  | { tipo: "indisponivel"; rotulo: string; titulo: string };

/** Página oficial de consulta de jurisprudência, por tribunal. */
const BUSCA_OFICIAL: Record<string, { url: string; nome: string }> = {
  TJMG: {
    url: "https://www5.tjmg.jus.br/jurisprudencia/formEspelhoAcordao.do",
    nome: "TJMG",
  },
  TJES: {
    url: "https://sistemas.tjes.jus.br/consulta-jurisprudencia/",
    nome: "TJES",
  },
};

/** Só `http`/`https` conta como link do acórdão; `javascript:` e afins, não. */
function urlExterna(link: string | null | undefined): string | null {
  const limpo = (link ?? "").trim();
  if (!/^https?:\/\//i.test(limpo)) return null;
  return limpo;
}

export function linkFonteOficial(
  caso: Pick<CasoJurisprudencia, "tribunal" | "processo" | "link">,
): FonteOficial {
  const direto = urlExterna(caso.link);
  if (direto) {
    const nome = caso.tribunal || "tribunal";
    return {
      tipo: "acordao",
      url: direto,
      rotulo: `Conferir no ${nome}`,
      titulo: `Abre o acórdão do processo ${caso.processo} no site oficial do ${nome}, em nova aba.`,
    };
  }

  const tribunal = (caso.tribunal || "").toUpperCase();
  const busca = BUSCA_OFICIAL[tribunal];
  if (busca) {
    return {
      tipo: "busca",
      url: busca.url,
      rotulo: `Buscar no ${busca.nome}`,
      titulo:
        `Abre a busca oficial de jurisprudência do ${busca.nome} em nova aba. ` +
        `O número ${caso.processo} não é enviado; cole-o no campo do site.`,
    };
  }

  return {
    tipo: "indisponivel",
    rotulo: "fonte oficial não informada",
    titulo: `O portal não tem o link do acórdão nem uma busca oficial cadastrada para ${
      caso.tribunal || "este tribunal"
    }.`,
  };
}
