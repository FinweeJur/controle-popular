/**
 * @file apps/web/lib/laboratorio/caderno-notebooklm.ts
 * @description Gerador de cadernos e dossiês para o sistema aberto tipo NotebookLM do Seu Nonô.
 *
 * Papel no portal:
 * Conecta o Laboratório de Dados ao assistente cívico aberto (Seu Nonô).
 * Permite transformar dados e camadas ativas em fontes do acervo (`AcervoFonte[]`).
 * Gera dossiês em formato Markdown aberto para estudo e leitura por LLMs locais (Ollama/Hermes).
 *
 * Regras e decisões:
 * - 100% aberto e auditável: padrão aberto compatível com Markdown, Obsidian e Logseq.
 * - Regra das Seis Qualidades: links canônicos oficiais em todos os registros citados.
 * - Proteção de dados pessoais: varredura estrita de CPF (Mod-11), SSN e SIN antes de formatar.
 * - Frases curtas e objetivas: adequadas à escada determinística e ao RAG citado.
 */

import type { AcervoFonte } from "@/lib/assistente/acervo";
import { sanitizarDadoPessoalInternacional } from "@/lib/internacional/privacidade-internacional";
import { cpfValido } from "@/lib/paraopeba/triagem";

export interface CamadaLabResumo {
  id: string;
  nome: string;
  categoria: string;
  totalLinhas?: number;
  valorTotal?: number | string;
  fonteOficial: string;
  urlOficial: string;
  descricao: string;
}

export interface OpcoesCaderno {
  titulo?: string;
  autor?: string;
  incluirFontesExternas?: boolean;
  limiteRegistros?: number;
}

/**
 * Sanitiza qualquer texto removendo CPFs (Mod-11), SSNs dos EUA e SINs canadenses.
 */
export function sanitizarTextoParaCaderno(texto: string): string {
  if (!texto) return texto;

  // 1. Sanitiza identificadores internacionais (SSN e SIN)
  let limpo = sanitizarDadoPessoalInternacional(texto);

  // 2. Sanitiza CPFs brasileiros (formatados ou 11 dígitos corridos válidos por Mod-11)
  const reCpf = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g;
  limpo = limpo.replace(reCpf, (candidato) => {
    const digitos = candidato.replace(/\D/g, "");
    if (cpfValido(digitos)) {
      return "[CPF-PROTEGIDO]";
    }
    return candidato;
  });

  return limpo;
}

/**
 * Converte camadas do Laboratório em itens de acervo (`AcervoFonte`)
 * para indexação no motor aberto tipo NotebookLM do Seu Nonô.
 */
export function converterCamadasParaAcervo(camadas: CamadaLabResumo[]): AcervoFonte[] {
  return camadas.map((c) => {
    const textoLimpo = sanitizarTextoParaCaderno(
      `Camada cívica: ${c.nome}. Categoria: ${c.categoria}. Fonte oficial: ${c.fonteOficial}. ` +
      `Descrição: ${c.descricao}. Total de registros medidos: ${c.totalLinhas ?? "agregado"}. ` +
      `Consulte sempre o ato oficial direto.`
    );

    return {
      id: `lab-${c.id}`,
      frente: "laboratorio",
      rota: `/laboratorio?j1=${c.id}`,
      titulo: `Laboratório — ${c.nome}`,
      fonteUrl: c.urlOficial.startsWith("http") ? c.urlOficial : "https://controlepopular.com.br" + c.urlOficial,
      texto: textoLimpo,
      links: [
        { href: `/laboratorio?j1=${c.id}`, texto: `Abrir camada ${c.nome}` },
        { href: c.urlOficial, texto: `Fonte oficial direta (${c.fonteOficial})` },
      ],
    };
  });
}

/**
 * Gera um dossiê aberto em Markdown compatível com o NotebookLM do Seu Nonô,
 * leitores locais (Obsidian, Logseq) e IAs abertas (Ollama, Hermes).
 */
export function gerarDossieNotebookLmAberto(
  camadas: CamadaLabResumo[],
  opcoes: OpcoesCaderno = {}
): string {
  const agora = new Date().toISOString().substring(0, 10);
  const titulo = opcoes.titulo ?? "Dossiê Cívico — Laboratório de Dados Abertos";
  const autor = opcoes.autor ?? "Controle Popular (controlepopular.com.br)";

  const linhas: string[] = [
    "---",
    `title: "${titulo}"`,
    `author: "${autor}"`,
    `date: "${agora}"`,
    "format: markdown-notebooklm-aberto",
    "portal: controlepopular.com.br",
    "licenca: CC-BY-4.0",
    "---",
    "",
    `# ${titulo}`,
    "",
    "> **Aviso ao leitor:** este dossiê foi gerado a partir de fontes públicas oficiais.",
    "> Todo número é medido e datado. Confira a fonte oficial antes de qualquer conclusão.",
    "",
    "## 1. Sumário Executivo",
    "",
    `Este caderno reúne ${camadas.length} camadas temáticas ativas no Laboratório de Dados.`,
    "Os dados cruzam meio ambiente, direitos, infraestrutura e finanças públicas.",
    "",
    "## 2. Camadas de Dados Analisadas",
    "",
  ];

  for (let i = 0; i < camadas.length; i++) {
    const c = camadas[i];
    const indice = i + 1;
    const nomeLimpo = sanitizarTextoParaCaderno(c.nome);
    const descLimpa = sanitizarTextoParaCaderno(c.descricao);
    const fonteLimpa = sanitizarTextoParaCaderno(c.fonteOficial);

    linhas.push(`### [${indice}] ${nomeLimpo}`);
    linhas.push(`- **Categoria:** ${c.categoria}`);
    linhas.push(`- **Fonte Primária Oficial:** [${fonteLimpa}](${c.urlOficial})`);
    linhas.push(`- **Registros Identificados:** ${c.totalLinhas ?? "Agregado oficial"}`);
    if (c.valorTotal) {
      linhas.push(`- **Valor Econômico Associado:** ${c.valorTotal}`);
    }
    linhas.push(`- **Síntese Técnica:** ${descLimpa}`);
    linhas.push(`- **Rota no Portal:** https://controlepopular.com.br/laboratorio?j1=${c.id}`);
    linhas.push("");
  }

  linhas.push("## 3. Perguntas Cívicas para o Assistente Seu Nonô");
  linhas.push("");
  linhas.push("Perguntas recomendadas para diálogo com o motor aberto tipo NotebookLM:");
  linhas.push("");

  const perguntasSugeridas = sugerirPerguntasCaderno(camadas);
  for (const p of perguntasSugeridas) {
    linhas.push(`- 🤖 **Pergunta:** "${p.pergunta}"`);
    linhas.push(`  - *Contexto:* ${p.contexto}`);
  }

  linhas.push("");
  linhas.push("---");
  linhas.push(`*Dossiê compilado em ${agora} sob o Padrão das Seis Qualidades do Controle Popular.*`);

  return linhas.join("\n");
}

/**
 * Sugere perguntas contextuais cruzando as camadas ativas.
 */
export function sugerirPerguntasCaderno(camadas: CamadaLabResumo[]): { pergunta: string; contexto: string }[] {
  if (camadas.length === 0) {
    return [
      {
        pergunta: "Quais são as principais camadas de dados disponíveis no Laboratório?",
        contexto: "Visão geral do acervo público.",
      },
    ];
  }

  const perguntas: { pergunta: string; contexto: string }[] = [];

  const temBarragens = camadas.some((c) => c.id.includes("barragem") || c.categoria.toLowerCase().includes("ambient"));
  const temLicencas = camadas.some((c) => c.id.includes("licenc") || c.nome.toLowerCase().includes("licen"));
  const temContratos = camadas.some((c) => c.id.includes("pncp") || c.categoria.toLowerCase().includes("econ"));

  if (temBarragens && temLicencas) {
    perguntas.push({
      pergunta: "Quantas barragens cadastradas no SIGBM possuem licenças ativas no mesmo município?",
      contexto: "Cruzamento entre segurança de barragens e licenciamento ambiental.",
    });
  }

  if (temBarragens) {
    perguntas.push({
      pergunta: "Qual é o volume total de rejeitos nas barragens em nível de emergência?",
      contexto: "Monitoramento de riscos físicos e salvaguarda de vidas.",
    });
  }

  if (temContratos) {
    perguntas.push({
      pergunta: "Quais foram os maiores contratos públicos registrados no PNCP este ano?",
      contexto: "Transparência orçamentária e controle de gastos públicos.",
    });
  }

  // Pergunta de fecho genérica
  const primeiroNome = sanitizarTextoParaCaderno(camadas[0]?.nome ?? "esta camada");
  perguntas.push({
    pergunta: `Qual é o resumo e a fonte oficial direta dos dados de ${primeiroNome}?`,
    contexto: "Verificação da fonte primária e rastreabilidade direta.",
  });

  return perguntas;
}
