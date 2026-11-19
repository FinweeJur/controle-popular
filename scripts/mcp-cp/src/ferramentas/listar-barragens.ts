/**
 * `listar_barragens` — lista as barragens de mineração do acervo local.
 *
 * Fonte oficial: apps/web/data/barragens-sigbm.json, gerado por
 * scripts/coletar-sigbm-anm.mts a partir do SIGBM/ANM
 * (https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv). Somente leitura.
 *
 * Só entram campos de pessoa jurídica (empreendedor) e de estrutura — não há
 * nome de pessoa física neste acervo. A ordem põe primeiro o risco maior:
 * emergência nível 3 → 2 → 1 → alerta → sem emergência.
 */

import type { Barragem } from "../acervo.js";
import { ErroDeEntrada, limitarPagina, type Paginacao } from "../resultado.js";
import { normalizar } from "../texto.js";

export interface ConsultaBarragens {
  uf?: string;
  limite?: number;
  deslocamento?: number;
}

export interface ItemBarragem {
  id: string;
  nome: string;
  uf: string;
  municipio: string;
  situacao: string;
  nivelEmergencia: string;
  categoriaRisco: string;
  danoPotencial: string;
  empreendedor: string;
  faseDescaracterizacao: string;
}

export interface ResultadoBarragens {
  filtro: { uf: string | null; limite: number; deslocamento: number };
  total: number;
  totalNoAcervo: number;
  mostrando: number;
  temMais: boolean;
  itens: ItemBarragem[];
  resumo: {
    porNivelEmergencia: Record<string, number>;
    porSituacao: Record<string, number>;
    porUf: Record<string, number>;
  };
  ufsDisponiveis: string[];
  mensagem: string;
}

/** Peso de gravidade do nível de emergência do SIGBM. Desconhecido fica no fim. */
export function pesoEmergencia(nivel: string): number {
  const alvo = normalizar(nivel);
  if (alvo.includes("nivel 3")) return 5;
  if (alvo.includes("nivel 2")) return 4;
  if (alvo.includes("nivel 1")) return 3;
  if (alvo.includes("alerta")) return 2;
  if (alvo.includes("sem emergencia")) return 1;
  return 0;
}

function contarPor<T>(itens: readonly T[], chave: (item: T) => string): Record<string, number> {
  const contagem: Record<string, number> = {};
  for (const item of itens) {
    const valor = chave(item) || "não informado";
    contagem[valor] = (contagem[valor] ?? 0) + 1;
  }
  return contagem;
}

export function listarBarragens(
  barragens: readonly Barragem[],
  consulta: ConsultaBarragens = {},
): ResultadoBarragens {
  const pagina: Paginacao = limitarPagina(consulta.limite, consulta.deslocamento, 20);
  const ufBruta = (consulta.uf ?? "").trim();
  const ufsDisponiveis = [...new Set(barragens.map((barragem) => barragem.uf).filter(Boolean))].sort();

  let uf: string | null = null;
  if (ufBruta) {
    if (!/^[a-zA-Z]{2}$/.test(ufBruta)) {
      throw new ErroDeEntrada(
        `\`uf\` precisa ter 2 letras (ex.: MG). UFs no acervo: ${ufsDisponiveis.join(", ") || "nenhuma"}.`,
      );
    }
    uf = ufBruta.toUpperCase();
  }

  const encontradas = barragens
    .filter((barragem) => (uf ? barragem.uf === uf : true))
    .sort((a, b) => {
      const peso = pesoEmergencia(b.nivelEmergencia) - pesoEmergencia(a.nivelEmergencia);
      if (peso !== 0) return peso;
      const municipio = a.municipio.localeCompare(b.municipio, "pt-BR");
      if (municipio !== 0) return municipio;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });

  const fatia = encontradas.slice(pagina.deslocamento, pagina.deslocamento + pagina.limite);
  const itens: ItemBarragem[] = fatia.map((barragem) => ({
    id: barragem.id,
    nome: barragem.nome,
    uf: barragem.uf,
    municipio: barragem.municipio,
    situacao: barragem.situacao,
    nivelEmergencia: barragem.nivelEmergencia,
    categoriaRisco: barragem.categoriaRisco,
    danoPotencial: barragem.danoPotencial,
    empreendedor: barragem.empreendedor,
    faseDescaracterizacao: barragem.faseDescaracterizacao,
  }));

  const filtroUf = uf ? ` na UF ${uf}` : "";
  const mensagem =
    encontradas.length === 0
      ? `Nenhuma barragem${filtroUf} no acervo local do SIGBM/ANM (${barragens.length} estruturas). ` +
        `UFs no acervo: ${ufsDisponiveis.join(", ") || "nenhuma"}.`
      : `${encontradas.length} barragem(ns)${filtroUf} no acervo local do SIGBM/ANM; ` +
        `mostrando ${pagina.deslocamento + 1}–${pagina.deslocamento + itens.length}, do risco maior para o menor.`;

  return {
    filtro: { uf, limite: pagina.limite, deslocamento: pagina.deslocamento },
    total: encontradas.length,
    totalNoAcervo: barragens.length,
    mostrando: itens.length,
    temMais: pagina.deslocamento + itens.length < encontradas.length,
    itens,
    resumo: {
      porNivelEmergencia: contarPor(encontradas, (barragem) => barragem.nivelEmergencia),
      porSituacao: contarPor(encontradas, (barragem) => barragem.situacao),
      porUf: contarPor(encontradas, (barragem) => barragem.uf),
    },
    ufsDisponiveis,
    mensagem,
  };
}

/** Texto que o cliente MCP recebe. */
export function formatarBarragens(resultado: ResultadoBarragens): string {
  const linhas: string[] = [resultado.mensagem];
  const niveis = Object.entries(resultado.resumo.porNivelEmergencia)
    .sort((a, b) => pesoEmergencia(b[0]) - pesoEmergencia(a[0]))
    .map(([nivel, quantidade]) => `${nivel}: ${quantidade}`);
  const situacoes = Object.entries(resultado.resumo.porSituacao)
    .sort((a, b) => b[1] - a[1])
    .map(([situacao, quantidade]) => `${situacao}: ${quantidade}`);

  if (niveis.length > 0) {
    linhas.push(`Nível de emergência — ${niveis.join("; ")}.`);
    linhas.push(`Situação — ${situacoes.join("; ")}.`);
  }

  resultado.itens.forEach((item, indice) => {
    linhas.push(
      "",
      `${resultado.filtro.deslocamento + indice + 1}. ${item.nome} (${item.municipio}/${item.uf})`,
      `   Situação: ${item.situacao || "não informada"} · Emergência: ${item.nivelEmergencia || "não informada"}`,
      `   Risco: ${item.categoriaRisco || "não informado"} · Dano potencial: ${item.danoPotencial || "não informado"}`,
    );
    if (item.empreendedor) linhas.push(`   Empreendedor: ${item.empreendedor}`);
    if (item.faseDescaracterizacao) {
      linhas.push(`   Descaracterização: ${item.faseDescaracterizacao}`);
    }
    linhas.push(`   id SIGBM: ${item.id}`);
  });

  if (resultado.temMais) {
    linhas.push(
      "",
      `Há mais resultados. Peça o próximo bloco com deslocamento=${resultado.filtro.deslocamento + resultado.mostrando}.`,
    );
  }

  return linhas.join("\n");
}
