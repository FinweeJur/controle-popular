export interface EventoAmbiental {
  data: string;
  tipo: "licenciamento" | "embargo" | "suspensao" | "multa" | "cfem" | "denuncia";
  titulo: string;
  descricao: string;
  fonte: string;
  href: string;
}

export interface NoticiaMonitoramento {
  titulo: string;
  href: string;
  data: string | null;
  fonte: string;
  descricao: string;
}

export interface TimelineItem {
  data: string;
  tipo: "evento" | "noticia";
  titulo: string;
  descricao: string;
  cor: string;
  href?: string;
}

const COR_EVENTOS: Record<string, string> = {
  embargo: "#dc2626",
  suspensao: "#ea580c",
  denuncia: "#ca8a04",
  licenciamento: "#2563eb",
  multa: "#9333ea",
  cfem: "#059669",
  noticia: "#6b7280",
};

export function montarTimelineAmbiental(
  eventos: EventoAmbiental[],
  noticias: NoticiaMonitoramento[]
): TimelineItem[] {
  const itens: TimelineItem[] = [];

  for (const evento of eventos) {
    itens.push({
      data: evento.data,
      tipo: "evento",
      titulo: evento.titulo,
      descricao: evento.descricao,
      cor: COR_EVENTOS[evento.tipo] ?? "#6b7280",
      href: evento.href,
    });
  }

  for (const noticia of noticias) {
    if (!noticia.data) continue;
    itens.push({
      data: noticia.data,
      tipo: "noticia",
      titulo: noticia.titulo,
      descricao: noticia.descricao,
      cor: COR_EVENTOS.noticia,
      href: noticia.href,
    });
  }

  itens.sort((a, b) => a.data.localeCompare(b.data));

  return itens;
}
