/**
 * Normas federais no acervo do assistente (frente "normas").
 *
 * Por que existe: o projeto de jurimetria (repo `tjmg-jurimetria`) passou a
 * manter um guia de leis federais — catálogo oficial do normas.leg.br,
 * temas oficiais (`about`), situação de revogação, relação com súmulas e um
 * resumo acessível com palavras-chave. Este módulo traz esse recorte para o
 * MESMO RAG do Seu Nonô, com a disciplina de citação do portal: cada pedaço
 * carrega `fonteUrl` da norma oficial e, sem fonte, não entra.
 *
 * Fonte do dado: `data/rag-normas.json`, gerado no repo `tjmg-jurimetria`
 * por `etl/exportar_rag_normas.py` (a partir de `normas_federais.csv` +
 * `normas_temas.csv` + `normas_resumos.csv`). O recorte é deliberadamente
 * pequeno — normas vigentes dos temas do portal (Ambiental, Direitos
 * Humanos, Administrativo, Constitucional) e as citadas por súmula — para
 * não diluir o top-k do RAG em memória. O catálogo inteiro (37 mil) fica
 * fora, atrás do roteador determinístico.
 *
 * `rota` é "/" porque o portal ainda não publica página por norma; o link
 * que o leitor deve abrir é o `fonteUrl` (normas.leg.br). Quando existir a
 * página, basta trocar aqui — o resto do acervo não muda.
 */
import dados from "@/data/rag-normas.json";
import type { AcervoFonte } from "./acervo";

interface NormaRag {
  id: string;
  titulo: string;
  fonteUrl: string;
  texto: string;
}

interface ArquivoRagNormas {
  fontes?: NormaRag[];
}

/**
 * Pedaços de normas para o acervo. A guarda de completude de `acervo.ts`
 * (`exigirPecasCompletas`) vale depois; aqui já se descarta o que não tem
 * fonte ou texto, para não derrubar o build inteiro por um item corrompido.
 */
export function deNormas(): AcervoFonte[] {
  const fontes = (dados as ArquivoRagNormas).fontes ?? [];
  return fontes
    .filter((f) => f.id && f.titulo && f.fonteUrl && f.texto)
    .map((f) => ({
      id: f.id,
      frente: "normas",
      rota: "/",
      titulo: f.titulo,
      fonteUrl: f.fonteUrl,
      texto: f.texto,
      links: [{ href: f.fonteUrl, texto: "Norma oficial" }],
    }));
}
