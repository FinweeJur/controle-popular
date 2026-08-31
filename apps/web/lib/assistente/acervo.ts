/**
 * Acervo do chatbot (degrau 3 do assistente): a memória de onde as respostas
 * IA saem, com a URL da fonte colada em cada pedaço.
 *
 * ═══ O QUE ISTO É ═══
 *
 * O RAG de demonstração (`demonstracao.ts`) indexava 4 normas federais sobre
 * a barragem de Fundão — corpus de prova de conceito, não o portal. Este
 * módulo monta o acervo REAL: as respostas pré-curadas do Seu Nonô
 * (`SeuNonoData.ts`), as sugestões contextuais por rota
 * (`contexto-pagina.ts`) e os resumos de dados das páginas
 * (`PAGINAS_DADOS`). Tudo texto já curado do portal, cada pedaço com
 * `rota`/`fonteUrl` — a disciplina de "citação colada ao número" do
 * `AGENTS.md`: se não há onde apontar a fonte, o pedaço não entra.
 *
 * ═══ POR QUE EM CÓDIGO, E NÃO NUM JSON COMMITADO ═══
 *
 * A primeira versão do plano previa um manifesto versionado
 * (`data/assistente-acervo.json`). Na prática o JSON seria artefato
 * derivado das MESMAS fontes TS — e artefato derivado commitado é armadilha
 * de stale (a fonte muda, o JSON fica velho, e o teste que compara os dois
 * vira manutenção). Decisão registrada: `montarAcervo()` constrói em
 * código, determinístico, sem fs e sem rede — roda em `next dev`, em
 * `next start` no home-pc e, se um dia o Worker voltar a servir, também lá.
 * O JSONL de finetuning (Fase 4) e a carga pgvector (Fase 5) são gerados a
 * partir DESTA mesma função por script — um consumidor a mais, zero
 * duplicação de verdade.
 *
 * ═══ DADO PESSOAL ═══
 *
 * As fontes aqui são módulos TS curados (varridos pela guarda de código
 * `checar-dado-pessoal.py` e pelo teste gêmeo `sem-cpf-no-repo.test.ts`) —
 * não dado ingerido de coletor. Quando a ingestão passar a puxar JSON de
 * `etl/betim/dados/` (que a guarda de DADO `checar-dado-pessoal-em-dado.py`
 * já cobre desde 22/08), a regra do AGENTS.md vale: varrer ANTES de
 * ingerir, nunca depois.
 */

import { FRENTES, PAGINAS_DADOS } from "@/app/components/SeuNonoData";
import { CONTEXTOS } from "@/lib/seo/contexto-pagina";

/** Um pedaço do acervo — texto + onde apontar a fonte. */
export interface AcervoFonte {
  /** Chave estável de deduplicação (frente + origem + id). */
  id: string;
  /** Frente do portal a que o pedaço pertence (id livre, ver FRENTES). */
  frente: string;
  /** Rota primária do portal onde o conteúdo aparece. */
  rota: string;
  /** Título curto do pedaço (a pergunta ou o nome da página). */
  titulo: string;
  /** URL para citar — a mesma `rota` quando a fonte é interna. */
  fonteUrl: string;
  /** O texto do pedaço (resposta pré-curada ou resumo de página). */
  texto: string;
  /** Links extras para mostrar junto da fonte (abrir/copiar). */
  links?: { href: string; texto: string }[];
}

/** Frente derivada da rota — mesma régua dos CONTEXTOS de `contexto-pagina.ts`. */
export function frenteDaRota(rota: string): string {
  if (
    rota.startsWith("/betim") ||
    rota.startsWith("/bh") ||
    rota.startsWith("/diamantina") ||
    rota.startsWith("/aracuai") ||
    rota.startsWith("/itinga") ||
    rota.startsWith("/sp")
  ) {
    return "cidades";
  }
  if (rota.startsWith("/congresso")) return "congresso";
  if (rota.startsWith("/judiciario")) return "judiciario";
  if (rota.startsWith("/ambiental")) return "ambiental";
  if (rota.startsWith("/paraopeba")) return "paraopeba";
  if (rota.startsWith("/funcaosocialterra")) return "funcaosocialterra";
  if (rota.startsWith("/direitos-em-movimento")) return "direitos-em-movimento";
  return "geral";
}

/** Um link do portal, no formato de `SeuNonoData`. */
interface LinkPortal {
  href: string;
  texto: string;
}

function rotaPrimaria(p: {
  link?: LinkPortal;
  links?: LinkPortal[];
}): LinkPortal | null {
  if (p.link) return p.link;
  if (p.links && p.links.length > 0) return p.links[0];
  return null;
}

function deFrentes(): { fontes: AcervoFonte[]; puladas: number } {
  const fontes: AcervoFonte[] = [];
  let puladas = 0;
  for (const frente of FRENTES) {
    for (const categoria of frente.categorias) {
      for (const pergunta of categoria.perguntas) {
        const primaria = rotaPrimaria(pergunta);
        // Regra "ou o número não vai": resposta sem página apontada não
        // entra no acervo — a IA não pode citar o que não tem endereço.
        if (!primaria) {
          puladas++;
          continue;
        }
        fontes.push({
          id: `pergunta:${frente.id}:${pergunta.id}`,
          frente: frente.id,
          rota: primaria.href,
          titulo: pergunta.pergunta,
          fonteUrl: primaria.href,
          texto: pergunta.resposta,
          links: pergunta.links ?? (pergunta.link ? [pergunta.link] : undefined),
        });
      }
    }
  }
  return { fontes, puladas };
}

function deContextos(): AcervoFonte[] {
  const fontes: AcervoFonte[] = [];
  CONTEXTOS.forEach((contexto, i) => {
    contexto.sugestoes.forEach((s, j) => {
      fontes.push({
        id: `contexto:${i}:${j}`,
        frente: frenteDaRota(s.link),
        rota: s.link,
        titulo: s.pergunta,
        fonteUrl: s.link,
        texto: s.resposta,
        links: [{ href: s.link, texto: s.linkTexto }],
      });
    });
  });
  return fontes;
}

function dePaginasDados(): AcervoFonte[] {
  const fontes: AcervoFonte[] = [];
  for (const pagina of PAGINAS_DADOS) {
    const primaria = pagina.links[0];
    if (!primaria) continue;
    fontes.push({
      id: `pagina:${pagina.id}`,
      frente: frenteDaRota(primaria.href),
      rota: primaria.href,
      titulo: pagina.titulo,
      fonteUrl: primaria.href,
      texto: [pagina.resumo, ...pagina.dados].join("\n"),
      links: pagina.links,
    });
  }
  return fontes;
}

/** Contagem de cobertura do acervo, para relatório e teste. */
export interface CoberturaAcervo {
  total: number;
  porFrente: Record<string, number>;
  /** Respostas pré-curadas sem link — fora do acervo por regra do módulo. */
  puladasSemRota: number;
}

/** Resultado de `montarAcervoDetalhado`: as fontes + a contagem de puladas. */
export interface AcervoMontado {
  fontes: AcervoFonte[];
  cobertura: CoberturaAcervo;
}

/**
 * Monta o acervo inteiro, determinístico: frentes → contextos → páginas.
 * Nenhuma dependência de fs/rede/banco — roda em qualquer ambiente.
 */
export function montarAcervoDetalhado(): AcervoMontado {
  const { fontes: deFrentesFontes, puladas } = deFrentes();
  const acervo = [...deFrentesFontes, ...deContextos(), ...dePaginasDados()];

  // Garantia estrutural: nada sem rota/fonteUrl/titulo/texto no acervo
  // (regra "ou o número não vai" do AGENTS.md, aplicada em código).
  const incompletas = acervo.filter(
    (f) => !f.rota || !f.fonteUrl || !f.titulo || !f.texto
  );
  if (incompletas.length > 0) {
    throw new Error(
      `montarAcervoDetalhado: ${incompletas.length} pedaço(s) incompleto(s) — ` +
        `ids: ${incompletas.map((f) => f.id).join(", ")}`
    );
  }

  // Dedup por id — id duplicado quebraria a citação [n] na UI.
  const vistos = new Set<string>();
  const unicos: AcervoFonte[] = [];
  for (const f of acervo) {
    if (vistos.has(f.id)) {
      throw new Error(`montarAcervoDetalhado: id duplicado "${f.id}"`);
    }
    vistos.add(f.id);
    unicos.push(f);
  }

  const porFrente: Record<string, number> = {};
  for (const f of unicos) {
    porFrente[f.frente] = (porFrente[f.frente] ?? 0) + 1;
  }

  return {
    fontes: unicos,
    cobertura: { total: unicos.length, porFrente, puladasSemRota: puladas },
  };
}

/** Apenas as fontes — atalho para quem não precisa da cobertura. */
export function montarAcervo(): AcervoFonte[] {
  return montarAcervoDetalhado().fontes;
}
