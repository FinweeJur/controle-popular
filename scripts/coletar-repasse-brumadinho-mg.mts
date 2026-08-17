/**
 * Coletor do repasse do Acordo de Brumadinho aos 853 municípios de Minas.
 *
 * Grava `apps/web/public/data/repasse-brumadinho-mg.json`, no formato de
 * `apps/web/lib/brumadinho/repasse.ts`. Não toca em banco: é uma requisição
 * GET sem autenticação e um arquivo.
 *
 * Uso:
 *   npx tsx scripts/coletar-repasse-brumadinho-mg.mts
 *   npx tsx scripts/coletar-repasse-brumadinho-mg.mts --seco        # mede, não grava
 *   npx tsx scripts/coletar-repasse-brumadinho-mg.mts --recomecar   # ignora o HTML em cache
 *
 * ═══ RETOMADA, NUMA COLETA DE UMA REQUISIÇÃO SÓ ═══
 *
 * A página inteira são 347.464 bytes numa requisição — não há o que retomar no
 * meio. O que a retomada evita aqui é outra coisa: **pedir de novo o que já se
 * tem**. O HTML fica em `.cache/repasse-brumadinho.html` e é reusado enquanto
 * tiver menos de 12 horas; `--recomecar` força o download.
 *
 * Isso importa porque o desenvolvimento do parser é iterativo — foram várias
 * passagens até fechar os três totais — e cada passagem sem cache seria mais
 * um download de 340 KB de um serviço público, para ler exatamente os mesmos
 * bytes. O cache não é otimização: é a educação com o servidor, aplicada ao
 * único momento em que se pede a mesma coisa muitas vezes.
 *
 * ═══ O QUE ESTE COLETOR NUNCA PODE FAZER ═══
 *
 * **Confiar no 200.** `/pro-brumadinho/noticias` responde 302 com
 * `X-Drupal-Periodo-Eleitoral-Redirect: 1` e, seguindo, 200 numa página que
 * diz que o conteúdo está indisponível. Quem validar status grava zero e
 * reporta sucesso. Aqui quem autoriza gravar é `validarPaginaRepasse()`, que
 * lê o CONTEÚDO — e o cabeçalho de redirecionamento eleitoral, se aparecer,
 * aborta antes disso.
 *
 * **Casar município por nome sem dizer quantos não casaram.** O relatório
 * final imprime casados e não casados por tabela, e os não casados vão
 * gravados no arquivo com motivo. Ver a armadilha 1 em `lib/brumadinho/repasse.ts`.
 *
 * **Se disfarçar.** `robots.txt` permite `/pro-brumadinho`; o User-Agent diz
 * quem está pedindo e para quê, e há pausa entre requisições. Nada disso roda
 * em CI — é coleta manual, com resultado versionado.
 *
 * ═══ CONFERÊNCIA ARITMÉTICA, EM CENTAVOS ═══
 *
 * O coletor aborta se qualquer uma das três somas não bater com o TOTAL
 * impresso na própria tabela, e, na tabela 1, se as três parcelas não somarem
 * o valor total do município. É a conferência que separa "o parser leu" de "o
 * parser leu certo": um seletor errado devolve linhas plausíveis, e só o total
 * denuncia.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  AGENTE_REPASSE,
  PAUSA_MS_REPASSE,
  TABELAS,
  URL_REPASSE,
  type ArquivoRepasse,
  type FonteTabela,
  type RecusaRepasse,
  type RepasseMunicipio,
  indiceDaMalha,
  lerPaginaRepasse,
  malhaMinas,
  normalizarNome,
  validarPaginaRepasse,
} from "../apps/web/lib/brumadinho/repasse.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = resolve(RAIZ, "apps/web");
const DESTINO = resolve(WEB, "public/data/repasse-brumadinho-mg.json");
const CACHE = resolve(RAIZ, ".cache/repasse-brumadinho.html");
const CACHE_VALIDO_MS = 12 * 60 * 60 * 1000;

const SECO = process.argv.includes("--seco");
const RECOMECAR = process.argv.includes("--recomecar");

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));
const brl = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/**
 * Busca a página, com 3 tentativas.
 *
 * `redirect: "manual"` de propósito: seguir o redirecionamento eleitoral
 * devolveria 200 de outra página, e o erro chegaria disfarçado de sucesso
 * lá adiante. Aqui ele chega com nome.
 */
async function baixar(): Promise<string> {
  let ultimo = "";
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await fetch(URL_REPASSE, {
        headers: { "User-Agent": AGENTE_REPASSE, Accept: "text/html" },
        redirect: "manual",
      });
      if (res.headers.get("x-drupal-periodo-eleitoral-redirect")) {
        throw new Error(
          `bloqueio eleitoral do portal (HTTP ${res.status} → ${res.headers.get("location")}). ` +
            `Não é falha de rede: revisitar depois que o TRE oficializar o fim do período.`
        );
      }
      if (res.status >= 300 && res.status < 400) {
        throw new Error(`redirecionamento inesperado para ${res.headers.get("location")}`);
      }
      if (!res.ok) {
        ultimo = `HTTP ${res.status}`;
        if (res.status < 500) throw new Error(ultimo);
      } else {
        return await res.text();
      }
    } catch (e) {
      ultimo = e instanceof Error ? e.message : String(e);
      if (/bloqueio eleitoral/.test(ultimo)) throw e;
    }
    if (tentativa < 3) await dormir(PAUSA_MS_REPASSE * tentativa);
  }
  throw new Error(`falhou 3x: ${ultimo} — ${URL_REPASSE}`);
}

async function html(): Promise<string> {
  if (!RECOMECAR && existsSync(CACHE)) {
    const idade = Date.now() - statSync(CACHE).mtimeMs;
    if (idade < CACHE_VALIDO_MS) {
      const s = readFileSync(CACHE, "utf-8");
      console.log(`cache: ${s.length} bytes, ${Math.round(idade / 60000)} min de idade`);
      return s;
    }
  }
  const s = await baixar();
  mkdirSync(dirname(CACHE), { recursive: true });
  writeFileSync(CACHE, s);
  console.log(`baixado: ${s.length} bytes`);
  return s;
}

/** Data que a própria página declara ter sido atualizada. */
function dataDaFonte(pagina: string): string {
  const m = pagina.match(/(\d{2})\/(\d{2})\/(\d{4})/g) ?? [];
  // A página traz várias datas no corpo (parcelas de 2021 e 2022). A de
  // atualização é a mais recente das que aparecem, e é ela que interessa para
  // saber se a fonte está viva.
  const ordenadas = m
    .map((d) => d.split("/").reverse().join("-"))
    .filter((d) => d >= "2021-01-01" && d <= new Date().toISOString().slice(0, 10))
    .sort();
  return ordenadas.at(-1) ?? "";
}

async function main() {
  const pagina = await html();

  const problema = validarPaginaRepasse(pagina);
  if (problema) throw new Error(`recusei a página: ${problema}`);

  const malha = malhaMinas(WEB);
  if (malha.length !== 853) {
    throw new Error(
      `a malha de Minas veio com ${malha.length} municípios, esperava 853. ` +
        `Sem malha completa o casamento mentiria; ver malhaMinas() em lib/brumadinho/repasse.ts.`
    );
  }
  const indice = indiceDaMalha(malha);
  console.log(`malha: ${malha.length} municípios, ${indice.size} grafias indexadas`);

  const tabelas = lerPaginaRepasse(pagina);

  // ── conferência aritmética, antes de casar nome nenhum ──
  for (const t of tabelas) {
    const soma = t.linhas.reduce((a, l) => a + l.centavos, 0);
    if (t.totalDeclarado === null) throw new Error(`tabela ${t.fonte}: sem linha TOTAL`);
    if (soma !== t.totalDeclarado) {
      throw new Error(
        `tabela ${t.fonte}: somei ${brl(soma)} e a página declara ${brl(t.totalDeclarado)}`
      );
    }
    if (t.fonte === "rateio") {
      for (const l of t.linhas) {
        const p = (l.parcelas ?? [0, 0, 0]).reduce((a, b) => a + b, 0);
        if (p !== l.centavos) {
          throw new Error(
            `${l.nome}: as 3 parcelas somam ${brl(p)} e o total da linha é ${brl(l.centavos)}`
          );
        }
      }
    }
    console.log(
      `tabela ${t.fonte}: ${t.linhas.length} municípios, ${brl(soma)} (bate com o TOTAL)`
    );
  }

  // ── casamento por nome → código IBGE ──
  const porCodigo = new Map<string, RepasseMunicipio>();
  const naoCasaram: RecusaRepasse[] = [];

  for (const t of tabelas) {
    let casados = 0;
    for (const l of t.linhas) {
      const chave = normalizarNome(l.nome);
      const alvo = indice.get(chave);
      if (!alvo) {
        naoCasaram.push({
          fonte: t.fonte,
          nomeNaFonte: l.nome,
          motivo:
            `"${chave}" não é nome de nenhum dos 853 municípios de Minas, nem grafia ` +
            `conhecida em APELIDOS. Não foi aproximado de propósito.`,
        });
        continue;
      }
      casados++;
      let reg = porCodigo.get(alvo.ibge7);
      if (!reg) {
        reg = {
          ibge7: alvo.ibge7,
          nome: alvo.nome,
          nomeNaFonte: l.nome,
          populacao2019: null,
          rateio: null,
          complementares: [],
          centavos: 0,
        };
        porCodigo.set(alvo.ibge7, reg);
      }
      if (t.fonte === "rateio") {
        reg.populacao2019 = l.populacao2019;
        reg.rateio = { centavos: l.centavos, parcelas: l.parcelas ?? [0, 0, 0] };
      } else {
        reg.complementares.push({
          fonte: t.fonte,
          baseLegal: TABELAS[t.fonte].baseLegal,
          centavos: l.centavos,
        });
      }
      reg.centavos += l.centavos;
    }
    console.log(
      `tabela ${t.fonte}: casaram ${casados}/${t.linhas.length}` +
        `, não casaram ${t.linhas.length - casados}`
    );
  }

  for (const r of naoCasaram) console.log(`  ✗ ${r.fonte}: ${r.nomeNaFonte} — ${r.motivo}`);

  const municipios = [...porCodigo.values()].sort((a, b) => a.ibge7.localeCompare(b.ibge7));
  const totalCentavos = municipios.reduce((a, m) => a + m.centavos, 0);
  const somaDeclarada = tabelas.reduce((a, t) => a + (t.totalDeclarado ?? 0), 0);
  const perdido = somaDeclarada - totalCentavos;

  console.log(
    `\nmunicípios distintos: ${municipios.length}` +
      `\ntotal casado:     ${brl(totalCentavos)}` +
      `\ntotal na fonte:   ${brl(somaDeclarada)}` +
      `\nnão atribuído:    ${brl(perdido)} (${naoCasaram.length} linhas recusadas)`
  );

  const arquivo: ArquivoRepasse = {
    gerado_em: new Date().toISOString(),
    fonte_url: URL_REPASSE,
    atualizado_na_fonte: dataDaFonte(pagina),
    tabelas: tabelas.map((t) => ({
      fonte: t.fonte as FonteTabela,
      rotulo: TABELAS[t.fonte].rotulo,
      baseLegal: TABELAS[t.fonte].baseLegal,
      municipios: t.linhas.length,
      centavos: t.totalDeclarado ?? 0,
    })),
    totalCentavos: somaDeclarada,
    municipios,
    naoCasaram,
  };

  if (SECO) {
    console.log("\n--seco: nada gravado.");
    return;
  }
  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify(arquivo, null, 1) + "\n");
  console.log(`\ngravado ${DESTINO} (${statSync(DESTINO).size} bytes)`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
