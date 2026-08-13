import type { ItemPainel } from "@/lib/betim/redeProtecao";
import type { RespostasDenuncia } from "@/lib/denuncia/tipos";
import {
  regrasAplicaveis,
  SITUACAO_LABEL,
  VIOLADOR_LABEL,
  TEXTO_CIDH,
  TEXTO_NAO_E_ACONSELHAMENTO,
  textoUrgencia,
} from "@/lib/denuncia/roteiro";
import { TIPO_PROVA_LABEL } from "@/lib/denuncia/provas";

/**
 * Composição do documento — determinística, SEM LLM, mesma doutrina de
 * `lib/congresso/oficio/compor.ts`: um documento que a pessoa vai levar à
 * Defensoria ou a um advogado não pode ter um parágrafo inventado. Tudo
 * aqui é o que a própria pessoa respondeu, mais os textos fixos já
 * verificados de `roteiro.ts`/`provas.ts` — nada gerado por modelo de
 * linguagem.
 *
 * ESTE ARQUIVO NÃO IMPORTA `docx` NEM `pdf-lib` — é lógica pura, testável
 * sem navegador (`compor.test.ts`). Quem transforma isto em bytes de DOCX é
 * `render-binario.ts`, e só ele roda no navegador da pessoa.
 */

export type TipoBlocoDenuncia = "titulo" | "subtitulo" | "paragrafo" | "item" | "aviso";

export interface BlocoDenuncia {
  tipo: TipoBlocoDenuncia;
  texto: string;
}

export interface DocumentoDenuncia {
  titulo: string;
  blocos: BlocoDenuncia[];
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function porExtenso(data: Date): string {
  return `${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
}

const CONTINUA_LABEL: Record<"sim" | "nao" | "nao_sei", string> = {
  sim: "Sim, continua acontecendo.",
  nao: "Não, já parou.",
  nao_sei: "Não sei dizer se continua.",
};

/** Endereço/telefone/site de um item sugerido, numa linha só — nunca reescrito de memória. */
function contatoDoItem(item: ItemPainel): string {
  const partes = [
    item.telefone ? `telefone ${item.telefone}` : null,
    item.endereco ? `endereço ${item.endereco}` : null,
    item.site ? `site ${item.site}` : null,
  ].filter((p): p is string => Boolean(p));
  return partes.length > 0 ? partes.join(" · ") : "sem contato catalogado — ver o site oficial";
}

export interface OpcoesDocumento {
  /** Nome já resolvido — cidade cadastrada ("Betim/MG") ou texto livre da pessoa, ou null. */
  cidadeNome: string | null;
  /** Itens já filtrados e deduplicados pelo chamador (ver `Facilitador.tsx`). */
  itensSugeridos: ItemPainel[];
  data?: Date;
}

export function comporDocumentoDenuncia(
  r: RespostasDenuncia,
  opcoes: OpcoesDocumento
): DocumentoDenuncia {
  const data = opcoes.data ?? new Date();
  const blocos: BlocoDenuncia[] = [];

  blocos.push({ tipo: "titulo", texto: "Registro de violação de direitos humanos" });
  blocos.push({
    tipo: "paragrafo",
    texto:
      `Documento gerado em ${porExtenso(data)}, no navegador de quem preencheu, através do ` +
      "Controle Popular (controlepopular.br). Este texto não foi enviado a nenhum servidor — " +
      "existe só neste arquivo, a partir de agora sob a guarda de quem o baixou.",
  });

  const urgencia = textoUrgencia(r.continua);
  if (urgencia) blocos.push({ tipo: "aviso", texto: urgencia });

  blocos.push({ tipo: "subtitulo", texto: "Quando começou" });
  blocos.push({ tipo: "paragrafo", texto: r.quando.trim() || "Não informado." });

  blocos.push({ tipo: "subtitulo", texto: "A violação continua acontecendo?" });
  blocos.push({
    tipo: "paragrafo",
    texto: r.continua ? CONTINUA_LABEL[r.continua] : "Não informado.",
  });

  blocos.push({ tipo: "subtitulo", texto: "Onde foi" });
  blocos.push({ tipo: "paragrafo", texto: opcoes.cidadeNome ?? "Não informado." });

  blocos.push({ tipo: "subtitulo", texto: "Quem esteve envolvido" });
  if (r.violadores.length === 0 && r.situacoes.length === 0) {
    blocos.push({ tipo: "paragrafo", texto: "Não informado." });
  } else {
    for (const v of r.violadores) blocos.push({ tipo: "item", texto: VIOLADOR_LABEL[v] });
    for (const s of r.situacoes) blocos.push({ tipo: "item", texto: SITUACAO_LABEL[s] });
  }

  blocos.push({ tipo: "subtitulo", texto: "O que aconteceu" });
  blocos.push({ tipo: "paragrafo", texto: r.relato.trim() || "Não informado." });

  blocos.push({ tipo: "subtitulo", texto: "Provas reunidas ou disponíveis" });
  if (r.provas.length === 0) {
    blocos.push({ tipo: "paragrafo", texto: "Não informado." });
  } else {
    for (const p of r.provas) blocos.push({ tipo: "item", texto: TIPO_PROVA_LABEL[p] });
  }
  if (r.detalheProvas.trim()) {
    blocos.push({ tipo: "paragrafo", texto: r.detalheProvas.trim() });
  }

  blocos.push({ tipo: "subtitulo", texto: "Para onde este documento pode ser levado" });
  if (opcoes.itensSugeridos.length === 0) {
    blocos.push({
      tipo: "paragrafo",
      texto: "Nenhum canal catalogado para esta combinação de respostas ainda.",
    });
  } else {
    for (const item of opcoes.itensSugeridos) {
      blocos.push({
        tipo: "item",
        texto: `${item.nome} — ${item.oQueAtende} (${contatoDoItem(item)}; verificado em ${item.verificadoEm})`,
      });
    }
  }
  for (const regra of regrasAplicaveis(r)) {
    blocos.push({ tipo: "paragrafo", texto: regra.motivo });
    if (regra.avisoExtra) blocos.push({ tipo: "aviso", texto: regra.avisoExtra });
  }

  blocos.push({ tipo: "subtitulo", texto: "Avisos importantes" });
  blocos.push({ tipo: "aviso", texto: TEXTO_NAO_E_ACONSELHAMENTO });
  blocos.push({ tipo: "aviso", texto: TEXTO_CIDH });

  blocos.push({ tipo: "subtitulo", texto: "Quem registra" });
  blocos.push({ tipo: "paragrafo", texto: r.nomeDenunciante.trim() || "Não identificado." });

  return { titulo: "Registro de violação de direitos humanos", blocos };
}
