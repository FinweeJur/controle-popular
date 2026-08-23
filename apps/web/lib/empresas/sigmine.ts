import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export interface ProcessoSigmine {
  processo: string;
  numero: number;
  ano: number;
  areaHa: number;
  fase: string;
  nome: string;
  substancia: string;
  uso: string;
}

function resolverCaminhoSigmine(): string {
  const candidatos = [
    path.join(process.cwd(), "apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson"),
    path.join(process.cwd(), "../../apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson"),
    path.join(process.cwd(), "../../../apps/web/public/terras/globo/dados/camadas/sigmine-operacao.geojson"),
  ];
  for (const c of candidatos) {
    if (existsSync(c)) return c;
  }
  return candidatos[0];
}

const CAMINHO_SIGMINE = resolverCaminhoSigmine();

let cache: ProcessoSigmine[] | null = null;

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ");
}

export async function listarProcessosSigmine(): Promise<ProcessoSigmine[]> {
  if (cache) return cache;
  const raw = await readFile(CAMINHO_SIGMINE, "latin1");
  const geojson = JSON.parse(raw) as {
    features: { properties: Record<string, string | number> }[];
  };
  cache = geojson.features.map((f) => ({
    processo: String(f.properties.processo ?? ""),
    numero: Number(f.properties.numero ?? 0),
    ano: Number(f.properties.ano ?? 0),
    areaHa: Number(f.properties.area_ha ?? 0),
    fase: String(f.properties.fase ?? ""),
    nome: String(f.properties.nome ?? ""),
    substancia: String(f.properties.subs ?? ""),
    uso: String(f.properties.uso ?? ""),
  }));
  return cache;
}

export async function processosPorEmpresa(
  sinonimos: string[]
): Promise<ProcessoSigmine[]> {
  const todos = await listarProcessosSigmine();
  const termos = sinonimos.map(normalizar);
  return todos
    .filter((p) => {
      const nome = normalizar(p.nome);
      return termos.some((t) => nome.includes(t));
    })
    .sort((a, b) => b.areaHa - a.areaHa);
}
