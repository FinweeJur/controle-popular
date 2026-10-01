import type { Metadata } from "next";
import Link from "next/link";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { obterCadastroEmpregadores } from "@/lib/server-only/dados-cadastro-empregadores";
import TabelaCadastroEmpregadores from "./TabelaCadastroEmpregadores";

/**
 * `/direitos-em-movimento/trabalho-e-renda/cadastro-empregadores`
 *
 * Trabalho escravo contemporâneo: as empresas (pessoa jurídica) incluídas pelo
 * Ministério do Trabalho e Emprego no Cadastro de Empregadores que submeteram
 * trabalhadores a condições análogas à escravidão — a "lista suja".
 *
 * ═══ FONTE E RÉGUA EDITORIAL (AGENTS § 7) ═══
 * Fonte: Cadastro de Empregadores do MTE (Portaria Interministerial
 * MTE/MDHC/MIR nº 18/2024), arquivo público atualizado periodicamente. Cada
 * linha traz o CNPJ, o estabelecimento, o número de trabalhadores envolvidos, o
 * CNAE e as datas da decisão administrativa e da inclusão no Cadastro.
 *
 * A inclusão é ATO ADMINISTRATIVO — a empresa pode contestar e ser excluída
 * depois. O portal republica o ato oficial com a data, não acusa nem conclui.
 * O que o leitor faz com o dado é conferir na fonte e cobrar dos contratos
 * públicos daquele CNPJ (PNCP e Portal da Transparência, linkados por linha).
 *
 * ═══ POR QUE SÓ PESSOA JURÍDICA ═══
 * O Cadastro mistura CNPJ e CPF. As pessoas físicas são contadas e omitidas do
 * acervo por proteção de dado pessoal — nome de indivíduo atrelado a este tema
 * é sensível, e o cruzamento com contratos públicos só se aplica a CNPJ. O CPF
 * nunca é gravado (ver o coletor `scripts/etl/trabalho/coletar-lista-suja-mte.py`).
 *
 * Todos os números dos cartões são medidos do dado versionado, nunca digitados.
 */

const acervo = obterCadastroEmpregadores();
const fmt = (n: number) => n.toLocaleString("pt-BR");

export const metadata: Metadata = {
  title: "Cadastro de Empregadores (trabalho escravo) — Controle Popular",
  description:
    `${fmt(acervo.total_registros)} empregadores pessoa jurídica no Cadastro de Empregadores do MTE ` +
    `(${acervo.total_empresas} empresas, ${acervo.total_ufs} UFs, ${fmt(acervo.trabalhadores_envolvidos_total)} trabalhadores ` +
    `envolvidos), com CNPJ, ato administrativo e link para conferir contratos públicos.`,
};

function Cartao({ valor, rotulo, nota }: { valor: string; rotulo: string; nota?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-5">
      <p className="text-2xl font-semibold tabular-nums">{valor}</p>
      <p className="mt-1 text-sm text-text-soft">{rotulo}</p>
      {nota ? <p className="mt-2 text-xs text-text-soft">{nota}</p> : null}
    </div>
  );
}

export default function PaginaCadastroEmpregadores() {
  const hoje = acervo.atualizado_em ? acervo.atualizado_em.split("-").reverse().join("/") : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Trilha de navegação" className="text-xs text-muted">
        <Link href="/direitos-em-movimento" className="hover:text-primary transition">
          Direitos em Movimento
        </Link>{" "}
        ·{" "}
        <Link href="/direitos-em-movimento/trabalho-e-renda" className="hover:text-primary transition">
          Trabalho e Renda
        </Link>{" "}
        · <span className="text-foreground font-semibold">Cadastro de Empregadores</span>
      </nav>

      <header className="mt-4 mb-6">
        <p className="text-sm uppercase tracking-wide text-text-soft">
          Trabalho escravo contemporâneo · Cadastro de Empregadores (MTE) · dados de {hoje || "—"}
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          Cadastro de Empregadores: quem submeteu trabalhadores a condições análogas à escravidão
        </h1>
        <ResumoExpandivel
          className="mt-3 max-w-3xl text-sm leading-relaxed text-text-soft"
          texto={
            `A "lista suja" do trabalho escravo reúne os empregadores que o Ministério do Trabalho e Emprego ` +
            `incluiu no Cadastro de Empregadores, depois de decisão administrativa procedente. Esta página ` +
            `publica as ${fmt(acervo.total_registros)} pessoas jurídicas do Cadastro vigente (${acervo.total_empresas} ` +
            `empresas, em ${acervo.total_ufs} UFs) e linka, para cada CNPJ, os contratos públicos — para o cidadão ` +
            `cobrar de quem contrata. A inclusão é ato administrativo do MTE, com direito a defesa e exclusão: ` +
            `o portal republica o ato com a data, não acusa.`
          }
        />
      </header>

      <section aria-label="Resumo em números" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao valor={fmt(acervo.total_registros)} rotulo="registros (pessoa jurídica)" nota="um por estabelecimento no Cadastro" />
        <Cartao valor={fmt(acervo.total_empresas)} rotulo="empresas (raiz de CNPJ)" nota="cada matriz com seus estabelecimentos" />
        <Cartao valor={fmt(acervo.total_ufs)} rotulo="estados" nota="UF do estabelecimento fiscalizado" />
        <Cartao
          valor={fmt(acervo.trabalhadores_envolvidos_total)}
          rotulo="trabalhadores envolvidos"
          nota="soma dos casos do Cadastro vigente"
        />
      </section>

      <p className="mt-4 rounded-xl border border-alert/40 bg-alert/10 p-3 text-sm">
        <strong>Estar no Cadastro é o começo da apuração, não o fim.</strong> A inclusão é ato do Ministério do
        Trabalho e Emprego; a empresa pode contestar na Justiça e ser excluída depois. O portal republica o ato
        oficial com a data — antes de concluir, confira a versão vigente na fonte e o processo.
      </p>

      <div className="mt-6">
        <TabelaCadastroEmpregadores registros={acervo.registros} />
      </div>

      <section
        aria-label="Fonte e método"
        className="mt-6 rounded-2xl border border-border bg-surface-2 p-5 text-sm leading-relaxed"
      >
        <h2 className="text-xl font-semibold">De onde vêm estes números</h2>
        <p className="mt-3">
          {acervo.metodologia}
        </p>
        <p className="mt-3 rounded-xl bg-surface p-3">
          <strong>Pessoa física:</strong> {fmt(acervo.empregadores_pessoa_fisica_omitidos)} empregadores pessoa
          física estão no Cadastro do MTE e <strong>não</strong> são publicados aqui — proteção de dado pessoal e
          foco no cruzamento com contratos públicos. A fonte oficial traz a lista completa.
        </p>
        <p className="mt-2 text-text-soft">
          Fonte:{" "}
          <a href={acervo.url_pagina} target="_blank" rel="noopener noreferrer" className="underline">
            Cadastro de Empregadores — MTE
          </a>
          {" "}(<a href={acervo.url_fonte} target="_blank" rel="noopener noreferrer" className="underline">arquivo</a>).
          Coletor: <code>scripts/etl/trabalho/coletar-lista-suja-mte.py</code>. Atualizado em {hoje || "—"}.
        </p>
        <p className="mt-2 text-text-soft print:hidden">
          A tabela é vetorial e sai nítida na impressão; o botão de planilha baixa exatamente o que está
          filtrado na tela, com separador <code>;</code> e BOM UTF-8 para o Excel brasileiro.
        </p>
      </section>
    </main>
  );
}
