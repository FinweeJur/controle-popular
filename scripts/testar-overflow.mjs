/**
 * Auditor automatizado de overflow horizontal em mobile (375x812).
 * Conecta via Chrome DevTools Protocol (CDP) usando fetch/WebSocket nativos do Node.
 * Detecta qualquer página ou elemento que extrapole 375px de largura.
 */

import { spawn } from "node:child_process";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const BASE_URL = "http://localhost:3027";

const ROTAS = [
  "/",
  "/indice",
  "/central",
  "/direitos-em-movimento",
  "/terra-e-territorios",
  "/estado-e-economia",
  "/ambiental",
  "/ambiental/car",
  "/ambiental/capacidade-institucional",
  "/cidades",
  "/betim",
  "/busca",
  "/noticias",
  "/editais",
  "/funcaosocialterra/mapa",
  "/laboratorio",
  "/empresas",
  "/assembleias",
  "/assembleias/mg",
];

async function main() {
  console.log("🚀 Iniciando Chrome Headless com porta CDP...");
  const chrome = spawn(CHROME_PATH, [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    `--remote-debugging-port=${PORT}`,
    "--window-size=375,812",
  ]);

  // Aguarda Chrome inicializar
  await new Promise((r) => setTimeout(r, 2000));

  try {
    const listRes = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    const tabs = await listRes.json();
    console.log(`📡 Conectado ao Chrome CDP (${tabs.length} abas encontradas).\n`);

    for (const rota of ROTAS) {
      const url = `${BASE_URL}${rota}`;
      
      // Cria uma nova aba para a rota usando PUT
      const newTabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
      const tab = await newTabRes.json();

      // Conecta ao WebSocket da aba
      const ws = new WebSocket(tab.webSocketDebuggerUrl);

      await new Promise((resolveWs) => {
        let msgId = 1;
        const pending = new Map();

        function send(method, params = {}) {
          const id = msgId++;
          return new Promise((res) => {
            pending.set(id, res);
            ws.send(JSON.stringify({ id, method, params }));
          });
        }

        ws.onopen = async () => {
          // Emula viewport mobile
          await send("Emulation.setDeviceMetricsOverride", {
            width: 375,
            height: 812,
            deviceScaleFactor: 2,
            mobile: true,
          });

          // Aguarda página carregar
          await new Promise((r) => setTimeout(r, 2000));

          // Avalia se há overflow horizontal
          const evalRes = await send("Runtime.evaluate", {
            expression: `(() => {
              const docWidth = document.documentElement.scrollWidth;
              const winWidth = window.innerWidth;
              const hasOverflow = docWidth > winWidth;
              const overflowingElements = [];

              if (hasOverflow) {
                const all = document.querySelectorAll('*');
                for (const el of all) {
                  const rect = el.getBoundingClientRect();
                  if (rect.right > winWidth + 1) {
                    overflowingElements.push({
                      tag: el.tagName.toLowerCase(),
                      className: (el.className || '').toString().slice(0, 80),
                      id: el.id,
                      rectRight: Math.round(rect.right),
                      width: Math.round(rect.width)
                    });
                    if (overflowingElements.length >= 5) break;
                  }
                }
              }

              return {
                docWidth,
                winWidth,
                hasOverflow,
                overflowingElements
              };
            })()`,
            returnByValue: true,
          });

          const data = evalRes?.result?.result?.value;
          if (data) {
            if (data.hasOverflow) {
              console.log(`⚠️ [OVERFLOW DETECTADO] ${rota} (doc: ${data.docWidth}px > win: ${data.winWidth}px)`);
              for (const el of data.overflowingElements) {
                console.log(`   👉 <${el.tag}> class="${el.className}" width=${el.width}px right=${el.rectRight}px`);
              }
            } else {
              console.log(`✅ [OK 375px] ${rota} (largura doc: ${data.docWidth}px)`);
            }
          }

          // Fecha a aba
          await fetch(`http://127.0.0.1:${PORT}/json/close/${tab.id}`);
          ws.close();
          resolveWs();
        };

        ws.onmessage = (event) => {
          const res = JSON.parse(event.data);
          if (res.id && pending.has(res.id)) {
            pending.get(res.id)(res);
            pending.delete(res.id);
          }
        };

        ws.onerror = () => {
          resolveWs();
        };
      });
    }
  } finally {
    chrome.kill();
    console.log("\n🏁 Auditoria de overflow concluída.");
  }
}

main().catch(console.error);
