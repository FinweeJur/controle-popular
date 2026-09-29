/**
 * Página de Municípios de Minas Gerais (Cidades de MG)
 * 
 * Papel: Apresentar a lista completa dos 853 municípios de Minas Gerais
 * com busca em tempo real, microrregiões e mesorregiões.
 * 
 * Fonte oficial:
 * - IBGE (Serviço de Dados): Localidades e Malha Municipal de MG (UF 31).
 *   URL: https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios
 * 
 * Decisões técnicas:
 * - Leitura no build via manifesto fatiado (`/municipios/mg`) com fallback
 *   para JSON local estático, respeitando teto de memória e payload.
 */

import TabelaEstatica, { type ColunaTabela } from "@/app/[municipio]/components/TabelaEstatica";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { POLOS_MG, calcularResumoPolosMg } from "@/lib/cidades/mg-polos";

interface Municipio {
  [key: string]: unknown;
  id: string;
  nome: string;
  microrregiao: string;
  mesorregiao: string;
  regiao_imediata: string;
  regiao_intermediaria: string;
}

const COLUNAS: ColunaTabela<Municipio>[] = [
  { chave: "nome", rotulo: "Município", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[180px]" },
  { chave: "microrregiao", rotulo: "Microrregião", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[140px]" },
  { chave: "mesorregiao", rotulo: "Mesorregião", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[140px]" },
  { chave: "regiao_imediata", rotulo: "Região Imediata", ordenavel: true, tipoOrdenacao: "texto", largura: "min-w-[140px]" },
];

export default async function PageCidadesMG() {
  // Verifica se os dados foram publicados via build (public/municipios/mg/)
  const publicDir = path.join(process.cwd(), "apps/web/public/municipios/mg");
  const base = "/municipios/mg";
  let total = 853;

  if (fs.existsSync(path.join(publicDir, "manifesto.json"))) {
    const manifesto = JSON.parse(fs.readFileSync(path.join(publicDir, "manifesto.json"), "utf-8"));
    total = manifesto.total;
  } else {
    // Fallback: tenta ler dados diretamente (next dev)
    const dataDir = path.join(process.cwd(), "apps/web/data", "municipios-mg.json");
    if (fs.existsSync(dataDir)) {
      const dados = JSON.parse(fs.readFileSync(dataDir, "utf-8"));
      total = dados.length;
    }
  }

  const resumoPolos = calcularResumoPolosMg();

  const cartao = {
    titulo: "Municípios de Minas Gerais",
    valor: total.toLocaleString("pt-BR"),
    descricao: "Todos os municípios de MG catalogados pelo IBGE",
  };

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8">
        <nav aria-label="Você está em" className="text-sm text-text_soft">
          <Link href="/">Controle Popular</Link> {" > "} <Link href="/cidades">Cidades</Link> {" > "} <span>Minas Gerais (MG)</span>
        </nav>
        <h1 className="mt-2 text-3xl font-bold">Municípios de Minas Gerais</h1>
        <p className="mt-3 text-text_soft">
          Todos os {cartao.valor} municípios de Minas Gerais mapeados via API oficial do IBGE. Dados atualizados
          e indexados para auditoria pública e cruzamento cívico — <a href="https://servicodados.ibge.gov.br/api/v1/localidades/estados/31/municipios" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Fonte Oficial IBGE</a>.
        </p>
      </header>

      {/* Cartão de Topo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <section className="rounded-lg border border-[var(--cp-border)] bg-surface p-5">
          <h2 className="text-sm font-semibold text-text_soft">{cartao.titulo}</h2>
          <p className="text-3xl font-bold text-[var(--cp-accent)] mt-1">{cartao.valor}</p>
          <p className="text-xs text-text_soft mt-1">{cartao.descricao}</p>
        </section>

        <section className="rounded-lg border border-[var(--cp-border)] bg-surface p-5">
          <h2 className="text-sm font-semibold text-text_soft">Cidades Polos Catalogadas</h2>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{POLOS_MG.length}</p>
          <p className="text-xs text-text_soft mt-1">Betim, BH, Contagem, Uberlândia, JF, etc.</p>
        </section>

        <section className="rounded-lg border border-[var(--cp-border)] bg-surface p-5">
          <h2 className="text-sm font-semibold text-text_soft">População dos Polos (Censo 2022)</h2>
          <p className="text-3xl font-bold text-sky-600 mt-1">{resumoPolos.populacaoTotal.toLocaleString("pt-BR")}</p>
          <p className="text-xs text-text_soft mt-1">Soma dos 10 polos — IBGE, Censo 2022</p>
        </section>
      </div>

      {/* Destaque Polos Regionais */}
      <section className="mb-8 rounded-lg border border-[var(--cp-border)] bg-surface p-5">
        <h2 className="text-lg font-bold mb-3">Principais Polos Regionais em Destaque</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {POLOS_MG.map((polo) => (
            <Link
              key={polo.ibge7}
              href={`/${polo.slug}`}
              className="p-3 rounded border border-[var(--cp-border)] hover:border-emerald-500 hover:bg-emerald-50/10 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="font-semibold text-sm block">{polo.nome}</span>
                <span className="text-xs text-text_soft">{polo.microrregiao}</span>
              </div>
              <span className="text-[11px] text-emerald-600 mt-2 font-mono">IBGE: {polo.ibge7}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Tabela de Municípios */}
      <h2 className="text-xl font-bold mb-3">Relação Completa dos {cartao.valor} Municípios</h2>
      <TabelaEstatica<Municipio>
        base={base}
        colunas={COLUNAS}
        camposBusca={["nome", "microrregiao", "mesorregiao", "regiao_imediata"]}
        porPagina={50}
        vazio="Nenhum município encontrado nesta busca."
      />

      <footer className="mt-8 border-t border-[var(--cp-border)] pt-4 text-sm text-text_soft">
        <p>🏛️ Dados de Minas Gerais integrados pelo Controle Popular com rastreabilidade direta ao IBGE.</p>
      </footer>
    </article>
  );
}