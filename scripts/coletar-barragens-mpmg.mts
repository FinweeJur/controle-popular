/**
 * Coleta as barragens a montante em descaracterização acompanhadas pelo MPMG
 * (`barragens.mpmg.mp.br`, projeto "Desativando Bombas-relógio", Caoma).
 *
 * ═══ POR QUE ESTA FONTE EXISTE NO PORTAL, E POR QUE ELA NÃO É NOTÍCIA ═══
 *
 * O site é um WordPress de campanha, e a leitura fácil seria tratá-lo como
 * clipping. Não é: medido em 21/08/2026, **cada um dos 45 posts é uma
 * barragem**, não um artigo. Cada post traz empreendedor, município, volume
 * de rejeito, previsão de descaracterização e percentual de andamento —
 * dado estruturado, publicado por quem fiscaliza, e que **não existe assim em
 * nenhum portal do Estado**.
 *
 * Cobertura medida sobre os 45: empreendedor em 45, previsão em 45,
 * andamento em 44, volume em 38, município reconhecido em 40. Os 5 sem
 * município são cidades REAIS (Igarapé, Araxá, Fortaleza de Minas, Nazareno)
 * que simplesmente não aparecem no cadastro do GTAC usado como dicionário —
 * a lacuna é do dicionário, não da fonte, e fica declarada em
 * `municipioBruto` em vez de virar palpite. Os que faltam faltam na FONTE — não se
 * inventa o campo ausente, ele vai como `null`.
 *
 * ═══ A VIA É A REST DO WORDPRESS, NÃO RASPAGEM DE HTML ═══
 *
 * `/wp-json/wp/v2/posts?per_page=100` responde 200 e devolve os 45 de uma vez
 * (`x-wp-total: 45`). Raspar o HTML renderizado seria escolher a via frágil
 * quando a fonte publica JSON — e o HTML aqui é Elementor, que muda de
 * classe a cada atualização de tema.
 *
 * ⚠️ O conteúdo do post vem como **HTML renderizado**, e os campos moram no
 * texto corrido ("Empreendedor: X Volume: Y mil m³ ..."). Por isso a extração
 * é por rótulo sobre o texto limpo, e **todo campo não encontrado vira
 * `null`** — nunca string vazia, que passaria por "medido e igual a nada".
 *
 * ⚠️ "Andamento" tem dois formatos que dizem coisas diferentes: percentual
 * ("100%") e frase de estado ("Aguarda o início das obras"). Forçar os dois
 * num número só apagaria a informação de que a obra sequer começou — então
 * guardam-se os dois campos, `andamentoPercentual` e `andamentoTexto`.
 *
 * Uso:
 *   npx tsx scripts/coletar-barragens-mpmg.mts --seco   # mede, não grava
 *   npx tsx scripts/coletar-barragens-mpmg.mts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { TACS_GTAC } from "../apps/web/lib/ambiental/tac-gtac";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = resolve(RAIZ, "etl/betim/dados/barragens-mpmg.json");
const API = "https://barragens.mpmg.mp.br/wp-json/wp/v2/posts";

/**
 * Municípios de MG que o portal já conhece, tirados do cadastro do GTAC
 * (2.002 TACs ambientais). Serve de dicionário para reconhecer o município no
 * texto livre desta fonte — não é lista oficial completa do IBGE, e por isso
 * o que não casar fica `null` em vez de virar palpite.
 */
const MUNICIPIOS_MG: string[] = [...new Set(TACS_GTAC.map((t) => t.municipio).filter(Boolean))];

/** Sem acento, sem caixa, espaços colapsados — para casar "Poços"/"Pocos". */
function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

// O WordPress deste host responde a curl comum, mas o resto do ecossistema de
// MG (dados.mg.gov.br) devolve 403 sem UA de navegador. Manter um UA que
// identifique o projeto E passe pelos filtros dos dois.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ControlePopular/1.0 (+https://github.com/FinweeJur/controle-popular)";

export interface BarragemMpmg {
  id: number;
  nome: string;
  municipio: string | null;
  /** O trecho cru antes de "/UF", guardado quando o dicionário não reconhece. */
  municipioBruto: string | null;
  uf: string | null;
  empreendedor: string | null;
  /** Volume de rejeito em mil m³, como a fonte declara. `null` se ausente. */
  volumeMilM3: number | null;
  volumeTexto: string | null;
  /** Ano previsto, "100% concluída", ou o que a fonte escrever. */
  previsaoDescaracterizacao: string | null;
  /** Só quando a fonte dá número. Estado em frase vai no campo de texto. */
  andamentoPercentual: number | null;
  andamentoTexto: string | null;
  link: string;
  atualizadoEm: string;
}

function textoLimpo(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Recorta o trecho entre um rótulo e o próximo rótulo conhecido. */
function entre(texto: string, rotulo: RegExp, proximos: RegExp[]): string | null {
  const m = rotulo.exec(texto);
  if (!m) return null;
  const inicio = m.index + m[0].length;
  let fim = texto.length;
  for (const p of proximos) {
    const n = new RegExp(p.source, p.flags.replace("g", ""));
    const achado = n.exec(texto.slice(inicio));
    if (achado && achado.index + inicio < fim) fim = achado.index + inicio;
  }
  const v = texto.slice(inicio, fim).trim();
  return v || null;
}

const R_EMPREENDEDOR = /Empreendedor:\s*/i;
const R_VOLUME = /Volume:\s*/i;
const R_PREVISAO = /Previs[ãa]o de descaracteriza[çc][ãa]o:\s*/i;
const R_ANDAMENTO = /Andamento\s*/i;
const R_DOCS = /Documentos Importantes/i;

export function extrair(post: {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
}): BarragemMpmg {
  const texto = textoLimpo(post.content.rendered);
  const nome = textoLimpo(post.title.rendered);

  // "Município/UF" vem antes de "Empreendedor:". Não dá para ancorar no
  // início tirando o título: em 3 dos 45 o corpo NÃO começa pelo título
  // ("Dique Auxiliar - Barragem 5MAC" para o post "Barragem 5MAC"), e o
  // ancoramento devolvia null com a informação ali, visível, no texto.
  // ═══ O MUNICÍPIO NÃO SE EXTRAI POR FORMA, SE RECONHECE POR DICIONÁRIO ═══
  //
  // O texto é "<Nome da barragem> <Município>/<UF>" e as duas partes são
  // capitalizadas do mesmo jeito — não há regra de forma que as separe.
  // Tentativa por regex gulosa produziu "Baixo João Pereira Congonhas" e
  // "MAC Nova Lima": municípios que não existem e que passariam batido num
  // join por nome (a armadilha já registrada no repo para TSE e OSM).
  //
  // Aqui o trecho antes de "/UF" é confrontado com os municípios REAIS de MG
  // que o portal já conhece, e vence o nome mais longo que casar no fim da
  // string. Não casou ⇒ `null` + `municipioBruto` preservado para conferência
  // humana. Melhor lacuna declarada que município inventado.
  const antesUf = /^(.*?)\/([A-Z]{2})\b/.exec(texto.split(R_EMPREENDEDOR)[0] ?? texto);
  const municipioBruto = antesUf ? antesUf[1].trim() : null;
  let municipio: string | null = null;
  if (municipioBruto) {
    const alvo = normalizar(municipioBruto);
    let melhor = "";
    for (const cidade of MUNICIPIOS_MG) {
      const n = normalizar(cidade);
      if (alvo === n || alvo.endsWith(" " + n)) {
        if (n.length > melhor.length) melhor = cidade;
      }
    }
    municipio = melhor || null;
  }

  const volumeTexto = entre(texto, R_VOLUME, [R_PREVISAO, R_ANDAMENTO, R_DOCS]);
  // A fonte mistura TRÊS grafias na MESMA coluna: "812,9 mil m³",
  // "12,137 milhões de m³" e "1,800 milhão de m³" (singular, medido em 4
  // registros). Ler todas como a mesma unidade erra por 1.000x — e 12 vira
  // uma barragem menor que 813, o que passa por plausível.
  //
  // ⚠️ A ordem da alternância importa: `mil` casa o prefixo de "milhão", e se
  // vier primeiro captura a grafia errada em silêncio. Por isso o singular e
  // o plural vêm ANTES, e `mil` só fecha com fronteira de palavra.
  // Tudo normalizado para mil m³. Sem unidade escrita, não converte.
  let volumeMilM3: number | null = null;
  if (volumeTexto) {
    const mv = /([\d.,]+)\s*(milh[õo]es|milh[ãa]o|mil)\b/i.exec(volumeTexto);
    if (mv) {
      const bruto = mv[1];
      // "12,137 milhões" usa vírgula decimal; "1.234 mil" usa ponto de milhar.
      const n = Number(bruto.replace(/\./g, "").replace(",", "."));
      if (Number.isFinite(n)) {
        volumeMilM3 = /milh/i.test(mv[2]) ? n * 1000 : n;
      }
    }
  }

  const andamentoBruto = entre(texto, R_ANDAMENTO, [R_DOCS]);
  const mPct = andamentoBruto ? /(\d{1,3})\s*%/.exec(andamentoBruto) : null;

  return {
    id: post.id,
    nome,
    municipio,
    municipioBruto: municipio ? null : municipioBruto,
    uf: antesUf ? antesUf[2] : null,
    empreendedor: entre(texto, R_EMPREENDEDOR, [R_VOLUME, R_PREVISAO, R_ANDAMENTO, R_DOCS]),
    volumeMilM3,
    volumeTexto,
    previsaoDescaracterizacao: entre(texto, R_PREVISAO, [R_ANDAMENTO, R_DOCS]),
    andamentoPercentual: mPct ? Number(mPct[1]) : null,
    andamentoTexto: andamentoBruto,
    link: post.link,
    atualizadoEm: post.date,
  };
}

async function main() {
  const seco = process.argv.includes("--seco");
  const r = await fetch(`${API}?per_page=100&_fields=id,date,link,title,content`, {
    headers: { "User-Agent": UA },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} na REST do WordPress`);
  const posts = (await r.json()) as Parameters<typeof extrair>[0][];

  // TRAVA DE SANIDADE, antes de gravar. O host respondeu 200 com corpo vazio
  // em fonte irmã desta frente (transparencia.mpmg, 0 bytes) — status não
  // prova conteúdo.
  if (!Array.isArray(posts) || posts.length < 30) {
    throw new Error(`só ${posts?.length ?? 0} posts — a fonte tinha 45 em 21/08/2026. Abortando.`);
  }

  const barragens = posts.map(extrair).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const comEmpreendedor = barragens.filter((b) => b.empreendedor).length;
  const comAndamento = barragens.filter((b) => b.andamentoTexto).length;
  const comVolume = barragens.filter((b) => b.volumeMilM3 !== null).length;
  const concluidas = barragens.filter((b) => b.andamentoPercentual === 100).length;

  console.log(`barragens: ${barragens.length}`);
  console.log(`  com empreendedor: ${comEmpreendedor}`);
  console.log(`  com andamento:    ${comAndamento}`);
  console.log(`  com volume:       ${comVolume}`);
  console.log(`  100% concluídas:  ${concluidas}`);

  if (comEmpreendedor < barragens.length * 0.9) {
    throw new Error("extração de empreendedor caiu abaixo de 90% — o HTML da fonte mudou");
  }

  if (seco) {
    console.log("--seco: nada gravado.");
    return;
  }

  mkdirSync(dirname(DESTINO), { recursive: true });
  writeFileSync(
    DESTINO,
    JSON.stringify(
      {
        coletadoEm: new Date().toISOString().slice(0, 10),
        fonte: "https://barragens.mpmg.mp.br/",
        via: "WordPress REST /wp-json/wp/v2/posts",
        observacao:
          "Projeto 'Desativando Bombas-relógio' do MPMG (Caoma). Cada post é uma barragem a montante em descaracterização, não um artigo.",
        total: barragens.length,
        comEmpreendedor,
        comAndamento,
        comVolume,
        concluidas,
        barragens,
      },
      null,
      1,
    ),
    "utf-8",
  );
  console.log(`gravado: ${DESTINO}`);
}

main();
