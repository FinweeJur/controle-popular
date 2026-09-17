import { NextResponse } from "next/server";

/**
 * Webhook do Telegram — controlepopular.com.br/api/telegram
 *
 * Recebe atualizações (mensagens, callbacks) da Telegram via POST e responde
 * com as respostas pré-configadas (botões inline, menus, etc.).
 * GET serve para verificação rápida do endpoint.
 *
 * Configurar com:
 *   setWebhook("https://controlepopular.com.br/api/telegram", {secret_token: "..."})
 */

// ── FRONTES PRÉ-CONFIGURADAS ──────────────────────────────────────────────────

const FRONTES = {
  ambiental: {
    label: "🌍 Meio Ambiente (ONSA)",
    desc: "Monitoramento ambiental: licenciamento, barragens, COPAM, crimes socioambientais. Dados públicos de MG, MT e federais.",
    link: "https://controlepopular.com.br/ambiental",
    subfrentes: [
      { label: "📋 Licenciamento Ambiental", link: "https://controlepopular.com.br/ambiental/licenciamento", desc: "Licenciamento SIGBM/ANM, fiscalização IBAMA-MG, SEMA-MT, outorgas IGAM-MG." },
      { label: "🏗️ Barragens", link: "https://controlepopular.com.br/ambiental/barragens", desc: "Inventário SIGBM/ANM de barragens de Minas Gerais com classificação de risco." },
      { label: "📖 COPAM", link: "https://controlepopular.com.br/ambiental/copam", desc: "Atas, reuniões e processos de licenciamento da COPAM-MG." },
      { label: "🔍 Crimes Socioambientais", link: "https://controlepopular.com.br/ambiental/crimes-socioambientais", desc: "Casos de danos ambientais: Brumadinho, Mariana, negligência, desmatamento." },
    ],
  },
  cidades: {
    label: "🏙️ Cidades",
    desc: "Dados de 5.571 municípios brasileiros (IBGE/Censo). Ranking, microresumos e indicadores sociais.",
    link: "https://controlepopular.com.br/cidades",
    subfrentes: [
      { label: "📊 Ranking Nacional", link: "https://controlepopular.com.br/cidades/ranking", desc: "Ranking de todos os municípios brasileiros por população, PIB, área, IDH." },
      { label: "🔍 Pesquisar Município", link: "https://controlepopular.com.br/cidades/pesquisar", desc: "Busca por nome ou código IBGE de qualquer município brasileiro." },
    ],
  },
  congresso: {
    label: "🏛️ Congresso",
    desc: "Proposições federais, parlamentares, orçamento público, Lei Rouanet, PPP e licitações.",
    link: "https://controlepopular.com.br/congresso",
    subfrentes: [
      { label: "📜 Proposições", link: "https://controlepopular.com.br/congresso/proposicoes", desc: "PL, PLP, PEC, MP, PUC em tramitação. Autor, sumaário e andamento." },
      { label: "💰 Orçamento", link: "https://controlepopular.com.br/congresso/orcamento", desc: "Emendas parlamentares, dotações e execução por ministério." },
      { label: "🤝 Lei Rouanet", link: "https://controlepopular.com.br/congresso/rouanet", desc: "Contratos, repasses, incentivadores e fornecedores do programa." },
    ],
  },
  judiciario: {
    label: "⚖️ Judiciário",
    desc: "Decisões judiciais, processos, tribunais. TJ-MG, CNJ, STF, ADPF e consultas públicas.",
    link: "https://controlepopular.com.br/judiciario",
    subfrentes: [
      { label: "⚖️ Decisões", link: "https://controlepopular.com.br/judiciario/decisoes", desc: "Decisões públicas: TJ-MG, CNJ, STF. Texto, data, órgão, relator." },
      { label: "📋 Processos", link: "https://controlepopular.com.br/judiciario/processos", desc: "Ações, denúncias e consultas públicas em tramitação." },
    ],
  },
  terra: {
    label: "🌄 Terra e Territórios",
    desc: "Soberania socioambiental: 203 cidades estratégicas, bacias, terras indígenas, serras e biomas.",
    link: "https://controlepopular.com.br/terra-e-territorios",
    subfrentes: [
      { label: "🏙️ 199 Cidades Estratégicas", link: "https://controlepopular.com.br/terra-e-territorios/cidades", desc: "27 capitais e 172 polos regionais. Saúde, educação e finanças de cada município." },
      { label: "🌍 Meio Ambiente (ONSA)", link: "https://controlepopular.com.br/ambiental", desc: "Licenciamento, COPAM, TACs e barragens SIGBM." },
      { label: "🛡️ Terras Indígenas e Quilombolas", link: "https://controlepopular.com.br/funcaosocialterra", desc: "Demarcações, sobreposições de mineração e defesa de povos originários." },
      { label: "⛰️ Nossas Serras", link: "https://controlepopular.com.br/nossas-serras", desc: "Preservação de topos de morro e contenção da expansão minerária predatória." },
      { label: "🌊 Nossos Rios e Bacias", link: "https://controlepopular.com.br/nossos-rios", desc: "Qualidade das águas, desastres (Rio Doce, Paraopeba) e saneamento." },
      { label: "🧭 Biomas e Biodiversidade", link: "https://controlepopular.com.br/biomas", desc: "Cerrado, Mata Atlântica, Caatinga e Amazônia: risco climático e preservação." },
    ],
  },
  estado: {
    label: "🏛️ Estado e Economia",
    desc: "Transparência institucional, orçamento público, contratos, Judiciário e poder econômico.",
    link: "https://controlepopular.com.br/estado-e-economia",
    subfrentes: [
      { label: "⚖️ Judiciário e Justiça", link: "https://controlepopular.com.br/estado-e-economia/judiciario", desc: "Composição de tribunais, vagas, remunerações e inspeções do CNJ." },
      { label: "📜 Congresso e Legislação", link: "https://controlepopular.com.br/estado-e-economia/congresso", desc: "Proposições, votações nominais, comissões temáticas e bancadas estaduais." },
      { label: "📋 Executivo e Políticas", link: "https://controlepopular.com.br/estado-e-economia/executivo", desc: "Atos oficiais, diários municipais, nomeações e programas de governo." },
      { label: "🏢 Empresas e Mercado", link: "https://controlepopular.com.br/estado-e-economia/empresas", desc: "Sócios, conglomerados, concentração de fornecedores e mineradoras." },
      { label: "💰 Orçamento Público", link: "https://controlepopular.com.br/estado-e-economia/orcamento", desc: "Dotação vs. execução financeira, transferências e indicadores BCB." },
      { label: "🔍 Transparência e Controle Social", link: "https://controlepopular.com.br/estado-e-economia/transparencia", desc: "LAI, alertas do TCU e fiscalização cidadã." },
    ],
  },
  direitos: {
    label: "❤️ Direitos em Movimento",
    desc: "Saúde pública, educação, trabalho e renda, segurança alimentar, moradia e acesso à justiça.",
    link: "https://controlepopular.com.br/direitos-em-movimento",
    subfrentes: [
      { label: "💼 Trabalho e Renda", link: "https://controlepopular.com.br/direitos-em-movimento/trabalho-e-renda", desc: "Emprego formal, admissões CAGED, estoques RAIS e impacto de contratos públicos." },
      { label: "🏥 Saúde Pública", link: "https://controlepopular.com.br/direitos-em-movimento/saude-publica", desc: "SUS, estabelecimentos CNES, leitos e internações SIH." },
      { label: "📚 Educação", link: "https://controlepopular.com.br/direitos-em-movimento/educacao", desc: "Infraestrutura escolar, matrículas do Censo Escolar e IDEB por município." },
      { label: "🍎 Segurança Alimentar", link: "https://controlepopular.com.br/direitos-em-movimento/seguranca-alimentar", desc: "Programas de transferência, vulnerabilidade nutricional e agricultura familiar." },
      { label: "🏠 Moradia e Habitação", link: "https://controlepopular.com.br/direitos-em-movimento/moradia", desc: "Déficit habitacional, regularização fundiária urbana e prevenção de remoções." },
      { label: "⚖️ Acesso à Justiça e Denúncias", link: "https://controlepopular.com.br/direitos-em-movimento/acesso-a-justica", desc: "Defensoria Pública, canais de denúncia e assistência jurídica comunitária." },
    ],
  },
};

// ── Respostas pré-configadas ──────────────────────────────────────────────────

function menuBotões(): Array<Array<{ text: string; callback_data: string }>> {
  return [
    [
      { text: "🌍 Meio Ambiente", callback_data: "frente_ambiental" },
      { text: "🏙️ Cidades", callback_data: "frente_cidades" },
      { text: "🏛️ Congresso", callback_data: "frente_congresso" },
      { text: "⚖️ Judiciário", callback_data: "frente_judiciario" },
    ],
    [
      { text: "🌄 Terra e Territórios", callback_data: "eixo_terra" },
      { text: "🏛️ Estado e Economia", callback_data: "eixo_estado" },
      { text: "❤️ Direitos em Movimento", callback_data: "eixo_direitos" },
    ],
  ];
}

function menuTexto(): string {
  return "📋 <b>Menu — Controle Popular</b>\n\n" +
    "<b>Frentes de Dados:</b>\n" +
    "🌍 Meio Ambiente (ONSA) — licenciamento, barragens, COPAM, crimes socioambientais\n" +
    "🏙️ Cidades — 5.571 municípios (IBGE/Censo), ranking, microresumos\n" +
    "🏛️ Congresso — proposições, parlamentares, orçamento, Lei Rouanet\n" +
    "⚖️ Judiciário — decisões, processos, TJ-MG, CNJ, STF\n\n" +
    "<b>Eixos Temáticos:</b>\n" +
    "🌄 Terra e Territórios — 203 cidades, bacias, terras indígenas, biomas\n" +
    "🏛️ Estado e Economia — transparência, contratos, Judiciário, orçamento\n" +
    "❤️ Direitos em Movimento — saúde, educação, trabalho, moradia, justiça\n\n" +
    "Clique em uma opção ou use os comandos:\n" +
    "/ambiental, /cidades, /congresso, /judiciario, /terra, /estado, /direitos";
}

function subfrenteResposta(slug: keyof typeof FRONTES): { text: string; reply_markup: { inline_keyboard: Array<Array<{ text: string; url: string }>> } } | null {
  const f = FRONTES[slug];
  if (!f) return null;

  return {
    text: `🔍 <b>${f.label}</b>\n\n${f.desc}\n\n` +
      f.subfrentes.map(s => `• <a href="${s.link}">${s.label}</a> — ${s.desc}`).join("\n\n") +
      `\n\n🔗 <a href="${f.link}">Ver ${f.label}</a>`,
    reply_markup: { inline_keyboard: f.subfrentes.map(s => [{ text: s.label, url: s.link }]) },
  };
}

// ── POST: webhook ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Validar secret_token (se configurado)
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && secretHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  let update;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const chatId = getChatId(update);
  if (!chatId) return NextResponse.json({}); // sem chat, ignorar

  // ── Callback query (clique em botão inline) ───────────────────────────────
  const cb = update.callback_query as { id: string; data?: string; message?: { chat?: { id?: number } } } | undefined;
  if (cb?.data) {
    const resposta = callbackParaResposta(cb.data.trim().toLowerCase());
    if (resposta) {
      await sendTelegram(chatId, resposta);
      // Confirmar o callback (evita indicador de loading)
      if (cb.id && process.env.TELEGRAM_BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cb.id, show_alert: false, text: "✅" }),
        }).catch(() => {});
      }
    }
    return NextResponse.json({});
  }

  // ── Mensagem de texto ──────────────────────────────────────────────────────
  const msg = update.message as { text?: string; chat?: { id?: number } } | undefined;
  if (msg?.text) {
    const cmd = msg.text.trim().split(/\s+/)[0].toLowerCase();
    const resposta = comandoParaResposta(cmd);
    await sendTelegram(chatId, resposta);
  }

  return NextResponse.json({});
}

// ── GET: status ─────────────────────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: "online",
    endpoint: "https://controlepopular.com.br/api/telegram",
    descricao: "Webhook do Telegram Bot — Controle Popular",
    comandos: ["/menu", "/ambiental", "/cidades", "/congresso", "/judiciario", "/terra", "/estado", "/direitos"],
    frentes: Object.keys(FRONTES),
    atualizado: new Date().toISOString(),
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getChatId(update: Record<string, unknown>): string | null {
  const cb = update.callback_query as { message?: { chat?: { id?: number } } } | undefined;
  const msg = update.message as { chat?: { id?: number } } | undefined;
  const id = (cb?.message?.chat?.id ?? msg?.chat?.id) as number | undefined;
  return id ? String(id) : null;
}

function callbackParaResposta(data: string) {
  const menu = { text: menuTexto(), reply_markup: { inline_keyboard: menuBotões() } };
  const map: Record<string, { text: string; reply_markup: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> } }> = {
    menu,
    frente_ambiental: subfrenteResposta("ambiental") ?? menu,
    frente_cidades: subfrenteResposta("cidades") ?? menu,
    frente_congresso: subfrenteResposta("congresso") ?? menu,
    frente_judiciario: subfrenteResposta("judiciario") ?? menu,
    eixo_terra: subfrenteResposta("terra") ?? menu,
    eixo_estado: subfrenteResposta("estado") ?? menu,
    eixo_direitos: subfrenteResposta("direitos") ?? menu,
  };
  return map[data] ?? menu;
}

function comandoParaResposta(cmd: string) {
  const menu = { text: menuTexto(), reply_markup: { inline_keyboard: menuBotões() } };
  const map: Record<string, { text: string; reply_markup: { inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>> } }> = {
    "/menu": menu,
    "/": menu,
    "/ambiental": subfrenteResposta("ambiental") ?? menu,
    "/cidades": subfrenteResposta("cidades") ?? menu,
    "/congresso": subfrenteResposta("congresso") ?? menu,
    "/judiciario": subfrenteResposta("judiciario") ?? menu,
    "/terra": subfrenteResposta("terra") ?? menu,
    "/estado": subfrenteResposta("estado") ?? menu,
    "/direitos": subfrenteResposta("direitos") ?? menu,
  };
  return map[cmd] ?? menu;
}

async function sendTelegram(chatId: string, resposta: { text: string; reply_markup: Record<string, unknown> }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: resposta.text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
      reply_markup: JSON.stringify(resposta.reply_markup),
    }),
  }).catch(() => {});
}
