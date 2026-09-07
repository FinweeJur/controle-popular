import fs from "node:fs";
import path from "node:path";

export type TipoDocumentoEmpresa =
  | "sustentabilidade"
  | "financeiro"
  | "clima"
  | "direitos_humanos";

export interface DocumentoEmpresa {
  id: string;
  empresaSlug: string;
  empresaNome: string;
  pais: string;
  regiao: string;
  setor: string;
  setorRotulo: string;
  tipoDocumento: TipoDocumentoEmpresa;
  tipoDocumentoRotulo: string;
  titulo: string;
  ano: number;
  microResumo: string;
  urlOficial: string;
  urlR2: string;
  tamanhoBytes: number;
  tamanhoFormatado: string;
  tags: string[];
}

export interface CatalogoDocumentosResultado {
  geradoEm: string;
  totalDocumentos: number;
  totalEmpresas: number;
  distribuicaoPorTipo: Record<string, number>;
  distribuicaoPorPais: Record<string, number>;
  itens: DocumentoEmpresa[];
}

export const COBERTURA_DOCUMENTOS_EMPRESAS = {
  totalDocumentos: 520,
  totalEmpresas: 130,
  paises: ["Brasil", "Estados Unidos"],
  tipos: [
    { id: "sustentabilidade", rotulo: "Sustentabilidade (ESG)" },
    { id: "financeiro", rotulo: "Demonstrações Financeiras" },
    { id: "clima", rotulo: "Ação Climática & Descarbonização" },
    { id: "direitos_humanos", rotulo: "Direitos Humanos & Comunidades" },
  ],
};

let cacheCatalogo: CatalogoDocumentosResultado | null = null;

export function obterCatalogoDocumentos(): CatalogoDocumentosResultado {
  if (cacheCatalogo) return cacheCatalogo;

  const caminho = path.join(process.cwd(), "data", "empresas-documentos.json");
  const fallbackCaminho = path.join(process.cwd(), "apps", "web", "data", "empresas-documentos.json");

  let raw = "";
  if (fs.existsSync(caminho)) {
    raw = fs.readFileSync(caminho, "utf-8");
  } else if (fs.existsSync(fallbackCaminho)) {
    raw = fs.readFileSync(fallbackCaminho, "utf-8");
  } else {
    return {
      geradoEm: new Date().toISOString(),
      totalDocumentos: 0,
      totalEmpresas: 0,
      distribuicaoPorTipo: {},
      distribuicaoPorPais: {},
      itens: [],
    };
  }

  cacheCatalogo = JSON.parse(raw) as CatalogoDocumentosResultado;
  return cacheCatalogo;
}

export function listarDocumentosPorEmpresa(empresaSlug: string): DocumentoEmpresa[] {
  const cat = obterCatalogoDocumentos();
  return cat.itens.filter((d) => d.empresaSlug.toLowerCase() === empresaSlug.toLowerCase());
}

export interface FiltrosDocumentos {
  busca?: string;
  empresa?: string;
  setor?: string;
  pais?: string;
  tipo?: string;
}

export function filtrarDocumentos(
  itens: DocumentoEmpresa[],
  filtros: FiltrosDocumentos
): DocumentoEmpresa[] {
  const buscaLimpa = (filtros.busca ?? "").trim().toLowerCase();

  return itens.filter((d) => {
    if (filtros.empresa && filtros.empresa !== "todos" && d.empresaSlug !== filtros.empresa) {
      return false;
    }
    if (filtros.setor && filtros.setor !== "todos" && d.setor !== filtros.setor) {
      return false;
    }
    if (filtros.pais && filtros.pais !== "todos" && d.pais !== filtros.pais) {
      return false;
    }
    if (filtros.tipo && filtros.tipo !== "todos" && d.tipoDocumento !== filtros.tipo) {
      return false;
    }
    if (buscaLimpa) {
      const matchNome = d.empresaNome.toLowerCase().includes(buscaLimpa);
      const matchTitulo = d.titulo.toLowerCase().includes(buscaLimpa);
      const matchResumo = d.microResumo.toLowerCase().includes(buscaLimpa);
      const matchTags = d.tags.some((t) => t.toLowerCase().includes(buscaLimpa));
      if (!matchNome && !matchTitulo && !matchResumo && !matchTags) {
        return false;
      }
    }
    return true;
  });
}
