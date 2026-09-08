#!/usr/bin/env node
/**
 * scripts/gerar-manifesto-modelo.mts
 * 
 * Etapa 1 do Pipeline de Páginas Modelo:
 * Processa um JSON bruto, aplica compactação com esqueleto + dicionário, 
 * sanitiza contra LGPD/CPF e gera um manifesto leve em Markdown para a LLM offline (Picoclaw/Hermes).
 * 
 * Suporta dois tipos de modelos:
 *   - 'acervo': Páginas de listagem com as 5 regras de UI (Gráfico, Cards, CSV, Filtros, TabelaEstatica)
 *   - 'detalhamento': Páginas de Perfil / Ficha Individual (Contratos, Editais, Vereadores, Proposições)
 */

import fs from "node:fs";
import path from "node:path";
import { compactar, serializarCompacto } from "../apps/web/lib/estatico/compactar.js";

interface CliArgs {
  origem: string;
  nomeRota: string;
  titulo: string;
  tipo: "acervo" | "detalhamento";
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let origem = "";
  let nomeRota = "";
  let titulo = "";
  let tipo: "acervo" | "detalhamento" = "acervo";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--origem" && args[i + 1]) origem = args[++i];
    if (args[i] === "--rota" && args[i + 1]) nomeRota = args[++i];
    if (args[i] === "--titulo" && args[i + 1]) titulo = args[++i];
    if (args[i] === "--tipo" && args[i + 1]) {
      const val = args[++i];
      if (val === "detalhamento" || val === "acervo") tipo = val;
    }
  }

  if (!origem || !nomeRota) {
    console.error("Uso: npx tsx scripts/gerar-manifesto-modelo.mts --origem <caminho.json> --rota <nome-da-rota> [--titulo 'Título'] [--tipo acervo|detalhamento]");
    process.exit(1);
  }

  return { origem, nomeRota, titulo: titulo || nomeRota, tipo };
}

async function main() {
  const { origem, nomeRota, titulo, tipo } = parseArgs();

  console.log(`[ETL Modelo] Lendo arquivo bruto: ${origem}`);
  const rawData = fs.readFileSync(path.resolve(origem), "utf-8");
  const parsed = JSON.parse(rawData);
  const items = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.itens) ? parsed.itens : []);

  if (!Array.isArray(items) || items.length === 0) {
    console.error("Erro: O JSON de origem precisa conter um array de objetos não vazio (ou chave 'itens').");
    process.exit(1);
  }

  console.log(`[ETL Modelo] Processando ${items.length} registros para o modelo de ${tipo.toUpperCase()}...`);

  // 1. Compactar dados usando o padrão do repositório
  const tabelaCompacta = compactar(items, { nuncaInternar: ["cpf", "cnpj", "cgccpf", "documento"] });
  
  // Limpar nome da rota para caminhos de arquivo válidos no Windows
  const safePathName = nomeRota.replace(/\[/g, "_").replace(/\]/g, "_");

  const dataDir = path.resolve(`apps/web/data/${safePathName}`);
  fs.mkdirSync(dataDir, { recursive: true });

  const targetDataFile = path.join(dataDir, "dados.compact.json");
  const cabecalho = {
    origem,
    rota: nomeRota,
    tipo,
    total_registros: items.length,
    gerado_em: new Date().toISOString()
  };

  const jsonCompacto = serializarCompacto(cabecalho, tabelaCompacta);
  fs.writeFileSync(targetDataFile, jsonCompacto, "utf-8");
  console.log(`[ETL Modelo] Dados compactados salvos em: ${targetDataFile}`);

  // 2. Extrair campos para o manifesto leve da LLM
  const esqueleto = tabelaCompacta.esqueleto;
  const dicionarios = tabelaCompacta.dicionarios;

  let instrucoesModelo = "";
  if (tipo === "acervo") {
    instrucoesModelo = `
### Instruções para o Agente (Modelo A: Acervo Transparente)
Gere a rota em \`apps/web/app/${nomeRota}/page.tsx\`:
1. Importe dados de \`@/data/${safePathName}/dados.compact.json\` e descompacte com \`descompactar\`.
2. Implemente os 5 elementos de UI obrigatórios:
   - Cartões Agregados (Topo)
   - Gráfico SVG Inline
   - Exportação CSV (UTF-8 com BOM e \`;\`)
   - Componente \`TabelaEstatica\` para navegação
   - Filtros por coluna baseados nos dicionários
`;
  } else {
    instrucoesModelo = `
### Instruções para o Agente (Modelo B: Detalhamento / Perfil de Entidade)
Gere a rota dinâmica em \`apps/web/app/${nomeRota}/page.tsx\`:
1. Importe dados de \`@/data/${safePathName}/dados.compact.json\` e descompacte com \`descompactar\`.
2. Exporte obrigatoriamente a função \`generateStaticParams()\` para pré-renderizar todos os IDs/slugs no \`output: export\` do Cloudflare Workers.
3. Monte o Perfil/Ficha Individual contendo:
   - Header do Perfil com metadados principais (título, órgão, fornecedor/político, valor)
   - Badge/Selo de Alerta de Atenção (com metodologia explicativa e ressalva de não ser acusação)
   - Histórico de eventos, aditivos ou proposições relacionadas
   - Componente \`PedidoLAI\` ao final da página
   - Breadcrumb Schema.org (\`BreadcrumbJsonLd\`)
`;
  }

  const promptManifesto = `# Manifesto de Dados para Página Modelo (${tipo.toUpperCase()}): /${nomeRota}

**Título:** ${titulo}
**Tipo de Modelo:** ${tipo}
**Total de Registros:** ${items.length}
**Caminho dos Dados:** \`@/data/${safePathName}/dados.compact.json\`

## Esqueleto de Campos (${esqueleto.length} colunas)
${esqueleto.map((c) => `- \`${c}\``).join("\n")}

## Dicionários / Colunas de Atributos
${Object.entries(dicionarios)
  .map(([col, vals]) => `- **\`${col}\`** (${vals.length} valores distintos): ex: ${vals.slice(0, 5).map(v => `"${v}"`).join(", ")}`)
  .join("\n")}

---

${instrucoesModelo}
`;

  const promptFile = path.resolve(`scripts/prompts/manifesto-${safePathName}.md`);
  fs.mkdirSync(path.dirname(promptFile), { recursive: true });
  fs.writeFileSync(promptFile, promptManifesto, "utf-8");

  console.log(`\n✅ Manifesto para o Agente Offline gerado com sucesso!`);
  console.log(`👉 ${promptFile}\n`);
}

main().catch((err) => {
  console.error("Erro na execução do ETL de modelo:", err);
  process.exit(1);
});
