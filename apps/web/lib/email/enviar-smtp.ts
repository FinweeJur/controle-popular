import net from "node:net";
import tls from "node:tls";

/**
 * Envio de e-mail via SMTP com STARTTLS — implementação mínima sem
 * dependências (filosofia do repo: "sem dependência nova só para...").
 *
 * Cobre exatamente o que a etapa 2 do Tier 2 precisa (PLANO-NAVEGACAO-E-
 * NOTIFICACOES.md): AUTH PLAIN na 587 da Umbler, mensagem multipart com um
 * anexo CSV em base64. Não é um cliente SMTP genérico — é o suficiente,
 * testado contra smtp.umbler.com (STARTTLS + AUTH PLAIN + DSN).
 */

export interface AnexoEmail {
  nome: string;
  tipo: string;
  conteudo: string;
}

export interface EnvioEmail {
  host: string;
  port: number;
  usuario: string;
  senha: string;
  de: string;
  para: string;
  assunto: string;
  texto: string;
  anexos?: AnexoEmail[];
}

function lerResposta(soquete: net.Socket): Promise<string> {
  return new Promise((resolve, reject) => {
    let dados = "";
    const onDados = (buf: Buffer) => {
      dados += buf.toString("utf-8");
      if (/\r?\n$/.test(dados)) {
        soquete.off("data", onDados);
        soquete.off("error", onErro);
        resolve(dados.trim());
      }
    };
    const onErro = (e: Error) => {
      soquete.off("data", onDados);
      reject(e);
    };
    soquete.on("data", onDados);
    soquete.once("error", onErro);
  });
}

async function cmd(soquete: net.Socket, linha: string, esperado: number[]): Promise<string> {
  soquete.write(linha + "\r\n");
  const resp = await lerResposta(soquete);
  const codigo = Number(resp.slice(0, 3));
  if (!esperado.includes(codigo)) {
    throw new Error(`SMTP ${codigo} em "${linha.split(" ")[0]}": ${resp.slice(0, 160)}`);
  }
  return resp;
}

function aguardarEvento(emissor: net.Socket | tls.TLSSocket, evento: string): Promise<void> {
  return new Promise((resolve, reject) => {
    emissor.once(evento, resolve);
    emissor.once("error", reject);
  });
}

function mimeEncode(assunto: string): string {
  return `=?UTF-8?B?${Buffer.from(assunto, "utf-8").toString("base64")}?=`;
}

/** Converte array de objetos em CSV no padrão do portal (BOM UTF-8, `;`). */
export function jsonParaCsv(linhas: Array<Record<string, unknown>>): string {
  const chaves = [...new Set(linhas.flatMap((l) => Object.keys(l)))];
  const escapar = (v: unknown): string => {
    const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return s.includes(";") || s.includes('"') || s.includes("\n") || s.includes("\r")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const cab = chaves.map(escapar).join(";");
  const corpo = linhas.map((l) => chaves.map((k) => escapar(l[k])).join(";"));
  return `\uFEFF${[cab, ...corpo].join("\r\n")}\r\n`;
}

/** Pega o primeiro array de objetos de um dataset JSON (forma heterogênea). */
export function extrairLinhas(dados: unknown): Array<Record<string, unknown>> | null {
  if (Array.isArray(dados)) {
    const arr = dados.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    return arr.length ? arr : null;
  }
  if (dados && typeof dados === "object") {
    for (const v of Object.values(dados as Record<string, unknown>)) {
      if (Array.isArray(v)) {
        const arr = v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
        if (arr.length) return arr;
      }
    }
  }
  return null;
}

export async function enviarEmail(opts: EnvioEmail): Promise<void> {
  const cru = net.connect(opts.port, opts.host);
  cru.setTimeout(30_000);
  try {
    await aguardarEvento(cru, "connect");
    await lerResposta(cru); // 220 banner
    await cmd(cru, `EHLO ${opts.host}`, [250]);
    await cmd(cru, "STARTTLS", [220]);

    const seguro = tls.connect({ socket: cru, servername: opts.host });
    await aguardarEvento(seguro, "secureConnect");
    const s = seguro as unknown as net.Socket;

    await lerResposta(s); // 220 pós-STARTTLS
    await cmd(s, `EHLO ${opts.host}`, [250]);
    const auth = Buffer.from(`\0${opts.usuario}\0${opts.senha}`, "utf-8").toString("base64");
    await cmd(s, `AUTH PLAIN ${auth}`, [235]);
    await cmd(s, `MAIL FROM:<${opts.de}>`, [250]);
    await cmd(s, `RCPT TO:<${opts.para}>`, [250, 251]);
    await cmd(s, "DATA", [354]);

    const boundary = `----cp-${Date.now().toString(36)}`;
    let mensagem =
      `From: ${opts.de}\r\n` +
      `To: ${opts.para}\r\n` +
      `Subject: ${mimeEncode(opts.assunto)}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n\r\n` +
      `${opts.texto}\r\n`;
    for (const anexo of opts.anexos ?? []) {
      mensagem +=
        `--${boundary}\r\n` +
        `Content-Type: ${anexo.tipo}; charset=utf-8; name="${anexo.nome}"\r\n` +
        `Content-Disposition: attachment; filename="${anexo.nome}"\r\n` +
        `Content-Transfer-Encoding: base64\r\n\r\n` +
        Buffer.from(anexo.conteudo, "utf-8").toString("base64").replace(/(.{76})/g, "$1\r\n") +
        "\r\n";
    }
    mensagem += `--${boundary}--\r\n.\r\n`;
    // dot-stuffing: linha que começa com "." ganha um "." extra
    s.write(mensagem.replace(/\r\n\./g, "\r\n.."));
    await lerResposta(s); // 250 enfileirado
    await cmd(s, "QUIT", [221]);
  } finally {
    cru.destroy();
  }
}
