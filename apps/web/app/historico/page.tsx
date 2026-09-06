import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Linha do Tempo — Desenvolvimento do Controle Popular",
  description:
    " Marcos do desenvolvimento do portal Controle Popular de transparência pública.",
};

const MARCOS = [
  {
    data: "Agosto 2026",
    titulo: "Nascimento do Controle Popular",
    descricao:
      "Portal lançado com foco em Betim (MG). Primeiras rotas: prefeitura, legislação, licenciamento ambiental, convênios e orçamento.",
    destaque: true,
  },
  {
    data: "Agosto 2026",
    titulo: "Expansão para 6 cidades",
    descricao:
      "Belo Horizonte, Araçuaí, Diamantina, Itinga e São Paulo adicionadas ao build. Sistema de dados estáticos por município.",
  },
  {
    data: "Agosto 2026",
    titulo: "Frente Congresso Nacional",
    descricao:
      "Proposições, votações, comissões, bancadas, parlamentares e cota parlamentar (CEAP) integrados.",
  },
  {
    data: "Agosto 2026",
    titulo: "Frente Judiciário",
    descricao:
      "Tribunais, indicações, vagas, inspeções, correições trabalhistas e defensoria.",
  },
  {
    data: "Agosto 2026",
    titulo: "Frente Ambiental",
    descricao:
      "Clima e risco, barragens SIGBM, licenciamento COPAM, legislação ambiental e decisões LAI.",
  },
  {
    data: "Agosto 2026",
    titulo: "Frente Paraopeba",
    descricao:
      "Acompanhamento da reparação de Brumadinho: execução, correlação Vale × notícias, linha do tempo do acordo.",
  },
  {
    data: "Agosto 2026",
    titulo: "Frente Terra e Território",
    descricao:
      "Mapa 3D de terras indígenas e quilombolas. Dados INCRA, Funai e敗ra.",
  },
  {
    data: "Setembro 2026",
    titulo: "Biblioteca de Crimes Socioambientais",
    descricao:
      "Acervo unificado de documentos de Mariana (2015) e Brumadinho (2019). 944 itens de fontes ministeriais, defensorias e ATIs.",
    destaque: true,
  },
  {
    data: "Setembro 2026",
    titulo: "Observatório de Empresas",
    descricao:
      "Perfis de Vale S.A. e Sigma Lithium com dados SIGMINE, notícias e timeline ambiental.",
  },
  {
    data: "Setembro 2026",
    titulo: "SINESP VDE — Segurança Pública",
    descricao:
      "572 mil registros de vítimas de eventos delituosos em MG (2022-2026). Dados por município, natureza e sexo.",
  },
  {
    data: "Setembro 2026",
    titulo: "Seu Nonô — Chatbot",
    descricao:
      "Assistente de IA baseado em dados do portal. Responde perguntas sobre contratos, licenciamento, barragens e mais.",
    destaque: true,
  },
  {
    data: "Setembro 2026",
    titulo: "Transparência Internacional",
    descricao:
      "Top 10 empresas e fundos dos EUA. Dados de CVM, SEC e câmbio.",
  },
];

export default function HistoricoPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <a href="/" className="hover:text-primary">
          Início
        </a>{" "}
        · <span className="text-text">Linha do Tempo</span>
      </nav>

      <header className="space-y-4">
        <h1 className="font-display text-3xl font-bold sm:text-4xl">
          Linha do Tempo
        </h1>
        <p className="max-w-2xl text-[1.05em] text-text-soft">
          Marcos do desenvolvimento do portal Controle Popular — de agosto de 2026
          até hoje.
        </p>
      </header>

      <div className="relative space-y-8 border-l-2 border-border pl-8">
        {MARCOS.map((marco, i) => (
          <div key={i} className="relative">
            <div
              className={`absolute -left-10 top-1 h-4 w-4 rounded-full border-2 ${
                marco.destaque
                  ? "border-primary bg-primary"
                  : "border-border bg-surface"
              }`}
            />
            <div className="space-y-1">
              <p className="text-sm text-text-soft">{marco.data}</p>
              <h2 className="font-display text-lg font-bold text-text">
                {marco.titulo}
              </h2>
              <p className="text-text-soft">{marco.descricao}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
