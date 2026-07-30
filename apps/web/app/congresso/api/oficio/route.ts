import { NextResponse } from "next/server";
import { obterProposicao } from "@/lib/congresso/proposicoes";
import { obterOrgao } from "@/lib/congresso/orgaos";
import {
  comporOficio,
  sugerirDestinatarios,
  type Destinatario,
  type Remetente,
  type TipoDocumento,
} from "@/lib/congresso/oficio/compor";
import { revisarOficio } from "@/lib/congresso/oficio/revisar";
import { MIME, nomeArquivo, renderTxt } from "@/lib/congresso/oficio/render";

export const runtime = "nodejs";

/**
 * Geração de ofício. SEM PERSISTÊNCIA por ora — o documento é composto e
 * devolvido na hora.
 *
 * Persistir exige `user_id`, e o Auth só chega no F6. Em vez de bloquear
 * a feature inteira nisso, a geração é stateless: quem quiser guardar,
 * baixa o arquivo. Quando o Auth existir, a mesma composição passa a
 * gravar em `documentos` e o histórico aparece em `/documentos` — nenhuma
 * linha desta lógica muda.
 */

const TIPOS_VALIDOS: TipoDocumento[] = ["apoio", "repudio", "vista", "comentario"];

/**
 * `docx` e `pdf` saíram daqui na Fase 6 e agora são gerados NO BROWSER
 * (`lib/congresso/oficio/render-binario.ts`), a partir do mesmo `json` que
 * esta rota devolve.
 *
 * Motivo medido: as duas libs somam ~304 KiB gzip e o bundle do Worker
 * estourou o teto de 3 MB gzip do Cloudflare Free (3.250 KiB), recusando o
 * deploy. Como o cliente já recebia os blocos para exibir na tela, montar
 * o arquivo lá não perde nada — e tira o trabalho do teto de 10 ms de CPU.
 */
const FORMATOS = ["json", "txt"] as const;
type Formato = (typeof FORMATOS)[number];

interface Corpo {
  proposicaoId?: string;
  tipo?: string;
  formato?: string;
  remetente?: Remetente;
  destinatarios?: Destinatario[];
  tratamento?: string;
  observacoes?: string;
  revisar?: boolean;
}

export async function POST(req: Request) {
  let corpo: Corpo;
  try {
    corpo = (await req.json()) as Corpo;
  } catch {
    return NextResponse.json({ erro: "corpo inválido" }, { status: 400 });
  }

  const tipo = (corpo.tipo ?? "") as TipoDocumento;
  const formato = (corpo.formato ?? "json") as Formato;

  if (!corpo.proposicaoId) {
    return NextResponse.json({ erro: "proposicaoId é obrigatório" }, { status: 400 });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json(
      { erro: `tipo deve ser um de: ${TIPOS_VALIDOS.join(", ")}` },
      { status: 400 }
    );
  }
  if (!FORMATOS.includes(formato)) {
    return NextResponse.json({ erro: `formato deve ser um de: ${FORMATOS.join(", ")}` }, { status: 400 });
  }
  if (!corpo.remetente?.nome?.trim()) {
    // Um ofício sem remetente identificado não é um ofício — é um panfleto
    // anônimo, e ninguém em gabinete lê isso.
    return NextResponse.json({ erro: "informe o nome de quem assina" }, { status: 400 });
  }

  const dados = await obterProposicao(corpo.proposicaoId);
  if (!dados) {
    return NextResponse.json({ erro: "proposição não encontrada" }, { status: 404 });
  }

  let destinatarios = corpo.destinatarios?.length ? corpo.destinatarios : null;
  if (!destinatarios) {
    // Mesmo fallback da página: membros da comissão onde a matéria está
    // agora, não o autor do PL — ver docstring de sugerirDestinatarios.
    const sigla = dados.proposicao.orgao_atual;
    const orgao = sigla ? await obterOrgao(sigla) : null;
    destinatarios = sugerirDestinatarios(dados.proposicao, dados.autores, orgao?.membros ?? []);
  }

  if (destinatarios.length === 0) {
    return NextResponse.json(
      { erro: "nenhum destinatário: a proposição não tem autoria nem órgão registrados" },
      { status: 422 }
    );
  }

  const oficio = comporOficio({
    proposicao: dados.proposicao,
    analise: dados.analise,
    itens: dados.itens,
    autores: dados.autores,
    destinatarios,
    remetente: corpo.remetente,
    tipo,
    tratamento: corpo.tratamento,
    observacoes: corpo.observacoes,
  });

  // A revisão por LLM é sempre opcional e nunca bloqueia: se falhar, o
  // ofício determinístico sai igual.
  let blocos = oficio.blocos;
  let revisao: Awaited<ReturnType<typeof revisarOficio>> | null = null;
  if (corpo.revisar) {
    revisao = await revisarOficio(oficio, {
      ementa: dados.proposicao.ementa,
      ementaDetalhada: dados.proposicao.ementa_detalhada,
      textoIntegral: dados.proposicao.texto_integral,
      itens: dados.itens,
    });
    if (!revisao.descartada) blocos = revisao.blocos;
  }

  if (formato === "json") {
    return NextResponse.json({
      oficio: { ...oficio, blocos },
      // O determinístico vai junto SEMPRE que houve revisão, para a tela
      // poder mostrar os dois lado a lado. Aceitar um texto reescrito por
      // IA sem poder comparar com o original seria o oposto do que este
      // app defende.
      original: corpo.revisar ? oficio.blocos : undefined,
      revisao: revisao
        ? {
            aplicada: !revisao.descartada,
            motivoDescarte: revisao.motivoDescarte,
            modelo: revisao.modelo,
            suspeitas: revisao.suspeitas,
          }
        : undefined,
      mailto: montarMailto(oficio.assunto, renderTxt({ ...oficio, blocos }, blocos), destinatarios),
    });
  }

  const nome = nomeArquivo(oficio, formato);
  const cabecalhos = {
    "content-type": MIME[formato],
    "content-disposition": `attachment; filename="${nome}"`,
  };

  return new NextResponse(renderTxt(oficio, blocos), { headers: cabecalhos });
}

/**
 * `mailto:` pré-preenchido — o caminho principal de envio.
 *
 * O primeiro destinatário vai no `to` e os demais em `cc`. O corpo entra
 * no link, mas clientes de e-mail truncam URLs longas (o limite prático
 * varia de 2.000 a 32.000 caracteres), então cortamos com aviso: melhor o
 * usuário perceber que precisa colar o resto do que descobrir depois que
 * mandou meio ofício.
 */
function montarMailto(assunto: string, corpo: string, destinatarios: Destinatario[]): string {
  const comEmail = destinatarios.filter((d) => d.email);
  if (comEmail.length === 0) return "";

  const LIMITE = 1800;
  const truncado =
    corpo.length > LIMITE
      ? corpo.slice(0, LIMITE) + "\n\n[...] — texto truncado pelo cliente de e-mail; cole o ofício completo a partir do arquivo baixado."
      : corpo;

  const para = comEmail[0].email!;
  const cc = comEmail.slice(1).map((d) => d.email!).join(",");
  const params = new URLSearchParams({ subject: assunto, body: truncado });
  if (cc) params.set("cc", cc);
  return `mailto:${para}?${params.toString()}`;
}
