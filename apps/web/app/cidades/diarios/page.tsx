import type { Metadata } from "next";
import Link from "next/link";

import atosJson from "@/data/querido-diario/atos.json";
import CartoesResumo from "@/app/components/CartoesResumo";
import DataColeta from "@/app/components/DataColeta";
import ExplicadorDaPagina from "@/app/components/ExplicadorDaPagina";
import FooterGlobal from "@/app/components/FooterGlobal";
import ResumoExpandivel from "@/app/components/ResumoExpandivel";
import { IndiceWiki, LinksRelacionados, SecaoWiki } from "@/app/components/wiki";
import { formatNumberBR } from "@/lib/betim/format";
import { slugCobertoPorIbge } from "@/lib/cidades/cobertas";
import {
  formatarDataBR,
  linhasDeAtos,
  resumoDiarios,
  rotuloTipo,
  type DadosDiarios,
} from "@/lib/fontes-externas/paginas";
import { metadataEditavel } from "@/lib/edicoes";

import PainelDiarios from "./PainelDiarios";

/**
 * ═══ COBERTURA DOS DIÁRIOS MUNICIPAIS — TEMA CIDADES ═══
 *
 * O que é:
 *   Página de cobertura do Querido Diário dentro de `/cidades`. Lista as três
 *   cidades com diário medido (Betim, Contagem, Uberaba), leva ao hub de cada
 *   uma e declara Mariana e Brumadinho como sem cobertura, com o motivo.
 *
 * Fonte oficial:
 *   API pública https://api.queridodiario.org.br (Open Knowledge Brasil,
 *   dados da plataforma em CC-BY 4.0). JSON versionado em
 *   `apps/web/data/querido-diario/atos.json`.
 *
 * Por que foi feito assim:
 *   - O diário oficial é dado da CIDADE: a rota mora em `/cidades`, não numa
 *     frente nova, e o hub municipal ganha a seção local.
 *   - Cidade em nível 0 não some: aparece com o motivo, porque lista vazia
 *     sem explicação vira afirmação falsa ("não publica").
 *   - Contagem de MENÇÃO ao radical no texto do diário, nunca classificação
 *     editorial de ato.
 *   - Regras 5.10 (descrição ≥ text-sm), 5.14 (390 px sem rolagem lateral) e
 *     5.16 (interface ≥ 12 px).
 */

const dados = atosJson as unknown as DadosDiarios;
const resumo = resumoDiarios(dados);

const SECOES = [
  { id: "o-que-e", titulo: "1. O que é o Querido Diário" },
  { id: "cobertura", titulo: "2. Cidades cobertas" },
  { id: "atos", titulo: "3. Atos por cidade e termo" },
  { id: "sem-cobertura", titulo: "4. Cidades sem cobertura" },
  { id: "metodo", titulo: "5. Método e limites" },
];

const LINKS_RELACIONADOS = [
  {
    href: "/cidades",
    titulo: "203 Cidades Estratégicas do Brasil",
    descricao: "O painel do tema Cidades: capitais e polos do interior em todas as UFs.",
  },
  {
    href: "/empresas/fornecedores",
    titulo: "Fornecedores com CNPJ enriquecido",
    descricao: "Amostra de fornecedores do acervo com situação cadastral, CNAE e município.",
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

export const metadata: Metadata = metadataEditavel("/cidades/diarios", {
  title: "Diários Oficiais Municipais — Cobertura do Querido Diário | Controle Popular",
  description: `Cobertura de diários oficiais municipais em Betim, Contagem e Uberaba: ${formatNumberBR(
    resumo.diarios
  )} diários, ${formatNumberBR(resumo.atos)} linhas de evidência e ${formatNumberBR(
    resumo.ocorrencias
  )} menções a decreto, portaria, licitação e nomeação.`,
});

export default function CoberturaDiariosPage() {
  const linhas = linhasDeAtos(dados);
  const cidades = dados.cidades.map((cidade) => cidade.nome);
  const tipos = dados.termos.map((termo) => ({ valor: termo, rotulo: rotuloTipo(termo) }));

  return (
    <div className="min-h-screen bg-surface-0 text-text">
      <main id="conteudo-principal" className="mx-auto w-full max-w-5xl min-w-0 px-4 py-10 sm:px-6">
        <nav
          aria-label="Navegação estrutural"
          className="mb-4 flex flex-wrap items-center gap-2 text-xs text-text-soft"
        >
          <Link href="/" className="hover:text-primary">
            Início
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/cidades" className="hover:text-primary">
            Cidades
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-text">Diários municipais</span>
        </nav>

        <header>
          <p className="text-xs font-semibold tracking-wide text-text-soft uppercase">
            Tema Cidades · Fonte externa
          </p>
          <h1 className="mt-2 font-display text-[clamp(1.7em,4vw,2.4em)] leading-tight font-bold tracking-tight text-text">
            Diários Oficiais Municipais pelo Querido Diário
          </h1>
          <ExplicadorDaPagina
            frase="Veja quais diários oficiais de Minas já estão no Querido Diário. Saiba quais cidades ficaram sem dados e o motivo."
            itens={[
              "As 3 cidades com diário medido: Betim, Contagem e Uberaba.",
              "Quantos diários e quantas menções a decreto, portaria, licitação e nomeação — cada menção é uma ocorrência do termo no texto.",
              "A lista de evidências, com data, edição e trecho do diário, filtrável e com CSV.",
              "As 2 cidades da lista inicial sem diário no acervo: Mariana e Brumadinho, com o motivo.",
            ]}
            glossario={[
              {
                termo: "Diário oficial",
                definicao:
                  "jornal oficial em que a prefeitura publica decreto, portaria, licitação e nomeação. O ato só vale depois de publicado ali.",
              },
              {
                termo: "Ato",
                definicao:
                  "decisão escrita do poder público: decreto, portaria, licitação ou nomeação. Aqui o termo é contado por menção, não classificado.",
              },
              {
                termo: "Ocorrência (menção)",
                definicao:
                  "quantas vezes a palavra apareceu no texto do diário. Menção não é prova de que o ato foi praticado: o mesmo trecho pode citar outro órgão.",
              },
              {
                termo: "Linha de evidência",
                definicao:
                  "um trecho de até 200 caracteres em volta da primeira ocorrência, com link para o PDF oficial. O portal não copia o diário inteiro.",
              },
              {
                termo: "Cobertura",
                definicao:
                  "se o Querido Diário já coleta o diário daquela cidade. Nível 0 significa que a plataforma ainda não tem diário do município.",
              },
              {
                termo: "Nível 3",
                definicao:
                  "grau mais completo de cobertura do Querido Diário: a plataforma declara que coleta o diário e há edição publicada na janela medida.",
              },
              {
                termo: "Querido Diário",
                definicao:
                  "projeto do Open Knowledge Brasil que reúne diários oficiais de prefeituras numa API pública. A página usa a API em api.queridodiario.org.br.",
              },
            ]}
          />
          <ResumoExpandivel
            texto="Onde cada prefeitura publica decreto, portaria e licitação em sistemas diferentes, o Querido Diário reúne os diários oficiais num só acervo. Esta página mostra a cobertura medida em três cidades mineiras e diz, com o motivo, quais cidades da lista inicial ainda não têm diário no acervo."
            className="mt-3 max-w-3xl text-text-soft"
          />
          <DataColeta
            coletadoEm={dados.coletadoEm}
            fonte={dados.fonte.nome}
            competencia={`janela de ${formatarDataBR(dados.janela.de)} a ${formatarDataBR(
              dados.janela.ate
            )}`}
          />
        </header>

        <IndiceWiki itens={SECOES} />

        <SecaoWiki id="o-que-e" titulo="1. O que é o Querido Diário">
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-text-soft sm:text-base">
            <p>
              O <strong className="text-text">Querido Diário</strong> é um projeto do Open
              Knowledge Brasil que coleta diários oficiais de prefeituras e publica o acervo numa
              API pública. Ele resolve o problema mais chato da transparência municipal: cada
              cidade publica num sistema próprio — SIGPub, portal da prefeitura, PDF solto — e sem
              esse intermediário seria preciso escrever um raspador por município. A fonte usada
              aqui é a API <code className="text-xs">api.queridodiario.org.br</code>, com dados da
              plataforma em licença CC-BY 4.0.
            </p>
            <p>
              A amostra usa <strong className="text-text">três cidades mineiras</strong> — Betim,
              Contagem e Uberaba — que o Querido Diário declara em nível 3, o mais completo de
              cobertura, e que tinham diário publicado na janela medida. Foram{" "}
              {formatNumberBR(resumo.diarios)} diários contados, {formatNumberBR(resumo.atos)}{" "}
              linhas de evidência e {formatNumberBR(resumo.ocorrencias)} menções aos termos. A
              escolha não é ranking de transparência: é recorte de quem tem fonte disponível para
              medir.
            </p>
          </div>
        </SecaoWiki>

        <SecaoWiki id="cobertura" titulo="2. Cidades cobertas">
          <CartoesResumo
            colunas={5}
            itens={[
              {
                rotulo: "Cidades cobertas · MG",
                valor: resumo.cidades,
                detalhe: "Betim, Contagem e Uberaba · Querido Diário",
                destaque: true,
              },
              {
                rotulo: "Diários no acervo",
                valor: resumo.diarios,
                detalhe: `janela de ${formatarDataBR(dados.janela.de)} a ${formatarDataBR(
                  dados.janela.ate
                )} · 3 cidades`,
              },
              {
                rotulo: "Linhas de evidência",
                valor: resumo.atos,
                detalhe: "trechos com link para o PDF oficial",
              },
              {
                rotulo: "Menções aos 4 termos",
                valor: resumo.ocorrencias,
                detalhe: "decreto, portaria, licitação e nomeação · 6 diários",
              },
              {
                rotulo: "Cidades sem cobertura",
                valor: resumo.semCobertura,
                detalhe: "Mariana e Brumadinho · nível 0 · sem diário coletado",
                alerta: true,
              },
            ]}
          />

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-soft">
            {formatNumberBR(resumo.cidades)} cidades, {formatNumberBR(resumo.diarios)} diários e{" "}
            {formatNumberBR(resumo.ocorrencias)} menções. Onde o hub da cidade já está publicado, o
            cartão leva até ele — é lá que fica o bloco “Diário oficial do município” com os
            últimos atos.
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {dados.cidades.map((cidade) => {
              const total = Object.values(cidade.porTipo).reduce(
                (soma, item) => soma + item.ocorrencias,
                0
              );
              // Só linka para hub que EXISTE no build. Contagem e Uberaba ainda
              // não têm página `/[municipio]`; link pelo nome daria 404 medido.
              const slug = slugCobertoPorIbge(cidade.ibge);
              const conteudo = (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-text">
                      {cidade.nome}/{cidade.uf}
                    </h3>
                    <span className="font-tabular text-xs text-text-soft">
                      {formatNumberBR(cidade.diariosContados)}{" "}
                      {cidade.diariosContados === 1 ? "diário" : "diários"}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    {dados.termos.map((termo) => (
                      <div key={termo} className="flex items-baseline justify-between gap-2">
                        <dt className="text-text-soft">{rotuloTipo(termo)}</dt>
                        <dd className="font-tabular font-semibold text-text">
                          {formatNumberBR(cidade.porTipo[termo]?.ocorrencias ?? 0)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 text-xs text-text-soft">
                    {formatNumberBR(total)} menções no total
                  </p>
                  {slug ? (
                    <span className="mt-2 text-sm font-semibold text-primary">
                      Ver o diário no hub de {cidade.nome} →
                    </span>
                  ) : (
                    <span className="mt-2 text-xs text-text-soft">
                      Hub da cidade ainda não publicado
                    </span>
                  )}
                </>
              );
              return (
                <li key={cidade.ibge} className="min-w-0">
                  {slug ? (
                    <Link
                      href={`/${slug}`}
                      className="cp-card-hover flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm transition-colors hover:border-primary"
                    >
                      {conteudo}
                    </Link>
                  ) : (
                    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm">
                      {conteudo}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="mt-3 text-xs text-text-soft">
            Contagem de menção ao radical no texto de cada diário, não classificação editorial do
            ato. O método completo está na seção 5.
          </p>
        </SecaoWiki>

        <SecaoWiki id="atos" titulo="3. Atos por cidade e termo">
          <p className="max-w-3xl text-sm leading-relaxed text-text-soft">
            Cada linha é uma evidência: cidade, data, edição, termo contado, número de menções e um
            trecho de até 200 caracteres em volta da primeira ocorrência. O link leva ao PDF
            oficial — o portal não copia o diário inteiro.
          </p>
          <PainelDiarios linhas={linhas} cidades={cidades} tipos={tipos} />
        </SecaoWiki>

        <SecaoWiki id="sem-cobertura" titulo="4. Cidades sem cobertura">
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-text">
              <span aria-hidden="true">⚠️</span>
              {formatNumberBR(resumo.semCobertura)} cidades da lista inicial não têm diário no
              acervo
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-soft">
              Mariana e Brumadinho foram tentadas e respondem nível 0 no Querido Diário: não há
              diário coletado, nem data de disponibilidade. Isso não quer dizer que a prefeitura
              não publique nada — quer dizer que a fonte ainda não cobre o município. A lista vazia
              esconderia essa diferença.
            </p>
            <ul className="mt-3 space-y-2">
              {dados.semCobertura.map((cidade) => (
                <li
                  key={cidade.ibge}
                  className="rounded-lg border border-border/70 bg-surface/70 p-3 text-sm"
                >
                  <p className="font-semibold text-text">
                    {cidade.nome}
                    {cidade.uf ? `/${cidade.uf}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-text-soft">{cidade.motivo}</p>
                </li>
              ))}
            </ul>
          </div>
        </SecaoWiki>

        <SecaoWiki id="metodo" titulo="5. Método e limites">
          <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-text-soft">
            <p>
              <strong className="text-text">Como a contagem é feita.</strong> O coletor baixa o
              arquivo de texto oficial do diário, conta o radical de cada termo e descarta o texto.
              O que fica versionado é o metadado, a contagem e o trecho curto. A busca fuzzy da API
              não é usada para contar: medida em 18/11/2026, ela casou “portaria” com o nome
              “Porto” e produziria número errado com cara de certo.
            </p>
            <p>
              <strong className="text-text">O que o número significa.</strong> “Portaria do
              condomínio”, citada dentro de um decreto de denominação de rua, conta como menção a
              portaria. Separar ato praticado de citação exigiria classificar texto — trabalho de
              outra frente, que ainda não existe. Por isso a página fala em{" "}
              <strong className="text-text">menção</strong> e em{" "}
              <strong className="text-text">linha de evidência</strong>, nunca em “atos
              publicados”.
            </p>
            <div>
              <p className="font-semibold text-text">Radicais contados:</p>
              <ul className="mt-1 space-y-1 text-xs">
                {Object.entries(dados.radicais).map(([termo, radical]) => (
                  <li key={termo} className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold text-text">{rotuloTipo(termo)}</span>
                    <code className="rounded bg-surface-2 px-1.5 py-0.5">{radical}</code>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs">
              Fonte: {dados.fonte.nome}. Coleta em {formatarDataBR(dados.coletadoEm)}. Dados da
              plataforma em {dados.fonte.licencaDados}. Documentação:{" "}
              <a
                href={dados.fonte.documentacao}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                API pública do Querido Diário ↗
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
