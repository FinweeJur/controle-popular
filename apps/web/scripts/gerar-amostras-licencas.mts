/**
 * gerar-amostras-licencas.mts — gera as amostras versionadas dos acervos de
 * licença/outorga (`apps/web/data/amostras/<arquivo>`), usadas pelo build do
 * Guara no lugar dos JSON completos.
 *
 * POR QUE EXISTE: o contexto de build do Guara tem teto de 256 MB e os 18
 * JSON de licença somam ~114 MB. A página /ambiental/licencas publica só a
 * janela de cada órgão (licencas-arquivos.ts), então a amostra — mesmos
 * metadados (total real, ressalva editorial, truncado), só as primeiras N
 * linhas — produz EXATAMENTE a mesma página. O JSON completo fica no repo
 * (fonte da verdade, atualizado pelos coletores), mas fora do contexto de
 * build via .dockerignore.
 *
 * Comportamento no build: entra no prebuild. Na home-pc (arquivo completo
 * presente) regenera a amostra do dado de hoje; no Guara (completo ausente)
 * mantém a amostra versionada e só avisa — nunca falha o build por ausência
 * do dado completo.
 *
 * Uso: npx tsx scripts/gerar-amostras-licencas.mts  (a partir de apps/web)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ARQUIVOS_LICENCAS } from "../lib/ambiental/licencas-arquivos";

const AQUI = path.dirname(fileURLToPath(import.meta.url));

function raizDados(): string {
  // mesmo contrato dos leitores: funciona a partir de apps/web e da raiz
  const a = path.resolve(AQUI, "..", "data");
  if (existsSync(a)) return a;
  return path.resolve(AQUI, "..", "..", "..", "apps", "web", "data");
}

const DADOS = raizDados();
const ALVO = path.join(DADOS, "amostras");
mkdirSync(ALVO, { recursive: true });

let geradas = 0;
let mantidas = 0;

for (const [nome, janela] of Object.entries(ARQUIVOS_LICENCAS)) {
  const completo = path.join(DADOS, nome);
  const amostra = path.join(ALVO, nome);

  if (!existsSync(completo)) {
    if (existsSync(amostra)) {
      mantidas++;
      console.log(`amostras: ${nome} completo ausente (build Guara) — amostra versionada mantida`);
      continue;
    }
    console.warn(`AVISO amostras: ${nome} não existe nem completo nem como amostra — página nascerá vazia para esta fonte`);
    continue;
  }

  const bruto = JSON.parse(readFileSync(completo, "utf-8")) as {
    linhas?: unknown[];
    total?: number;
    [k: string]: unknown;
  };
  const linhas = Array.isArray(bruto.linhas) ? bruto.linhas.slice(0, janela) : [];
  // spread preserva os metadados editoriais: total real, ressalva, truncado,
  // gerado_em, colunas — o que a publicação mostra de "quanto existe" vem daqui.
  const saida = { ...bruto, linhas };
  writeFileSync(amostra, JSON.stringify(saida), "utf-8");
  geradas++;
  console.log(`amostras: ${nome} → ${linhas.length}/${bruto.linhas?.length ?? 0} linhas (janela ${janela})`);
}

console.log(`amostras: ${geradas} gerada(s), ${mantidas} mantida(s) — ${ALVO}`);
