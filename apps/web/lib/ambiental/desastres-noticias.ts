/**
 * Radar de notícias dos desastres de Mariana e Brumadinho e do reconhecimento
 * de atingidos (ES e BA). DADO GERADO por
 * `scripts/coletar-noticias-desastres.py`, gravado em
 * `apps/web/data/noticias-desastres.json` e lido aqui por import (padrão da
 * camada data-json). `apps/web/data` está em `DIRETORIOS_DADO`, então a
 * varredura de CPF mod-11 cobre este arquivo no pre-push e na CI.
 *
 * ═══ O QUE ISTO É, E O QUE NÃO É ═══
 *
 * É um radar, não um acervo: título, veículo, data, microresumo (snippet
 * publicado pela própria fonte de feed) e link — nunca o corpo da matéria.
 * Notícia diz que algo foi noticiado, na data em que foi; não é fato oficial.
 * O `desastre` de cada item é inferido por termo de lugar no título; item sem
 * vínculo claro fica `null` ("—") em vez de chutar um caso — errar seria
 * insinuação (regra editorial do AGENTS.md).
 */
import bruto from "../../data/noticias-desastres.json";

export interface NoticiaDesastre {
  titulo: string;
  link: string;
  veiculo: string;
  /** Snippet que a fonte de feed publicou — nunca escrito por este portal. */
  resumo: string | null;
  /** Busca que encontrou a matéria (atingidos-bahia, rio-doce-es, mariana, brumadinho). */
  tema: string;
  /** "mariana" | "brumadinho" | null (sem vínculo claro de lugar). */
  desastre: "mariana" | "brumadinho" | null;
  data: string | null;
}

const dados = bruto as {
  gerado_em?: string;
  janela_dias?: number;
  lacuna_conhecida?: string;
  itens?: NoticiaDesastre[];
};

export const NOTICIAS_DESASTRES: NoticiaDesastre[] = Array.isArray(dados.itens) ? dados.itens : [];

export const NOTICIAS_DESASTRES_LACUNA: string = dados.lacuna_conhecida ?? "";

export const NOTICIAS_DESASTRES_GERADO_EM: string = dados.gerado_em ?? "";
