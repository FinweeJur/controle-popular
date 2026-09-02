#!/usr/bin/env node
/**
 * scripts/relatar-gemini.mts
 * Envia relatório de avanço do agente Gemini / Antigravity para o Telegram do dono.
 * Identifica explicitamente [Gemini] no cabeçalho e detalha o que avançou com emojis.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_PATH = path.join(RAIZ, "scripts", ".env");

function carregarEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/)) {
    const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

carregarEnv();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DONO = process.env.TELEGRAM_CHAT_ID;

if (!TOKEN || !DONO) {
  console.error("TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID ausentes em scripts/.env");
  process.exit(1);
}

const mensagemPadrao = `🤖 <b>[Gemini] Relatório de Avanço: Frentes "Nossos", Sanfonas e Cidades</b>

✅ <b>Expansão de Cidades e Territórios Concluída:</b>
• <b>6 Cidades Iniciais 100% Curadas:</b> Diamantina (Biribiri/Concessão), Betim (Paraopeba/Indústria), BH (Rio das Velhas/Serras/Tribunais), Araçuaí (Lítio/Emendas), Itinga (Cerâmica/Tradição) e São Paulo (Cantareira/Billings/Bancada Federal).
• <b>Capitais Foco Sudeste:</b> Rio de Janeiro (Sistema Guandu/Tijuca/Baía) e Vitória (Foz do Rio Doce/Manguezais/Portos).
• <b>Polos Estratégicos do Interior:</b> Brumadinho, Mariana, Governador Valadares, Ouro Preto, Montes Claros, Uberlândia e Juiz de Fora.
• <b>Motor Universal Automático:</b> Implementado <code>gerarPontesAutomaticas()</code> que cruza o código IBGE de qualquer um dos 853 municípios de MG com rios, serras e bancada do Congresso.

👥 <b>Bloco "E nosso povo?" / "E nossa gente?":</b>
Componente ativo conectando preservação ambiental a saúde (SUS), trabalho/renda (pesca/artesanato), moradia e cultura.

🏛️ <b>Próximo Passo Mapeado no Plano:</b>
Integração dos Conselhos Sociais (PCTs, Direitos Humanos, Idoso, Criança/Adolescente e Defesa Social) com canais de denúncia, contatos e atas.

🧪 <b>Testes e Commits:</b>
16 testes unitários verdes (<code>lib/dialogos.test.ts</code> e <code>lib/lugares.test.ts</code>). Commits realizados com sucesso com pathspec explícito e sem conflitos.`;

const textoBruto = process.argv.slice(2).join(" ").trim() || mensagemPadrao;
const texto = textoBruto.replace(/<br\s*\/?>/gi, "\n");

async function enviar() {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: DONO,
      text: texto,
      parse_mode: "HTML",
    }),
  });

  if (res.ok) {
    console.log("✅ Relatório do Gemini enviado com sucesso para o Telegram!");
  } else {
    const erro = await res.text();
    console.error(`❌ Erro HTTP ${res.status}: ${erro}`);
    process.exit(1);
  }
}

enviar().catch((e) => {
  console.error("❌ Falha:", e);
  process.exit(1);
});
