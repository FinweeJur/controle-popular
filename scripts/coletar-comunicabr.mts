/**
 * Coletor do ComunicaBR — indicadores municipais do governo federal.
 *
 * Grava `apps/web/data/comunicabr-<uf>.json` no formato de
 * `apps/web/lib/comunicabr/arquivo.ts`. Não toca em banco: a coleta inteira
 * são requisições GET sem autenticação e um arquivo.
 *
 * Uso:
 *   npx tsx scripts/coletar-comunicabr.mts                 # MG (853 municípios)
 *   npx tsx scripts/coletar-comunicabr.mts --uf 35         # São Paulo
 *   npx tsx scripts/coletar-comunicabr.mts --limite 20     # piloto, 20 municípios
 *   npx tsx scripts/coletar-comunicabr.mts --pausa 800     # mais devagar
 *   npx tsx scripts/coletar-comunicabr.mts --recomecar     # ignora o que já foi coletado
 *   npx tsx scripts/coletar-comunicabr.mts --seco          # mede e não grava
 *
 * ═══ O QUE O COLETOR NUNCA PODE FAZER: CONFIAR NO 200 ═══
 *
 * Esta API responde **HTTP 200 com 102,8 KB de esqueleto vazio** quando não
 * reconhece o código — inclusive quando se manda o IBGE de 7 dígitos que o
 * resto do portal usa (Betim é `310670` aqui, e `3106200` no IBGE). Foi assim
 * que uma medição anterior concluiu que "o dado municipal não vem pela API":
 * 17 categorias, 66 subindicadores, 132 itens, tudo nulo, status 200.
 *
 * Por isso a validação não é do status, é de `nome_ibge` — feita em
 * `lerRespostaComunicaBR`, e o município recusado vai para `recusados` **com
 * motivo**, nunca some. O coletor também não inventa código: pega a lista de
 * `/api/v1/municipios/{uf}`, cujos `id` já são os 6 dígitos certos.
 *
 * ═══ POR QUE RETOMADA, SE SÃO SÓ 853 REQUISIÇÕES ═══
 *
 * Porque o custo de uma interrupção não é o tempo, é a tentação de baixar de
 * novo o que já se tem. O arquivo é regravado a cada 25 municípios e relido no
 * início: quem estiver lá não é pedido outra vez. Uma coleta interrompida na
 * metade continua de onde parou, e uma coleta repetida no dia seguinte só paga
 * pelo que falta (`--recomecar` força tudo).
 *
 * ═══ EDUCAÇÃO COM O SERVIDOR ═══
 *
 * Uma requisição por vez, `--pausa` de 400 ms entre elas (medi 340–800 ms de
 * resposta em 6 municípios, então a pausa mais que dobra o intervalo real), e
 * User-Agent que diz quem está pedindo e para quê. Serviço do governo pago com
 * dinheiro público não é motivo para paralelismo: 853 requisições sequenciais
 * levam menos de 20 minutos e não pesam para ninguém.
 *
 * ═══ RESSALVA QUE VAI GRAVADA NO ARQUIVO ═══
 *
 * O ComunicaBR é comunicação de governo sobre a própria atuação. O campo
 * `fonte` de cada item traz o ministério que declarou o número, e é ele que a
 * tela deve citar. Não é execução orçamentária auditada — para isso existem o
 * Portal da Transparência e o SIAFI, e o próprio portal remete a eles.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  type ArquivoComunicaBR,
  type Esqueleto,
  type MunicipioCompacto,
  type RecusaComunicaBR,
  Dicionario,
  compactarMunicipio,
  expandirArquivo,
  impressaoDoEsqueleto,
  medirCoberturaUF,
  montarEsqueleto,
} from "../apps/web/lib/comunicabr/arquivo.ts";
import {
  RESSALVA_COMUNICABR,
  ehCodigoIbgeComunicaBR,
  lerRespostaComunicaBR,
} from "../apps/web/lib/comunicabr/indicadores.ts";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const BASE = "https://comunicabr.presidencia.gov.br";
const AGENTE = "ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)";

/** Lê `--chave valor` da linha de comando. */
function opcao(nome: string, padrao: number): number {
  const i = process.argv.indexOf(`--${nome}`);
  if (i < 0) return padrao;
  const v = Number(process.argv[i + 1]);
  return Number.isFinite(v) ? v : padrao;
}

const UF = opcao("uf", 31); // 31 = Minas Gerais
const PAUSA_MS = opcao("pausa", 400);
const LIMITE = opcao("limite", Number.POSITIVE_INFINITY);
const RECOMECAR = process.argv.includes("--recomecar");
const SECO = process.argv.includes("--seco");

const DESTINO = resolve(RAIZ, `apps/web/data/comunicabr-${UF}.json`);

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET com 3 tentativas e espera crescente.
 *
 * Distingue **erro de transporte** (rede, 5xx — vale tentar de novo) de
 * **resposta ruim de conteúdo** (que é problema de interpretação e se resolve
 * em `lerRespostaComunicaBR`, não em retentativa).
 */
async function buscarJson(url: string): Promise<unknown> {
  let ultimo = "";
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": AGENTE, Accept: "application/json" } });
      if (!res.ok) {
        ultimo = `HTTP ${res.status}`;
        if (res.status < 500) throw new Error(ultimo);
      } else {
        return (await res.json()) as unknown;
      }
    } catch (e) {
      ultimo = e instanceof Error ? e.message : String(e);
    }
    if (tentativa < 3) await dormir(1000 * tentativa);
  }
  throw new Error(`falhou 3x: ${ultimo} — ${url}`);
}

interface MunicipioDaLista {
  id: number;
  nome: string;
}

async function listarMunicipios(uf: number): Promise<MunicipioDaLista[]> {
  const corpo = (await buscarJson(`${BASE}/api/v1/municipios/${uf}`)) as { data?: unknown };
  const lista = Array.isArray(corpo?.data) ? corpo.data : [];
  const saida: MunicipioDaLista[] = [];
  for (const bruto of lista) {
    const m = bruto as { id?: unknown; nome?: unknown };
    // A guarda que vale a coleta inteira: só entra código que ESTA API aceita.
    // Um `id` de 7 dígitos aqui viraria 853 respostas 200 e vazias.
    if (typeof m.id === "number" && ehCodigoIbgeComunicaBR(m.id) && typeof m.nome === "string") {
      saida.push({ id: m.id, nome: m.nome });
    }
  }
  return saida;
}

/** Estado acumulado — é ele que a retomada relê e o gravador escreve. */
interface Estado {
  dic: Dicionario;
  esqueletos: Esqueleto[];
  /** Impressão da estrutura -> índice em `esqueletos`. */
  impressoes: Map<string, number>;
  municipios: MunicipioCompacto[];
  recusados: RecusaComunicaBR[];
  duracaoAnterior: number;
}

function estadoInicial(): Estado {
  return {
    dic: new Dicionario(),
    esqueletos: [],
    impressoes: new Map(),
    municipios: [],
    recusados: [],
    duracaoAnterior: 0,
  };
}

/**
 * Relê o arquivo anterior para retomar.
 *
 * Reconstrói as impressões a partir dos esqueletos gravados **expandindo os
 * municípios**, e não confiando na ordem: é a mesma função que a coleta usa
 * para decidir se a estrutura mudou, então retomada e coleta nova não podem
 * discordar.
 */
function retomar(): Estado {
  if (RECOMECAR || !existsSync(DESTINO)) return estadoInicial();
  let arq: ArquivoComunicaBR;
  try {
    arq = JSON.parse(readFileSync(DESTINO, "utf-8")) as ArquivoComunicaBR;
  } catch {
    console.log("arquivo anterior ilegivel — recomecando do zero");
    return estadoInicial();
  }
  if (arq.uf !== UF) return estadoInicial();

  const estado: Estado = {
    dic: new Dicionario(arq.rotulos),
    esqueletos: arq.esqueletos,
    impressoes: new Map(),
    municipios: arq.municipios,
    recusados: arq.recusados ?? [],
    duracaoAnterior: arq.duracao_s ?? 0,
  };
  for (const m of expandirArquivo(arq)) {
    const compacto = arq.municipios.find((x) => x.cod === m.codigoIbge);
    if (compacto) estado.impressoes.set(impressaoDoEsqueleto(m), compacto.esq);
  }
  return estado;
}

function gravar(estado: Estado, duracaoS: number): void {
  if (SECO) return;
  const arquivo: ArquivoComunicaBR = {
    gerado_em: new Date().toISOString(),
    uf: UF,
    fonte: `${BASE}/api/v2/indicadores`,
    ressalva: RESSALVA_COMUNICABR,
    duracao_s: Math.round(estado.duracaoAnterior + duracaoS),
    rotulos: estado.dic.rotulos,
    esqueletos: estado.esqueletos,
    municipios: [...estado.municipios].sort((a, b) => a.cod - b.cod),
    recusados: [...estado.recusados].sort((a, b) => a.codigo - b.codigo),
  };
  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(DESTINO, JSON.stringify(arquivo), "utf-8");
}

async function principal(): Promise<void> {
  const inicio = Date.now();
  const estado = retomar();

  const lista = await listarMunicipios(UF);
  console.log(`UF ${UF}: ${lista.length} municipios na lista da API`);

  const jaTem = new Set(estado.municipios.map((m) => m.cod));
  const recusadosAntes = new Set(estado.recusados.map((r) => r.codigo));
  const pendentes = lista.filter((m) => !jaTem.has(m.id) && !recusadosAntes.has(m.id)).slice(0, LIMITE);
  console.log(
    `ja coletados: ${jaTem.size} | recusados antes: ${recusadosAntes.size} | a pedir agora: ${pendentes.length}` +
      (SECO ? " | MODO SECO (nao grava)" : "")
  );

  let feitos = 0;
  for (const alvo of pendentes) {
    let corpo: unknown;
    try {
      corpo = await buscarJson(`${BASE}/api/v2/indicadores?codigo_ibge=${alvo.id}`);
    } catch (e) {
      // Falha de transporte NÃO vira recusa: recusa é veredito sobre o
      // conteúdo. Deixar de fora significa que a próxima execução tenta de
      // novo, que é o certo para erro de rede.
      console.log(`  ! ${alvo.id} ${alvo.nome}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const lido = lerRespostaComunicaBR(corpo, alvo.id);
    if (!lido.ok) {
      estado.recusados.push({ codigo: alvo.id, nome: alvo.nome, motivo: lido.motivo, detalhe: lido.detalhe });
      console.log(`  x ${alvo.id} ${alvo.nome}: ${lido.motivo} (${lido.detalhe})`);
    } else {
      const m = lido.municipio;
      const impressao = impressaoDoEsqueleto(m);
      let idx = estado.impressoes.get(impressao);
      if (idx === undefined) {
        idx = estado.esqueletos.length;
        estado.esqueletos.push(montarEsqueleto(m, estado.dic));
        estado.impressoes.set(impressao, idx);
        console.log(`  + esqueleto novo (#${idx}) visto em ${m.nomeIbge}`);
      }
      estado.municipios.push(compactarMunicipio(m, idx, estado.dic));
    }

    feitos++;
    if (feitos % 25 === 0) {
      gravar(estado, (Date.now() - inicio) / 1000);
      console.log(`  ... ${feitos}/${pendentes.length} (${Math.round((Date.now() - inicio) / 1000)}s)`);
    }
    await dormir(PAUSA_MS);
  }

  const duracaoS = (Date.now() - inicio) / 1000;
  gravar(estado, duracaoS);

  // Relê pelo próprio codec, e não pela memória: a medição do relatório tem de
  // sair do arquivo que foi gravado, senão ela mede o que eu quis escrever.
  const expandidos = SECO
    ? []
    : expandirArquivo(JSON.parse(readFileSync(DESTINO, "utf-8")) as ArquivoComunicaBR);
  const cobertura = medirCoberturaUF(expandidos, lista.length, estado.recusados.length);

  console.log("");
  console.log(`gravado: ${SECO ? "(seco)" : DESTINO}`);
  console.log(`municipios com resposta: ${cobertura.municipiosComResposta} de ${cobertura.municipiosPedidos}`);
  console.log(`recusados: ${cobertura.municipiosRecusados} | sem nenhum valor: ${cobertura.municipiosSemNenhumValor}`);
  console.log(`itens: ${cobertura.itens} | com valor: ${cobertura.itensComValor} | vazios: ${cobertura.itensVazios}`);
  console.log(`esqueletos distintos: ${estado.esqueletos.length}`);
  console.log(`ministerios declarados: ${cobertura.fontes.length} (${cobertura.fontes.join(", ")})`);
  console.log(`tempo desta execucao: ${Math.round(duracaoS)}s`);

  const vazias = Object.entries(cobertura.vaziosPorCategoria)
    .map(([cat, vazios]) => ({ cat, vazios, itens: cobertura.itensPorCategoria[cat] ?? 0 }))
    .filter((x) => x.itens > 0)
    .sort((a, b) => b.vazios / b.itens - a.vazios / a.itens);
  console.log("\ncategoria | itens | vazios | % vazio");
  for (const v of vazias) {
    console.log(`${v.cat} | ${v.itens} | ${v.vazios} | ${((100 * v.vazios) / v.itens).toFixed(1)}%`);
  }
}

await principal();
