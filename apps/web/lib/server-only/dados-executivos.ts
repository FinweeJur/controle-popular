/**
 * @file apps/web/lib/server-only/dados-executivos.ts
 * @description Loader SERVER-ONLY dos dados de governança corporativa
 * (Diretores Estatutários, CEOs, Conselhos) para `/empresas/executivos`.
 *
 * POR QUE ESTE ARQUIVO EXISTE (separado de lib/empresas/dados-executivos.ts):
 * o componente de cliente `PainelExecutivosClient.tsx` importa os TIPOS e as
 * CONSTANTES (ROTULOS_ORGAOS, COBERTURA_EXECUTIVOS) do módulo compartilhado.
 * Quando as funções de leitura em disco (`node:fs`) moravam no MESMO arquivo,
 * o webpack embutia o módulo inteiro no bundle do navegador e o build morria
 * com `UnhandledSchemeError: Reading from "node:fs"` (medido no build local
 * de 01/10/2026 — foi o que derrubou o deploy 79af0f44 no Guara). Convenção
 * do repo: leitura de JSON fica em `lib/server-only/` — ver o cabeçalho de
 * `lib/server-only/json-etl.ts`. O componente de cliente NUNCA importa este
 * arquivo; quem lê do disco é a página de servidor (page.tsx) e repassa props.
 *
 * Fontes oficiais: CVM (FRE itens 8/12/13, IAN/DFP), SEC (20-F, 10-K, DEF 14A),
 * SEDAR+ (Canadá), Companies House, CMVM, BaFin — ver o módulo compartilhado.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expandir, type TabelaCompacta } from "@/lib/estatico/compactar";

import type { RegistroExecutivo } from "@/lib/empresas/dados-executivos";

/** Cache em memória para evitar releitura e reexpansão de disco no ciclo de vida do processo */
let CACHE_EXECUTIVOS: RegistroExecutivo[] | null = null;

/**
 * Localiza o arquivo de dados compactados considerando variações de CWD
 * entre execução do Next.js, suíte de testes Vitest e scripts na raiz.
 */
function resolverCaminhoDados(): string {
  const relativo = path.join("data", "empresas", "executivos-conselhos.compact.json");
  const candidatos = [
    path.join(process.cwd(), relativo),
    path.join(process.cwd(), "apps", "web", relativo),
  ];

  try {
    const dirModulo = path.dirname(fileURLToPath(import.meta.url));
    candidatos.push(path.resolve(dirModulo, "../../data/empresas/executivos-conselhos.compact.json"));
  } catch {
    // Caso import.meta.url não esteja disponível em ambientes específicos de bundle
  }

  for (const cand of candidatos) {
    if (fs.existsSync(cand)) {
      return cand;
    }
  }

  return candidatos[0];
}

/**
 * Retorna todos os executivos, conselheiros e membros de comitês de auditoria catalogados.
 *
 * @returns Lista completa e tipada de registros de governança corporativa.
 */
export function obterExecutivosConselhos(): RegistroExecutivo[] {
  if (CACHE_EXECUTIVOS) {
    return CACHE_EXECUTIVOS;
  }

  try {
    const caminho = resolverCaminhoDados();
    if (!fs.existsSync(caminho)) {
      return [];
    }

    const conteudoRaw = fs.readFileSync(caminho, "utf-8");
    const tabelaCompacta = JSON.parse(conteudoRaw) as TabelaCompacta;
    const itensExpandidos = expandir<RegistroExecutivo>(tabelaCompacta);

    CACHE_EXECUTIVOS = itensExpandidos;
    return CACHE_EXECUTIVOS;
  } catch (erro) {
    console.error("Falha ao carregar dados de executivos e conselhos:", erro);
    return [];
  }
}

/**
 * Filtra os membros de governança de uma empresa específica a partir do seu identificador/slug.
 *
 * @param empresaId - Slug canônico da empresa (ex.: 'vale', 'petrobras', 'samarco', 'bhp').
 * @returns Lista de executivos e conselheiros vinculados à corporação.
 */
export function obterExecutivosPorEmpresa(empresaId: string): RegistroExecutivo[] {
  const todos = obterExecutivosConselhos();
  const idNormalizado = empresaId.trim().toLowerCase();
  return todos.filter((item) => item.empresaId.toLowerCase() === idNormalizado);
}

/**
 * Retorna exclusivamente os executivos e conselheiros que possuem diretorias ou conselhos entrelaçados
 * (interlocking directorates) com outras corporações monitoradas.
 *
 * @returns Registros onde `interlockingIds` não está vazio.
 */
export function obterDiretoriasEntrelacadas(): RegistroExecutivo[] {
  const todos = obterExecutivosConselhos();
  return todos.filter((item) => Array.isArray(item.interlockingIds) && item.interlockingIds.length > 0);
}

/**
 * Busca um registro de executivo ou conselheiro pelo seu identificador único.
 *
 * @param id - Identificador único (ex.: 'exec-vale-gustavo-pimenta').
 * @returns O registro correspondente ou `undefined` se não for localizado.
 */
export function obterExecutivoPorId(id: string): RegistroExecutivo | undefined {
  const todos = obterExecutivosConselhos();
  return todos.find((item) => item.id === id);
}
