/**
 * Limitador de taxa por IP em memória — a peça comum das rotas do companheiro.
 *
 * PAPEL NO PROJETO
 * ----------------
 * O companheiro de desktop (bichinho-preguiça) e o widget da sessão pareada
 * perguntam em rajada; toda rota do portal que responde ao companheiro precisa
 * de um teto por IP. Este módulo é a fábrica desse teto, para a regra não
 * divergir entre `/api/companheiro` e as rotas da sessão.
 *
 * FONTE / REGRA DE NEGÓCIO
 * ------------------------
 * Contrato de segurança descrito em `docs/planos/PLANO-COMPANHEIRO-SEU-NONO.md`
 * (§ Segurança): limite por IP lido de `ipDoCliente` (cabeçalho que a própria
 * Cloudflare seta na borda, `CF-Connecting-IP`), nunca de `x-forwarded-for` cru.
 *
 * DECISÃO TÉCNICA
 * ---------------
 * O estado é um `Map` em memória por processo. Isso só é correto porque o
 * portal roda em UMA instância (Guara) e o RAG do assistente já é em memória —
 * a sessão pareada segue o mesmo desenho. Não introduza aqui dependência de
 * banco nem de cache distribuído sem rever a instância.
 */

/** Uma função que responde `true` quando a requisição do IP é permitida agora. */
export interface VerificadorDeLimite {
  (ip: string): boolean;
}

export interface OpcoesLimite {
  /** Teto de requisições por IP dentro da janela de um minuto. */
  maxPorMinuto: number;
  /** Limite de IPs distintos guardados antes de varrer os expirados. */
  maxIps?: number;
}

/**
 * Cria um verificador de limite por IP (janela deslizante de 1 minuto).
 *
 * Devolve uma função fechada sobre o próprio `Map`, para que cada rota tenha a
 * contagem isolada e o estado não vaze entre rotas. A limpeza de entradas
 * expiradas roda quando o mapa passa de `maxIps`, evitando crescimento sem fim.
 */
export function criarLimite({ maxPorMinuto, maxIps = 2000 }: OpcoesLimite): VerificadorDeLimite {
  const JANELA_MS = 60 * 1000;
  const registros = new Map<string, { contagem: number; resetEm: number }>();

  return function verificar(ip: string): boolean {
    const agora = Date.now();

    if (registros.size > maxIps) {
      for (const [chave, valor] of registros.entries()) {
        if (agora > valor.resetEm) registros.delete(chave);
      }
    }

    const registro = registros.get(ip);
    if (!registro || agora > registro.resetEm) {
      registros.set(ip, { contagem: 1, resetEm: agora + JANELA_MS });
      return true;
    }
    if (registro.contagem >= maxPorMinuto) return false;
    registro.contagem += 1;
    return true;
  };
}
