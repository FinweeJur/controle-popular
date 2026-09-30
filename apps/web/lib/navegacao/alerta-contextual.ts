/**
 * Cabeçalho e mensagem de alerta para WhatsApp/Redes — o texto que o cidadão
 * compartilha ao encontrar um dado no portal.
 *
 * Vive em `lib/` como função PURA por dois motivos: (1) o `vitest` roda os
 * testes que ficam em `lib/`, então o texto é testável sem montar componente; e
 * (2) a MESMA lista de cabeçalhos estava copiada em dois componentes —
 * `app/alertas/CentralAlertasClient.tsx` e
 * `app/components/BotaoAlertaContextual.tsx` —, duas fontes da verdade para a
 * mesma frase. A unificação feita em 30/09/2026 trouxe a lista para cá.
 *
 * O CORPO da mensagem do planejador (`CentralAlertasClient`) virou
 * `montarMensagemAlerta`; o botão compacto mantém o corpo PRÓPRIO (texto
 * diferente, de propósito — é outra tela) e usa só `CABECALHOS_ALERTA`.
 */

/** Assuntos de alerta — fechados de propósito; um tipo novo entra aqui. */
export type TipoAssuntoAlerta =
  | "contrato"
  | "pl"
  | "convenio"
  | "clima"
  | "reparacao"
  | "licenciamento"
  | "contato"
  | "resumo_pagina";

/** Cabeçalho de cada assunto. A chave é o `?tipo=` que circula nas URLs. */
export const CABECALHOS_ALERTA: Record<TipoAssuntoAlerta, string> = {
  contrato: "💼 *ALERTA DE CONTRATO PÚBLICO*",
  pl: "📜 *ALERTA LEGISLATIVO — CÂMARA / CONGRESSO*",
  convenio: "🤝 *ALERTA DE REPASSE & CONVÊNIO*",
  clima: "🌧️ *AVISO DE RISCO SOCIOAMBIENTAL*",
  reparacao: "⚖️ *ACOMPANHAMENTO DE REPARAÇÃO*",
  licenciamento: "🌿 *ALERTA DE LICENCIAMENTO AMBIENTAL*",
  contato: "📞 *CANAL INSTITUCIONAL & CONTATOS ÚTEIS*",
  resumo_pagina: "📊 *DADOS PÚBLICOS & FISCALIZAÇÃO CIDADÃ*",
};

/** Cabeçalho do assunto, ou `fallback` quando o tipo não está no mapa. */
export function cabecalhoDeAlerta(tipo: TipoAssuntoAlerta, fallback: string): string {
  return CABECALHOS_ALERTA[tipo] || fallback;
}

export interface DadosMensagemAlerta {
  tipo: TipoAssuntoAlerta;
  /** Ex.: "Betim, MG". */
  orgao: string;
  titulo: string;
  /** Identificação oficial: "Processo COPAM nº 0842/2026". */
  identificador: string;
  link: string;
  detalhes: string;
  /** Bloco já formatado (uma linha por contato); vazio não entra. */
  telefones?: string;
}

/**
 * Mensagem do PLANEJADOR (`/alertas`), em formato WhatsApp. Devolve texto
 * pronto para `encodeURIComponent` — sem HTML, sem rede.
 */
export function montarMensagemAlerta(d: DadosMensagemAlerta): string {
  const cabecalho = cabecalhoDeAlerta(d.tipo, "🔔 *ALERTA CIDADÃO*");
  let texto = `${cabecalho}
📍 *Território / Órgão:* ${d.orgao}
📌 *Assunto:* ${d.titulo}
🔢 *Identificação Oficial:* ${d.identificador}

🔎 *Detalhes para fiscalização:*
${d.detalhes}`;

  if (d.telefones) {
    texto += `\n\n📞 *Telefones e Contatos para Acionar:*\n${d.telefones}`;
  }

  texto += `\n\n🔗 *Confira a comprovação completa com dados oficiais:*
${d.link}

_Fonte: Dados públicos oficiais organizados pelo portal independente Controle Popular (controlepopular.com.br). Compartilhe com quem precisa saber!_`;

  return texto;
}
