/**
 * Jurisprudência do TJES (Fundão/Rio Doce) no acervo do assistente.
 *
 * Fonte: `data/rag-tjes.json`, gerado no repo `tjes-jurimetria` por
 * `scripts/tjes_rag.py` a partir de `tabelas/tjes_jurimetria.csv` (19.197
 * linhas, 10.891 processos). Aqui entra o recorte de 2ª instância (1.960
 * processos), que é o comparável ao NACAB e cabe no RAG em memória.
 *
 * O TJES não traz permalink no dado coletado: `fonteUrl` aponta para o portal
 * oficial de jurisprudência e o número do processo vai no título.
 */
import dados from "@/data/rag-tjes.json";
import type { AcervoFonte } from "./acervo";

interface PecaTjes {
  id: string;
  titulo: string;
  fonteUrl: string;
  texto: string;
}

interface ArquivoTjes {
  fontes?: PecaTjes[];
}

export function deTjes(): AcervoFonte[] {
  const fontes = (dados as ArquivoTjes).fontes ?? [];
  return fontes
    .filter((f) => f.id && f.titulo && f.fonteUrl && f.texto)
    .map((f) => ({
      id: f.id,
      frente: "jurisprudencia",
      rota: "/judiciario",
      titulo: f.titulo,
      fonteUrl: f.fonteUrl,
      texto: f.texto,
      links: [{ href: f.fonteUrl, texto: "Jurisprudência TJES" }],
    }));
}
