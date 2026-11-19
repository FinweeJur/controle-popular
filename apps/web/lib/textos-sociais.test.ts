import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import textos from "@/data/textos-sociais.json";
import { metadataEditavel } from "./edicoes";

/**
 * Guardião do texto de compartilhamento (`data/textos-sociais.json`).
 *
 * POR QUE ESTE TESTE EXISTE
 *
 * O cartão que o WhatsApp monta é a primeira coisa que o leitor vê de uma
 * página — e foi o que denunciou o problema em 10/11/2026: link compartilhado
 * abria com o texto genérico do layout, longo e cortado no meio da frase.
 * O mapa em `data/textos-sociais.json` resolve isso à mão, rota por rota.
 *
 * Só que mapa escrito à mão apodrece em silêncio: uma rota renomeada, um
 * título que passou de 60 caracteres, uma descrição que termina em reticências
 * — nada disso quebra o build, e o defeito só aparece no grupo de WhatsApp.
 * Por isso as réguas estão aqui, medidas e não opinadas:
 *
 *   título   ≤ 60 caracteres  (o WhatsApp quebra linha e come o fim)
 *   descrição ≤ 150            (mesma razão)
 *   título + descrição + ~38 da URL < 260
 *                              (o que cabe antes do "ler mais")
 *   descrição termina em ponto: frase completa, nunca cortada
 *
 * A lista `ROTAS_OBRIGATORIAS` é a parte editorial: todo eixo, toda frente e
 * todo subeixo que o dono compartilha precisa ter texto próprio. Ela falha
 * listando o que falta — não com um "1 teste falhou" sem nome.
 */

interface TextoSocial {
  titulo: string;
  descricao: string;
}

const MAPA = textos as Record<string, TextoSocial>;

/** Tamanho aproximado de "https://www.controlepopular.com.br" + rota. */
const TAMANHO_URL = 38;
/** Teto do cartão do WhatsApp antes do "ler mais". */
const TETO_CARTAO = 260;

const MOJIBAKE = ["Ã", "â€", "Â"];

/**
 * Rotas que não podem ficar sem texto próprio.
 *
 * Ordem: eixo → frente/caso → subeixo. É a lista que o dono percorre quando
 * compartilha o portal; se uma delas cair, o cartão volta a ser genérico.
 */
const ROTAS_OBRIGATORIAS: string[] = [
  // ── Eixos ──────────────────────────────────────────────────────────────
  "/",
  "/ambiental",
  "/direitos-em-movimento",
  "/estado-e-economia",
  "/terra-e-territorios",
  "/central",
  // ── Frentes e casos ────────────────────────────────────────────────────
  "/eixos/casos",
  "/paraopeba",
  "/riodoce",
  "/itatiaiaucu",
  "/jurisprudencia",
  "/jurisprudencia/penal",
  // ── Hubs transversais ──────────────────────────────────────────────────
  "/indice",
  "/cidades",
  "/congresso",
  "/judiciario",
  "/empresas",
  "/direitos-globais",
  "/direitos-comparados",
  "/internacional",
  "/eua",
  "/europa",
  "/canada",
  "/america-latina",
  "/memoria",
  "/funcaosocialterra",
  "/educacao",
  "/tecnologia",
  "/documentacao",
  "/biblioteca",
  "/noticias",
  "/editais",
  "/alertas",
  "/assembleias",
  "/governo",
  "/instituicoes",
  "/indicadores",
  "/glossario",
  "/modelos",
  "/sobre",
  "/termos",
  "/politica-de-ia",
  // ── Subeixos do catálogo (`lib/eixos/catalogo.ts`) ─────────────────────
  "/ambiental/barragens",
  "/ambiental/licenciamento",
  "/ambiental/tac",
  "/ambiental/copam",
  "/ambiental/legislacao",
  "/ambiental/clima-risco",
  "/ambiental/autuacoes",
  "/ambiental/mariana",
  "/ambiental/judiciario",
  "/terra-e-territorios/nossas-serras",
  "/terra-e-territorios/nossos-rios",
  "/terra-e-territorios/vales",
  "/funcaosocialterra/alertas",
  "/funcaosocialterra/mapa",
  "/direitos-em-movimento/ajuda",
  "/direitos-em-movimento/denuncia",
  "/direitos-em-movimento/informacao",
  "/direitos-em-movimento/conselhos",
  "/congresso/parlamentares",
  "/congresso/votacoes",
  "/congresso/proposicoes",
  "/congresso/comissoes",
  "/judiciario/composicao",
  "/judiciario/numeros",
  "/estado-e-economia/orcamento",
  "/empresas/conglomerados",
  "/dados/comunicabr",
  "/busca",
  "/laboratorio",
  "/estudos-rurais",
  "/imprensa",
  "/eleicoes/2026/gastos-campanha",
];

describe("data/textos-sociais.json", () => {
  const chaves = Object.keys(MAPA);

  it("é JSON válido e tem ao menos uma entrada", () => {
    expect(Array.isArray(chaves)).toBe(true);
    expect(chaves.length).toBeGreaterThan(100);
  });

  it("toda chave começa com / e não repete", () => {
    const foraDoPadrao = chaves.filter((c) => !c.startsWith("/"));
    expect(foraDoPadrao, "chave sem barra inicial").toEqual([]);

    // `JSON.parse` engole chave repetida em silêncio (a última vence), então a
    // contagem sai do texto cru: se o arquivo declara 210 chaves e o objeto tem
    // 209, há duplicata.
    const cru = readFileSync(
      path.join(process.cwd(), "data", "textos-sociais.json"),
      "utf-8"
    );
    const declaradas = cru.match(/^\s{2}"\/[^"]*":\s*\{/gm) ?? [];
    const repetidas = declaradas
      .map((linha) => linha.trim().replace(/^"|":\s*\{$/g, ""))
      .filter((rota, i, todas) => todas.indexOf(rota) !== i);
    expect([...new Set(repetidas)], "chave duplicada no arquivo").toEqual([]);
    expect(declaradas.length).toBe(chaves.length);
  });

  it("título cabe em 60 caracteres e descrição em 150", () => {
    const grandes = chaves
      .map((rota) => ({ rota, t: MAPA[rota].titulo.length, d: MAPA[rota].descricao.length }))
      .filter(({ t, d }) => t > 60 || d > 150)
      .map(({ rota, t, d }) => `${rota} (${t}/${d})`);
    expect(grandes, "título >60 ou descrição >150").toEqual([]);
  });

  it("a descrição é frase completa, não reticência", () => {
    const problemas = chaves
      .filter((rota) => {
        const d = MAPA[rota].descricao.trim();
        return !/[.!?]$/.test(d) || d.endsWith("…") || /\.\.\.$/.test(d);
      })
      .map((rota) => `${rota}: ${MAPA[rota].descricao}`);
    expect(problemas, "descrição sem ponto final ou terminando em reticência").toEqual([]);
  });

  it("cabe no cartão do WhatsApp antes do ler mais", () => {
    const estourados = chaves
      .filter(
        (rota) =>
          MAPA[rota].titulo.length + MAPA[rota].descricao.length + TAMANHO_URL > TETO_CARTAO
      )
      .map((rota) => rota);
    expect(estourados, `título + descrição + URL passou de ${TETO_CARTAO}`).toEqual([]);
  });

  it("não tem mojibake nem o sufixo do site no título", () => {
    const problemas: string[] = [];
    for (const rota of chaves) {
      const { titulo, descricao } = MAPA[rota];
      for (const sinal of MOJIBAKE) {
        if (titulo.includes(sinal) || descricao.includes(sinal)) {
          problemas.push(`${rota}: "${sinal}"`);
        }
      }
      // O nome do site pode ser o ASSUNTO ("Sobre o Controle Popular"); o que
      // não pode é o sufixo herdado do <title> ("… — Controle Popular"), que
      // repete o nome em toda mensagem e rouba espaço do assunto.
      if (/\s[—–|-]\s*Controle Popular\s*$/i.test(titulo)) {
        problemas.push(`${rota}: título termina com o sufixo do site`);
      }
    }
    expect(problemas).toEqual([]);
  });

  it("cobre todos os eixos, frentes e subeixos da lista curada", () => {
    const faltando = ROTAS_OBRIGATORIAS.filter((rota) => !MAPA[rota]);
    expect(
      faltando,
      `rotas obrigatórias sem texto social (${faltando.length}): ${faltando.join(", ")}`
    ).toEqual([]);
  });
});

describe("metadataEditavel usa o texto social", () => {
  it("troca o openGraph genérico pelo texto curado da rota", () => {
    const meta = metadataEditavel("/ambiental", {
      title: "Meio Ambiente — Observatório Nacional Socioambiental (ONSA) — Controle Popular",
      description:
        "O Observatório Nacional Socioambiental: COPAM e licenciamento de Minas, barragens do país inteiro, normas federais, processos ambientais na Justiça, o Acordo do Rio Doce e a Vale.",
    });
    expect(meta.openGraph?.title).toBe(MAPA["/ambiental"].titulo);
    expect(meta.openGraph?.description).toBe(MAPA["/ambiental"].descricao);
    expect(meta.twitter?.title).toBe(MAPA["/ambiental"].titulo);
  });

  it("mantém o canonical automático da rota", () => {
    const meta = metadataEditavel("/ambiental/barragens", {
      title: "Barragens — Controle Popular",
      description: "Texto qualquer.",
    });
    expect(meta.alternates?.canonical).toBe("/ambiental/barragens");
  });

  it("sem entrada no mapa, ainda entrega descrição — nunca vazia", () => {
    // Rota que não está no mapa e página sem `description`: era aqui que saía
    // `<meta property="og:description" content="">` e o cartão ficava mudo.
    const meta = metadataEditavel("/rota-de-teste-sem-texto", {
      title: "Título de teste",
    });
    expect(meta.openGraph?.title).toBe("Título de teste");
    expect(meta.openGraph?.description).toBeTruthy();
    expect((meta.openGraph?.description as string).length).toBeGreaterThan(10);
  });
});
