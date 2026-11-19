import type { Metadata } from "next";
import Link from "next/link";

import fornecedoresJson from "@/data/fornecedores/enriquecido.json";
import CartoesResumo from "@/app/components/CartoesResumo";
import DataColeta from "@/app/components/DataColeta";
import ExplicadorDaPagina from "@/app/components/ExplicadorDaPagina";
import FooterGlobal from "@/app/components/FooterGlobal";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { formatNumberBR } from "@/lib/betim/format";
import {
  formatarDataBR,
  listarSituacoes,
  resumoFornecedores,
  type DadosFornecedores,
} from "@/lib/fontes-externas/paginas";
import { metadataEditavel } from "@/lib/edicoes";

import PainelFornecedores from "./PainelFornecedores";

/**
 * ═══ FORNECEDORES COM CNPJ ENRIQUECIDO — TEMA EMPRESAS ═══
 *
 * O que é:
 *   Subpágina de `/empresas` com a amostra de 17 fornecedores que já aparecem
 *   no acervo do portal (contratos do PNCP), enriquecidos com situação
 *   cadastral, CNAE, natureza jurídica, município/UF e data de abertura.
 *
 * Fonte oficial:
 *   Brasil API — https://brasilapi.com.br/api/cnpj/v1/{cnpj}, dados públicos da
 *   Receita Federal. JSON versionado em
 *   `apps/web/data/fornecedores/enriquecido.json`.
 *
 * Por que foi feito assim:
 *   - É amostra fechada, não cadastro completo: 20 CNPJ consultados, 17
 *     versionados e 3 descartados por serem Empresário Individual (a razão
 *     social é o nome da pessoa). A página diz isso em vez de sugerir censo.
 *   - Sem sócio, CPF, telefone ou e-mail. O coletor nem lê o QSA; o teste de
 *     contrato reprova campo novo fora da lista fechada.
 *   - O tema é EMPRESAS: a rota mora em `/empresas/fornecedores`, não numa
 *     frente nova. Server Component importa o JSON; o cliente recebe 17 linhas.
 *   - Regras 5.10, 5.14 e 5.16: texto legível, 390 px sem rolagem lateral e
 *     interface a partir de 12 px.
 */

const dados = fornecedoresJson as unknown as DadosFornecedores;
const resumo = resumoFornecedores(dados);

const SECOES = [
  { id: "amostra", titulo: "1. O que é esta amostra" },
  { id: "numeros", titulo: "2. O que foi medido" },
  { id: "tabela", titulo: "3. Fornecedores por CNPJ" },
  { id: "limites", titulo: "4. Limites e privacidade" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/empresas",
    titulo: "Observatório de Grandes Empresas & Fundos",
    descricao: "As 130 entidades do acervo, com ações, ESG, licenciamentos e contratos.",
  },
  {
    href: "/cidades/diarios",
    titulo: "Diários Oficiais Municipais",
    descricao: "Cobertura do Querido Diário em Betim, Contagem e Uberaba.",
  },
  {
    href: "/editais",
    titulo: "Editais e Licitações de Minas Gerais",
    descricao: "Chamamentos e compras públicas do Diário Oficial do Estado.",
  },
  {
    href: "/dados",
    titulo: "Catálogo de Dados Abertos",
    descricao: "As bases que alimentam o portal, com fonte, licença e data de coleta.",
  },
];

export const metadata: Metadata = metadataEditavel("/empresas/fornecedores", {
  title: "Fornecedores com CNPJ Enriquecido — Empresas | Controle Popular",
  description: `Amostra de ${formatNumberBR(
    resumo.total
  )} fornecedores do acervo com situação cadastral, CNAE, natureza jurídica e município, consultados na Brasil API (dados públicos da Receita Federal).`,
});

export default function FornecedoresPage() {
  const situacoes = listarSituacoes(dados.fornecedores);
  const ufs = resumo.ufs.map((item) => item.uf);

  return (
    <div className="min-h-screen bg-surface-0 text-text">
      <main id="conteudo-principal" className="mx-auto w-full max-w-6xl min-w-0 px-4 py-10 sm:px-6">
        <nav
          aria-label="Navegação estrutural"
          className="mb-4 flex flex-wrap items-center gap-2 text-xs text-text-soft"
        >
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/empresas" className="hover:text-primary">
            Empresas
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-text">Fornecedores</span>
        </nav>

        <header>
          <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
            Tema Empresas · Fonte externa
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight text-text">
            Fornecedores do acervo com CNPJ enriquecido
          </h1>
          <ExplicadorDaPagina
            frase="Veja 17 fornecedores de contratos públicos do portal, com CNPJ consultado na Receita. É uma amostra, não a lista completa."
            itens={[
              "Quantos CNPJ foram consultados e por que 3 ficaram de fora.",
              "Situação cadastral, CNAE e município de cada fornecedor, com a data da consulta.",
              "A tabela filtrável e ordenável, com CSV do que está na tela.",
              "Os limites: lista parcial, sem sócios, CPF ou contato.",
            ]}
            glossario={[
              {
                termo: "CNPJ (Cadastro Nacional da Pessoa Jurídica)",
                definicao:
                  "número de 14 dígitos que identifica cada empresa no cadastro da Receita Federal. É o mesmo número que aparece no contrato público.",
              },
              {
                termo: "CNAE (Classificação Nacional de Atividades Econômicas)",
                definicao:
                  "código que diz o ramo principal da empresa — por exemplo, construção, transporte ou consultoria. A tabela mostra o código e a descrição.",
              },
              {
                termo: "Situação cadastral",
                definicao:
                  "estado do CNPJ na Receita: ATIVA, BAIXADA, INAPTA ou SUSPENSA. Muda sem avisar o portal; a data da consulta é a régua desta página.",
              },
              {
                termo: "Natureza jurídica",
                definicao:
                  "forma legal da empresa: LTDA, S.A., EIRELI, MEI e outras. Aparece junto da razão social, com a data de início da atividade.",
              },
              {
                termo: "Amostra",
                definicao:
                  "grupo fechado de casos escolhidos para medir, não o universo inteiro. Aqui, 17 empresas que já aparecem nos contratos do acervo.",
              },
              {
                termo: "Empresário Individual",
                definicao:
                  "empresa cujo dono é uma pessoa física e a razão social é o nome dela. Ficou fora da amostra para não publicar nome de pessoa.",
              },
              {
                termo: "Brasil API",
                definicao:
                  "serviço público que devolve, em texto, o cadastro da Receita Federal a partir do CNPJ. É a fonte da consulta desta página.",
              },
            ]}
          />
          <ResumoExpandivel
            texto="Amostra de 17 fornecedores que já aparecem nos contratos públicos do portal, com o cadastro da Receita Federal completado pela Brasil API: situação cadastral, CNAE, natureza jurídica, município e data de abertura. É amostra, não o cadastro inteiro."
            className="mt-3 max-w-3xl text-text-soft"
          />
          <DataColeta
            coletadoEm={dados.coletadoEm}
            fonte={dados.fonte.nome}
            competencia={`${formatNumberBR(dados.consultados)} CNPJ consultados`}
          />
        </header>

        <IndiceWiki itens={SECOES} />

        <SecaoWiki id="amostra" titulo="1. O que é esta amostra">
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-text-soft sm:text-base">
            <p>
              O portal já publica contratos públicos com o CNPJ do fornecedor. O que faltava era a
              resposta à primeira pergunta que o leitor faz:{" "}
              <strong className="text-text">“essa empresa ainda existe?”</strong>. A Brasil API
              devolve o cadastro da Receita Federal em texto — situação cadastral (
              <code className="text-xs">ATIVA</code>, <code className="text-xs">BAIXADA</code>,{" "}
              <code className="text-xs">INAPTA</code>), descrição do CNAE, natureza jurídica e
              município —, o que o contrato sozinho não traz.
            </p>
            <p>
              Foram <strong className="text-text">{formatNumberBR(dados.consultados)} CNPJ</strong>{" "}
              consultados, uma vez cada, todos já presentes em{" "}
              <code className="text-xs">apps/web/data/contratos-pncp-consolidado.json</code>.{" "}
              {formatNumberBR(resumo.total)} viraram linha versionada. Os{" "}
              {formatNumberBR(resumo.descartados)} descartados são{" "}
              <strong className="text-text">Empresário Individual</strong>: o CNPJ é válido, mas a
              razão social é o nome da pessoa — publicação de pessoa física está fora da regra do
              portal. Eles ficam registrados só pelo número e pelo motivo, sem nome.
            </p>
          </div>
        </SecaoWiki>

        <SecaoWiki id="numeros" titulo="2. O que foi medido">
          <CartoesResumo
            colunas={4}
            itens={[
              {
                rotulo: "Fornecedores · amostra",
                valor: resumo.total,
                detalhe: "linhas versionadas de 20 CNPJ consultados",
                destaque: true,
              },
              {
                rotulo: "Estados (UF)",
                valor: ufs.length,
                detalhe: `Brasil · ${ufs.length} UFs: ${ufs.join(" · ")}`,
              },
              {
                rotulo: "CNAEs distintos",
                valor: resumo.cnaesDistintos,
                detalhe: "atividade principal declarada de cada empresa",
              },
              {
                rotulo: "CNPJ consultados",
                valor: resumo.consultados,
                detalhe: `${formatNumberBR(
                  resumo.descartados
                )} descartados por serem Empresário Individual (pessoa física)`,
              },
            ]}
          />

          <p className="mt-3 text-xs text-text-soft">
            Situações no arquivo:{" "}
            {resumo.situacoes
              .map((item) => `${item.situacao} (${formatNumberBR(item.total)})`)
              .join(" · ")}
            . Situação muda na Receita sem aviso; a data da consulta é a régua desta página.
          </p>
        </SecaoWiki>

        <SecaoWiki id="tabela" titulo="3. Fornecedores por CNPJ">
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
            Razão social, CNPJ, situação cadastral, CNAE, município/UF e data da consulta. Filtre
            por situação, busque por nome ou número e baixe em CSV o que estiver na tela.
          </p>
          <PainelFornecedores linhas={dados.fornecedores} situacoes={situacoes} />
        </SecaoWiki>

        <SecaoWiki id="limites" titulo="4. Limites e privacidade">
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-text">
              <span aria-hidden="true">⚠️</span>
              Amostra, não cadastro completo
            </h3>
            <ul className="mt-2 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-text-soft">
              <li>
                São {formatNumberBR(resumo.total)} fornecedores que já aparecem em contratos do
                acervo — não a lista de todos os fornecedores do país nem de uma prefeitura.
              </li>
              <li>
                <strong className="text-text">Sem sócios.</strong> O portal não publica QSA, CPF,
                telefone nem e-mail. A consulta não lê o quadro societário; nome de pessoa física é
                dado que fica fora.
              </li>
              <li>
                Todas as {formatNumberBR(resumo.total)} linhas estão com situação{" "}
                <strong className="text-text">{resumo.situacoes[0]?.situacao ?? "—"}</strong> na
                data da consulta. Isso descreve o cadastro naquele dia, não garante regularidade
                hoje.
              </li>
              <li>
                A Brasil API pede volume de pessoa real, sem crawling. Esta amostra foi fechada em{" "}
                {formatNumberBR(dados.consultados)} CNPJ, uma consulta por empresa, com pausa entre
                chamadas.
              </li>
            </ul>
            <p className="mt-3 text-xs leading-relaxed text-text-soft">
              Fonte: {dados.fonte.nome}. Consulta em {formatarDataBR(dados.coletadoEm)}. Endpoint:{" "}
              <a
                href={dados.fonte.documentacao}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                documentação da Brasil API ↗
              </a>
              .
            </p>
          </div>
        </SecaoWiki>

        <LinksRelacionados links={LINKS_RELACIONADOS} />
      </main>

      <FooterGlobal />
    </div>
  );
}
