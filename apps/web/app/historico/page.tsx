import type { Metadata } from "next";
import Link from "next/link";
import LinhaDoTempo from "@/app/components/LinhaDoTempo";

export const metadata: Metadata = {
  title: "Linha do Tempo — Desenvolvimento do Controle Popular",
  description:
    " Marcos do desenvolvimento do portal Controle Popular de transparência pública.",
};

/*
 * Marcos do portal. A linha é desenhada pelo componente genérico
 * `LinhaDoTempo` (03/11/2026), que põe a estrela a descer no trilho conforme
 * o scroll. `destaque` saiu do shape: com o trilho percorrido pela estrela,
 * o realce visual de 3 dos 12 itens virava ruído decorativo — todos os marcos
 * se equivalem na leitura.
 *
 * REGRA DA LISTA (03/11/2026, a pedido do dono — "o histórico pode crescer
 * mais"): todo marco entra com data medida na fonte — `docs/02-estado/
 * ESTADO.md` (entregas e fila) ou `git log` da rota citada. Número sem data
 * não entra (AGENTS). Para não repetir um marco, o critério é "mudou o que o
 * leitor vê ou onde o portal mora": build, banco, casa de publicação, frente
 * nova e ferramenta própria contam; ajuste fino de componente não.
 */
const MARCOS = [
  {
    data: "Agosto 2026",
    titulo: "Nascimento do Controle Popular",
    descricao:
      "Portal lançado com foco em Betim (MG). Primeiras rotas: prefeitura, legislação, licenciamento ambiental, convênios e orçamento.",
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
  },
  {
    data: "Setembro 2026",
    titulo: "Transparência Internacional",
    descricao:
      "Top 10 empresas e fundos dos EUA. Dados de CVM, SEC e câmbio.",
  },
  {
    data: "Setembro 2026",
    titulo: "Onda de frentes novas",
    descricao:
      "29–30/09: abrem /internacional (hub multilíngue), /eua, /canada, /assembleias (27 legislativas estaduais), /mineracao/cavas, /laboratorio e /radio — 44 estações de 11 países.",
  },
  {
    data: "Setembro 2026",
    titulo: "RAG em memória e espelhos do código",
    descricao:
      "O índice documental do Seu Nonô roda em memória (397 pedaços, sem pgvector); entra o Vigia ETL de 397 bases, o motor de fact-checking e o espelho do código no GitLab e Hugging Face (29/09).",
  },
  {
    data: "Outubro 2026",
    titulo: "Rádio que sobrevive à navegação",
    descricao:
      "3/10: interceptador global de links e navegação no cliente — navbar, faixa, rodapé, Seu Nonô, companheiro e rádio persistem entre páginas. /memoria ganha visão calendário e as fontes da APIB.",
  },
  {
    data: "Outubro 2026",
    titulo: "Build leve e rápido",
    descricao:
      "Contexto de build cai de 442 para 223,5 MB (1/10); Turbopack medido e adotado — 338 s contra 369–398 s, com as mesmas 621 rotas (5/10).",
  },
  {
    data: "Outubro 2026",
    titulo: "Casa nova: Azure e Heroku",
    descricao:
      "O www passa a ser publicado no Azure Container Apps (6–7/10) e o banco migra para o Heroku Postgres (8/10). O Guara para por cota do plano Starter (9/10).",
  },
  {
    data: "Outubro 2026",
    titulo: "Links que se consertam sozinhos",
    descricao:
      "Bot do Telegram com os 43 links conferidos e 14 quebrados corrigidos (5/10); LinkMender ganha portão tolerante, memória de reparos e escada D0–D5, com 85 testes verdes (18/10).",
  },
  {
    data: "Outubro 2026",
    titulo: "Cavas: gate v7 aprovado",
    descricao:
      "O modelo de detecção de cavas de mineração passa no gate com os 31 negativos da pasta certa (11/10); o workflow da VM ganha vigia e desligamento sempre.",
  },
  {
    data: "Outubro 2026",
    titulo: "Plataforma Rio Doce nasce",
    descricao:
      "12/10: hub /riodoce e /riodoce/processos — 8 processos confirmados no DataJud, 38 camadas da SEMAD medidas e a mancha de inundação do Fundão com 1.243 feições.",
  },
  {
    data: "Outubro 2026",
    titulo: "Licenciamento completo: 831 cidades",
    descricao:
      "A coleta de licenciamento COPAM fecha rodada completa: 19.713 licenças em 831 municípios (antes, 145 cidades paradas no município 145) — morre o bug do \"zero licença\" (18/10).",
  },
  {
    data: "Outubro 2026",
    titulo: "Jurisprudência TJMG e TJES",
    descricao:
      "28/10: acórdãos do Fundão (TJES) e de Brumadinho (TJMG) em página filtrável por órgão julgador, tema, ano e processo, com extrator e acervo versionado.",
  },
  {
    data: "Outubro 2026",
    titulo: "Autos de infração da SEMAD",
    descricao:
      "29/10: 36.007 autos de 2024–2026, R$ 1,90 bi em multas lavradas — busca, filtros e detalhe por município, sem nome nem documento pessoal no dado.",
  },
  {
    data: "Outubro 2026",
    titulo: "Memória com país, universidades de verdade",
    descricao:
      "31/10: os 542 verbetes da memória ganham país; /universidades vira lista real com 168 projetos de extensão da UFVJM (1.584 registros no total); o RAG reindexa com 2.243 documentos e 2.471 trechos.",
  },
  {
    data: "Novembro 2026",
    titulo: "Ordem canônica dos eixos",
    descricao:
      "1º Direitos em Movimento, 2º Terra e Territórios, 3º Estado e Economia, 4º Central (1/11) — menu, carrossel da home, índice e 54 títulos de páginas alinhados na mesma numeração.",
  },
  {
    data: "Novembro 2026",
    titulo: "Vigia de coletores",
    descricao:
      "2/11: rotina diária audita o estado dos coletores e a saúde dos links oficiais, com relatório datado no repositório — fonte muda, o portal conta.",
  },
  {
    data: "Novembro 2026",
    titulo: "Linha do tempo com estrela",
    descricao:
      "3/11: a estrela que desce pelo trilho conforme o scroll entra em seis linhas do tempo do portal — sem dependência nova, presa nas pontas, invisível ao leitor de tela e parada com movimento reduzido.",
  },
];

export default function HistoricoPage() {
  return (
    <main id="conteudo-principal" tabIndex={-1} className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:py-16">
      <nav className="text-sm text-text-soft">
        <Link href="/" className="hover:text-primary">
          Início
        </Link>{" "}
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

      <LinhaDoTempo
        itens={MARCOS.map((marco) => ({
          marco: marco.data,
          titulo: marco.titulo,
          texto: marco.descricao,
        }))}
      />
    </main>
  );
}
