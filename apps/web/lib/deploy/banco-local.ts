/**
 * Qual banco a rotina local pode usar.
 *
 * ═══ POR QUE ESTA FUNÇÃO EXISTE ═══
 *
 * O guard de banco nasceu de um incidente: um build local apontou para a Neon e
 * levou HTTP 402 no meio do build. Comentário no arquivo de ambiente não impede
 * nada; abortar impede. Então `scripts/rotina-local.mts` recusava qualquer host
 * que não fosse local.
 *
 * ═══ O QUE MUDOU EM 01/11/2026 ═══
 *
 * O banco oficial passou a ser o RDS (`*.rds.amazonaws.com`, us-east-1). O guard
 * continuou igual — e por isso a tarefa agendada `CP-Rotina-Local` passou a
 * terminar com resultado 1 todo dia às 07:00, sem publicar: o freio de mão
 * barrava a saída legítima.
 *
 * A saída NÃO é remover o guard. É uma exceção estreita, explícita e auditável:
 *
 *   - sem `PERMITIR_BANCO_REMOTO`, o comportamento continua exatamente o antigo;
 *   - com `PERMITIR_BANCO_REMOTO=1`, aceita **apenas** host terminado em
 *     `.rds.amazonaws.com`;
 *   - Neon continua recusada, mesmo com a variável ligada. Foi ela que deu 402,
 *     e não é o banco do portal desde 08/10/2026;
 *   - qualquer outro host continua recusado, mesmo com a variável ligada.
 *
 * Ou seja: o freio de mão fica no carro. Só deixa de impedir a saída pela porta
 * certa, com o dono do carro dizendo que quer sair.
 *
 * ═══ POR QUE A LÓGICA MORA AQUI, E NÃO NO SCRIPT ═══
 *
 * `scripts/rotina-local.mts` é um executável: importa `node:child_process`, roda
 * bash e só fala com o banco no fim. Testar o guard lá dentro exigiria rodar a
 * rotina inteira. Aqui é função pura — a tabela de casos de
 * `banco-local.test.ts` cobre cada host sem tocar em disco nem em rede.
 *
 * Fonte de verdade dos arquivos: `apps/web/.env.local` e `etl/betim/.env`
 * desta máquina (o build local lê os dois).
 */

/** Hosts em que o Postgres roda na própria máquina. `::1` entra sem colchetes. */
export const HOSPEDEIROS_LOCAIS = ["127.0.0.1", "localhost", "::1"] as const;

/** O único sufixo remoto que a exceção libera. */
export const SUFIXO_RDS = ".rds.amazonaws.com";

/** O banco do incidente de 402. Recusado mesmo com a exceção ligada. */
export const SUFIXO_NEON = ".neon.tech";

export type MotivoBanco =
  | "local"
  | "rds-autorizado"
  | "sem-url"
  | "url-invalida"
  | "neon-recusado"
  | "rds-sem-autorizacao"
  | "host-recusado";

export type DecisaoBanco = {
  /** `true` só quando a rotina pode seguir. */
  aceita: boolean;
  /** Host medido, ou `null` quando nem havia URL. */
  hospedeiro: string | null;
  motivo: MotivoBanco;
  /** Texto pronto para log ou para o erro que aborta a rotina. */
  mensagem: string;
};

/**
 * `PERMITIR_BANCO_REMOTO` está ligada?
 *
 * Aceita as formas que alguém digita de verdade (`1`, `true`, `sim`, `yes`) e
 * nada mais. Qualquer outro valor — inclusive `0` — é desligado: a variável
 * existe para ser difícil de ligar sem querer.
 */
export function excecaoRemotaLigada(valor: string | undefined): boolean {
  if (!valor) return false;
  return ["1", "true", "sim", "yes"].includes(valor.trim().toLowerCase());
}

/**
 * Extrai o host de uma `DATABASE_URL` de Postgres.
 *
 * Troca `postgres://` por `http://` porque o `URL` do Node recusa o esquema.
 * Devolve `null` quando a string não é URL — a rotina não adivinha.
 */
export function hospedeiroDoBanco(url: string): string | null {
  try {
    const lido = new URL(url.replace(/^postgres(ql)?:/i, "http:")).hostname.toLowerCase();
    // `URL` devolve IPv6 entre colchetes (`[::1]`); o resto do código compara sem.
    return lido.replace(/^\[(.*)\]$/, "$1");
  } catch {
    return null;
  }
}

/**
 * Decide se a rotina pode usar o banco deste arquivo de ambiente.
 *
 * Nunca lança: devolve a decisão com o texto do motivo. Quem aborta é o
 * chamador, para que o mesmo texto sirva de log quando aceita.
 *
 * A divisão em três funções é de propósito: o CodeScene mede complexidade 9 e
 * 72 linhas num corpo só, que é o limiar. Separar local, remoto e texto de
 * recusa deixa cada decisão legível por si — e testável pela mesma tabela.
 */
export function avaliarBanco(
  url: string | undefined,
  origem: string,
  permitirRemoto = false
): DecisaoBanco {
  if (!url || !url.trim()) {
    return recusa(null, "sem-url", `DATABASE_URL ausente em ${origem}.`);
  }

  const hospedeiro = hospedeiroDoBanco(url);
  if (!hospedeiro) {
    return recusa(
      null,
      "url-invalida",
      `${origem} tem uma DATABASE_URL que não é URL. ` +
        `A rotina para aqui em vez de adivinhar o banco.`
    );
  }

  if ((HOSPEDEIROS_LOCAIS as readonly string[]).includes(hospedeiro)) {
    return aceita(hospedeiro, "local", `${origem}: ${hospedeiro} (Postgres local).`);
  }

  return decidirRemoto(hospedeiro, origem, permitirRemoto);
}

/**
 * A parte estreita: fora do localhost, quem pode entrar.
 *
 * Neon é testada antes do RDS de propósito — é ela que deu 402, e a mensagem
 * precisa dizer que a variável não a libera, senão alguém liga a exceção e
 * continua barrado sem entender por quê.
 */
function decidirRemoto(
  hospedeiro: string,
  origem: string,
  permitirRemoto: boolean
): DecisaoBanco {
  if (hospedeiro === "neon.tech" || hospedeiro.endsWith(SUFIXO_NEON)) {
    return recusa(
      hospedeiro,
      "neon-recusado",
      `${origem} aponta para "${hospedeiro}", que é Neon. ` +
        `Neon não é o banco do portal desde 08/10/2026 e foi ela que deu HTTP 402 ` +
        `no build local. PERMITIR_BANCO_REMOTO não libera Neon, em nenhum valor.`
    );
  }

  if (!hospedeiro.endsWith(SUFIXO_RDS)) {
    return recusa(
      hospedeiro,
      "host-recusado",
      `${origem} aponta para "${hospedeiro}", que não é o Postgres local. ` +
        `A rotina se recusa a rodar: foi assim que um build local bateu na Neon e levou 402. ` +
        `PERMITIR_BANCO_REMOTO=1 libera apenas host *.rds.amazonaws.com, nunca este.`
    );
  }

  if (!permitirRemoto) {
    return recusa(
      hospedeiro,
      "rds-sem-autorizacao",
      `${origem} aponta para "${hospedeiro}", que é o RDS oficial, não o Postgres local. ` +
        `Para liberar, rode com PERMITIR_BANCO_REMOTO=1 — a exceção vale só para host ` +
        `*.rds.amazonaws.com.`
    );
  }

  return aceita(
    hospedeiro,
    "rds-autorizado",
    `${origem}: ${hospedeiro} (RDS, liberado por PERMITIR_BANCO_REMOTO).`
  );
}

function aceita(
  hospedeiro: string,
  motivo: MotivoBanco,
  mensagem: string
): DecisaoBanco {
  return { aceita: true, hospedeiro, motivo, mensagem };
}

function recusa(
  hospedeiro: string | null,
  motivo: MotivoBanco,
  mensagem: string
): DecisaoBanco {
  return { aceita: false, hospedeiro, motivo, mensagem };
}

